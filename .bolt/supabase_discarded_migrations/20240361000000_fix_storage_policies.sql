-- Drop all existing storage policies
DO $$ 
BEGIN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "StoriesPublicAccess" ON storage.objects;
    DROP POLICY IF EXISTS "StoriesUpload" ON storage.objects;
    DROP POLICY IF EXISTS "StoriesUpdate" ON storage.objects;
    DROP POLICY IF EXISTS "StoriesDelete" ON storage.objects;
    DROP POLICY IF EXISTS "Enable public access" ON storage.objects;
    DROP POLICY IF EXISTS "Enable all operations" ON storage.objects;
EXCEPTION
    WHEN undefined_object THEN null;
END $$;

-- Create bucket if not exists
INSERT INTO storage.buckets (id, name, public)
SELECT 'stories', 'stories', true
WHERE NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'stories'
);

-- Create new storage policies
CREATE POLICY "AllowPublicRead"
ON storage.objects FOR SELECT
USING (bucket_id = 'stories');

CREATE POLICY "AllowPublicInsert"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'stories');

CREATE POLICY "AllowPublicUpdate"
ON storage.objects FOR UPDATE
USING (bucket_id = 'stories')
WITH CHECK (bucket_id = 'stories');

CREATE POLICY "AllowPublicDelete"
ON storage.objects FOR DELETE
USING (bucket_id = 'stories');

-- Disable RLS for storage
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON storage.objects TO anon, authenticated;
GRANT ALL ON storage.buckets TO anon, authenticated;

-- Update stories table
ALTER TABLE public.stories 
ADD COLUMN IF NOT EXISTS is_admin_post BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Create or update indexes
DROP INDEX IF EXISTS stories_user_id_idx;
DROP INDEX IF EXISTS stories_hashtag_idx;
DROP INDEX IF EXISTS stories_is_admin_post_idx;

CREATE INDEX stories_user_id_idx ON stories(user_id);
CREATE INDEX stories_hashtag_idx ON stories(hashtag);
CREATE INDEX stories_is_admin_post_idx ON stories(is_admin_post);