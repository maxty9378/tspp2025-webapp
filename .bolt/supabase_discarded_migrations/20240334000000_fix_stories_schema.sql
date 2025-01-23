-- Drop existing metadata column if exists
ALTER TABLE stories DROP COLUMN IF EXISTS metadata;

-- Add task completion tracking columns
ALTER TABLE stories ADD COLUMN IF NOT EXISTS task_type TEXT CHECK (task_type IN ('speaker_story', 'team_story', 'success_story'));
ALTER TABLE stories ADD COLUMN IF NOT EXISTS points_awarded INTEGER DEFAULT 0;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS points_awarded_at TIMESTAMP WITH TIME ZONE;

-- Create index for task tracking
CREATE INDEX IF NOT EXISTS stories_task_type_idx ON stories(task_type);

-- Create function to handle story points
CREATE OR REPLACE FUNCTION award_story_points()
RETURNS TRIGGER AS $$
BEGIN
  -- Only proceed for new stories
  IF TG_OP = 'INSERT' THEN
    -- Determine points based on hashtag
    CASE
      WHEN NEW.hashtag = '#ЯиСпикер' THEN
        NEW.task_type := 'speaker_story';
        NEW.points_awarded := 50;
      WHEN NEW.hashtag = '#МояКоманда' THEN
        NEW.task_type := 'team_story';
        NEW.points_awarded := 20;
      WHEN NEW.hashtag = '#МойУспех' THEN
        NEW.task_type := 'success_story';
        NEW.points_awarded := 30;
      ELSE
        RETURN NEW;
    END CASE;

    -- Award points and update user
    PERFORM increment_user_points(
      ARRAY[NEW.user_id],
      NEW.points_awarded,
      NEW.task_type,
      jsonb_build_object(
        'story_id', NEW.id,
        'hashtag', NEW.hashtag
      )
    );

    NEW.points_awarded_at := NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for points
DROP TRIGGER IF EXISTS story_points_trigger ON stories;
CREATE TRIGGER story_points_trigger
  BEFORE INSERT ON stories
  FOR EACH ROW
  EXECUTE FUNCTION award_story_points();