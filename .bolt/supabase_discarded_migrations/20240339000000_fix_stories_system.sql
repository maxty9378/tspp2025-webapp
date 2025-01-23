-- First, drop all existing policies and triggers
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Allow All Operations" ON storage.objects;
DROP TRIGGER IF EXISTS story_points_trigger ON public.stories;
DROP FUNCTION IF EXISTS handle_story_points();

-- Ensure stories bucket exists
INSERT INTO storage.buckets (id, name, public)
SELECT 'stories', 'stories', true
WHERE NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'stories'
);

-- Create simplified storage policies
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'stories');

CREATE POLICY "Allow All Operations"
ON storage.objects FOR ALL
USING (bucket_id = 'stories')
WITH CHECK (bucket_id = 'stories');

-- Disable RLS for storage
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- Update stories table structure
ALTER TABLE public.stories 
ADD COLUMN IF NOT EXISTS task_type TEXT,
ADD COLUMN IF NOT EXISTS points_awarded INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Create improved story points function
CREATE OR REPLACE FUNCTION handle_story_points()
RETURNS TRIGGER AS $$
DECLARE
  task_points INTEGER;
  task_name TEXT;
  is_admin BOOLEAN;
BEGIN
  -- Check if user is admin
  SELECT is_admin INTO is_admin FROM users WHERE id = NEW.user_id;
  
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
  NEW.metadata := jsonb_build_object(
    'is_admin_post', is_admin,
    'awarded_at', CURRENT_TIMESTAMP
  );

  -- Only award points if not admin
  IF NOT is_admin THEN
    -- Update user status and points
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
        'hashtag', NEW.hashtag,
        'task_type', task_name
      ),
      NOW()
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER story_points_trigger
  BEFORE INSERT ON public.stories
  FOR EACH ROW
  EXECUTE FUNCTION handle_story_points();

-- Grant permissions
GRANT ALL ON storage.objects TO anon, authenticated;
GRANT ALL ON storage.buckets TO anon, authenticated;
GRANT ALL ON public.stories TO anon, authenticated;
GRANT ALL ON public.story_slides TO anon, authenticated;