-- Create composite unique constraint for quiz completions
ALTER TABLE public.task_completions DROP CONSTRAINT IF EXISTS unique_quiz_completion;
ALTER TABLE public.task_completions 
ADD CONSTRAINT unique_quiz_completion 
UNIQUE (user_id, task_type, (metadata->>'quiz_id'))
WHERE task_type = 'surveys';

-- Create or replace function to handle quiz completion
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

-- Recreate trigger for quiz completion
DROP TRIGGER IF EXISTS quiz_completion_trigger ON task_completions;
CREATE TRIGGER quiz_completion_trigger
  AFTER INSERT ON task_completions
  FOR EACH ROW
  WHEN (NEW.task_type = 'surveys')
  EXECUTE FUNCTION handle_quiz_completion();