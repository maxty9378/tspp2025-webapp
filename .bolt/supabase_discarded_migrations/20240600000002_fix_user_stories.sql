-- Ensure proper user creation
CREATE OR REPLACE FUNCTION ensure_user_exists()
RETURNS TRIGGER AS $$
BEGIN
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
DROP TRIGGER IF EXISTS ensure_user_exists_trigger ON stories;
CREATE TRIGGER ensure_user_exists_trigger
  BEFORE INSERT ON stories
  FOR EACH ROW
  EXECUTE FUNCTION ensure_user_exists();

-- Grant permissions
GRANT ALL ON public.stories TO anon, authenticated;
GRANT ALL ON public.story_slides TO anon, authenticated;