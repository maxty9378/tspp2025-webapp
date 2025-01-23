-- Drop existing policies
DROP POLICY IF EXISTS "programs_select_policy" ON programs;
DROP POLICY IF EXISTS "programs_insert_policy" ON programs;
DROP POLICY IF EXISTS "programs_update_policy" ON programs;
DROP POLICY IF EXISTS "program_speakers_select_policy" ON program_speakers;
DROP POLICY IF EXISTS "program_speakers_insert_policy" ON program_speakers;
DROP POLICY IF EXISTS "program_speakers_update_policy" ON program_speakers;

-- Create more permissive policies for programs
CREATE POLICY "programs_select_policy"
ON programs FOR SELECT
USING (true);

CREATE POLICY "programs_insert_policy"
ON programs FOR INSERT
WITH CHECK (true);

CREATE POLICY "programs_update_policy"
ON programs FOR UPDATE
USING (true)
WITH CHECK (true);

CREATE POLICY "programs_delete_policy"
ON programs FOR DELETE
USING (true);

-- Create more permissive policies for program_speakers
CREATE POLICY "program_speakers_select_policy"
ON program_speakers FOR SELECT
USING (true);

CREATE POLICY "program_speakers_insert_policy"
ON program_speakers FOR INSERT
WITH CHECK (true);

CREATE POLICY "program_speakers_update_policy"
ON program_speakers FOR UPDATE
USING (true)
WITH CHECK (true);

CREATE POLICY "program_speakers_delete_policy"
ON program_speakers FOR DELETE
USING (true);

-- Grant permissions
GRANT ALL ON programs TO authenticated;
GRANT ALL ON program_speakers TO authenticated;