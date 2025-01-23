-- Add likes support to messages table
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS likes INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS liked_by TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS is_notification BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS notification_type TEXT CHECK (
    notification_type IS NULL OR 
    notification_type IN ('like', 'reply', 'system')
);

-- Create index for liked_by array
CREATE INDEX IF NOT EXISTS messages_liked_by_idx ON public.messages USING gin(liked_by);
CREATE INDEX IF NOT EXISTS messages_notifications_idx ON public.messages(is_notification, notification_type);

-- Create function to handle message likes
CREATE OR REPLACE FUNCTION handle_message_like()
RETURNS TRIGGER AS $$
BEGIN
  -- Update likes count based on liked_by array
  NEW.likes := array_length(NEW.liked_by, 1);
  IF NEW.likes IS NULL THEN
    NEW.likes := 0;
  END IF;
  
  -- Update user likes if not a notification
  IF NOT NEW.is_notification THEN
    -- Update user's likes array
    UPDATE users 
    SET 
      likes = array_append(likes, NEW.id),
      updated_at = NOW()
    WHERE id = ANY(NEW.liked_by)
    AND NOT (likes @> ARRAY[NEW.id]);
  END IF;
  
  NEW.updated_at := CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for likes
DROP TRIGGER IF EXISTS message_likes_trigger ON public.messages;
CREATE TRIGGER message_likes_trigger
  BEFORE UPDATE ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION handle_message_like();

-- Create function to handle like removal
CREATE OR REPLACE FUNCTION handle_message_unlike()
RETURNS TRIGGER AS $$
BEGIN
  -- Remove message from user's likes array
  IF NOT NEW.is_notification THEN
    UPDATE users 
    SET 
      likes = array_remove(likes, OLD.id),
      updated_at = NOW()
    WHERE id = ANY(
      array(
        SELECT unnest(OLD.liked_by) 
        EXCEPT 
        SELECT unnest(NEW.liked_by)
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for unlikes
DROP TRIGGER IF EXISTS message_unlike_trigger ON public.messages;
CREATE TRIGGER message_unlike_trigger
  BEFORE UPDATE ON public.messages
  FOR EACH ROW
  WHEN (OLD.liked_by <> NEW.liked_by)
  EXECUTE FUNCTION handle_message_unlike();

-- Update existing messages
UPDATE public.messages 
SET 
  likes = COALESCE(array_length(liked_by, 1), 0),
  is_notification = false 
WHERE is_notification IS NULL;

-- Grant permissions
GRANT ALL ON public.messages TO anon, authenticated;