-- Create function to handle likes
CREATE OR REPLACE FUNCTION add_like(
  target_user_id TEXT,
  liker_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  target_user RECORD;
  liker RECORD;
BEGIN
  -- Get target user
  SELECT * INTO target_user
  FROM users
  WHERE id = target_user_id
  FOR UPDATE;

  -- Get liker
  SELECT * INTO liker
  FROM users
  WHERE id = liker_id
  FOR UPDATE;

  -- Update target user's liked_by array
  UPDATE users 
  SET 
    liked_by = array_append(COALESCE(liked_by, ARRAY[]::text[]), liker_id),
    updated_at = NOW()
  WHERE id = target_user_id;

  -- Update liker's likes array
  UPDATE users 
  SET 
    likes = array_append(COALESCE(likes, ARRAY[]::text[]), target_user_id),
    updated_at = NOW()
  WHERE id = liker_id;

  -- Return updated target user data
  RETURN jsonb_build_object(
    'liked_by', (SELECT liked_by FROM users WHERE id = target_user_id),
    'likes', (SELECT likes FROM users WHERE id = liker_id)
  );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION add_like(TEXT, TEXT) TO anon, authenticated;