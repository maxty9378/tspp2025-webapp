-- Drop existing trigger and function
DROP TRIGGER IF EXISTS greeting_points_trigger ON public.users;
DROP FUNCTION IF EXISTS handle_greeting_points();

-- Create improved greeting points function
CREATE OR REPLACE FUNCTION handle_greeting_points()
RETURNS TRIGGER AS $$
DECLARE
  current_day INTEGER;
  is_weekday BOOLEAN;
  cooldown_passed BOOLEAN;
  message_type TEXT;
BEGIN
  -- Only proceed if greeting message changed
  IF NEW.greeting_message IS DISTINCT FROM OLD.greeting_message THEN
    -- Get current day (1 = Monday, 7 = Sunday)
    current_day := EXTRACT(DOW FROM CURRENT_TIMESTAMP);
    -- Check if it's a weekday (Monday-Friday)
    is_weekday := current_day BETWEEN 1 AND 5;
    
    IF NOT is_weekday THEN
      RAISE EXCEPTION 'Сообщения можно отправлять только по будням (Пн-Пт)';
    END IF;

    -- Determine message type based on day
    message_type := CASE 
      WHEN current_day = 1 THEN 'Приветствие'
      ELSE 'Цитата дня'
    END;

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
      RAISE EXCEPTION 'Можно отправлять только одно сообщение в день';
    ELSE
      -- Award points and update timestamp
      NEW.points = COALESCE(OLD.points, 0) + 10;
      NEW.last_greeting_date = CURRENT_TIMESTAMP;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for greetings
CREATE TRIGGER greeting_points_trigger
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_greeting_points();

-- Fix user likes function
CREATE OR REPLACE FUNCTION add_like(
  target_user_id TEXT,
  liker_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  target_user RECORD;
  liker RECORD;
  total_likes INTEGER;
BEGIN
  -- Get target user
  SELECT * INTO target_user
  FROM users
  WHERE id = target_user_id
  FOR UPDATE;

  -- Get liker
  SELECT * INTO liker
  FROM users
  WHERE id = liker_id
  FOR UPDATE;

  -- Check if already liked
  IF target_user.liked_by @> ARRAY[liker_id] THEN
    RAISE EXCEPTION 'Вы уже поставили лайк этому пользователю';
  END IF;

  -- Calculate total likes (profile + messages)
  SELECT COUNT(*) INTO total_likes
  FROM messages
  WHERE user_id = target_user_id 
  AND liked_by ? liker_id;

  -- Update target user's liked_by array
  UPDATE users 
  SET 
    liked_by = array_append(COALESCE(liked_by, ARRAY[]::text[]), liker_id),
    updated_at = NOW()
  WHERE id = target_user_id;

  -- Update liker's likes array
  UPDATE users 
  SET 
    likes = array_append(COALESCE(likes, ARRAY[]::text[]), target_user_id),
    updated_at = NOW()
  WHERE id = liker_id;

  -- Return updated data
  RETURN jsonb_build_object(
    'liked_by', (SELECT liked_by FROM users WHERE id = target_user_id),
    'likes', (SELECT likes FROM users WHERE id = liker_id),
    'total_likes', total_likes + 1
  );
END;
$$;