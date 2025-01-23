-- Add completed_surveys column if not exists
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS completed_surveys INTEGER DEFAULT 0;

-- Create index for completed_surveys
CREATE INDEX IF NOT EXISTS users_completed_surveys_idx ON users(completed_surveys);

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
DROP TRIGGER IF EXISTS quiz_completion_trigger ON task_completions;
CREATE TRIGGER quiz_completion_trigger
  AFTER INSERT ON task_completions
  FOR EACH ROW
  WHEN (NEW.task_type = 'surveys')
  EXECUTE FUNCTION handle_quiz_completion();

-- Create unique constraint for quiz completions
ALTER TABLE task_completions
ADD CONSTRAINT unique_quiz_completion 
UNIQUE (user_id, task_type, (metadata->>'quiz_id'));