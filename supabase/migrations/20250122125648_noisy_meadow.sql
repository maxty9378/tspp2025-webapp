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

  -- For each user ID in the liked_by array
  IF NEW.liked_by IS NOT NULL THEN
    FOREACH liker_id IN ARRAY NEW.liked_by
    LOOP
      -- Update the user's liked_by array if not already present
      UPDATE users
      SET liked_by = array_append(COALESCE(liked_by, ARRAY[]::TEXT[]), liker_id)
      WHERE id = message_user_id
      AND NOT (COALESCE(liked_by, ARRAY[]::TEXT[]) @> ARRAY[liker_id]);
    END LOOP;
  END IF;

  -- Remove likes that were removed from the message
  IF OLD.liked_by IS NOT NULL AND NEW.liked_by IS NOT NULL THEN
    FOREACH liker_id IN ARRAY OLD.liked_by
    LOOP
      IF NOT (NEW.liked_by @> ARRAY[liker_id]) THEN
        UPDATE users
        SET liked_by = array_remove(COALESCE(liked_by, ARRAY[]::TEXT[]), liker_id)
        WHERE id = message_user_id;
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
    'Message likes synced to user',
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

-- Grant permissions
GRANT EXECUTE ON FUNCTION sync_message_likes_to_user() TO authenticated;