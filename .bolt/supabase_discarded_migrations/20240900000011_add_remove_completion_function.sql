-- Create function to safely remove task completion
CREATE OR REPLACE FUNCTION remove_task_completion(completion_id UUID)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_completion RECORD;
BEGIN
  -- Get completion details within transaction
  SELECT * INTO v_completion
  FROM task_completions
  WHERE id = completion_id
  FOR UPDATE;

  IF FOUND THEN
    -- Update user points
    UPDATE users 
    SET 
      points = points - v_completion.points_awarded,
      updated_at = NOW()
    WHERE id = v_completion.user_id;

    -- Delete completion
    DELETE FROM task_completions 
    WHERE id = completion_id;
  END IF;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION remove_task_completion(UUID) TO anon, authenticated;