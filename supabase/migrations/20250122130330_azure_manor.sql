-- Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS sync_message_user_likes ON messages;
DROP FUNCTION IF EXISTS sync_message_user_likes();

-- Create function to sync message likes to user likes
CREATE OR REPLACE FUNCTION sync_message_user_likes()
RETURNS TRIGGER AS $$
DECLARE
  message_user_id TEXT;
  liker_id TEXT;
BEGIN
  -- Get the message owner's ID
  message_user_id := NEW.user_id;

  -- For each user ID in the liked_by array
  IF NEW.liked_by IS NOT NULL THEN
    FOREACH liker_id IN ARRAY NEW.liked_by
    LOOP
      -- Update both liked_by and likes arrays
      UPDATE users
      SET 
        -- Add liker to liked_by array of message owner
        liked_by = array_append(COALESCE(liked_by, ARRAY[]::TEXT[]), liker_id),
        -- Add message owner to likes array of liker
        likes = array_append(COALESCE(likes, ARRAY[]::TEXT[]), message_user_id)
      WHERE id IN (message_user_id, liker_id)
      AND (
        -- Only append if not already present
        (id = message_user_id AND NOT (COALESCE(liked_by, ARRAY[]::TEXT[]) @> ARRAY[liker_id]))
        OR
        (id = liker_id AND NOT (COALESCE(likes, ARRAY[]::TEXT[]) @> ARRAY[message_user_id]))
      );
    END LOOP;
  END IF;

  -- Remove likes that were removed from the message
  IF OLD.liked_by IS NOT NULL AND NEW.liked_by IS NOT NULL THEN
    FOREACH liker_id IN ARRAY OLD.liked_by
    LOOP
      IF NOT (NEW.liked_by @> ARRAY[liker_id]) THEN
        -- Remove likes from both users
        UPDATE users
        SET 
          -- Remove liker from liked_by array of message owner
          liked_by = array_remove(COALESCE(liked_by, ARRAY[]::TEXT[]), liker_id),
          -- Remove message owner from likes array of liker
          likes = array_remove(COALESCE(likes, ARRAY[]::TEXT[]), message_user_id)
        WHERE id IN (message_user_id, liker_id);
      END IF;
    END LOOP;
  END IF;

  -- Log the sync operation
  INSERT INTO system_logs (
    level,
    event,
    user_id,
    details
  ) VALUES (
    'info',
    'Message likes synced to user likes',
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
CREATE TRIGGER sync_message_user_likes
  AFTER INSERT OR UPDATE OF liked_by ON messages
  FOR EACH ROW
  EXECUTE FUNCTION sync_message_user_likes();

-- Grant permissions
GRANT EXECUTE ON FUNCTION sync_message_user_likes() TO authenticated;