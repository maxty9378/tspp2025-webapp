-- Create programs table if not exists
CREATE TABLE IF NOT EXISTS programs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    day_index INTEGER NOT NULL CHECK (day_index BETWEEN 0 AND 4),
    time_start TIME NOT NULL,
    time_end TIME NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    location TEXT,
    duration TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_time_range CHECK (time_start < time_end)
);

-- Create program_speakers table if not exists
CREATE TABLE IF NOT EXISTS program_speakers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    program_id UUID REFERENCES programs(id) ON DELETE CASCADE,
    speaker_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('primary', 'secondary', 'tertiary')),
    UNIQUE (program_id, speaker_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS programs_day_index_idx ON programs(day_index);
CREATE INDEX IF NOT EXISTS programs_time_start_idx ON programs(time_start);
CREATE INDEX IF NOT EXISTS program_speakers_program_id_idx ON program_speakers(program_id);
CREATE INDEX IF NOT EXISTS program_speakers_speaker_id_idx ON program_speakers(speaker_id);

-- Enable RLS
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_speakers ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "programs_select_policy"
ON programs FOR SELECT
USING (true);

CREATE POLICY "programs_insert_policy"
ON programs FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid()::text 
        AND (is_admin = true OR role = 'admin')
    )
);

CREATE POLICY "programs_update_policy"
ON programs FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid()::text 
        AND (is_admin = true OR role = 'admin')
    )
);

CREATE POLICY "program_speakers_select_policy"
ON program_speakers FOR SELECT
USING (true);

CREATE POLICY "program_speakers_insert_policy"
ON program_speakers FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid()::text 
        AND (is_admin = true OR role = 'admin')
    )
);

CREATE POLICY "program_speakers_update_policy"
ON program_speakers FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid()::text 
        AND (is_admin = true OR role = 'admin')
    )
);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION update_program_timestamps()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updating timestamps
CREATE TRIGGER update_program_timestamps
    BEFORE UPDATE ON programs
    FOR EACH ROW
    EXECUTE FUNCTION update_program_timestamps();

-- Grant permissions
GRANT ALL ON programs TO authenticated;
GRANT ALL ON program_speakers TO authenticated;