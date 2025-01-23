-- Create function to increment user likes
CREATE OR REPLACE FUNCTION increment_user_likes(
  user_id TEXT,
  liker_id TEXT
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Update user's total likes
  UPDATE users 
  SET 
    likes = array_append(COALESCE(likes, ARRAY[]::TEXT[]), liker_id),
    updated_at = NOW()
  WHERE id = user_id;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION increment_user_likes(TEXT, TEXT) TO anon, authenticated;

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
      SELECT unnest(COALESCE(OLD.liked_by, ARRAY[]::TEXT[]))
    )
    UPDATE users 
    SET 
      likes = array_append(COALESCE(likes, ARRAY[]::TEXT[]), NEW.id::TEXT),
      updated_at = NOW()
    WHERE id IN (SELECT user_id FROM new_likers);
  END IF;
  
  NEW.updated_at := CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for message likes
DROP TRIGGER IF EXISTS message_likes_trigger ON messages;
CREATE TRIGGER message_likes_trigger
  BEFORE UPDATE ON messages
  FOR EACH ROW
  EXECUTE FUNCTION handle_message_like();