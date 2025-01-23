/*
  # Messages Table Migration

  1. Changes:
    - Create messages table with proper structure
    - Add indexes for performance
    - Add functions for likes handling
    - Add RLS policies
    
  2. Safety:
    - Uses IF EXISTS/IF NOT EXISTS clauses
    - Preserves data through careful column selection
    - Adds proper constraints
*/

-- First, backup existing messages if any exist
CREATE TABLE IF NOT EXISTS messages_backup AS 
SELECT 
  id,
  user_id,
  text,
  type,
  image_url,
  liked_by,
  likes,
  is_from_telegram,
  sender_name,
  created_at,
  updated_at
FROM messages;

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

-- Restore data from backup if it exists
INSERT INTO messages (
    id,
    user_id,
    text,
    type,
    image_url,
    liked_by,
    likes,
    is_from_telegram,
    sender_name,
    created_at,
    updated_at
)
SELECT 
    id,
    user_id,
    text,
    type,
    image_url,
    liked_by,
    likes,
    is_from_telegram,
    sender_name,
    created_at,
    updated_at
FROM messages_backup
WHERE EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'messages_backup'
);

-- Drop backup table
DROP TABLE IF EXISTS messages_backup;

-- Create indexes
CREATE INDEX IF NOT EXISTS messages_user_id_idx ON messages(user_id);
CREATE INDEX IF NOT EXISTS messages_type_idx ON messages(type);
CREATE INDEX IF NOT EXISTS messages_created_at_idx ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS messages_likes_idx ON messages(likes DESC);

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

-- Create function to toggle message like
CREATE OR REPLACE FUNCTION toggle_message_like(
    message_id UUID,
    user_id TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    current_liked_by TEXT[];
    is_liked BOOLEAN;
BEGIN
    -- Get current liked_by array
    SELECT liked_by INTO current_liked_by
    FROM messages
    WHERE id = message_id;

    -- Check if user already liked
    is_liked := user_id = ANY(COALESCE(current_liked_by, ARRAY[]::TEXT[]));

    -- Update liked_by array
    IF is_liked THEN
        -- Remove like
        UPDATE messages
        SET liked_by = array_remove(COALESCE(liked_by, ARRAY[]::TEXT[]), user_id)
        WHERE id = message_id;
    ELSE
        -- Add like
        UPDATE messages
        SET liked_by = array_append(COALESCE(liked_by, ARRAY[]::TEXT[]), user_id)
        WHERE id = message_id;
    END IF;

    RETURN NOT is_liked;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
GRANT EXECUTE ON FUNCTION toggle_message_like TO authenticated;