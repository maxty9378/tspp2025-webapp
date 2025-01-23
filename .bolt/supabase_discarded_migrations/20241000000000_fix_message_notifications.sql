-- Drop existing notification type constraint
ALTER TABLE public.messages 
DROP CONSTRAINT IF EXISTS messages_notification_type_check;

-- Add new notification type constraint with all valid types
ALTER TABLE public.messages
ADD CONSTRAINT messages_notification_type_check 
CHECK (
    notification_type IS NULL OR 
    notification_type IN ('like', 'reply', 'system', 'greeting', 'quote', 'achievement')
);

-- Update like notification function
CREATE OR REPLACE FUNCTION handle_like_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create notification if likes increased and not a notification message
  IF NEW.likes > OLD.likes AND NOT OLD.is_notification THEN
    INSERT INTO messages (
      user_id,
      text,
      type,
      is_notification,
      notification_type,
      created_at,
      updated_at,
      liked_by
    ) VALUES (
      NEW.user_id,
      format('Ваше сообщение понравилось %s пользователям', NEW.likes),
      'text',
      true,
      'like',
      NOW(),
      NOW(),
      ARRAY[]::text[]
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate trigger for like notifications
DROP TRIGGER IF EXISTS message_like_notification_trigger ON public.messages;
CREATE TRIGGER message_like_notification_trigger
  AFTER UPDATE ON public.messages
  FOR EACH ROW
  WHEN (NEW.likes > OLD.likes AND NOT OLD.is_notification)
  EXECUTE FUNCTION handle_like_notification();