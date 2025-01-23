-- Create function to handle task completion
CREATE OR REPLACE FUNCTION handle_task_completion()
RETURNS TRIGGER AS $$
BEGIN
  -- Update user's task completion status and points
  UPDATE users 
  SET 
    completed_surveys = CASE 
      WHEN NEW.task_type = 'surveys' THEN COALESCE(completed_surveys, 0) + 1
      ELSE completed_surveys
    END,
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
    NEW.task_type,
    NEW.metadata,
    NOW()
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for task completion
DROP TRIGGER IF EXISTS task_completion_trigger ON task_completions;
CREATE TRIGGER task_completion_trigger
  AFTER INSERT ON task_completions
  FOR EACH ROW
  EXECUTE FUNCTION handle_task_completion();

-- Create unique index for task completions
DROP INDEX IF EXISTS idx_unique_task_completion;
CREATE UNIQUE INDEX idx_unique_task_completion 
ON task_completions (user_id, task_type, (metadata->>'task_id')) 
WHERE task_type IN ('surveys', 'daily', 'story');