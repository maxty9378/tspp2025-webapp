-- Add role column to users if not exists
ALTER TABLE users
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'participant'
CHECK (role IN ('participant', 'organizer', 'speaker', 'admin'));

-- Create tasks table if not exists
CREATE TABLE IF NOT EXISTS tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL CHECK (type IN ('daily', 'achievement', 'story', 'aos')),
    points INTEGER NOT NULL DEFAULT 0,
    program_id TEXT,
    enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create index for tasks
CREATE INDEX IF NOT EXISTS tasks_type_idx ON tasks(type);
CREATE INDEX IF NOT EXISTS tasks_enabled_idx ON tasks(enabled);

-- Enable RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access for all users" ON tasks;
DROP POLICY IF EXISTS "Enable insert for admins" ON tasks;
DROP POLICY IF EXISTS "Enable update for admins" ON tasks;

-- Create policies with unique names
CREATE POLICY "tasks_select_policy"
ON tasks FOR SELECT
USING (true);

CREATE POLICY "tasks_insert_policy"
ON tasks FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid()::text 
        AND (is_admin = true OR role = 'admin')
    )
);

CREATE POLICY "tasks_update_policy"
ON tasks FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid()::text 
        AND (is_admin = true OR role = 'admin')
    )
);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION update_task_timestamps()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updating timestamps
CREATE TRIGGER update_task_timestamps
    BEFORE UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_task_timestamps();

-- Grant permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;