-- Add likes support to messages table
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS likes INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS liked_by TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Create index for liked_by array
CREATE INDEX IF NOT EXISTS messages_liked_by_idx ON public.messages USING gin(liked_by);

-- Create function to handle message likes
CREATE OR REPLACE FUNCTION handle_message_like()
RETURNS TRIGGER AS $$
BEGIN
  -- Update likes count based on liked_by array
  NEW.likes := array_length(NEW.liked_by, 1);
  IF NEW.likes IS NULL THEN
    NEW.likes := 0;
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

-- Update RLS policies
DROP POLICY IF EXISTS "Enable read access for all users" ON public.messages;
DROP POLICY IF EXISTS "Enable insert for all users" ON public.messages;
DROP POLICY IF EXISTS "Enable update for all users" ON public.messages;

-- Create new policies
CREATE POLICY "Enable read access for all users"
ON public.messages FOR SELECT
USING (true);

CREATE POLICY "Enable insert for all users"
ON public.messages FOR INSERT
WITH CHECK (true);

CREATE POLICY "Enable update for message likes"
ON public.messages FOR UPDATE
USING (true)
WITH CHECK (true);

-- Grant permissions
GRANT ALL ON public.messages TO anon, authenticated;