/*
  # Add photo handling functions

  1. New Functions
    - `handle_team_photo` - Handles team photo uploads and points
    - `handle_participants_photo` - Handles participant photo uploads and points
  
  2. Changes
    - Add daily completion tracking for team photos
    - Add one-time completion tracking for participant photos
    - Add points awarding logic
*/

-- Create function to handle team photo uploads
CREATE OR REPLACE FUNCTION handle_team_photo()
RETURNS TRIGGER AS $$
DECLARE
  today DATE := CURRENT_DATE;
  has_completion BOOLEAN;
BEGIN
  -- Check if user already completed team photo today
  SELECT EXISTS (
    SELECT 1 
    FROM task_completions 
    WHERE user_id = NEW.user_id
    AND task_type = 'team_photo'
    AND DATE(completed_at) = today
  ) INTO has_completion;

  -- If no completion today, award points
  IF NOT has_completion AND NEW.text LIKE '%#КоманднаяАктивность%' THEN
    -- Create task completion record
    INSERT INTO task_completions (
      user_id,
      task_type,
      points_awarded,
      metadata,
      completed_at
    ) VALUES (
      NEW.user_id,
      'team_photo',
      10,
      jsonb_build_object(
        'image_url', NEW.image_url,
        'message_id', NEW.id
      ),
      NEW.created_at
    );

    -- Award points
    PERFORM increment_points(
      NEW.user_id,
      10,
      'team_photo'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to handle participant photo uploads
CREATE OR REPLACE FUNCTION handle_participants_photo()
RETURNS TRIGGER AS $$
DECLARE
  has_completion BOOLEAN;
BEGIN
  -- Check if user already completed participants photo task
  SELECT EXISTS (
    SELECT 1 
    FROM task_completions 
    WHERE user_id = NEW.user_id
    AND task_type = 'participants_photo'
    AND metadata->>'first_time' = 'true'
  ) INTO has_completion;

  -- If no previous completion, award points
  IF NOT has_completion AND NEW.text LIKE '%#ФотоСУчастниками%' THEN
    -- Create task completion record
    INSERT INTO task_completions (
      user_id,
      task_type,
      points_awarded,
      metadata,
      completed_at
    ) VALUES (
      NEW.user_id,
      'participants_photo',
      10,
      jsonb_build_object(
        'image_url', NEW.image_url,
        'message_id', NEW.id,
        'first_time', true
      ),
      NEW.created_at
    );

    -- Award points
    PERFORM increment_points(
      NEW.user_id,
      10,
      'participants_photo'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for photo handling
DROP TRIGGER IF EXISTS handle_team_photo ON messages;
CREATE TRIGGER handle_team_photo
  AFTER INSERT ON messages
  FOR EACH ROW
  WHEN (NEW.text LIKE '%#КоманднаяАктивность%')
  EXECUTE FUNCTION handle_team_photo();

DROP TRIGGER IF EXISTS handle_participants_photo ON messages;
CREATE TRIGGER handle_participants_photo
  AFTER INSERT ON messages
  FOR EACH ROW
  WHEN (NEW.text LIKE '%#ФотоСУчастниками%')
  EXECUTE FUNCTION handle_participants_photo();

-- Grant permissions
GRANT EXECUTE ON FUNCTION handle_team_photo TO authenticated;
GRANT EXECUTE ON FUNCTION handle_participants_photo TO authenticated;