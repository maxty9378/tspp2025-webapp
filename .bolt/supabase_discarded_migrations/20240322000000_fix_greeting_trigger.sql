-- Drop existing trigger and function
DROP TRIGGER IF EXISTS daily_quote_trigger ON public.users;
DROP FUNCTION IF EXISTS handle_daily_quote();

-- Create improved function to handle greetings/quotes
CREATE OR REPLACE FUNCTION handle_greeting_points()
RETURNS TRIGGER AS $$
BEGIN
  -- Only proceed if greeting message changed
  IF NEW.greeting_message IS DISTINCT FROM OLD.greeting_message THEN
    -- Check cooldown period (6 hours)
    IF OLD.last_greeting_date IS NULL OR 
       EXTRACT(EPOCH FROM (NEW.last_greeting_date - OLD.last_greeting_date)) >= 21600 THEN
      -- Award points
      NEW.points = COALESCE(NEW.points, 0) + 10;
    ELSE
      -- Revert changes if cooldown hasn't passed
      NEW.greeting_message = OLD.greeting_message;
      NEW.last_greeting_date = OLD.last_greeting_date;
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