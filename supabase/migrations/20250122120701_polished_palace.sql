-- Drop existing functions to avoid conflicts
DROP FUNCTION IF EXISTS increment_points(TEXT, INTEGER, TEXT);
DROP FUNCTION IF EXISTS increment_user_points(TEXT[], INTEGER);

-- Create function to increment points with proper parameter names
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
GRANT EXECUTE ON FUNCTION increment_points(TEXT, INTEGER, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_user_points(TEXT[], INTEGER) TO authenticated;

-- Add missing telegram_message_id column to messages
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS telegram_message_id BIGINT;

-- Create index for telegram_message_id
CREATE INDEX IF NOT EXISTS messages_telegram_id_idx ON messages(telegram_message_id);

-- Update messages policies to be more permissive
DROP POLICY IF EXISTS "messages_read_all" ON messages;
DROP POLICY IF EXISTS "messages_insert_all" ON messages;
DROP POLICY IF EXISTS "messages_update_all" ON messages;

CREATE POLICY "messages_read_all"
ON messages FOR SELECT
USING (true);

CREATE POLICY "messages_insert_all"
ON messages FOR INSERT
WITH CHECK (true);

CREATE POLICY "messages_update_all"
ON messages FOR UPDATE
USING (true);

-- Grant permissions
GRANT ALL ON messages TO anon, authenticated;