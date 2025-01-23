-- Drop existing triggers and functions
DROP TRIGGER IF EXISTS message_likes_trigger ON public.messages;
DROP FUNCTION IF EXISTS handle_message_likes();

-- Create improved message likes function
CREATE OR REPLACE FUNCTION handle_message_likes()
RETURNS TRIGGER AS $$
BEGIN
  -- Update likes count based on liked_by array
  NEW.likes := array_length(NEW.liked_by, 1);
  IF NEW.likes IS NULL THEN
    NEW.likes := 0;
  END IF;
  
  -- Only process likes for non-notification messages
  IF NOT NEW.is_notification AND NEW.liked_by IS DISTINCT FROM OLD.liked_by THEN
    -- Add new likes to users
    WITH new_likers AS (
      SELECT unnest(NEW.liked_by) AS user_id
      EXCEPT
      SELECT unnest(COALESCE(OLD.liked_by, ARRAY[]::text[]))
    )
    UPDATE users 
    SET 
      likes = array_append(COALESCE(likes, ARRAY[]::text[]), NEW.id),
      updated_at = NOW()
    WHERE id IN (SELECT user_id FROM new_likers);

    -- Remove unlikes from users
    WITH removed_likers AS (
      SELECT unnest(COALESCE(OLD.liked_by, ARRAY[]::text[])) AS user_id
      EXCEPT
      SELECT unnest(NEW.liked_by)
    )
    UPDATE users 
    SET 
      likes = array_remove(COALESCE(likes, ARRAY[]::text[]), NEW.id),
      updated_at = NOW()
    WHERE id IN (SELECT user_id FROM removed_likers);
  END IF;
  
  NEW.updated_at := CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for likes
CREATE TRIGGER message_likes_trigger
  BEFORE UPDATE ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION handle_message_likes();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS messages_liked_by_idx ON public.messages USING gin(liked_by);
CREATE INDEX IF NOT EXISTS users_likes_idx ON public.users USING gin(likes);

-- Update existing messages
UPDATE public.messages 
SET 
  likes = COALESCE(array_length(liked_by, 1), 0),
  is_notification = COALESCE(is_notification, false);

-- Grant permissions
GRANT ALL ON public.messages TO anon, authenticated;