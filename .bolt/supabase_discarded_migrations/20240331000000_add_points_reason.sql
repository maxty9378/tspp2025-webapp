-- Add reason parameter to increment_user_points function
CREATE OR REPLACE FUNCTION increment_user_points(
  user_ids text[],
  points_to_add integer,
  reason text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Update points
  UPDATE users 
  SET 
    points = points + points_to_add,
    updated_at = NOW()
  WHERE id = ANY(user_ids);

  -- Record points history with reason
  INSERT INTO points_history (
    user_id,
    points_added,
    reason,
    created_at
  )
  SELECT 
    id,
    points_to_add,
    COALESCE(reason, 'other'),
    NOW()
  FROM users
  WHERE id = ANY(user_ids);

  -- Mark task as completed if it's a story task
  IF reason IN ('speaker_story', 'team_story', 'success_story') THEN
    INSERT INTO task_completions (
      user_id,
      task_id,
      hashtag,
      points_awarded,
      completed_at
    )
    SELECT 
      id,
      reason,
      CASE 
        WHEN reason = 'speaker_story' THEN '#ЯиСпикер'
        WHEN reason = 'team_story' THEN '#МояКоманда'
        WHEN reason = 'success_story' THEN '#МойУспех'
      END,
      points_to_add,
      NOW()
    FROM users
    WHERE id = ANY(user_ids)
    ON CONFLICT (user_id, task_id) DO NOTHING;
  END IF;
END;
$$;