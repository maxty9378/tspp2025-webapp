-- Create function to remove task completion and handle points
CREATE OR REPLACE FUNCTION remove_task_completion(completion_id TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    v_user_id TEXT;
    v_points_awarded INTEGER;
    v_task_type TEXT;
BEGIN
    -- Get completion details
    SELECT 
        user_id,
        points_awarded,
        task_type
    INTO 
        v_user_id,
        v_points_awarded,
        v_task_type
    FROM task_completions
    WHERE id = completion_id;

    -- If completion not found, return false
    IF NOT FOUND THEN
        RETURN false;
    END IF;

    -- Deduct points from user
    UPDATE users
    SET 
        points = GREATEST(0, points - v_points_awarded),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = v_user_id;

    -- Create points history record for deduction
    INSERT INTO points_history (
        user_id,
        points,
        reason,
        metadata
    ) VALUES (
        v_user_id,
        -v_points_awarded,
        'completion_removed',
        jsonb_build_object(
            'completion_id', completion_id,
            'task_type', v_task_type
        )
    );

    -- Delete the completion record
    DELETE FROM task_completions
    WHERE id = completion_id;

    -- Log the removal
    INSERT INTO system_logs (
        level,
        event,
        user_id,
        details
    ) VALUES (
        'info',
        'Task completion removed',
        v_user_id,
        jsonb_build_object(
            'completion_id', completion_id,
            'points_deducted', v_points_awarded,
            'task_type', v_task_type
        )
    );

    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION remove_task_completion(TEXT) TO authenticated;