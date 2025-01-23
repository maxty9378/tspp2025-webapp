-- Drop existing policies
DROP POLICY IF EXISTS "Enable public access" ON storage.objects;
DROP POLICY IF EXISTS "Enable uploads" ON storage.objects;
DROP POLICY IF EXISTS "Enable modifications" ON storage.objects;

-- Create simplified storage policies
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (true);

CREATE POLICY "Allow All Operations"
ON storage.objects FOR ALL
USING (true)
WITH CHECK (true);

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
DECLARE
  task_points INTEGER;
  task_name TEXT;
BEGIN
  -- Set task type and points based on hashtag
  CASE NEW.hashtag
    WHEN '#ЯиСпикер' THEN
      task_name := 'speaker_story';
      task_points := 50;
    WHEN '#МояКоманда' THEN
      task_name := 'team_story';
      task_points := 20;
    WHEN '#МойУспех' THEN
      task_name := 'success_story';
      task_points := 30;
    ELSE
      RETURN NEW;
  END CASE;

  -- Update story record
  NEW.task_type := task_name;
  NEW.points_awarded := task_points;

  -- Award points and update user status
  UPDATE users 
  SET 
    points = points + task_points,
    speaker_story_posted = CASE WHEN task_name = 'speaker_story' THEN true ELSE speaker_story_posted END,
    team_story_posted = CASE WHEN task_name = 'team_story' THEN true ELSE team_story_posted END,
    success_story_posted = CASE WHEN task_name = 'success_story' THEN true ELSE success_story_posted END,
    updated_at = NOW()
  WHERE id = NEW.user_id;

  -- Record points history
  INSERT INTO points_history (
    user_id,
    points_added,
    reason,
    metadata,
    created_at
  ) VALUES (
    NEW.user_id,
    task_points,
    task_name,
    jsonb_build_object(
      'story_id', NEW.id,
      'hashtag', NEW.hashtag
    ),
    NOW()
  );

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