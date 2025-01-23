-- First, drop all existing policies
DO $$ 
BEGIN
    -- Drop storage policies if they exist
    DROP POLICY IF EXISTS "StoragePublicAccess" ON storage.objects;
    DROP POLICY IF EXISTS "StoragePublicWrite" ON storage.objects;
    DROP POLICY IF EXISTS "StoragePublicUpdate" ON storage.objects;
    DROP POLICY IF EXISTS "StoragePublicDelete" ON storage.objects;
    DROP POLICY IF EXISTS "StoriesPublicRead" ON public.stories;
    DROP POLICY IF EXISTS "StoriesPublicWrite" ON public.stories;
    DROP POLICY IF EXISTS "StoriesPublicUpdate" ON public.stories;
    DROP POLICY IF EXISTS "SlidesPublicRead" ON public.story_slides;
    DROP POLICY IF EXISTS "SlidesPublicWrite" ON public.story_slides;
    DROP POLICY IF EXISTS "SlidesPublicUpdate" ON public.story_slides;
EXCEPTION
    WHEN undefined_object THEN null;
END $$;

-- Ensure stories bucket exists and is public
INSERT INTO storage.buckets (id, name, public)
SELECT 'stories', 'stories', true
WHERE NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'stories'
);

-- Disable RLS completely for all relevant tables
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.stories DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_slides DISABLE ROW LEVEL SECURITY;

-- Grant full permissions
GRANT ALL ON storage.objects TO anon, authenticated;
GRANT ALL ON storage.buckets TO anon, authenticated;
GRANT ALL ON public.stories TO anon, authenticated;
GRANT ALL ON public.story_slides TO anon, authenticated;

-- Update foreign key constraint to be more permissive
ALTER TABLE public.stories DROP CONSTRAINT IF EXISTS stories_user_id_fkey;
ALTER TABLE public.stories 
  ADD CONSTRAINT stories_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES public.users(id) 
  ON DELETE CASCADE 
  DEFERRABLE INITIALLY DEFERRED;

-- Ensure proper indexes exist
CREATE INDEX IF NOT EXISTS stories_user_id_idx ON stories(user_id);
CREATE INDEX IF NOT EXISTS stories_hashtag_idx ON stories(hashtag);
CREATE INDEX IF NOT EXISTS story_slides_story_id_idx ON story_slides(story_id);