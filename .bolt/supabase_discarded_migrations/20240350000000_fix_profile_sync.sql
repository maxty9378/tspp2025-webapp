-- Drop existing policies
DROP POLICY IF EXISTS "Enable read access for all users" ON public.users;
DROP POLICY IF EXISTS "Enable insert for all users" ON public.users;
DROP POLICY IF EXISTS "Enable update for all users" ON public.users;

-- Create more permissive policies for users table
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

-- Ensure RLS is enabled but with permissive policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS users_id_idx ON public.users(id);
CREATE INDEX IF NOT EXISTS users_username_idx ON public.users(username);
CREATE INDEX IF NOT EXISTS users_last_active_idx ON public.users(last_active);

-- Grant full permissions
GRANT ALL ON public.users TO anon, authenticated;
GRANT USAGE ON SCHEMA public TO anon, authenticated;