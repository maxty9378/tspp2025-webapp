/*
  # Add new message types

  1. Changes
    - Add 'practice' and 'mistake' to valid message types
    - Update type check constraint
    - Add trigger for handling experience points

  2. Points System
    - First time sharing practice: +50 points
    - First time sharing mistake: +50 points
*/

-- Update type check constraint to include new types
ALTER TABLE messages 
DROP CONSTRAINT IF EXISTS messages_type_check;

ALTER TABLE messages
ADD CONSTRAINT messages_type_check 
CHECK (type IN ('text', 'image', 'system', 'greeting', 'quote', 'slogan', 'practice', 'mistake'));

-- Create function to handle experience points
CREATE OR REPLACE FUNCTION handle_experience_points()
RETURNS TRIGGER AS $$
DECLARE
  has_previous_completion BOOLEAN;
BEGIN
  -- Only handle practice and mistake types
  IF NEW.type NOT IN ('practice', 'mistake') THEN
    RETURN NEW;
  END IF;

  -- Check for previous completion of this type
  SELECT EXISTS (
    SELECT 1 
    FROM task_completions 
    WHERE user_id = NEW.user_id
    AND task_type = NEW.type
    AND metadata->>'first_time' = 'true'
  ) INTO has_previous_completion;

  -- Award points for first completion
  IF NOT has_previous_completion THEN
    -- Create task completion record
    INSERT INTO task_completions (
      user_id,
      task_type,
      points_awarded,
      metadata,
      completed_at
    ) VALUES (
      NEW.user_id,
      NEW.type,
      50,
      jsonb_build_object(
        'message_id', NEW.id,
        'first_time', 'true'
      ),
      NEW.created_at
    );

    -- Award points
    PERFORM increment_points(
      NEW.user_id,
      50,
      NEW.type
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for experience points
DROP TRIGGER IF EXISTS handle_experience_points ON messages;
CREATE TRIGGER handle_experience_points
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION handle_experience_points();

-- Grant permissions
GRANT EXECUTE ON FUNCTION handle_experience_points TO authenticated;