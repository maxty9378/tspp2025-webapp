-- Create function to increment user's completed surveys
CREATE OR REPLACE FUNCTION increment_user_surveys(user_id TEXT)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE users 
  SET 
    completed_surveys = COALESCE(completed_surveys, 0) + 1,
    updated_at = NOW()
  WHERE id = user_id;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION increment_user_surveys(TEXT) TO anon, authenticated;