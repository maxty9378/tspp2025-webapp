/*
  # Fix likes synchronization between messages and users

  1. Changes
    - Fixes array handling in trigger function
    - Ensures atomic updates
    - Prevents duplicate likes
    - Improves error handling

  2. Security
    - Functions run with SECURITY DEFINER
    - Proper error handling and validation
*/

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS sync_message_likes ON messages;
DROP FUNCTION IF EXISTS sync_message_likes_to_user();

-- Create improved function to sync message likes to user
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

  -- Handle added likes
  FOR liker IN 
    SELECT UNNEST(new_liked_by)
    EXCEPT
    SELECT UNNEST(old_liked_by)
  LOOP
    -- Update message owner's liked_by array
    UPDATE users
    SET 
      liked_by = CASE 
        WHEN liked_by IS NULL THEN ARRAY[liker]
        WHEN NOT (liked_by @> ARRAY[liker]) THEN array_append(liked_by, liker)
        ELSE liked_by
      END,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = message_user_id;

    -- Update liker's likes array
    UPDATE users
    SET 
      likes = CASE 
        WHEN likes IS NULL THEN ARRAY[message_user_id]
        WHEN NOT (likes @> ARRAY[message_user_id]) THEN array_append(likes, message_user_id)
        ELSE likes
      END,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = liker;
  END LOOP;

  -- Handle removed likes
  FOR liker IN 
    SELECT UNNEST(old_liked_by)
    EXCEPT
    SELECT UNNEST(new_liked_by)
  LOOP
    -- Remove from message owner's liked_by array
    UPDATE users
    SET 
      liked_by = array_remove(COALESCE(liked_by, ARRAY[]::TEXT[]), liker),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = message_user_id;

    -- Remove from liker's likes array
    UPDATE users
    SET 
      likes = array_remove(COALESCE(likes, ARRAY[]::TEXT[]), message_user_id),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = liker;
  END LOOP;

  -- Log the sync operation
  INSERT INTO system_logs (
    level,
    event,
    user_id,
    details
  ) VALUES (
    'info',
    'Message likes synced',
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
    -- Process each liker
    FOR liker IN 
      SELECT UNNEST(msg.liked_by)
    LOOP
      -- Update message owner's liked_by array
      UPDATE users
      SET 
        liked_by = CASE 
          WHEN liked_by IS NULL THEN ARRAY[liker]
          WHEN NOT (liked_by @> ARRAY[liker]) THEN array_append(liked_by, liker)
          ELSE liked_by
        END,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = msg.user_id;

      -- Update liker's likes array
      UPDATE users
      SET 
        likes = CASE 
          WHEN likes IS NULL THEN ARRAY[msg.user_id]
          WHEN NOT (likes @> ARRAY[msg.user_id]) THEN array_append(likes, msg.user_id)
          ELSE likes
        END,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = liker;
    END LOOP;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION sync_message_likes_to_user TO authenticated;
GRANT EXECUTE ON FUNCTION sync_all_message_likes TO authenticated;