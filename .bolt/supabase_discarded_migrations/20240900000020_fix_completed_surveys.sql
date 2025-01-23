-- Add completed_surveys column to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS completed_surveys INTEGER DEFAULT 0;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS users_completed_surveys_idx ON public.users(completed_surveys);

-- Create function to handle survey completion
CREATE OR REPLACE FUNCTION handle_survey_completion()
RETURNS TRIGGER AS $$
BEGIN
  -- Update user's completed_surveys count and points
  UPDATE users 
  SET 
    completed_surveys = COALESCE(completed_surveys, 0) + 1,
    points = COALESCE(points, 0) + 15, -- Award 15 points per survey
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
    15,
    'survey_completed',
    jsonb_build_object(
      'survey_id', NEW.metadata->>'survey_id',
      'survey_name', NEW.metadata->>'survey_name'
    ),
    NOW()
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for survey completion
DROP TRIGGER IF EXISTS survey_completion_trigger ON task_completions;
CREATE TRIGGER survey_completion_trigger
  AFTER INSERT ON task_completions
  FOR EACH ROW
  WHEN (NEW.task_type = 'surveys')
  EXECUTE FUNCTION handle_survey_completion();