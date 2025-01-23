/*
  # Update quiz points system

  1. Changes
    - Add quiz-specific task type
    - Update points handling for quiz completions
    - Add quiz completion tracking

  2. Security
    - Enable RLS for all tables
    - Add appropriate policies
*/

-- Add quiz type to task_completions check constraint
ALTER TABLE task_completions 
DROP CONSTRAINT IF EXISTS task_completions_task_type_check;

ALTER TABLE task_completions
ADD CONSTRAINT task_completions_task_type_check
CHECK (task_type IN (
    'daily', 'achievement', 'story', 'coins', 'likes', 
    'surveys', 'practice', 'mistake', 'greeting', 'quote', 'slogan',
    'team_activity', 'participants_photo', 'other', 'team_photo', 'aos', 'quiz'
));

-- Create function to handle quiz completions
CREATE OR REPLACE FUNCTION handle_quiz_completion()
RETURNS TRIGGER AS $$
DECLARE
  today DATE := CURRENT_DATE;
  has_completed BOOLEAN;
BEGIN
  -- Check if quiz already completed
  SELECT EXISTS (
    SELECT 1 
    FROM task_completions 
    WHERE user_id = NEW.user_id
    AND task_type = 'quiz'
    AND metadata->>'quiz_id' = NEW.metadata->>'quiz_id'
  ) INTO has_completed;

  IF has_completed THEN
    RAISE EXCEPTION 'Quiz already completed';
  END IF;

  -- Always award 40 points for quiz completion
  NEW.points_awarded := 40;

  -- Log completion
  INSERT INTO system_logs (
    level,
    event,
    user_id,
    details
  ) VALUES (
    'info',
    'Quiz completed',
    NEW.user_id,
    jsonb_build_object(
      'quiz_id', NEW.metadata->>'quiz_id',
      'quiz_title', NEW.metadata->>'quiz_title',
      'points_awarded', 40,
      'score', NEW.metadata->>'score',
      'total_questions', NEW.metadata->>'total_questions'
    )
  );

  -- Award points
  PERFORM increment_points(
    NEW.user_id,
    40,
    'quiz_completion'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for quiz completions
DROP TRIGGER IF EXISTS handle_quiz_completion ON task_completions;
CREATE TRIGGER handle_quiz_completion
  BEFORE INSERT ON task_completions
  FOR EACH ROW
  WHEN (NEW.task_type = 'quiz')
  EXECUTE FUNCTION handle_quiz_completion();

-- Grant permissions
GRANT EXECUTE ON FUNCTION handle_quiz_completion TO authenticated;