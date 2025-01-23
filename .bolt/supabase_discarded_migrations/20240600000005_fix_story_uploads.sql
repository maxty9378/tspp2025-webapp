-- Drop existing storage policies
DROP POLICY IF EXISTS "StoragePublicRead" ON storage.objects;
DROP POLICY IF EXISTS "StoragePublicWrite" ON storage.objects;
DROP POLICY IF EXISTS "StoragePublicUpdate" ON storage.objects;
DROP POLICY IF EXISTS "StoragePublicDelete" ON storage.objects;

-- Ensure stories bucket exists and is public
INSERT INTO storage.buckets (id, name, public)
SELECT 'stories', 'stories', true
WHERE NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'stories'
);

-- Create simplified storage policies
CREATE POLICY "AllowAllOperations"
ON storage.objects FOR ALL
USING (true)
WITH CHECK (true);

-- Disable RLS for storage completely
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- Grant full permissions
GRANT ALL ON storage.objects TO anon, authenticated;
GRANT ALL ON storage.buckets TO anon, authenticated;

-- Update stories table to handle user creation
ALTER TABLE public.stories DROP CONSTRAINT IF EXISTS stories_user_id_fkey;
ALTER TABLE public.stories 
  ADD CONSTRAINT stories_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES public.users(id) 
  ON DELETE CASCADE 
  DEFERRABLE INITIALLY DEFERRED;

-- Create or replace user creation function
CREATE OR REPLACE FUNCTION create_user_if_not_exists()
RETURNS TRIGGER AS $$
BEGIN
  -- Clean user ID
  NEW.user_id := REPLACE(NEW.user_id, '@', '');
  
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
DROP TRIGGER IF EXISTS create_user_trigger ON stories;
CREATE TRIGGER create_user_trigger
  BEFORE INSERT ON stories
  FOR EACH ROW
  EXECUTE FUNCTION create_user_if_not_exists();

-- Grant permissions
GRANT ALL ON public.stories TO anon, authenticated;
GRANT ALL ON public.story_slides TO anon, authenticated;