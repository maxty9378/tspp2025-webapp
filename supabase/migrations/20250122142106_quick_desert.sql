-- Drop existing trigger and function
DROP TRIGGER IF EXISTS sync_message_likes ON messages;
DROP FUNCTION IF EXISTS sync_message_likes_to_user();

-- Create improved function to sync message likes to user that preserves duplicates
CREATE OR REPLACE FUNCTION sync_message_likes_to_user()
RETURNS TRIGGER AS $$
DECLARE
  message_user_id TEXT;
  old_liked_by TEXT[];
  new_liked_by TEXT[];
  liker TEXT;
BEGIN
  -- Get the message owner's ID
  message_user_id := NEW.user_id;
  old_liked_by := COALESCE(OLD.liked_by, ARRAY[]::TEXT[]);
  new_liked_by := COALESCE(NEW.liked_by, ARRAY[]::TEXT[]);

  -- Update message owner's liked_by array directly (preserving duplicates)
  UPDATE users
  SET 
    liked_by = new_liked_by,
    updated_at = CURRENT_TIMESTAMP
  WHERE id = message_user_id;

  -- Update likers' likes arrays
  FOREACH liker IN ARRAY new_liked_by
  LOOP
    UPDATE users
    SET 
      likes = array_append(likes, message_user_id),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = liker;
  END LOOP;

  -- Remove likes from users who unliked
  FOREACH liker IN ARRAY old_liked_by
  LOOP
    IF NOT (liker = ANY(new_liked_by)) THEN
      UPDATE users
      SET 
        likes = array_remove(likes, message_user_id),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = liker;
    END IF;
  END LOOP;

  -- Log the sync operation
  INSERT INTO system_logs (
    level,
    event,
    user_id,
    details
  ) VALUES (
    'info',
    'Message likes synced (with duplicates)',
    message_user_id,
    jsonb_build_object(
      'message_id', NEW.id,
      'old_liked_by', old_liked_by,
      'new_liked_by', new_liked_by,
      'likes_count', array_length(new_liked_by, 1)
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for likes synchronization
CREATE TRIGGER sync_message_likes
  AFTER INSERT OR UPDATE OF liked_by ON messages
  FOR EACH ROW
  EXECUTE FUNCTION sync_message_likes_to_user();

-- Create function to sync all existing likes
CREATE OR REPLACE FUNCTION sync_all_message_likes()
RETURNS void AS $$
DECLARE
  msg RECORD;
  liker TEXT;
BEGIN
  -- First clear all existing likes from users
  UPDATE users
  SET 
    liked_by = ARRAY[]::TEXT[],
    likes = ARRAY[]::TEXT[];

  -- Then sync all message likes
  FOR msg IN 
    SELECT id, user_id, liked_by
    FROM messages
    WHERE liked_by IS NOT NULL
    AND array_length(liked_by, 1) > 0
  LOOP
    -- Update message owner's liked_by array directly (preserving duplicates)
    UPDATE users
    SET 
      liked_by = msg.liked_by,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = msg.user_id;

    -- Update likers' likes arrays
    FOREACH liker IN ARRAY msg.liked_by
    LOOP
      UPDATE users
      SET 
        likes = array_append(likes, msg.user_id),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = liker;
    END LOOP;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION sync_message_likes_to_user TO authenticated;
GRANT EXECUTE ON FUNCTION sync_all_message_likes TO authenticated;

-- Run initial sync to fix any existing inconsistencies
SELECT sync_all_message_likes();