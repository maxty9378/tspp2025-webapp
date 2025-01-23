-- Drop existing storage policies
DROP POLICY IF EXISTS "Enable public access" ON storage.objects;
DROP POLICY IF EXISTS "Enable all operations" ON storage.objects;

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

CREATE POLICY "StoriesUpload"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'stories');

CREATE POLICY "StoriesUpdate"
ON storage.objects FOR UPDATE
USING (bucket_id = 'stories')
WITH CHECK (bucket_id = 'stories');

CREATE POLICY "StoriesDelete"
ON storage.objects FOR DELETE
USING (bucket_id = 'stories');

-- Disable RLS for storage
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON storage.objects TO anon, authenticated;
GRANT ALL ON storage.buckets TO anon, authenticated;

-- Update stories table
ALTER TABLE public.stories 
ADD COLUMN IF NOT EXISTS is_admin_post BOOLEAN DEFAULT false;

-- Create indexes
CREATE INDEX IF NOT EXISTS stories_user_id_idx ON stories(user_id);
CREATE INDEX IF NOT EXISTS stories_hashtag_idx ON stories(hashtag);
CREATE INDEX IF NOT EXISTS stories_is_admin_post_idx ON stories(is_admin_post);