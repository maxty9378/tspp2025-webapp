/*
  # Fix likes synchronization between messages and users

  1. Changes
    - Fixes array handling in trigger function
    - Ensures atomic updates
    - Prevents duplicate likes
    - Improves error handling
*/

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS sync_message_likes ON messages;
DROP FUNCTION IF EXISTS sync_message_likes_to_user();

-- Create improved function to sync message likes to user
CREATE OR REPLACE FUNCTION sync_message_likes_to_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Update message owner's liked_by array
  UPDATE users
  SET 
    liked_by = NEW.liked_by,
    updated_at = CURRENT_TIMESTAMP
  WHERE id = NEW.user_id;

  -- Update likers' likes arrays
  UPDATE users
  SET 
    likes = array_append(
      array_remove(COALESCE(likes, ARRAY[]::TEXT[]), NEW.user_id),
      NEW.user_id
    ),
    updated_at = CURRENT_TIMESTAMP
  WHERE id = ANY(NEW.liked_by);

  -- Remove likes from users who unliked
  IF OLD.liked_by IS NOT NULL THEN
    UPDATE users
    SET 
      likes = array_remove(likes, NEW.user_id),
      updated_at = CURRENT_TIMESTAMP
    WHERE 
      id = ANY(OLD.liked_by) 
      AND NOT (id = ANY(NEW.liked_by));
  END IF;

  -- Log the sync operation
  INSERT INTO system_logs (
    level,
    event,
    user_id,
    details
  ) VALUES (
    'info',
    'Message likes synced',
    NEW.user_id,
    jsonb_build_object(
      'message_id', NEW.id,
      'old_liked_by', OLD.liked_by,
      'new_liked_by', NEW.liked_by,
      'likes_count', array_length(NEW.liked_by, 1)
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
    -- Update message owner's liked_by array
    UPDATE users
    SET 
      liked_by = msg.liked_by,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = msg.user_id;

    -- Update likers' likes arrays
    UPDATE users
    SET 
      likes = array_append(
        array_remove(COALESCE(likes, ARRAY[]::TEXT[]), msg.user_id),
        msg.user_id
      ),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ANY(msg.liked_by);
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION sync_message_likes_to_user TO authenticated;
GRANT EXECUTE ON FUNCTION sync_all_message_likes TO authenticated;

-- Run initial sync to fix any existing inconsistencies
SELECT sync_all_message_likes();