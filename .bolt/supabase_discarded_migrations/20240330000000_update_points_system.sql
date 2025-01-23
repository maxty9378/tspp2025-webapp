-- Create or replace the increment_user_points function
CREATE OR REPLACE FUNCTION increment_user_points(
  user_ids text[],
  points_to_add integer
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Update points and track the update time
  UPDATE users 
  SET 
    points = points + points_to_add,
    updated_at = NOW()
  WHERE id = ANY(user_ids);

  -- Insert points history record
  INSERT INTO points_history (
    user_id,
    points_added,
    reason,
    created_at
  )
  SELECT 
    id,
    points_to_add,
    'story_points',
    NOW()
  FROM users
  WHERE id = ANY(user_ids);
END;
$$;

-- Create points history table if it doesn't exist
CREATE TABLE IF NOT EXISTS points_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT REFERENCES users(id),
  points_added INTEGER NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS points_history_user_id_idx ON points_history(user_id);
CREATE INDEX IF NOT EXISTS points_history_created_at_idx ON points_history(created_at);

-- Add constraints
ALTER TABLE points_history 
  ADD CONSTRAINT points_added_positive CHECK (points_added >= 0);

-- Grant permissions
GRANT ALL ON points_history TO authenticated, anon;