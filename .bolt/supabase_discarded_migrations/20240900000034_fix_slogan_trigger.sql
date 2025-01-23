-- Drop existing trigger and function
DROP TRIGGER IF EXISTS slogan_points_trigger ON public.users;
DROP FUNCTION IF EXISTS handle_slogan_points();

-- Create improved function to handle slogan points
CREATE OR REPLACE FUNCTION handle_slogan_points()
RETURNS TRIGGER AS $$
BEGIN
  -- Only proceed if slogan changed from NULL to a value (first time)
  IF OLD.slogan IS NULL AND NEW.slogan IS NOT NULL THEN
    -- Award points for first-time slogan
    NEW.points = COALESCE(OLD.points, 0) + 10;
    
    -- Record points history
    INSERT INTO points_history (
      user_id,
      points_added,
      reason,
      metadata,
      created_at
    ) VALUES (
      NEW.id,
      10,
      'slogan_created',
      jsonb_build_object(
        'slogan', NEW.slogan,
        'first_time', true
      ),
      NOW()
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for slogan
CREATE TRIGGER slogan_points_trigger
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_slogan_points();