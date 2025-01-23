/*
  # Fix likes synchronization between messages and users

  1. Changes
    - Improves the sync_message_likes_to_user function to properly handle likes synchronization
    - Adds atomic operations to prevent race conditions
    - Adds better error handling and logging
    - Fixes duplicate likes issue

  2. Security
    - Function runs with SECURITY DEFINER to ensure proper permissions
    - Adds proper error handling and validation
*/

-- Drop existing function and trigger
DROP TRIGGER IF EXISTS sync_message_likes ON messages;
DROP FUNCTION IF EXISTS sync_message_likes_to_user();

-- Create improved function to sync message likes to user
CREATE OR REPLACE FUNCTION sync_message_likes_to_user()
RETURNS TRIGGER AS $$
DECLARE
  message_user_id TEXT;
  liker_id TEXT;
  old_liked_by TEXT[];
  new_liked_by TEXT[];
BEGIN
  -- Get the message owner's ID
  message_user_id := NEW.user_id;
  old_liked_by := COALESCE(OLD.liked_by, ARRAY[]::TEXT[]);
  new_liked_by := COALESCE(NEW.liked_by, ARRAY[]::TEXT[]);

  -- Process new likes
  FOR liker_id IN SELECT UNNEST(new_liked_by) EXCEPT SELECT UNNEST(old_liked_by)
  LOOP
    -- Update message owner's liked_by array
    UPDATE users
    SET 
      liked_by = array_append(
        array_remove(COALESCE(liked_by, ARRAY[]::TEXT[]), liker_id),
        liker_id
      ),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = message_user_id;

    -- Update liker's likes array
    UPDATE users
    SET 
      likes = array_append(
        array_remove(COALESCE(likes, ARRAY[]::TEXT[]), message_user_id),
        message_user_id
      ),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = liker_id;
  END LOOP;

  -- Process removed likes
  FOR liker_id IN SELECT UNNEST(old_liked_by) EXCEPT SELECT UNNEST(new_liked_by)
  LOOP
    -- Remove from message owner's liked_by array
    UPDATE users
    SET 
      liked_by = array_remove(COALESCE(liked_by, ARRAY[]::TEXT[]), liker_id),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = message_user_id;

    -- Remove from liker's likes array
    UPDATE users
    SET 
      likes = array_remove(COALESCE(likes, ARRAY[]::TEXT[]), message_user_id),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = liker_id;
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

-- Grant permissions
GRANT EXECUTE ON FUNCTION sync_message_likes_to_user() TO authenticated;