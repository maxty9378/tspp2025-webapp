-- Reset all policies
DROP POLICY IF EXISTS "Enable read access for all users" ON public.users;
DROP POLICY IF EXISTS "Enable insert for all users" ON public.users;
DROP POLICY IF EXISTS "Enable update for all users" ON public.users;
DROP POLICY IF EXISTS "Enable read access for all messages" ON public.messages;
DROP POLICY IF EXISTS "Enable insert for all messages" ON public.messages;
DROP POLICY IF EXISTS "Enable read access for all task completions" ON public.task_completions;
DROP POLICY IF EXISTS "Enable insert for all task completions" ON public.task_completions;

-- Create policies for users table
CREATE POLICY "Enable read access for all users"
ON public.users FOR SELECT
USING (true);

CREATE POLICY "Enable insert for all users"
ON public.users FOR INSERT
WITH CHECK (true);

CREATE POLICY "Enable update for all users"
ON public.users FOR UPDATE
USING (true)
WITH CHECK (true);

-- Create policies for messages table
CREATE POLICY "Enable read access for all messages"
ON public.messages FOR SELECT
USING (true);

CREATE POLICY "Enable insert for all messages"
ON public.messages FOR INSERT
WITH CHECK (
  type IN ('text', 'image', 'task') AND
  text IS NOT NULL AND
  (type = 'text' OR (type = 'image' AND image_url IS NOT NULL) OR (type = 'task' AND task_id IS NOT NULL))
);

-- Create policies for task_completions table
CREATE POLICY "Enable read access for all task completions"
ON public.task_completions FOR SELECT
USING (true);

CREATE POLICY "Enable insert for all task completions"
ON public.task_completions FOR INSERT
WITH CHECK (true);

-- Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;