-- Drop existing storage policies
DROP POLICY IF EXISTS "Enable read access for all users" ON storage.objects;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON storage.objects;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON storage.objects;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON storage.objects;

-- Create more permissive storage policies
CREATE POLICY "storage_select_policy"
ON storage.objects FOR SELECT
USING (bucket_id = 'stories');

CREATE POLICY "storage_insert_policy"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'stories');

CREATE POLICY "storage_update_policy"
ON storage.objects FOR UPDATE
USING (bucket_id = 'stories');

CREATE POLICY "storage_delete_policy"
ON storage.objects FOR DELETE
USING (bucket_id = 'stories');

-- Drop existing message policies
DROP POLICY IF EXISTS "messages_select" ON messages;
DROP POLICY IF EXISTS "messages_insert" ON messages;
DROP POLICY IF EXISTS "messages_update" ON messages;

-- Create more permissive message policies
CREATE POLICY "messages_select_policy"
ON messages FOR SELECT
USING (true);

CREATE POLICY "messages_insert_policy"
ON messages FOR INSERT
WITH CHECK (true);

CREATE POLICY "messages_update_policy"
ON messages FOR UPDATE
USING (true);

-- Ensure storage bucket exists and is public
INSERT INTO storage.buckets (id, name, public)
VALUES ('stories', 'stories', true)
ON CONFLICT (id) DO UPDATE
SET public = true;

-- Grant permissions
GRANT ALL ON storage.objects TO anon, authenticated;
GRANT ALL ON storage.buckets TO anon, authenticated;
GRANT ALL ON messages TO anon, authenticated;