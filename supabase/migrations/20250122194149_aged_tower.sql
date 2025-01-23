/*
  # Fix AOS task completions

  1. Changes
    - Adds unique index for AOS task completions
    - Updates policies for AOS responses
    - Adds proper handling for AOS completions
*/

-- Drop existing policies
DROP POLICY IF EXISTS "aos_responses_select" ON aos_responses;
DROP POLICY IF EXISTS "aos_responses_insert" ON aos_responses;
DROP POLICY IF EXISTS "aos_responses_update" ON aos_responses;

-- Create more permissive policies for aos_responses
CREATE POLICY "aos_responses_select_v4"
ON aos_responses FOR SELECT
USING (true);

CREATE POLICY "aos_responses_insert_v4"
ON aos_responses FOR INSERT
WITH CHECK (true);

CREATE POLICY "aos_responses_update_v4"
ON aos_responses FOR UPDATE
USING (true);

-- Create unique index for task completions
CREATE UNIQUE INDEX IF NOT EXISTS task_completions_aos_unique_idx 
ON task_completions (user_id, task_type, (metadata->>'program_id'::text))
WHERE task_type = 'aos';

-- Create function to handle AOS completions
CREATE OR REPLACE FUNCTION handle_aos_completion()
RETURNS TRIGGER AS $$
DECLARE
  task_enabled BOOLEAN;
  has_previous_completion BOOLEAN;
BEGIN
  -- Check if task is enabled
  SELECT enabled INTO task_enabled
  FROM tasks
  WHERE id::text = NEW.metadata->>'program_id'
  AND type = 'aos';

  IF NOT task_enabled THEN
    RAISE EXCEPTION 'Task is not enabled';
  END IF;

  -- Check for previous completion
  SELECT EXISTS (
    SELECT 1 
    FROM task_completions 
    WHERE user_id = NEW.user_id
    AND task_type = 'aos'
    AND metadata->>'program_id' = NEW.metadata->>'program_id'
  ) INTO has_previous_completion;

  IF has_previous_completion THEN
    RAISE EXCEPTION 'AOS already completed for this program';
  END IF;

  -- Set points awarded
  NEW.points_awarded := 30;

  -- Log completion
  INSERT INTO system_logs (
    level,
    event,
    user_id,
    details
  ) VALUES (
    'info',
    'AOS completed',
    NEW.user_id,
    jsonb_build_object(
      'program_id', NEW.metadata->>'program_id',
      'program_title', NEW.metadata->>'program_title',
      'points_awarded', 30
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop and recreate trigger for AOS completions
DROP TRIGGER IF EXISTS handle_aos_completion ON task_completions;
CREATE TRIGGER handle_aos_completion
  BEFORE INSERT ON task_completions
  FOR EACH ROW
  WHEN (NEW.task_type = 'aos')
  EXECUTE FUNCTION handle_aos_completion();

-- Grant permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON FUNCTION handle_aos_completion TO authenticated;