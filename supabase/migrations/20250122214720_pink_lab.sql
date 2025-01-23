-- Add reply_to column to messages table
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS reply_to JSONB;

-- Create index for reply_to column
CREATE INDEX IF NOT EXISTS messages_reply_to_idx ON messages USING gin(reply_to);

-- Update messages policies
DROP POLICY IF EXISTS "messages_select_policy" ON messages;
DROP POLICY IF EXISTS "messages_insert_policy" ON messages;
DROP POLICY IF EXISTS "messages_update_policy" ON messages;

CREATE POLICY "messages_select_policy"
ON messages FOR SELECT
USING (true);

CREATE POLICY "messages_insert_policy"
ON messages FOR INSERT
WITH CHECK (true);

CREATE POLICY "messages_update_policy"
ON messages FOR UPDATE
USING (true)
WITH CHECK (true);

-- Grant permissions
GRANT ALL ON messages TO authenticated;