-- Add slogan fields to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS slogan TEXT,
ADD COLUMN IF NOT EXISTS last_slogan_date TIMESTAMP WITH TIME ZONE;

-- Create index for last_slogan_date
CREATE INDEX IF NOT EXISTS users_last_slogan_date_idx ON users(last_slogan_date);

-- Create function to handle slogan points
CREATE OR REPLACE FUNCTION handle_slogan_points()
RETURNS TRIGGER AS $$
DECLARE
  current_day INTEGER;
  is_weekday BOOLEAN;
  cooldown_passed BOOLEAN;
BEGIN
  -- Only proceed if slogan changed
  IF NEW.slogan IS DISTINCT FROM OLD.slogan THEN
    -- Get current day (1 = Monday, 7 = Sunday)
    current_day := EXTRACT(DOW FROM CURRENT_TIMESTAMP);
    -- Check if it's a weekday (Monday-Friday)
    is_weekday := current_day BETWEEN 1 AND 5;
    
    IF NOT is_weekday THEN
      RAISE EXCEPTION 'Слоганы можно отправлять только по будням (Пн-Пт)';
    END IF;

    -- Check cooldown period (24 hours)
    IF OLD.last_slogan_date IS NULL THEN
      cooldown_passed := true;
    ELSE
      -- Check if last slogan was on a different day
      cooldown_passed := EXTRACT(DAY FROM CURRENT_TIMESTAMP) != EXTRACT(DAY FROM OLD.last_slogan_date);
    END IF;

    IF NOT cooldown_passed THEN
      -- Keep old values if cooldown hasn't passed
      NEW.slogan = OLD.slogan;
      NEW.last_slogan_date = OLD.last_slogan_date;
      RAISE EXCEPTION 'Можно отправлять только один слоган в день';
    ELSE
      -- Award points and update timestamp
      NEW.points = COALESCE(OLD.points, 0) + 10;
      NEW.last_slogan_date = CURRENT_TIMESTAMP;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for slogan
DROP TRIGGER IF EXISTS slogan_points_trigger ON public.users;
CREATE TRIGGER slogan_points_trigger
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_slogan_points();