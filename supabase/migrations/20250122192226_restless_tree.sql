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

-- Create aos_responses table
CREATE TABLE IF NOT EXISTS aos_responses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    program_id TEXT NOT NULL,
    ratings JSONB NOT NULL,
    feedback JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, program_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS tasks_type_idx ON tasks(type);
CREATE INDEX IF NOT EXISTS tasks_enabled_idx ON tasks(enabled);
CREATE INDEX IF NOT EXISTS aos_responses_user_id_idx ON aos_responses(user_id);
CREATE INDEX IF NOT EXISTS aos_responses_program_id_idx ON aos_responses(program_id);

-- Enable RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE aos_responses ENABLE ROW LEVEL SECURITY;

-- Create policies with unique names
CREATE POLICY "tasks_select_v3"
ON tasks FOR SELECT
USING (true);

CREATE POLICY "tasks_insert_v3"
ON tasks FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid()::text 
        AND (is_admin = true OR role = 'admin')
    )
);

CREATE POLICY "tasks_update_v3"
ON tasks FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid()::text 
        AND (is_admin = true OR role = 'admin')
    )
);

-- Create policies for aos_responses
CREATE POLICY "aos_responses_select_v3"
ON aos_responses FOR SELECT
USING (true);

CREATE POLICY "aos_responses_insert_v3"
ON aos_responses FOR INSERT
WITH CHECK (true);

CREATE POLICY "aos_responses_update_v3"
ON aos_responses FOR UPDATE
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION update_timestamps()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updating timestamps
DROP TRIGGER IF EXISTS update_tasks_timestamp ON tasks;
CREATE TRIGGER update_tasks_timestamp
    BEFORE UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamps();

DROP TRIGGER IF EXISTS update_aos_responses_timestamp ON aos_responses;
CREATE TRIGGER update_aos_responses_timestamp
    BEFORE UPDATE ON aos_responses
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamps();

-- Grant permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;