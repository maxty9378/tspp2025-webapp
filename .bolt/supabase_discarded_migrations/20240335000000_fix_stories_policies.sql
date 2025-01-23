-- Drop existing policies
DROP POLICY IF EXISTS "Enable read access for all users" ON storage.objects;
DROP POLICY IF EXISTS "Enable uploads" ON storage.objects;
DROP POLICY IF EXISTS "Enable updates" ON storage.objects;
DROP POLICY IF EXISTS "Enable deletes" ON storage.objects;

-- Create storage bucket if not exists
INSERT INTO storage.buckets (id, name, public)
SELECT 'stories', 'stories', true
WHERE NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'stories'
);

-- Create comprehensive storage policies
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'stories');

CREATE POLICY "Allow Uploads"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'stories' AND
    (auth.role() = 'anon' OR auth.role() = 'authenticated')
);

CREATE POLICY "Allow Updates"
ON storage.objects FOR UPDATE
USING (bucket_id = 'stories')
WITH CHECK (bucket_id = 'stories');

CREATE POLICY "Allow Deletes"
ON storage.objects FOR DELETE
USING (bucket_id = 'stories');

-- Disable RLS temporarily for storage
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON storage.objects TO anon, authenticated;
GRANT ALL ON storage.buckets TO anon, authenticated;

-- Create or replace stories policies
CREATE POLICY "Enable read access for all users"
ON public.stories FOR SELECT
USING (true);

CREATE POLICY "Enable insert for all users"
ON public.stories FOR INSERT
WITH CHECK (true);

CREATE POLICY "Enable update for all users"
ON public.stories FOR UPDATE
USING (true)
WITH CHECK (true);

-- Create or replace story_slides policies  
CREATE POLICY "Enable read access for all users"
ON public.story_slides FOR SELECT
USING (true);

CREATE POLICY "Enable insert for all users"
ON public.story_slides FOR INSERT
WITH CHECK (true);

CREATE POLICY "Enable update for all users"
ON public.story_slides FOR UPDATE
USING (true)
WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS stories_user_id_idx ON public.stories(user_id);
CREATE INDEX IF NOT EXISTS stories_expires_at_idx ON public.stories(expires_at);
CREATE INDEX IF NOT EXISTS story_slides_story_id_idx ON public.story_slides(story_id);
CREATE INDEX IF NOT EXISTS story_slides_liked_by_idx ON public.story_slides USING gin(liked_by);

-- Grant permissions
GRANT ALL ON public.stories TO anon, authenticated;
GRANT ALL ON public.story_slides TO anon, authenticated;