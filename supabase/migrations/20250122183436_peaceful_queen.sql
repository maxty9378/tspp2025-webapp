-- Add AOS task type to task_completions check constraint
ALTER TABLE task_completions 
DROP CONSTRAINT IF EXISTS task_completions_task_type_check;

ALTER TABLE task_completions
ADD CONSTRAINT task_completions_task_type_check
CHECK (task_type IN (
    'daily', 'achievement', 'story', 'coins', 'likes', 
    'surveys', 'practice', 'mistake', 'greeting', 'quote', 'slogan',
    'team_activity', 'participants_photo', 'other', 'team_photo', 'aos'
));

-- Create function to handle AOS points
CREATE OR REPLACE FUNCTION handle_aos_points()
RETURNS TRIGGER AS $$
DECLARE
  has_previous_completion BOOLEAN;
BEGIN
  -- Only handle AOS type
  IF NEW.task_type != 'aos' THEN
    RETURN NEW;
  END IF;

  -- Check for previous completion for this program
  SELECT EXISTS (
    SELECT 1 
    FROM task_completions 
    WHERE user_id = NEW.user_id
    AND task_type = 'aos'
    AND metadata->>'program_id' = NEW.metadata->>'program_id'
  ) INTO has_previous_completion;

  -- Award points if no previous completion for this program
  IF NOT has_previous_completion THEN
    -- Award points
    PERFORM increment_points(
      NEW.user_id,
      30,
      'aos_completion'
    );

    -- Log the completion
    INSERT INTO system_logs (
      level,
      event,
      user_id,
      details
    ) VALUES (
      'info',
      'AOS completed',
      NEW.user_id,
      jsonb_build_object(
        'program_id', NEW.metadata->>'program_id',
        'program_title', NEW.metadata->>'program_title',
        'points_awarded', 30
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for AOS points
DROP TRIGGER IF EXISTS handle_aos_points ON task_completions;
CREATE TRIGGER handle_aos_points
  AFTER INSERT ON task_completions
  FOR EACH ROW
  WHEN (NEW.task_type = 'aos')
  EXECUTE FUNCTION handle_aos_points();

-- Grant permissions
GRANT EXECUTE ON FUNCTION handle_aos_points TO authenticated;