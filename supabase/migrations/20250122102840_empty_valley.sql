-- Drop existing policies
DROP POLICY IF EXISTS "Enable read access for all users" ON public.users;
DROP POLICY IF EXISTS "Enable insert for new users" ON public.users;
DROP POLICY IF EXISTS "Enable self updates" ON public.users;

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

-- Create function to handle user creation with upsert logic
CREATE OR REPLACE FUNCTION handle_user_creation()
RETURNS TRIGGER AS $$
BEGIN
    -- If user already exists, update their data
    IF EXISTS (SELECT 1 FROM users WHERE id = NEW.id) THEN
        UPDATE users SET
            username = COALESCE(NEW.username, users.username),
            first_name = COALESCE(NEW.first_name, users.first_name),
            last_name = COALESCE(NEW.last_name, users.last_name),
            photo_url = COALESCE(NEW.photo_url, users.photo_url),
            is_admin = COALESCE(NEW.is_admin, users.is_admin),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = NEW.id;
        RETURN NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for user creation
DROP TRIGGER IF EXISTS handle_user_creation ON users;
CREATE TRIGGER handle_user_creation
    BEFORE INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION handle_user_creation();

-- Ensure task_completions has proper foreign key relationship
ALTER TABLE task_completions
    DROP CONSTRAINT IF EXISTS task_completions_user_id_fkey,
    ADD CONSTRAINT task_completions_user_id_fkey 
    FOREIGN KEY (user_id) 
    REFERENCES users(id) 
    ON DELETE CASCADE;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS task_completions_user_id_idx ON task_completions(user_id);
CREATE INDEX IF NOT EXISTS task_completions_type_date_idx ON task_completions(task_type, completed_at DESC);

-- Grant permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;