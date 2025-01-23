-- Drop existing policies
DROP POLICY IF EXISTS "aos_responses_select_policy" ON aos_responses;
DROP POLICY IF EXISTS "aos_responses_insert_policy" ON aos_responses;

-- Create more permissive policies
CREATE POLICY "aos_responses_select"
ON aos_responses FOR SELECT
USING (true);

CREATE POLICY "aos_responses_insert"
ON aos_responses FOR INSERT
WITH CHECK (true);

-- Create policy for updates
CREATE POLICY "aos_responses_update"
ON aos_responses FOR UPDATE
USING (true)
WITH CHECK (true);

-- Grant permissions
GRANT ALL ON aos_responses TO authenticated;