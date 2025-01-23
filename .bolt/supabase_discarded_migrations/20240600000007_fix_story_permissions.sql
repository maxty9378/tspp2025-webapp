-- Drop existing storage policies
DROP POLICY IF EXISTS "StorageFullAccess" ON storage.objects;

-- Create simplified storage policy
CREATE POLICY "AllowEverything"
ON storage.objects FOR ALL
USING (true)
WITH CHECK (true);

-- Disable RLS for storage
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- Grant full permissions
GRANT ALL ON storage.objects TO anon, authenticated;
GRANT ALL ON storage.buckets TO anon, authenticated;

-- Update stories table permissions
ALTER TABLE public.stories DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_slides DISABLE ROW LEVEL SECURITY;

-- Grant full permissions to stories tables
GRANT ALL ON public.stories TO anon, authenticated;
GRANT ALL ON public.story_slides TO anon, authenticated;

-- Ensure proper indexes
CREATE INDEX IF NOT EXISTS stories_user_id_idx ON stories(user_id);
CREATE INDEX IF NOT EXISTS stories_hashtag_idx ON stories(hashtag);
CREATE INDEX IF NOT EXISTS story_slides_story_id_idx ON story_slides(story_id);

-- Update user trigger to be more permissive
CREATE OR REPLACE FUNCTION ensure_user_exists()
RETURNS TRIGGER AS $$
BEGIN
  -- Clean user ID more permissively
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