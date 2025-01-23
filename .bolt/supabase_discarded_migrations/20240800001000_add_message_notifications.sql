-- Add notifications support
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS is_notification BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS notification_type TEXT CHECK (
    notification_type IS NULL OR 
    notification_type IN ('like', 'reply', 'system')
);

-- Create index for notifications
CREATE INDEX IF NOT EXISTS messages_notifications_idx 
ON public.messages(is_notification, notification_type)
WHERE is_notification = true;

-- Create function to handle like notifications
CREATE OR REPLACE FUNCTION handle_like_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create notification if likes increased
  IF NEW.likes > OLD.likes THEN
    INSERT INTO messages (
      user_id,
      text,
      type,
      is_notification,
      notification_type,
      created_at
    ) VALUES (
      NEW.user_id,
      format('Ваше сообщение понравилось %s пользователям', NEW.likes),
      'text',
      true,
      'like',
      NOW()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for like notifications
DROP TRIGGER IF EXISTS message_like_notification_trigger ON public.messages;
CREATE TRIGGER message_like_notification_trigger
  AFTER UPDATE ON public.messages
  FOR EACH ROW
  WHEN (NEW.likes > OLD.likes)
  EXECUTE FUNCTION handle_like_notification();