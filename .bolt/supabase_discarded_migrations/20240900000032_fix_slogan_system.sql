-- Drop existing trigger and function
DROP TRIGGER IF EXISTS slogan_points_trigger ON public.users;
DROP FUNCTION IF EXISTS handle_slogan_points();

-- Add slogan fields to users table if they don't exist
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS slogan TEXT;

-- Remove last_slogan_date as it's no longer needed
ALTER TABLE public.users 
DROP COLUMN IF EXISTS last_slogan_date;

-- Create function to handle slogan points
CREATE OR REPLACE FUNCTION handle_slogan_points()
RETURNS TRIGGER AS $$
BEGIN
  -- Only proceed if slogan changed from NULL to a value
  IF OLD.slogan IS NULL AND NEW.slogan IS NOT NULL THEN
    -- Award points for first-time slogan
    NEW.points = COALESCE(OLD.points, 0) + 10;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for slogan
CREATE TRIGGER slogan_points_trigger
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_slogan_points();