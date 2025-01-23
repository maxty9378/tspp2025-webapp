-- Drop existing policies and disable RLS
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.stories DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_slides DISABLE ROW LEVEL SECURITY;

-- Ensure stories bucket exists and is public
INSERT INTO storage.buckets (id, name, public)
SELECT 'stories', 'stories', true
WHERE NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'stories'
);

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

-- Create or replace function to ensure user exists
CREATE OR REPLACE FUNCTION ensure_user_exists()
RETURNS TRIGGER AS $$
BEGIN
  -- Clean user ID
  NEW.user_id := REGEXP_REPLACE(NEW.user_id, '[^a-zA-Z0-9_]', '', 'g');
  
  -- Create user if doesn't exist
  IF NOT EXISTS (SELECT 1 FROM users WHERE id = NEW.user_id) THEN
    INSERT INTO users (
      id,
      username,
      first_name,
      last_name,
      created_at,
      updated_at
    ) VALUES (
      NEW.user_id,
      NEW.user_id,
      'User',
      '',
      NOW(),
      NOW()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS ensure_user_trigger ON stories;
CREATE TRIGGER ensure_user_trigger
  BEFORE INSERT ON stories
  FOR EACH ROW
  EXECUTE FUNCTION ensure_user_exists();

-- Ensure proper indexes
CREATE INDEX IF NOT EXISTS stories_user_id_idx ON stories(user_id);
CREATE INDEX IF NOT EXISTS stories_hashtag_idx ON stories(hashtag);
CREATE INDEX IF NOT EXISTS story_slides_story_id_idx ON story_slides(story_id);