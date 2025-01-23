-- First, drop all existing storage policies
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Allow All Operations" ON storage.objects;

-- Create bucket if not exists
INSERT INTO storage.buckets (id, name, public)
SELECT 'stories', 'stories', true
WHERE NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'stories'
);

-- Create simplified storage policies
CREATE POLICY "StoriesPublicAccess"
ON storage.objects FOR SELECT
USING (bucket_id = 'stories');

CREATE POLICY "StoriesAllOperations"
ON storage.objects FOR ALL
USING (bucket_id = 'stories')
WITH CHECK (bucket_id = 'stories');

-- Enable RLS but with permissive policies
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Grant full permissions
GRANT ALL ON storage.objects TO anon, authenticated;
GRANT ALL ON storage.buckets TO anon, authenticated;