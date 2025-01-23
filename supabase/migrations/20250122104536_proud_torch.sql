-- Add missing columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS total_coins_earned INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS greeting_message TEXT,
ADD COLUMN IF NOT EXISTS last_greeting_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS slogan TEXT,
ADD COLUMN IF NOT EXISTS last_slogan_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS team_activity_count INTEGER DEFAULT 0;

-- Create points_history table if not exists
CREATE TABLE IF NOT EXISTS points_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    points INTEGER NOT NULL,
    reason TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT points_history_user_id_fkey 
        FOREIGN KEY (user_id) 
        REFERENCES users(id) 
        ON DELETE CASCADE
);

-- Create system_logs table if not exists
CREATE TABLE IF NOT EXISTS system_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    level TEXT NOT NULL CHECK (level IN ('info', 'warn', 'error')),
    event TEXT NOT NULL,
    user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    details JSONB DEFAULT '{}'::jsonb,
    error_message TEXT,
    error_stack TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS users_total_coins_earned_idx ON users(total_coins_earned);
CREATE INDEX IF NOT EXISTS users_last_greeting_date_idx ON users(last_greeting_date);
CREATE INDEX IF NOT EXISTS users_last_slogan_date_idx ON users(last_slogan_date);
CREATE INDEX IF NOT EXISTS users_team_activity_count_idx ON users(team_activity_count);
CREATE INDEX IF NOT EXISTS points_history_user_id_idx ON points_history(user_id);
CREATE INDEX IF NOT EXISTS points_history_created_at_idx ON points_history(created_at DESC);
CREATE INDEX IF NOT EXISTS system_logs_timestamp_idx ON system_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS system_logs_level_idx ON system_logs(level);
CREATE INDEX IF NOT EXISTS system_logs_user_id_idx ON system_logs(user_id);

-- Enable RLS
ALTER TABLE points_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$ BEGIN
    DROP POLICY IF EXISTS "Enable read access for all users" ON points_history;
    DROP POLICY IF EXISTS "Enable insert for all users" ON points_history;
    DROP POLICY IF EXISTS "Enable insert for all users" ON system_logs;
    DROP POLICY IF EXISTS "Enable read access for admins only" ON system_logs;
EXCEPTION
    WHEN undefined_object THEN null;
END $$;

-- Create new policies
CREATE POLICY "Enable points history read"
ON points_history FOR SELECT
USING (true);

CREATE POLICY "Enable points history insert"
ON points_history FOR INSERT
WITH CHECK (true);

CREATE POLICY "Enable system logs insert"
ON system_logs FOR INSERT
WITH CHECK (true);

CREATE POLICY "Enable system logs read for admins"
ON system_logs FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid()::text 
        AND is_admin = true
    )
);

-- Create function to increment points
CREATE OR REPLACE FUNCTION increment_points(
    p_user_id TEXT,
    p_amount INTEGER,
    p_reason TEXT DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
    new_points INTEGER;
BEGIN
    -- Update user points
    UPDATE users
    SET points = COALESCE(points, 0) + p_amount,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_user_id
    RETURNING points INTO new_points;

    -- Create points history record
    INSERT INTO points_history (
        user_id,
        points,
        reason,
        metadata
    ) VALUES (
        p_user_id,
        p_amount,
        COALESCE(p_reason, 'other'),
        jsonb_build_object(
            'points_awarded', p_amount,
            'reason', p_reason
        )
    );

    -- Log the points update
    INSERT INTO system_logs (
        level,
        event,
        user_id,
        details
    ) VALUES (
        'info',
        'Points incremented',
        p_user_id,
        jsonb_build_object(
            'amount', p_amount,
            'reason', p_reason,
            'new_total', new_points
        )
    );

    RETURN new_points;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON FUNCTION increment_points(TEXT, INTEGER, TEXT) TO authenticated;