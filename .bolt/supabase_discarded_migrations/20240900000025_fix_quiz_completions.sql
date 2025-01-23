-- Drop existing constraints if they exist
DO $$ 
BEGIN
    ALTER TABLE public.users DROP CONSTRAINT IF EXISTS completed_surveys_non_negative;
EXCEPTION 
    WHEN undefined_object THEN NULL;
END $$;

-- Create increment function if not exists
CREATE OR REPLACE FUNCTION increment(
  tbl regclass,
  column_name text,
  amount integer,
  where_clause text DEFAULT ''
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  EXECUTE format(
    'UPDATE %s SET %I = COALESCE(%I, 0) + $1 WHERE %s',
    tbl,
    column_name,
    column_name,
    CASE WHEN where_clause = '' THEN 'true' ELSE where_clause END
  ) USING amount;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION increment(regclass, text, integer, text) TO anon, authenticated;

-- Add completed_surveys column if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'completed_surveys'
    ) THEN
        ALTER TABLE public.users ADD COLUMN completed_surveys INTEGER DEFAULT 0;
    END IF;
END $$;

-- Create index for completed_surveys if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'users' AND indexname = 'users_completed_surveys_idx'
    ) THEN
        CREATE INDEX users_completed_surveys_idx ON users(completed_surveys);
    END IF;
END $$;

-- Create function to handle quiz completion
CREATE OR REPLACE FUNCTION handle_quiz_completion()
RETURNS TRIGGER AS $$
BEGIN
  -- Update user's completed_surveys count and points
  UPDATE users 
  SET 
    completed_surveys = COALESCE(completed_surveys, 0) + 1,
    points = COALESCE(points, 0) + NEW.points_awarded,
    updated_at = NOW()
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for quiz completion
DROP TRIGGER IF EXISTS quiz_completion_trigger ON task_completions;
CREATE TRIGGER quiz_completion_trigger
  AFTER INSERT ON task_completions
  FOR EACH ROW
  WHEN (NEW.task_type = 'surveys')
  EXECUTE FUNCTION handle_quiz_completion();