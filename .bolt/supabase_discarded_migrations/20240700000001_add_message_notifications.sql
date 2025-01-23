-- Add notifications support for messages
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS is_notification BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS notification_type TEXT CHECK (
    notification_type IS NULL OR 
    notification_type IN ('greeting', 'quote', 'system', 'achievement')
);

-- Create index for notifications
CREATE INDEX messages_notifications_idx ON public.messages(is_notification, notification_type)
WHERE is_notification = true;

-- Update message type check constraint
ALTER TABLE public.messages 
DROP CONSTRAINT IF EXISTS messages_type_check;

ALTER TABLE public.messages
ADD CONSTRAINT messages_type_check 
CHECK (type IN ('text', 'image', 'greeting', 'notification'));