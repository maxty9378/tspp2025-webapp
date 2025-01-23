-- Drop existing triggers
DROP TRIGGER IF EXISTS message_likes_trigger ON public.messages;
DROP TRIGGER IF EXISTS message_unlike_trigger ON public.messages;
DROP FUNCTION IF EXISTS handle_message_like();
DROP FUNCTION IF EXISTS handle_message_unlike();

-- Create improved message likes function
CREATE OR REPLACE FUNCTION handle_message_likes()
RETURNS TRIGGER AS $$
BEGIN
  -- Update likes count based on liked_by array
  NEW.likes := array_length(NEW.liked_by, 1);
  IF NEW.likes IS NULL THEN
    NEW.likes := 0;
  END IF;
  
  -- Update user likes if not a notification
  IF NOT NEW.is_notification AND NEW.liked_by IS DISTINCT FROM OLD.liked_by THEN
    -- Add new likes
    WITH new_likes AS (
      SELECT unnest(NEW.liked_by) AS user_id
      EXCEPT
      SELECT unnest(OLD.liked_by)
    )
    UPDATE users 
    SET 
      likes = array_append(likes, NEW.id),
      updated_at = NOW()
    WHERE id IN (SELECT user_id FROM new_likes)
    AND NOT (likes @> ARRAY[NEW.id]);

    -- Remove unlikes
    WITH removed_likes AS (
      SELECT unnest(OLD.liked_by) AS user_id
      EXCEPT
      SELECT unnest(NEW.liked_by)
    )
    UPDATE users 
    SET 
      likes = array_remove(likes, NEW.id),
      updated_at = NOW()
    WHERE id IN (SELECT user_id FROM removed_likes);
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

-- Update existing messages
UPDATE public.messages 
SET 
  likes = COALESCE(array_length(liked_by, 1), 0),
  is_notification = false 
WHERE is_notification IS NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS messages_liked_by_idx ON public.messages USING gin(liked_by);
CREATE INDEX IF NOT EXISTS users_likes_idx ON public.users USING gin(likes);

-- Grant permissions
GRANT ALL ON public.messages TO anon, authenticated;