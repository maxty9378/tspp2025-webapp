-- Drop existing trigger and function
DROP TRIGGER IF EXISTS ensure_user_exists_trigger ON stories;
DROP FUNCTION IF EXISTS ensure_user_exists();

-- Create improved user creation function
CREATE OR REPLACE FUNCTION ensure_user_exists()
RETURNS TRIGGER AS $$
BEGIN
  -- Remove @ from user_id if present
  NEW.user_id := REPLACE(NEW.user_id, '@', '');
  
  -- Create user if doesn't exist
  IF NOT EXISTS (SELECT 1 FROM users WHERE id = NEW.user_id) THEN
    INSERT INTO users (
      id,
      username,
      first_name,
      last_name,
      created_at,
      updated_at
    ) VALUES (
      NEW.user_id,
      NEW.user_id,
      'User',
      '',
      NOW(),
      NOW()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for user creation
CREATE TRIGGER ensure_user_exists_trigger
  BEFORE INSERT ON stories
  FOR EACH ROW
  EXECUTE FUNCTION ensure_user_exists();

-- Update existing stories to remove @ from user_id
UPDATE stories 
SET user_id = REPLACE(user_id, '@', '')
WHERE user_id LIKE '@%';

-- Update existing users to remove @ from id
UPDATE users
SET id = REPLACE(id, '@', '')
WHERE id LIKE '@%';

-- Grant permissions
GRANT ALL ON public.stories TO anon, authenticated;
GRANT ALL ON public.story_slides TO anon, authenticated;