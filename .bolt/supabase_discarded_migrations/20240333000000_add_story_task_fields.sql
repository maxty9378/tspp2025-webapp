-- Add story task fields to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS speaker_story_posted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS team_story_posted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS success_story_posted BOOLEAN DEFAULT false;

-- Create index for story task fields
CREATE INDEX IF NOT EXISTS users_story_tasks_idx ON users(speaker_story_posted, team_story_posted, success_story_posted);

-- Update points function to handle story tasks
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
        updated_at = NOW(),
        -- Update story task flags based on reason
        speaker_story_posted = CASE WHEN reason = 'speaker_story' THEN true ELSE speaker_story_posted END,
        team_story_posted = CASE WHEN reason = 'team_story' THEN true ELSE team_story_posted END,
        success_story_posted = CASE WHEN reason = 'success_story' THEN true ELSE success_story_posted END
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
END;
$$;