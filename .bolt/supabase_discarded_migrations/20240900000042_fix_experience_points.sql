-- Drop existing trigger and function
DROP TRIGGER IF EXISTS task_completion_trigger ON task_completions;
DROP FUNCTION IF EXISTS handle_task_completion();

-- Create improved function to handle task completion
CREATE OR REPLACE FUNCTION handle_task_completion()
RETURNS TRIGGER AS $$
DECLARE
  is_first_time BOOLEAN;
BEGIN
  -- Check if this is first time completion for this type
  SELECT NOT EXISTS (
    SELECT 1 
    FROM task_completions 
    WHERE user_id = NEW.user_id 
    AND task_type = NEW.task_type
    AND metadata->>'type' = NEW.metadata->>'type'
    AND metadata->>'first_time' = 'true'
  ) INTO is_first_time;

  -- Set first_time flag and points
  NEW.metadata = jsonb_set(
    NEW.metadata,
    '{first_time}',
    to_jsonb(is_first_time)
  );

  -- Only award points if it's first time
  IF is_first_time THEN
    NEW.points_awarded := CASE NEW.task_type
      WHEN 'daily' THEN
        CASE NEW.metadata->>'type'
          WHEN 'practice' THEN 50
          WHEN 'mistake' THEN 50
          ELSE 10
        END
      ELSE 0
    END;

    -- Update user points
    UPDATE users 
    SET 
      points = COALESCE(points, 0) + NEW.points_awarded,
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
      NEW.points_awarded,
      NEW.task_type,
      NEW.metadata,
      NOW()
    );
  ELSE
    NEW.points_awarded := 0;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for task completion
CREATE TRIGGER task_completion_trigger
  BEFORE INSERT ON task_completions
  FOR EACH ROW
  EXECUTE FUNCTION handle_task_completion();

-- Update existing completions to mark first-time status
WITH completion_ranks AS (
  SELECT 
    user_id,
    task_type,
    metadata->>'type' as task_subtype,
    created_at,
    ROW_NUMBER() OVER (
      PARTITION BY user_id, task_type, metadata->>'type' 
      ORDER BY created_at ASC
    ) as rn
  FROM task_completions
  WHERE metadata->>'type' IN ('practice', 'mistake')
)
UPDATE task_completions tc
SET metadata = jsonb_set(
  metadata,
  '{first_time}',
  CASE 
    WHEN cr.rn = 1 THEN 'true'::jsonb
    ELSE 'false'::jsonb
  END
)
FROM completion_ranks cr
WHERE tc.user_id = cr.user_id
  AND tc.task_type = cr.task_type
  AND tc.metadata->>'type' = cr.task_subtype;

-- Create unique index for first-time completions
DROP INDEX IF EXISTS idx_unique_first_time_completion;
CREATE UNIQUE INDEX idx_unique_first_time_completion 
ON task_completions (user_id, task_type, (metadata->>'type')) 
WHERE metadata->>'first_time' = 'true';

-- Grant permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;