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

-- Create indexes
CREATE INDEX IF NOT EXISTS tasks_type_idx ON tasks(type);
CREATE INDEX IF NOT EXISTS tasks_created_at_idx ON tasks(created_at);

-- Enable RLS
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for all users"
ON public.tasks FOR SELECT
USING (true);

CREATE POLICY "Enable write access for admins"
ON public.tasks FOR ALL
USING (true)
WITH CHECK (true);

-- Grant permissions
GRANT ALL ON public.tasks TO anon, authenticated;