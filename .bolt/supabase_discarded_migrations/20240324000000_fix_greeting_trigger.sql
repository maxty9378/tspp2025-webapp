-- Drop existing trigger and function
DROP TRIGGER IF EXISTS greeting_points_trigger ON public.users;
DROP FUNCTION IF EXISTS handle_greeting_points();

-- Create improved function to handle greetings/quotes
CREATE OR REPLACE FUNCTION handle_greeting_points()
RETURNS TRIGGER AS $$
DECLARE
  cooldown_passed boolean;
  is_monday boolean;
  last_greeting timestamp with time zone;
BEGIN
  -- Only proceed if greeting message changed
  IF NEW.greeting_message IS DISTINCT FROM OLD.greeting_message THEN
    -- Check if it's Monday
    is_monday := EXTRACT(DOW FROM CURRENT_TIMESTAMP) = 1;
    
    -- Get last greeting timestamp
    SELECT last_greeting_date INTO last_greeting
    FROM public.users
    WHERE id = NEW.id;

    -- Check cooldown period (6 hours)
    IF last_greeting IS NULL THEN
      cooldown_passed := true;
    ELSE
      cooldown_passed := EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - last_greeting)) >= 21600;
    END IF;

    IF cooldown_passed THEN
      -- Award points and update timestamp
      NEW.points = COALESCE(OLD.points, 0) + 10;
      NEW.last_greeting_date = CURRENT_TIMESTAMP;
    ELSE
      -- Keep old values and raise error
      NEW.greeting_message = OLD.greeting_message;
      NEW.last_greeting_date = OLD.last_greeting_date;
      RAISE EXCEPTION 'Cooldown period has not passed. Please wait 6 hours between messages.';
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