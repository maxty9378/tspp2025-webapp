-- Add enabled column to tasks table
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS enabled BOOLEAN DEFAULT true;

-- Create index for enabled column
CREATE INDEX IF NOT EXISTS tasks_enabled_idx ON tasks(enabled);

-- Add AOS type to tasks type check constraint
ALTER TABLE tasks 
DROP CONSTRAINT IF EXISTS tasks_type_check;

ALTER TABLE tasks
ADD CONSTRAINT tasks_type_check
CHECK (type IN ('daily', 'achievement', 'story', 'aos'));

-- Create function to handle AOS task completions
CREATE OR REPLACE FUNCTION handle_aos_completion()
RETURNS TRIGGER AS $$
DECLARE
  task_enabled BOOLEAN;
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
  IF EXISTS (
    SELECT 1 
    FROM task_completions 
    WHERE user_id = NEW.user_id
    AND task_type = 'aos'
    AND metadata->>'task_id' = NEW.metadata->>'task_id'
  ) THEN
    RAISE EXCEPTION 'AOS already completed for this program';
  END IF;

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
      'task_id', NEW.metadata->>'task_id',
      'program_title', NEW.metadata->>'program_title',
      'points_awarded', 30
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for AOS completions
DROP TRIGGER IF EXISTS handle_aos_completion ON task_completions;
CREATE TRIGGER handle_aos_completion
  BEFORE INSERT ON task_completions
  FOR EACH ROW
  WHEN (NEW.task_type = 'aos')
  EXECUTE FUNCTION handle_aos_completion();

-- Grant permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON FUNCTION handle_aos_completion TO authenticated;