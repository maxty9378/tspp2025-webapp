-- Drop existing constraints and functions
DROP TRIGGER IF EXISTS quiz_completion_trigger ON task_completions;
DROP FUNCTION IF EXISTS handle_quiz_completion();
DROP FUNCTION IF EXISTS increment_user_surveys(TEXT);

-- Create index on metadata->quiz_id
CREATE INDEX IF NOT EXISTS idx_task_completions_quiz_id ON task_completions ((metadata->>'quiz_id')) WHERE task_type = 'surveys';

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
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for quiz completion
CREATE TRIGGER quiz_completion_trigger
  AFTER INSERT ON task_completions
  FOR EACH ROW
  WHEN (NEW.task_type = 'surveys')
  EXECUTE FUNCTION handle_quiz_completion();

-- Create function to increment user's completed surveys
CREATE OR REPLACE FUNCTION increment_user_surveys(user_id TEXT)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE users 
  SET 
    completed_surveys = COALESCE(completed_surveys, 0) + 1,
    updated_at = NOW()
  WHERE id = user_id;
END;
$$;

-- Create unique index instead of constraint
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_quiz_completion 
ON task_completions (user_id, task_type, (metadata->>'quiz_id')) 
WHERE task_type = 'surveys';

-- Grant permissions
GRANT EXECUTE ON FUNCTION handle_quiz_completion() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION increment_user_surveys(TEXT) TO anon, authenticated;