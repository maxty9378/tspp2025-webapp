-- Add AOS task type to task_completions check constraint if not exists
DO $$ BEGIN
    ALTER TABLE task_completions 
    DROP CONSTRAINT IF EXISTS task_completions_task_type_check;

    ALTER TABLE task_completions
    ADD CONSTRAINT task_completions_task_type_check
    CHECK (task_type IN (
        'daily', 'achievement', 'story', 'coins', 'likes', 
        'surveys', 'practice', 'mistake', 'greeting', 'quote', 'slogan',
        'team_activity', 'participants_photo', 'other', 'team_photo', 'aos'
    ));
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add AOS type to tasks type check constraint if not exists
DO $$ BEGIN
    ALTER TABLE tasks 
    DROP CONSTRAINT IF EXISTS tasks_type_check;

    ALTER TABLE tasks
    ADD CONSTRAINT tasks_type_check
    CHECK (type IN ('daily', 'achievement', 'story', 'aos'));
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add enabled column to tasks if not exists
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS enabled BOOLEAN DEFAULT true;

-- Create index for enabled column if not exists
CREATE INDEX IF NOT EXISTS tasks_enabled_idx ON tasks(enabled);

-- Create function to handle AOS completions if not exists
CREATE OR REPLACE FUNCTION handle_aos_completion()
RETURNS TRIGGER AS $$
DECLARE
  task_enabled BOOLEAN;
  has_previous_completion BOOLEAN;
BEGIN
  -- Check if task is enabled
  SELECT enabled INTO task_enabled
  FROM tasks
  WHERE id = NEW.metadata->>'task_id'
  AND type = 'aos';

  IF NOT task_enabled THEN
    RAISE EXCEPTION 'Task is not enabled';
  END IF;

  -- Check for previous completion
  SELECT EXISTS (
    SELECT 1 
    FROM task_completions 
    WHERE user_id = NEW.user_id
    AND task_type = 'aos'
    AND metadata->>'program_id' = NEW.metadata->>'program_id'
  ) INTO has_previous_completion;

  -- Award points if no previous completion
  IF NOT has_previous_completion THEN
    -- Set points awarded
    NEW.points_awarded := 30;

    -- Log completion
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

-- Create trigger for AOS completions if not exists
DROP TRIGGER IF EXISTS handle_aos_completion ON task_completions;
CREATE TRIGGER handle_aos_completion
  BEFORE INSERT ON task_completions
  FOR EACH ROW
  WHEN (NEW.task_type = 'aos')
  EXECUTE FUNCTION handle_aos_completion();

-- Grant permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON FUNCTION handle_aos_completion TO authenticated;