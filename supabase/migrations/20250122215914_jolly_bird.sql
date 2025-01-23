-- Create function to handle quote message edits
CREATE OR REPLACE FUNCTION handle_quote_message_edit()
RETURNS TRIGGER AS $$
BEGIN
  -- Only handle quote messages
  IF NEW.text NOT LIKE '%#ЦитатаДня%' THEN
    RETURN NEW;
  END IF;

  -- Update user's last_greeting_date to preserve completion status
  UPDATE users
  SET 
    last_greeting_date = COALESCE(OLD.created_at, CURRENT_TIMESTAMP),
    updated_at = CURRENT_TIMESTAMP
  WHERE id = NEW.user_id;

  -- Log the edit
  INSERT INTO system_logs (
    level,
    event,
    user_id,
    details
  ) VALUES (
    'info',
    'Quote message edited',
    NEW.user_id,
    jsonb_build_object(
      'message_id', NEW.id,
      'old_text', OLD.text,
      'new_text', NEW.text
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for quote message edits
DROP TRIGGER IF EXISTS handle_quote_message_edit ON messages;
CREATE TRIGGER handle_quote_message_edit
  AFTER UPDATE OF text ON messages
  FOR EACH ROW
  WHEN (NEW.text LIKE '%#ЦитатаДня%')
  EXECUTE FUNCTION handle_quote_message_edit();

-- Grant permissions
GRANT EXECUTE ON FUNCTION handle_quote_message_edit TO authenticated;