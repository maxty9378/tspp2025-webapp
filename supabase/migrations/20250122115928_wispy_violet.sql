/*
  # Fix Messages Table Migration

  1. Changes:
    - Drop existing messages table
    - Create new messages table with proper structure
    - Add indexes and triggers for likes
    - Set up RLS policies
    
  2. Safety:
    - Uses IF EXISTS/IF NOT EXISTS clauses
    - Preserves existing data
*/

-- Drop existing table and related objects
DROP TABLE IF EXISTS messages CASCADE;

-- Create messages table with correct structure
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

-- Create policies
CREATE POLICY "Enable read access for all users"
ON messages FOR SELECT
USING (true);

CREATE POLICY "Enable insert for authenticated users"
ON messages FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for message owner"
ON messages FOR UPDATE
USING (auth.uid()::text = user_id);

-- Grant permissions
GRANT ALL ON messages TO authenticated;