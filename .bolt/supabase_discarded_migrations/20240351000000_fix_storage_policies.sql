-- Drop existing storage policies
DROP POLICY IF EXISTS "StoriesPublicAccess" ON storage.objects;
DROP POLICY IF EXISTS "StoriesAllOperations" ON storage.objects;

-- Create bucket if not exists
INSERT INTO storage.buckets (id, name, public)
SELECT 'stories', 'stories', true
WHERE NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'stories'
);

-- Create simplified storage policies
CREATE POLICY "Enable public access"
ON storage.objects FOR SELECT
USING (true);

CREATE POLICY "Enable all operations"
ON storage.objects FOR ALL
USING (true)
WITH CHECK (true);

-- Disable RLS for storage
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- Grant full permissions
GRANT ALL ON storage.objects TO anon, authenticated;
GRANT ALL ON storage.buckets TO anon, authenticated;