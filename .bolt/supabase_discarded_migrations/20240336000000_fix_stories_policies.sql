-- Drop existing policies first
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Allow Uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow Updates" ON storage.objects;
DROP POLICY IF EXISTS "Allow Deletes" ON storage.objects;

-- Ensure stories bucket exists
INSERT INTO storage.buckets (id, name, public)
SELECT 'stories', 'stories', true
WHERE NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'stories'
);

-- Create simplified storage policies
CREATE POLICY "Enable public access"
ON storage.objects FOR SELECT
USING (bucket_id = 'stories');

CREATE POLICY "Enable uploads"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'stories');

CREATE POLICY "Enable modifications"
ON storage.objects FOR ALL
USING (bucket_id = 'stories')
WITH CHECK (bucket_id = 'stories');

-- Disable RLS for storage
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- Grant full permissions
GRANT ALL ON storage.objects TO anon, authenticated;
GRANT ALL ON storage.buckets TO anon, authenticated;

-- Update stories table
ALTER TABLE public.stories 
ADD COLUMN IF NOT EXISTS task_type TEXT,
ADD COLUMN IF NOT EXISTS points_awarded INTEGER DEFAULT 0;

-- Create or replace story trigger
CREATE OR REPLACE FUNCTION handle_story_points()
RETURNS TRIGGER AS $$
BEGIN
  -- Set task type and points based on hashtag
  IF NEW.hashtag = '#ЯиСпикер' THEN
    NEW.task_type := 'speaker_story';
    NEW.points_awarded := 50;
  ELSIF NEW.hashtag = '#МояКоманда' THEN
    NEW.task_type := 'team_story';
    NEW.points_awarded := 20;
  ELSIF NEW.hashtag = '#МойУспех' THEN
    NEW.task_type := 'success_story';
    NEW.points_awarded := 30;
  END IF;

  -- Award points if applicable
  IF NEW.points_awarded > 0 THEN
    PERFORM increment_user_points(
      ARRAY[NEW.user_id],
      NEW.points_awarded,
      NEW.task_type
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS story_points_trigger ON public.stories;
CREATE TRIGGER story_points_trigger
  BEFORE INSERT ON public.stories
  FOR EACH ROW
  EXECUTE FUNCTION handle_story_points();

-- Grant permissions
GRANT ALL ON public.stories TO anon, authenticated;
GRANT ALL ON public.story_slides TO anon, authenticated;