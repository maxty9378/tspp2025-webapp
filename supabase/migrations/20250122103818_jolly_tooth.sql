-- Add missing columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS greeting_message TEXT,
ADD COLUMN IF NOT EXISTS last_greeting_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS slogan TEXT,
ADD COLUMN IF NOT EXISTS last_slogan_date TIMESTAMP WITH TIME ZONE;

-- Create or replace function to increment points
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

    -- Create task completion record
    INSERT INTO task_completions (
        user_id,
        task_type,
        points_awarded,
        metadata,
        completed_at
    ) VALUES (
        p_user_id,
        COALESCE(p_reason, 'other'),
        p_amount,
        jsonb_build_object(
            'reason', p_reason,
            'points_awarded', p_amount
        ),
        CURRENT_TIMESTAMP
    );

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
            'points_awarded', p_amount
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

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS users_last_greeting_date_idx ON users(last_greeting_date);
CREATE INDEX IF NOT EXISTS users_last_slogan_date_idx ON users(last_slogan_date);

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION increment_points(TEXT, INTEGER, TEXT) TO authenticated;