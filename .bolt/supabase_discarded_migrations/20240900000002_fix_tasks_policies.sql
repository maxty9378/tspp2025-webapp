-- First drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access for all users" ON public.tasks;
DROP POLICY IF EXISTS "Enable write access for admins" ON public.tasks;

-- Create fresh policies
CREATE POLICY "Enable read access for all users"
ON public.tasks FOR SELECT
USING (true);

CREATE POLICY "Enable write access for admins"
ON public.tasks FOR ALL
USING (true)
WITH CHECK (true);

-- Ensure RLS is enabled
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON public.tasks TO anon, authenticated;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS tasks_type_idx ON tasks(type);
CREATE INDEX IF NOT EXISTS tasks_created_at_idx ON tasks(created_at);