-- Drop existing trigger and function
DROP TRIGGER IF EXISTS sync_message_likes ON messages;
DROP FUNCTION IF EXISTS sync_message_likes_to_user();

-- Create improved function to sync message likes to user that allows duplicates
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

  -- For each new like, append to liked_by array (allowing duplicates)
  FOR liker IN 
    SELECT UNNEST(new_liked_by)
    EXCEPT
    SELECT UNNEST(old_liked_by)
  LOOP
    -- Update message owner's liked_by array by directly appending
    UPDATE users
    SET 
      liked_by = array_append(COALESCE(liked_by, ARRAY[]::TEXT[]), liker),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = message_user_id;

    -- Update liker's likes array
    UPDATE users
    SET 
      likes = array_append(COALESCE(likes, ARRAY[]::TEXT[]), message_user_id),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = liker;
  END LOOP;

  -- Handle removed likes
  FOR liker IN 
    SELECT UNNEST(old_liked_by)
    EXCEPT
    SELECT UNNEST(new_liked_by)
  LOOP
    -- Remove only one instance of the like from the array
    UPDATE users u
    SET 
      liked_by = (
        SELECT array_cat(
          left_part,
          CASE 
            WHEN array_position(right_part, liker) IS NOT NULL 
            THEN right_part[array_position(right_part, liker) + 1:]
            ELSE right_part
          END
        )
        FROM (
          SELECT 
            u.liked_by[:array_position(u.liked_by, liker) - 1] as left_part,
            u.liked_by[array_position(u.liked_by, liker):] as right_part
        ) sub
      ),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = message_user_id
    AND array_position(liked_by, liker) IS NOT NULL;

    -- Remove from liker's likes array
    UPDATE users
    SET 
      likes = array_remove(likes, message_user_id),
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

-- Grant permissions
GRANT EXECUTE ON FUNCTION sync_message_likes_to_user TO authenticated;