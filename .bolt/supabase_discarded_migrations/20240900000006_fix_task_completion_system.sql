-- Drop existing tables and policies if they exist
DROP TABLE IF EXISTS public.task_completions CASCADE;

-- Create task_completions table with proper schema
CREATE TABLE IF NOT EXISTS public.task_completions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    task_type TEXT NOT NULL CHECK (task_type IN ('coins', 'likes', 'surveys', 'stories')),
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    points_awarded INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS task_completions_user_id_idx ON task_completions(user_id);
CREATE INDEX IF NOT EXISTS task_completions_task_type_idx ON task_completions(task_type);
CREATE INDEX IF NOT EXISTS task_completions_completed_at_idx ON task_completions(completed_at);

-- Enable RLS
ALTER TABLE public.task_completions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for all users"
ON public.task_completions FOR SELECT
USING (true);

CREATE POLICY "Enable insert for all users"
ON public.task_completions FOR INSERT
WITH CHECK (true);

-- Create function to handle task completion
CREATE OR REPLACE FUNCTION handle_task_completion()
RETURNS TRIGGER AS $$
BEGIN
  -- Set points based on task type
  NEW.points_awarded := CASE NEW.task_type
    WHEN 'coins' THEN 10
    WHEN 'likes' THEN 10
    WHEN 'surveys' THEN 15
    WHEN 'stories' THEN 50
    ELSE 0
  END;

  -- Update user points
  UPDATE users 
  SET 
    points = points + NEW.points_awarded,
    updated_at = NOW()
  WHERE id = NEW.user_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for task completion
DROP TRIGGER IF EXISTS task_completion_trigger ON task_completions;
CREATE TRIGGER task_completion_trigger
  BEFORE INSERT ON task_completions
  FOR EACH ROW
  EXECUTE FUNCTION handle_task_completion();

-- Grant permissions
GRANT ALL ON public.task_completions TO anon, authenticated;