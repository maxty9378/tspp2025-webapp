-- Drop existing trigger and function
DROP TRIGGER IF EXISTS greeting_points_trigger ON public.users;
DROP FUNCTION IF EXISTS handle_greeting_points();

-- Create improved function to handle greetings/quotes
CREATE OR REPLACE FUNCTION handle_greeting_points()
RETURNS TRIGGER AS $$
DECLARE
  cooldown_passed boolean;
  current_day integer;
  is_weekday boolean;
BEGIN
  -- Only proceed if greeting message changed
  IF NEW.greeting_message IS DISTINCT FROM OLD.greeting_message THEN
    -- Get current day (1 = Monday, 7 = Sunday)
    current_day := EXTRACT(DOW FROM CURRENT_TIMESTAMP);
    -- Check if it's a weekday (Monday-Friday)
    is_weekday := current_day BETWEEN 1 AND 5;
    
    IF NOT is_weekday THEN
      RAISE EXCEPTION 'Messages can only be posted on weekdays (Monday-Friday)';
    END IF;

    -- Check cooldown period (24 hours)
    IF OLD.last_greeting_date IS NULL THEN
      cooldown_passed := true;
    ELSE
      -- Check if last greeting was on a different day
      cooldown_passed := EXTRACT(DAY FROM CURRENT_TIMESTAMP) != EXTRACT(DAY FROM OLD.last_greeting_date);
    END IF;

    IF NOT cooldown_passed THEN
      -- Keep old values if cooldown hasn't passed
      NEW.greeting_message = OLD.greeting_message;
      NEW.last_greeting_date = OLD.last_greeting_date;
      RAISE EXCEPTION 'You can only post one message per day';
    ELSE
      -- Award points and update timestamp
      NEW.points = COALESCE(OLD.points, 0) + 10;
      NEW.last_greeting_date = CURRENT_TIMESTAMP;
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