-- Create points_history table if not exists
CREATE TABLE IF NOT EXISTS points_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT REFERENCES users(id),
    points_added INTEGER NOT NULL,
    reason TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS points_history_user_id_idx ON points_history(user_id);
CREATE INDEX IF NOT EXISTS points_history_created_at_idx ON points_history(created_at);

-- Add constraints
ALTER TABLE points_history 
    ADD CONSTRAINT points_added_positive CHECK (points_added >= 0);

-- Update increment_user_points function
CREATE OR REPLACE FUNCTION increment_user_points(
    user_ids text[],
    points_to_add integer,
    reason text DEFAULT NULL,
    metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    -- Update points
    UPDATE users 
    SET 
        points = points + points_to_add,
        updated_at = NOW()
    WHERE id = ANY(user_ids);

    -- Record points history
    INSERT INTO points_history (
        user_id,
        points_added,
        reason,
        metadata,
        created_at
    )
    SELECT 
        id,
        points_to_add,
        COALESCE(reason, 'other'),
        metadata,
        NOW()
    FROM users
    WHERE id = ANY(user_ids);

    -- Mark task as completed if applicable
    IF reason IN ('speaker_story', 'team_story', 'success_story', 'daily_greeting', 'survey_completed') THEN
        INSERT INTO task_completions (
            user_id,
            task_id,
            points_awarded,
            completed_at
        )
        SELECT 
            id,
            reason,
            points_to_add,
            NOW()
        FROM users
        WHERE id = ANY(user_ids)
        ON CONFLICT (user_id, task_id) DO NOTHING;
    END IF;
END;
$$;

-- Grant permissions
GRANT ALL ON points_history TO anon, authenticated;