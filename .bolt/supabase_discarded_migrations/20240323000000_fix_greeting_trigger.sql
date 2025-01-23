-- Drop existing trigger and function
DROP TRIGGER IF EXISTS greeting_points_trigger ON public.users;
DROP FUNCTION IF EXISTS handle_greeting_points();

-- Create improved function to handle greetings/quotes
CREATE OR REPLACE FUNCTION handle_greeting_points()
RETURNS TRIGGER AS $$
DECLARE
  cooldown_passed boolean;
  is_monday boolean;
BEGIN
  -- Only proceed if greeting message changed
  IF NEW.greeting_message IS DISTINCT FROM OLD.greeting_message THEN
    -- Check if it's Monday
    is_monday := EXTRACT(DOW FROM CURRENT_TIMESTAMP) = 1;
    
    -- Check cooldown period (6 hours)
    IF OLD.last_greeting_date IS NULL THEN
      cooldown_passed := true;
    ELSE
      cooldown_passed := EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - OLD.last_greeting_date)) >= 21600;
    END IF;

    IF cooldown_passed THEN
      -- Award points
      NEW.points = COALESCE(NEW.points, 0) + 10;
      NEW.last_greeting_date = CURRENT_TIMESTAMP;
    ELSE
      -- Revert changes if cooldown hasn't passed
      RAISE EXCEPTION 'Cooldown period has not passed';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create new trigger
CREATE TRIGGER greeting_points_trigger
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_greeting_points();

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_users_greeting_date ON public.users(last_greeting_date);