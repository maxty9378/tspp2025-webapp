-- Drop existing storage policies
DROP POLICY IF EXISTS "Enable public access" ON storage.objects;
DROP POLICY IF EXISTS "Enable all operations" ON storage.objects;

-- Ensure stories bucket exists and is public
INSERT INTO storage.buckets (id, name, public)
SELECT 'stories', 'stories', true
WHERE NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'stories'
);

-- Create more permissive storage policies
CREATE POLICY "StoragePublicRead"
ON storage.objects FOR SELECT
USING (true);

CREATE POLICY "StoragePublicWrite"
ON storage.objects FOR INSERT
WITH CHECK (true);

CREATE POLICY "StoragePublicUpdate"
ON storage.objects FOR UPDATE
USING (true)
WITH CHECK (true);

CREATE POLICY "StoragePublicDelete"
ON storage.objects FOR DELETE
USING (true);

-- Enable RLS but with permissive policies
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Update stories table policies
DROP POLICY IF EXISTS "Enable read access for all users" ON public.stories;
DROP POLICY IF EXISTS "Enable insert for all users" ON public.stories;
DROP POLICY IF EXISTS "Enable update for all users" ON public.stories;

CREATE POLICY "StoriesPublicRead"
ON public.stories FOR SELECT
USING (true);

CREATE POLICY "StoriesPublicWrite"
ON public.stories FOR INSERT
WITH CHECK (true);

CREATE POLICY "StoriesPublicUpdate"
ON public.stories FOR UPDATE
USING (true)
WITH CHECK (true);

-- Update story_slides table policies
DROP POLICY IF EXISTS "Enable read access for all users" ON public.story_slides;
DROP POLICY IF EXISTS "Enable insert for all users" ON public.story_slides;
DROP POLICY IF EXISTS "Enable update for all users" ON public.story_slides;

CREATE POLICY "SlidesPublicRead"
ON public.story_slides FOR SELECT
USING (true);

CREATE POLICY "SlidesPublicWrite"
ON public.story_slides FOR INSERT
WITH CHECK (true);

CREATE POLICY "SlidesPublicUpdate"
ON public.story_slides FOR UPDATE
USING (true)
WITH CHECK (true);

-- Grant full permissions
GRANT ALL ON storage.objects TO anon, authenticated;
GRANT ALL ON storage.buckets TO anon, authenticated;
GRANT ALL ON public.stories TO anon, authenticated;
GRANT ALL ON public.story_slides TO anon, authenticated;

-- Ensure proper indexes
CREATE INDEX IF NOT EXISTS stories_user_id_idx ON stories(user_id);
CREATE INDEX IF NOT EXISTS stories_hashtag_idx ON stories(hashtag);
CREATE INDEX IF NOT EXISTS story_slides_story_id_idx ON story_slides(story_id);