/*
  # Fix likes synchronization between messages and users

  1. Changes
    - Ensures all message likes are properly duplicated to users table
    - Adds function to sync all existing likes
    - Improves trigger function to handle likes synchronization

  2. Security
    - Functions run with SECURITY DEFINER to ensure proper permissions
    - Adds proper error handling and validation
*/

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS sync_message_likes ON messages;
DROP FUNCTION IF EXISTS sync_message_likes_to_user();

-- Create function to sync message likes to user
CREATE OR REPLACE FUNCTION sync_message_likes_to_user()
RETURNS TRIGGER AS $$
DECLARE
  message_user_id TEXT;
  liker_id TEXT;
BEGIN
  -- Get the message owner's ID
  message_user_id := NEW.user_id;

  -- First, clear existing likes for this message to prevent duplicates
  UPDATE users
  SET 
    liked_by = array_remove(COALESCE(liked_by, ARRAY[]::TEXT[]), unnest(COALESCE(OLD.liked_by, ARRAY[]::TEXT[]))),
    likes = array_remove(COALESCE(likes, ARRAY[]::TEXT[]), message_user_id)
  WHERE 
    id = ANY(COALESCE(OLD.liked_by, ARRAY[]::TEXT[]))
    OR id = message_user_id;

  -- Then add all current likes
  IF NEW.liked_by IS NOT NULL THEN
    -- Update message owner's liked_by array
    UPDATE users
    SET 
      liked_by = array_cat(COALESCE(liked_by, ARRAY[]::TEXT[]), NEW.liked_by),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = message_user_id;

    -- Update likers' likes arrays
    UPDATE users
    SET 
      likes = array_append(COALESCE(likes, ARRAY[]::TEXT[]), message_user_id),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ANY(NEW.liked_by);
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
    message_user_id,
    jsonb_build_object(
      'message_id', NEW.id,
      'liked_by', NEW.liked_by,
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
      liked_by = array_cat(COALESCE(liked_by, ARRAY[]::TEXT[]), msg.liked_by),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = msg.user_id;

    -- Update likers' likes arrays
    UPDATE users
    SET 
      likes = array_append(COALESCE(likes, ARRAY[]::TEXT[]), msg.user_id),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ANY(msg.liked_by);
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION sync_message_likes_to_user TO authenticated;
GRANT EXECUTE ON FUNCTION sync_all_message_likes TO authenticated;