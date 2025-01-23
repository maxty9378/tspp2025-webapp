/*
  # Fix Message Likes Migration

  1. Changes:
    - Add likes_count column to messages table
    - Update existing likes to likes_count
    - Add trigger to maintain likes_count
    - Create indexes for performance
    
  2. Safety:
    - Uses IF EXISTS/IF NOT EXISTS clauses
    - Preserves existing data
*/

-- Add likes_count column
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0;

-- Update likes_count from existing likes
UPDATE messages
SET likes_count = likes
WHERE likes_count = 0 AND likes > 0;

-- Create function to maintain likes_count
CREATE OR REPLACE FUNCTION update_message_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    NEW.likes_count = COALESCE(array_length(NEW.liked_by, 1), 0);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for likes_count
DROP TRIGGER IF EXISTS update_message_likes_count ON messages;
CREATE TRIGGER update_message_likes_count
    BEFORE INSERT OR UPDATE OF liked_by ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_message_likes_count();

-- Create index for likes_count
CREATE INDEX IF NOT EXISTS messages_likes_count_idx ON messages(likes_count DESC);

-- Grant permissions
GRANT ALL ON messages TO authenticated;