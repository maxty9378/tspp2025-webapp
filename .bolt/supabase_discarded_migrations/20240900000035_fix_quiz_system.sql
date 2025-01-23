-- Drop existing constraints and functions
DROP TRIGGER IF EXISTS quiz_completion_trigger ON task_completions;
DROP FUNCTION IF EXISTS handle_quiz_completion();
DROP FUNCTION IF EXISTS increment_user_surveys(TEXT);

-- Create function to handle quiz completion
CREATE OR REPLACE FUNCTION handle_quiz_completion()
RETURNS TRIGGER AS $$
BEGIN
  -- Update user's completed_surveys count and points
  UPDATE users 
  SET 
    completed_surveys = COALESCE(completed_surveys, 0) + 1,
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
    'quiz_completed',
    NEW.metadata,
    NOW()
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for quiz completion
CREATE TRIGGER quiz_completion_trigger
  AFTER INSERT ON task_completions
  FOR EACH ROW
  WHEN (NEW.task_type = 'surveys')
  EXECUTE FUNCTION handle_quiz_completion();

-- Create unique index for quiz completions
DROP INDEX IF EXISTS idx_unique_quiz_completion;
CREATE UNIQUE INDEX idx_unique_quiz_completion 
ON task_completions (user_id, (metadata->>'quiz_id')) 
WHERE task_type = 'surveys';

-- Grant permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;