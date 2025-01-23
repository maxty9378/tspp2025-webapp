-- Drop existing tables and policies if they exist
DROP TABLE IF EXISTS public.task_completions CASCADE;
DROP TABLE IF EXISTS public.tasks CASCADE;

-- Create tasks table
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    points INTEGER DEFAULT 0,
    type TEXT CHECK (type IN ('daily', 'achievement', 'story')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create task_completions table
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
CREATE INDEX IF NOT EXISTS tasks_type_idx ON tasks(type);
CREATE INDEX IF NOT EXISTS tasks_created_at_idx ON tasks(created_at);
CREATE INDEX IF NOT EXISTS task_completions_user_id_idx ON task_completions(user_id);
CREATE INDEX IF NOT EXISTS task_completions_task_id_idx ON task_completions(task_id);
CREATE INDEX IF NOT EXISTS task_completions_task_type_idx ON task_completions(task_type);
CREATE INDEX IF NOT EXISTS task_completions_completed_at_idx ON task_completions(completed_at);

-- Enable RLS
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_completions ENABLE ROW LEVEL SECURITY;

-- Create policies for tasks
CREATE POLICY "Enable read access for all users"
ON public.tasks FOR SELECT
USING (true);

CREATE POLICY "Enable write access for admins"
ON public.tasks FOR ALL
USING (true)
WITH CHECK (true);

-- Create policies for task_completions
CREATE POLICY "Enable read access for all users"
ON public.task_completions FOR SELECT
USING (true);

CREATE POLICY "Enable insert for all users"
ON public.task_completions FOR INSERT
WITH CHECK (true);

-- Grant permissions
GRANT ALL ON public.tasks TO anon, authenticated;
GRANT ALL ON public.task_completions TO anon, authenticated;