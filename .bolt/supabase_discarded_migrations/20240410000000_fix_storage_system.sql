-- Drop existing storage policies
DROP POLICY IF EXISTS "StoriesPublicAccess" ON storage.objects;
DROP POLICY IF EXISTS "StoriesAllOperations" ON storage.objects;
DROP POLICY IF EXISTS "Enable public access" ON storage.objects;
DROP POLICY IF EXISTS "Enable all operations" ON storage.objects;

-- Ensure stories bucket exists and is public
INSERT INTO storage.buckets (id, name, public)
SELECT 'stories', 'stories', true
WHERE NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'stories'
);

-- Create new storage policies
CREATE POLICY "StoriesPublicRead"
ON storage.objects FOR SELECT
USING (bucket_id = 'stories');

CREATE POLICY "StoriesPublicWrite"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'stories');

CREATE POLICY "StoriesPublicUpdate"
ON storage.objects FOR UPDATE
USING (bucket_id = 'stories')
WITH CHECK (bucket_id = 'stories');

CREATE POLICY "StoriesPublicDelete"
ON storage.objects FOR DELETE
USING (bucket_id = 'stories');

-- Enable RLS but with permissive policies
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON storage.objects TO anon, authenticated;
GRANT ALL ON storage.buckets TO anon, authenticated;

-- Update system user
UPDATE public.users
SET 
    username = 'ТСПП',
    first_name = 'ТСПП',
    last_name = '',
    is_admin = true,
    role = 'system'
WHERE id = 'system';