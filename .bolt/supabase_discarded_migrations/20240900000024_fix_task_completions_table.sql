-- Add missing columns and constraints to task_completions
ALTER TABLE public.task_completions 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS points_awarded INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS task_type TEXT NOT NULL,
ADD CONSTRAINT task_completions_type_check CHECK (
  task_type IN ('daily', 'achievement', 'story', 'coins', 'likes', 'surveys')
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS task_completions_user_id_idx ON task_completions(user_id);
CREATE INDEX IF NOT EXISTS task_completions_task_type_idx ON task_completions(task_type);
CREATE INDEX IF NOT EXISTS task_completions_completed_at_idx ON task_completions(completed_at);
CREATE INDEX IF NOT EXISTS task_completions_metadata_gin_idx ON task_completions USING gin(metadata);

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

-- Grant permissions
GRANT ALL ON public.task_completions TO anon, authenticated;
GRANT EXECUTE ON FUNCTION remove_task_completion(UUID) TO anon, authenticated;