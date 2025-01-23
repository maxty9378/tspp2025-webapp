-- Create function to handle greeting and quote messages
CREATE OR REPLACE FUNCTION handle_greeting_message()
RETURNS TRIGGER AS $$
DECLARE
  message_type TEXT;
  today DATE := CURRENT_DATE;
  has_posted_today BOOLEAN;
BEGIN
  -- Determine message type
  IF NEW.text LIKE '%#Приветствие%' THEN
    message_type := 'greeting';
  ELSIF NEW.text LIKE '%#ЦитатаДня%' THEN
    message_type := 'quote';
  ELSE
    RETURN NEW;
  END IF;

  -- Check if user has already posted today
  SELECT EXISTS (
    SELECT 1 
    FROM messages 
    WHERE user_id = NEW.user_id
    AND type = message_type
    AND DATE(created_at) = today
    AND id != NEW.id
  ) INTO has_posted_today;

  IF has_posted_today THEN
    RAISE EXCEPTION 'You can only post one % per day', message_type;
  END IF;

  -- Update user's last_greeting_date
  UPDATE users 
  SET 
    last_greeting_date = CURRENT_TIMESTAMP,
    updated_at = CURRENT_TIMESTAMP
  WHERE id = NEW.user_id;

  -- Create task completion record if not exists
  INSERT INTO task_completions (
    user_id,
    task_type,
    points_awarded,
    metadata,
    completed_at
  )
  SELECT 
    NEW.user_id,
    message_type,
    10,
    jsonb_build_object(
      'message_id', NEW.id,
      'text', NEW.text,
      'first_time', true
    ),
    CURRENT_TIMESTAMP
  WHERE NOT EXISTS (
    SELECT 1 
    FROM task_completions 
    WHERE user_id = NEW.user_id
    AND task_type = message_type
    AND DATE(completed_at) = today
  );

  -- Award points if not already awarded today
  IF NOT EXISTS (
    SELECT 1 
    FROM points_history 
    WHERE user_id = NEW.user_id
    AND reason = message_type
    AND DATE(created_at) = today
  ) THEN
    PERFORM increment_points(NEW.user_id, 10, message_type);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for greeting messages
DROP TRIGGER IF EXISTS handle_greeting_message ON messages;
CREATE TRIGGER handle_greeting_message
  BEFORE INSERT ON messages
  FOR EACH ROW
  WHEN (NEW.text LIKE '%#Приветствие%' OR NEW.text LIKE '%#ЦитатаДня%')
  EXECUTE FUNCTION handle_greeting_message();

-- Grant permissions
GRANT EXECUTE ON FUNCTION handle_greeting_message TO authenticated;