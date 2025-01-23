-- Insert initial AOS program
INSERT INTO tasks (
    id,
    title,
    description,
    type,
    points,
    enabled,
    created_at
) VALUES (
    gen_random_uuid(),
    'Практикум «Стандарты ТСПП – обмен опытом» (Катюрина Д.)',
    'Оцените эффективность активного семинара и работу тренера',
    'aos',
    30,
    true,
    CURRENT_TIMESTAMP
);

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
  WHERE id = NEW.metadata->>'program_id'
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

  -- Award points if no previous completion
  IF NOT has_previous_completion THEN
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
        'points_awarded', 30,
        'ratings', NEW.metadata->'ratings',
        'feedback', NEW.metadata->'feedback'
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for AOS completions
DROP TRIGGER IF EXISTS handle_aos_completion ON task_completions;
CREATE TRIGGER handle_aos_completion
  BEFORE INSERT ON task_completions
  FOR EACH ROW
  WHEN (NEW.task_type = 'aos')
  EXECUTE FUNCTION handle_aos_completion();

-- Grant permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON FUNCTION handle_aos_completion TO authenticated;