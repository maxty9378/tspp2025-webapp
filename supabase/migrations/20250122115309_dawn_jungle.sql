/*
  # Fix Messages Relationship Migration

  1. Changes:
    - Add proper foreign key relationship between users and messages
    - Add indexes for performance
    - Update RLS policies
    
  2. Safety:
    - Uses IF EXISTS/IF NOT EXISTS clauses
    - Preserves existing data
*/

-- Drop existing foreign key if exists
ALTER TABLE messages 
DROP CONSTRAINT IF EXISTS messages_user_id_fkey;

-- Add proper foreign key constraint
ALTER TABLE messages
ADD CONSTRAINT messages_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES users(id)
ON DELETE CASCADE;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS messages_user_id_idx ON messages(user_id);
CREATE INDEX IF NOT EXISTS messages_user_likes_idx ON messages(user_id, likes DESC);

-- Update RLS policies
DROP POLICY IF EXISTS "Enable read access for all users" ON messages;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON messages;
DROP POLICY IF EXISTS "Enable update for message owner" ON messages;

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