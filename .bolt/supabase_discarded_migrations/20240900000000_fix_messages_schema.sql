-- Add updated_at column and trigger
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Create function to update timestamp
CREATE OR REPLACE FUNCTION update_message_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for timestamp updates
DROP TRIGGER IF EXISTS update_message_timestamp_trigger ON public.messages;
CREATE TRIGGER update_message_timestamp_trigger
  BEFORE UPDATE ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION update_message_timestamp();

-- Update existing messages
UPDATE public.messages 
SET updated_at = created_at 
WHERE updated_at IS NULL;