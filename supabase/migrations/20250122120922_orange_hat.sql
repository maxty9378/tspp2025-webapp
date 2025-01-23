-- Drop existing functions to avoid conflicts
DROP FUNCTION IF EXISTS increment_points(TEXT, INTEGER, TEXT);
DROP FUNCTION IF EXISTS increment_user_points(TEXT[], INTEGER);

-- Create function to increment points with correct parameter order
CREATE OR REPLACE FUNCTION increment_points(
    user_id TEXT,
    amount INTEGER,
    reason TEXT DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
    new_points INTEGER;
BEGIN
    -- Update user points
    UPDATE users
    SET points = COALESCE(points, 0) + amount,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = user_id
    RETURNING points INTO new_points;

    -- Create points history record
    INSERT INTO points_history (
        user_id,
        points,
        reason,
        metadata
    ) VALUES (
        user_id,
        amount,
        COALESCE(reason, 'other'),
        jsonb_build_object(
            'points_awarded', amount,
            'reason', reason
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
        user_id,
        jsonb_build_object(
            'amount', amount,
            'reason', reason,
            'new_total', new_points
        )
    );

    RETURN new_points;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to increment points for multiple users
CREATE OR REPLACE FUNCTION increment_user_points(
    user_ids TEXT[],
    points_to_add INTEGER
)
RETURNS SETOF users AS $$
BEGIN
    RETURN QUERY
    UPDATE users
    SET 
        points = COALESCE(points, 0) + points_to_add,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ANY(user_ids)
    RETURNING *;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION increment_points TO authenticated;
GRANT EXECUTE ON FUNCTION increment_user_points TO authenticated;

-- Add system user for admin messages
INSERT INTO users (
    id,
    username,
    first_name,
    last_name,
    is_admin,
    role,
    points
) VALUES (
    'admin',
    'system',
    'System',
    'Admin',
    true,
    'organizer',
    0
) ON CONFLICT (id) DO NOTHING;

-- Add some initial messages for the system user
INSERT INTO messages (
    user_id,
    text,
    type,
    created_at
) VALUES 
    ('admin', 'Добро пожаловать в ТСПП2025! 👋', 'greeting', now()),
    ('admin', 'Вдохновляйтесь и вдохновляйте других! ✨', 'quote', now()),
    ('admin', 'ТСПП2025 - Развивайтесь • Соревнуйтесь • Побеждайте', 'slogan', now())
ON CONFLICT DO NOTHING;