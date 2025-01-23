-- Add type column to messages table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'messages' AND column_name = 'type') THEN
        ALTER TABLE public.messages ADD COLUMN type TEXT DEFAULT 'text';
    END IF;
END $$;

-- Drop existing constraint if exists
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'messages_type_check') THEN
        ALTER TABLE public.messages DROP CONSTRAINT messages_type_check;
    END IF;
END $$;

-- Add constraint for message types
ALTER TABLE public.messages 
ADD CONSTRAINT messages_type_check 
CHECK (type IN ('text', 'image', 'task', 'system'));

-- Create index for type column if not exists
DROP INDEX IF EXISTS messages_type_idx;
CREATE INDEX messages_type_idx ON public.messages(type);