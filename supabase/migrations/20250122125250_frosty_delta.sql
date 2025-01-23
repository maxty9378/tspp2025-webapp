/*
  # Synchronize likes between messages and users

  1. New Functions
    - `sync_message_likes_to_user`: Syncs message likes to user's liked_by array
    - `handle_message_likes_sync`: Trigger function to handle likes sync

  2. Triggers
    - `sync_message_likes`: Trigger to sync likes on message update/insert

  3. Changes
    - Adds automatic synchronization of likes between messages and users tables
    - Ensures likes are properly tracked in both tables
*/

-- Create function to sync message likes to user
CREATE OR REPLACE FUNCTION sync_message_likes_to_user()
RETURNS TRIGGER AS $$
DECLARE
  message_user_id TEXT;
  liker_id TEXT;
BEGIN
  -- Get the message owner's ID
  SELECT user_id INTO message_user_id
  FROM messages
  WHERE id = NEW.id;

  -- For each user ID in the liked_by array
  FOR liker_id IN SELECT unnest(NEW.liked_by)
  LOOP
    -- Update the user's liked_by array if not already present
    UPDATE users
    SET liked_by = array_append(COALESCE(liked_by, ARRAY[]::TEXT[]), liker_id)
    WHERE id = message_user_id
    AND NOT (liked_by @> ARRAY[liker_id]);
  END LOOP;

  -- Remove likes that were removed from the message
  IF OLD.liked_by IS NOT NULL THEN
    UPDATE users
    SET liked_by = array_remove(liked_by, unnest(OLD.liked_by))
    WHERE id = message_user_id
    AND NOT (NEW.liked_by @> ARRAY[unnest(OLD.liked_by)]);
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
DROP TRIGGER IF EXISTS sync_message_likes ON messages;
CREATE TRIGGER sync_message_likes
  AFTER INSERT OR UPDATE OF liked_by ON messages
  FOR EACH ROW
  EXECUTE FUNCTION sync_message_likes_to_user();

-- Grant permissions
GRANT EXECUTE ON FUNCTION sync_message_likes_to_user() TO authenticated;