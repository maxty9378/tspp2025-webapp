-- Drop existing storage policies
DROP POLICY IF EXISTS "StoriesPublicRead" ON storage.objects;
DROP POLICY IF EXISTS "StoriesPublicWrite" ON storage.objects;
DROP POLICY IF EXISTS "StoriesPublicUpdate" ON storage.objects;
DROP POLICY IF EXISTS "StoriesPublicDelete" ON storage.objects;

-- Ensure stories bucket exists and is public
INSERT INTO storage.buckets (id, name, public)
SELECT 'stories', 'stories', true
WHERE NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'stories'
);

-- Create simplified storage policies
CREATE POLICY "AllowPublicAccess"
ON storage.objects FOR ALL
USING (true)
WITH CHECK (true);

-- Disable RLS for storage
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

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