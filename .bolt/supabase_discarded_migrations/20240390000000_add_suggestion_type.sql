-- Add suggestion type to messages table
ALTER TABLE public.messages 
DROP CONSTRAINT IF EXISTS messages_type_check;

ALTER TABLE public.messages
ADD CONSTRAINT messages_type_check 
CHECK (type IN ('text', 'image', 'task', 'system', 'suggestion'));

-- Create index for suggestions
CREATE INDEX IF NOT EXISTS messages_suggestions_idx 
ON public.messages(type) 
WHERE type = 'suggestion';