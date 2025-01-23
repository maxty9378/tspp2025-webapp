-- Create task_completions table if not exists
CREATE TABLE IF NOT EXISTS public.task_completions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    task_type TEXT NOT NULL CHECK (task_type IN ('coins', 'likes', 'surveys', 'stories')),
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    points_awarded INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS task_completions_user_id_idx ON task_completions(user_id);
CREATE INDEX IF NOT EXISTS task_completions_task_id_idx ON task_completions(task_id);
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

-- Grant permissions
GRANT ALL ON public.task_completions TO anon, authenticated;