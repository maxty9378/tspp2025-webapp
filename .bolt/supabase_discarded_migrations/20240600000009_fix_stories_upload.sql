-- Drop existing storage policies
DROP POLICY IF EXISTS "StorageFullAccess" ON storage.objects;
DROP POLICY IF EXISTS "AllowPublicAccess" ON storage.objects;

-- Ensure stories bucket exists and is public
INSERT INTO storage.buckets (id, name, public)
SELECT 'stories', 'stories', true
WHERE NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'stories'
);

-- Disable RLS for storage
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- Grant full permissions
GRANT ALL ON storage.objects TO anon, authenticated;
GRANT ALL ON storage.buckets TO anon, authenticated;

-- Disable RLS for stories tables
ALTER TABLE public.stories DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_slides DISABLE ROW LEVEL SECURITY;

-- Grant full permissions
GRANT ALL ON public.stories TO anon, authenticated;
GRANT ALL ON public.story_slides TO anon, authenticated;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS stories_user_id_idx ON stories(user_id);
CREATE INDEX IF NOT EXISTS stories_hashtag_idx ON stories(hashtag);
CREATE INDEX IF NOT EXISTS story_slides_story_id_idx ON story_slides(story_id);

-- Update foreign key constraint to be more permissive
ALTER TABLE public.stories DROP CONSTRAINT IF EXISTS stories_user_id_fkey;
ALTER TABLE public.stories 
  ADD CONSTRAINT stories_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES public.users(id) 
  ON DELETE CASCADE 
  DEFERRABLE INITIALLY DEFERRED;