-- Create function to safely increment user points
CREATE OR REPLACE FUNCTION increment_user_points(
  user_ids text[],
  points_to_add integer
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE users 
  SET 
    points = points + points_to_add,
    updated_at = NOW()
  WHERE id = ANY(user_ids);
END;
$$;