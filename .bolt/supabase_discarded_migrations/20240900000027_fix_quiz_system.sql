-- Drop existing constraint if exists
ALTER TABLE public.users 
DROP CONSTRAINT IF EXISTS completed_surveys_non_negative;

-- Create function to handle quiz completion with transaction
CREATE OR REPLACE FUNCTION record_quiz_completion(
  p_user_id TEXT,
  p_quiz_id TEXT,
  p_quiz_title TEXT,
  p_score INTEGER,
  p_total_questions INTEGER,
  p_points_earned INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
  -- Start transaction
  BEGIN
    -- Update user's completed_surveys count and points
    UPDATE users 
    SET 
      completed_surveys = COALESCE(completed_surveys, 0) + 1,
      points = COALESCE(points, 0) + p_points_earned,
      updated_at = NOW()
    WHERE id = p_user_id;

    -- Create task completion record
    INSERT INTO task_completions (
      user_id,
      task_type,
      points_awarded,
      metadata,
      completed_at
    ) VALUES (
      p_user_id,
      'surveys',
      p_points_earned,
      jsonb_build_object(
        'quiz_id', p_quiz_id,
        'quiz_title', p_quiz_title,
        'score', p_score,
        'total_questions', p_total_questions
      ),
      NOW()
    );

    RETURN true;
  EXCEPTION 
    WHEN OTHERS THEN
      RAISE NOTICE 'Error in record_quiz_completion: %', SQLERRM;
      RETURN false;
  END;
END;
$$;