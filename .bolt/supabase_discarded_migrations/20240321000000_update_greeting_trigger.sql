-- Drop existing trigger and function
DROP TRIGGER IF EXISTS greeting_points_trigger ON public.users;
DROP FUNCTION IF EXISTS handle_greeting_points();

-- Create improved function to handle daily quotes
CREATE OR REPLACE FUNCTION handle_daily_quote()
RETURNS TRIGGER AS $$
DECLARE
  hours_diff interval;
BEGIN
  -- Calculate time difference
  IF OLD.last_greeting_date IS NULL THEN
    hours_diff := interval '7 hours'; -- Allow first quote
  ELSE
    hours_diff := NEW.last_greeting_date - OLD.last_greeting_date;
  END IF;

  -- Check if message changed and enough time passed (6 hours)
  IF (OLD.greeting_message IS NULL OR OLD.greeting_message != NEW.greeting_message) AND
     (OLD.last_greeting_date IS NULL OR EXTRACT(EPOCH FROM hours_diff) >= 21600) THEN
    -- Award points
    NEW.points = COALESCE(NEW.points, 0) + 10;
  ELSE
    -- Revert message if cooldown hasn't passed
    NEW.greeting_message = OLD.greeting_message;
    NEW.last_greeting_date = OLD.last_greeting_date;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create new trigger
CREATE TRIGGER daily_quote_trigger
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_daily_quote();