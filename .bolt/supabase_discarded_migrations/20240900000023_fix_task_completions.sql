-- Add missing columns to task_completions if they don't exist
ALTER TABLE public.task_completions 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS points_awarded INTEGER DEFAULT 0;

-- Create index for metadata to improve query performance
CREATE INDEX IF NOT EXISTS task_completions_metadata_gin_idx ON public.task_completions USING gin(metadata);

-- Create function to safely remove task completion
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
        points = GREATEST(0, points - v_completion.points_awarded),
        updated_at = NOW()
      WHERE id = v_completion.user_id;

      -- Delete completion
      DELETE FROM task_completions 
      WHERE id = completion_id;

      v_success := true;
    ELSE
      v_success := false;
    END IF;

    RETURN v_success;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error removing task completion: %', SQLERRM;
    RETURN false;
  END;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION remove_task_completion(UUID) TO anon, authenticated;