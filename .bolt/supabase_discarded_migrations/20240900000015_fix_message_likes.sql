-- Drop existing functions and triggers
DROP TRIGGER IF EXISTS message_likes_trigger ON messages;
DROP FUNCTION IF EXISTS handle_message_like();

-- Create improved function to handle message likes
CREATE OR REPLACE FUNCTION handle_message_like()
RETURNS TRIGGER AS $$
BEGIN
  -- Update likes count based on liked_by array
  NEW.likes := array_length(NEW.liked_by, 1);
  IF NEW.likes IS NULL THEN
    NEW.likes := 0;
  END IF;

  -- Update user's total likes count
  IF NOT NEW.is_notification AND NEW.liked_by IS DISTINCT FROM OLD.liked_by THEN
    -- Add new likes to users' totals
    WITH new_likers AS (
      SELECT unnest(NEW.liked_by) AS user_id
      EXCEPT
      SELECT unnest(COALESCE(OLD.liked_by, ARRAY[]::text[]))
    )
    UPDATE users 
    SET 
      likes = array_append(COALESCE(likes, ARRAY[]::text[]), NEW.id::text),
      updated_at = NOW()
    WHERE id IN (SELECT user_id FROM new_likers);
  END IF;
  
  NEW.updated_at := CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for message likes
CREATE TRIGGER message_likes_trigger
  BEFORE UPDATE ON messages
  FOR EACH ROW
  EXECUTE FUNCTION handle_message_like();

-- Update add_like function to handle message likes
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
  total_likes INTEGER;
  message_likes INTEGER;
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

  -- Calculate message likes
  SELECT COUNT(*) INTO message_likes
  FROM messages
  WHERE user_id = target_user_id 
  AND liked_by ? liker_id;

  -- Calculate total likes (profile + messages)
  total_likes := COALESCE(array_length(target_user.liked_by, 1), 0) + message_likes;

  -- Update target user's liked_by array if not already liked
  IF NOT target_user.liked_by @> ARRAY[liker_id] THEN
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
  END IF;

  -- Return updated data
  RETURN jsonb_build_object(
    'liked_by', (SELECT liked_by FROM users WHERE id = target_user_id),
    'likes', (SELECT likes FROM users WHERE id = liker_id),
    'total_likes', total_likes
  );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION handle_message_like() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION add_like(TEXT, TEXT) TO anon, authenticated;