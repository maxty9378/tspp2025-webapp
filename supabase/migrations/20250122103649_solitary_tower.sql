-- Create system_logs table
CREATE TABLE IF NOT EXISTS public.system_logs (
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

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS system_logs_timestamp_idx ON system_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS system_logs_level_idx ON system_logs(level);
CREATE INDEX IF NOT EXISTS system_logs_user_id_idx ON system_logs(user_id);
CREATE INDEX IF NOT EXISTS system_logs_event_idx ON system_logs(event);

-- Enable RLS
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable insert for all users"
ON system_logs FOR INSERT
WITH CHECK (true);

CREATE POLICY "Enable read access for admins only"
ON system_logs FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid()::text 
        AND is_admin = true
    )
);

-- Create function to log system events
CREATE OR REPLACE FUNCTION log_system_event(
    p_level TEXT,
    p_event TEXT,
    p_user_id TEXT,
    p_details JSONB DEFAULT NULL,
    p_error_message TEXT DEFAULT NULL,
    p_error_stack TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_log_id UUID;
BEGIN
    INSERT INTO system_logs (
        level,
        event,
        user_id,
        details,
        error_message,
        error_stack
    ) VALUES (
        p_level,
        p_event,
        p_user_id,
        COALESCE(p_details, '{}'::jsonb),
        p_error_message,
        p_error_stack
    )
    RETURNING id INTO v_log_id;

    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT ALL ON system_logs TO anon, authenticated;
GRANT EXECUTE ON FUNCTION log_system_event TO anon, authenticated;