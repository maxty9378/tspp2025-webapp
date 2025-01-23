-- Drop existing trigger and function
DROP TRIGGER IF EXISTS task_completion_trigger ON task_completions;
DROP FUNCTION IF EXISTS handle_task_completion();

-- Create improved function to handle task completion
CREATE OR REPLACE FUNCTION handle_task_completion()
RETURNS TRIGGER AS $$
DECLARE
  task_points INTEGER;
  is_first_time BOOLEAN;
BEGIN
  -- Get points from tasks table if task_id exists in metadata
  IF NEW.metadata ? 'task_id' THEN
    SELECT points INTO task_points
    FROM tasks
    WHERE id = (NEW.metadata->>'task_id')::uuid;
  END IF;

  -- Check if this is first time completion for this type
  SELECT NOT EXISTS (
    SELECT 1 
    FROM task_completions 
    WHERE user_id = NEW.user_id 
    AND task_type = NEW.task_type
    AND metadata->>'type' = NEW.metadata->>'type'
    AND metadata->>'first_time' = 'true'
  ) INTO is_first_time;

  -- Set first_time flag
  NEW.metadata = jsonb_set(
    NEW.metadata,
    '{first_time}',
    to_jsonb(is_first_time)
  );

  -- Set points based on task type or task table
  NEW.points_awarded := CASE
    -- For tasks from tasks table
    WHEN task_points IS NOT NULL THEN
      task_points
    -- For experience sharing tasks (only award points first time)
    WHEN NEW.task_type = 'daily' AND is_first_time THEN
      CASE NEW.metadata->>'type'
        WHEN 'practice' THEN 50
        WHEN 'mistake' THEN 50
        ELSE 10
      END
    -- For other tasks
    ELSE 0
  END;

  -- Only update user points if points were awarded
  IF NEW.points_awarded > 0 THEN
    -- Update user points
    UPDATE users 
    SET 
      points = COALESCE(points, 0) + NEW.points_awarded,
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
      NEW.points_awarded,
      CASE
        WHEN NEW.metadata ? 'task_id' THEN 'custom_task'
        ELSE NEW.task_type
      END,
      NEW.metadata,
      NOW()
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for task completion
CREATE TRIGGER task_completion_trigger
  BEFORE INSERT ON task_completions
  FOR EACH ROW
  EXECUTE FUNCTION handle_task_completion();

-- Create unique index for first-time completions
DROP INDEX IF EXISTS idx_unique_first_time_completion;
CREATE UNIQUE INDEX idx_unique_first_time_completion 
ON task_completions (user_id, task_type, (metadata->>'type')) 
WHERE metadata->>'first_time' = 'true';

-- Grant permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;