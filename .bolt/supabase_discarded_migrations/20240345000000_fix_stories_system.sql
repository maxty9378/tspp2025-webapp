-- Drop existing trigger and function
DROP TRIGGER IF EXISTS story_points_trigger ON public.stories;
DROP FUNCTION IF EXISTS handle_story_points();

-- Create improved story points function
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
  NEW.metadata := jsonb_build_object(
    'awarded_at', CURRENT_TIMESTAMP,
    'task_type', task_name,
    'hashtag', NEW.hashtag
  );

  -- Only award points for non-system posts
  IF NOT NEW.is_admin_post AND NEW.user_id != 'system' THEN
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
      NEW.metadata,
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

-- Ensure proper indexes
CREATE INDEX IF NOT EXISTS stories_is_admin_post_idx ON stories(is_admin_post);
CREATE INDEX IF NOT EXISTS stories_task_type_idx ON stories(task_type);
CREATE INDEX IF NOT EXISTS stories_user_id_idx ON stories(user_id);

-- Grant permissions
GRANT ALL ON public.stories TO anon, authenticated;