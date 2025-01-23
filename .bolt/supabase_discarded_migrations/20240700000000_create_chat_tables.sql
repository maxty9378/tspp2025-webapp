-- Create messages table if not exists
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('text', 'image', 'greeting')),
    image_url TEXT,
    likes INTEGER DEFAULT 0,
    liked_by TEXT[] DEFAULT ARRAY[]::TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create chat_attachments bucket if not exists
INSERT INTO storage.buckets (id, name, public)
SELECT 'chat', 'chat', true
WHERE NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'chat'
);

-- Add liked_by column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'messages' AND column_name = 'liked_by'
    ) THEN
        ALTER TABLE public.messages ADD COLUMN liked_by TEXT[] DEFAULT ARRAY[]::TEXT[];
    END IF;
END $$;

-- Drop existing indexes if they exist
DROP INDEX IF EXISTS messages_user_id_idx;
DROP INDEX IF EXISTS messages_created_at_idx;
DROP INDEX IF EXISTS messages_type_idx;
DROP INDEX IF EXISTS messages_liked_by_idx;

-- Create indexes for better performance
CREATE INDEX messages_user_id_idx ON public.messages(user_id);
CREATE INDEX messages_created_at_idx ON public.messages(created_at DESC);
CREATE INDEX messages_type_idx ON public.messages(type);
CREATE INDEX messages_liked_by_idx ON public.messages USING gin(liked_by);

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access for all users" ON public.messages;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.messages;
DROP POLICY IF EXISTS "Enable update for message owner" ON public.messages;

-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for all users"
ON public.messages FOR SELECT
USING (true);

CREATE POLICY "Enable insert for authenticated users"
ON public.messages FOR INSERT
WITH CHECK (true);

CREATE POLICY "Enable update for message owner"
ON public.messages FOR UPDATE
USING (true)
WITH CHECK (true);

-- Grant permissions
GRANT ALL ON public.messages TO anon, authenticated;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS message_likes_trigger ON public.messages;
DROP FUNCTION IF EXISTS handle_message_like();

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
CREATE TRIGGER message_likes_trigger
  BEFORE UPDATE ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION handle_message_like();