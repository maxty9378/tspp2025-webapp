-- Drop existing function if exists
DROP FUNCTION IF EXISTS remove_task_completion(UUID);

-- Create improved function to safely remove task completion
CREATE OR REPLACE FUNCTION remove_task_completion(completion_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  v_completion RECORD;
  v_success BOOLEAN;
BEGIN
  -- Start transaction
  BEGIN
    -- Get completion details with lock
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

      v_success := true;
    ELSE
      v_success := false;
    END IF;

    -- Commit transaction
    RETURN v_success;
  EXCEPTION WHEN OTHERS THEN
    -- Rollback will happen automatically
    RAISE NOTICE 'Error removing task completion: %', SQLERRM;
    RETURN false;
  END;
END;
$$;

-- Create function to get task completion details
CREATE OR REPLACE FUNCTION get_task_completion(completion_id UUID)
RETURNS TABLE (
  id UUID,
  user_id TEXT,
  task_type TEXT,
  points_awarded INTEGER,
  metadata JSONB,
  completed_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    tc.id,
    tc.user_id,
    tc.task_type,
    tc.points_awarded,
    tc.metadata,
    tc.completed_at
  FROM task_completions tc
  WHERE tc.id = completion_id;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION remove_task_completion(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_task_completion(UUID) TO anon, authenticated;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS task_completions_metadata_task_id_idx ON task_completions USING gin ((metadata->'task_id'));