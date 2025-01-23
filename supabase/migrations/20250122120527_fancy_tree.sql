-- Drop existing policies first to avoid conflicts
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "messages_select_policy" ON messages;
    DROP POLICY IF EXISTS "messages_insert_policy" ON messages;
    DROP POLICY IF EXISTS "messages_update_policy" ON messages;
    DROP POLICY IF EXISTS "Enable read access for all users" ON messages;
    DROP POLICY IF EXISTS "Enable insert for authenticated users" ON messages;
    DROP POLICY IF EXISTS "Enable update for message owner" ON messages;
EXCEPTION
    WHEN undefined_object THEN null;
END $$;

-- Drop and recreate messages table
DROP TABLE IF EXISTS messages CASCADE;

CREATE TABLE messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('text', 'image', 'system', 'greeting', 'quote', 'slogan', 'practice', 'mistake')),
    image_url TEXT,
    liked_by TEXT[] DEFAULT ARRAY[]::TEXT[],
    likes INTEGER DEFAULT 0,
    is_from_telegram BOOLEAN DEFAULT false,
    sender_name TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes
CREATE INDEX messages_user_id_idx ON messages(user_id);
CREATE INDEX messages_type_idx ON messages(type);
CREATE INDEX messages_created_at_idx ON messages(created_at DESC);
CREATE INDEX messages_likes_idx ON messages(likes DESC);

-- Create function to handle message likes
CREATE OR REPLACE FUNCTION handle_message_like()
RETURNS TRIGGER AS $$
BEGIN
    -- Update likes count based on liked_by array
    NEW.likes = COALESCE(array_length(NEW.liked_by, 1), 0);
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for likes
DROP TRIGGER IF EXISTS update_message_likes ON messages;
CREATE TRIGGER update_message_likes
    BEFORE INSERT OR UPDATE OF liked_by ON messages
    FOR EACH ROW
    EXECUTE FUNCTION handle_message_like();

-- Enable RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create new RLS policies with more permissive rules
CREATE POLICY "messages_read_all"
ON messages FOR SELECT
USING (true);

CREATE POLICY "messages_insert_all"
ON messages FOR INSERT
WITH CHECK (true);

CREATE POLICY "messages_update_all"
ON messages FOR UPDATE
USING (true);

-- Grant permissions
GRANT ALL ON messages TO anon, authenticated;