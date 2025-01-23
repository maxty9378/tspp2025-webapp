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
CREATE INDEX IF NOT EXISTS aos_responses_user_id_idx ON aos_responses(user_id);
CREATE INDEX IF NOT EXISTS aos_responses_program_id_idx ON aos_responses(program_id);

-- Enable RLS
ALTER TABLE aos_responses ENABLE ROW LEVEL SECURITY;

-- Create policies for aos_responses
CREATE POLICY "aos_responses_select_policy"
ON aos_responses FOR SELECT
USING (
    -- Users can see their own responses
    user_id = auth.uid()::text
    OR
    -- Admins can see all responses
    EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid()::text 
        AND (is_admin = true OR role = 'admin')
    )
);

CREATE POLICY "aos_responses_insert_policy"
ON aos_responses FOR INSERT
WITH CHECK (
    -- Users can only insert their own responses
    user_id = auth.uid()::text
);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION update_aos_response_timestamps()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updating timestamps
CREATE TRIGGER update_aos_response_timestamps
    BEFORE UPDATE ON aos_responses
    FOR EACH ROW
    EXECUTE FUNCTION update_aos_response_timestamps();

-- Grant permissions
GRANT ALL ON aos_responses TO authenticated;
GRANT EXECUTE ON FUNCTION update_aos_response_timestamps TO authenticated;