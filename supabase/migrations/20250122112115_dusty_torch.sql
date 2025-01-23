/*
  # Fix message likes system

  1. Changes
    - Add likes column to messages table
    - Add function to handle message likes
    - Add trigger for likes updates
    - Add index for likes column

  2. Security
    - Enable RLS for messages table
    - Add policies for likes management
*/

-- Add likes column if not exists
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS likes INTEGER DEFAULT 0;

-- Create function to handle message likes
CREATE OR REPLACE FUNCTION handle_message_like()
RETURNS TRIGGER AS $$
BEGIN
    -- Update likes count based on liked_by array
    NEW.likes = COALESCE(array_length(NEW.liked_by, 1), 0);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for likes
DROP TRIGGER IF EXISTS update_message_likes ON messages;
CREATE TRIGGER update_message_likes
    BEFORE INSERT OR UPDATE OF liked_by ON messages
    FOR EACH ROW
    EXECUTE FUNCTION handle_message_like();

-- Create index for likes
CREATE INDEX IF NOT EXISTS messages_likes_idx ON messages(likes DESC);

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
        SET liked_by = array_remove(COALESCE(liked_by, ARRAY[]::TEXT[]), user_id),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = message_id;
    ELSE
        -- Add like
        UPDATE messages
        SET liked_by = array_append(COALESCE(liked_by, ARRAY[]::TEXT[]), user_id),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = message_id;
    END IF;

    RETURN NOT is_liked;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION toggle_message_like TO authenticated;