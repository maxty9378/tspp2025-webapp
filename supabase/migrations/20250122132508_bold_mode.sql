/*
  # Fix messages RLS policies

  1. Messages Table Policies
    - Drop existing policies to avoid conflicts
    - Create proper RLS policies for messages table
    - Grant necessary permissions
*/

-- Drop existing policies
DROP POLICY IF EXISTS "messages_read_all" ON messages;
DROP POLICY IF EXISTS "messages_insert_all" ON messages;
DROP POLICY IF EXISTS "messages_update_all" ON messages;

-- Enable RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create new policies with proper permissions
CREATE POLICY "messages_select"
ON messages FOR SELECT
USING (true);

CREATE POLICY "messages_insert"
ON messages FOR INSERT
WITH CHECK (
  -- Allow insert if authenticated
  auth.role() = 'authenticated'
  OR
  -- Or if admin
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid()::text 
    AND is_admin = true
  )
);

CREATE POLICY "messages_update"
ON messages FOR UPDATE
USING (
  -- Allow update if owner
  user_id = auth.uid()::text
  OR
  -- Or if admin
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid()::text 
    AND is_admin = true
  )
);

-- Create function to handle message creation with proper user_id
CREATE OR REPLACE FUNCTION handle_message_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- Set user_id if not provided
  IF NEW.user_id IS NULL THEN
    NEW.user_id := COALESCE(auth.uid()::text, 'admin');
  END IF;

  -- Set created_at and updated_at
  NEW.created_at := COALESCE(NEW.created_at, now());
  NEW.updated_at := COALESCE(NEW.updated_at, now());

  -- Initialize arrays if null
  NEW.liked_by := COALESCE(NEW.liked_by, ARRAY[]::text[]);
  NEW.likes := COALESCE(NEW.likes, 0);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for message insert
DROP TRIGGER IF EXISTS handle_message_insert ON messages;
CREATE TRIGGER handle_message_insert
  BEFORE INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION handle_message_insert();

-- Grant permissions
GRANT ALL ON messages TO authenticated;