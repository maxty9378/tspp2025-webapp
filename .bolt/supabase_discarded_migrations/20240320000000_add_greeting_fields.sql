-- Add last_greeting_date column to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS last_greeting_date TIMESTAMP WITH TIME ZONE;

-- Create index for last_greeting_date
CREATE INDEX IF NOT EXISTS users_last_greeting_date_idx ON public.users(last_greeting_date);

-- Create function to handle greeting points
CREATE OR REPLACE FUNCTION handle_greeting_points()
RETURNS TRIGGER AS $$
DECLARE
  time_diff interval;
BEGIN
  time_diff := NEW.last_greeting_date - OLD.last_greeting_date;
  
  IF (OLD.greeting_message IS NULL OR OLD.greeting_message != NEW.greeting_message) AND 
     (OLD.last_greeting_date IS NULL OR 
      EXTRACT(EPOCH FROM time_diff) >= 21600) THEN
    NEW.points = NEW.points + 10;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for greeting points
DROP TRIGGER IF EXISTS greeting_points_trigger ON public.users;
CREATE TRIGGER greeting_points_trigger
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_greeting_points();