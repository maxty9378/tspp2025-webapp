-- Drop existing function and trigger
DROP TRIGGER IF EXISTS handle_slogan_quote_points ON messages;
DROP FUNCTION IF EXISTS handle_slogan_quote_points();

-- Create function to handle slogan and quote points with fixed column references
CREATE OR REPLACE FUNCTION handle_slogan_quote_points()
RETURNS TRIGGER AS $$
DECLARE
    points_to_award INTEGER := 10;
    message_task_type TEXT;
    has_previous_completion BOOLEAN;
BEGIN
    -- Determine task type based on hashtag
    IF NEW.text LIKE '%#Слоган%' THEN
        message_task_type := 'slogan';
    ELSIF NEW.text LIKE '%#ЦитатаДня%' THEN
        message_task_type := 'quote';
    ELSE
        RETURN NEW;
    END IF;

    -- Check for previous completion
    SELECT EXISTS (
        SELECT 1 
        FROM task_completions tc
        WHERE tc.user_id = NEW.user_id 
        AND tc.task_type = message_task_type
        AND tc.metadata->>'first_time' = 'true'
    ) INTO has_previous_completion;

    -- Only award points if this is their first time
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
            message_task_type,
            points_to_award,
            jsonb_build_object(
                'message_id', NEW.id,
                'text', NEW.text,
                'first_time', true
            ),
            NEW.created_at
        );

        -- Update user points
        UPDATE users 
        SET points = COALESCE(points, 0) + points_to_award,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = NEW.user_id;

        -- Create points history record
        INSERT INTO points_history (
            user_id,
            points,
            reason,
            metadata
        ) VALUES (
            NEW.user_id,
            points_to_award,
            message_task_type,
            jsonb_build_object(
                'message_id', NEW.id,
                'text', NEW.text
            )
        );

        -- Log the points award
        INSERT INTO system_logs (
            level,
            event,
            user_id,
            details
        ) VALUES (
            'info',
            'Points awarded for ' || message_task_type,
            NEW.user_id,
            jsonb_build_object(
                'points_awarded', points_to_award,
                'message_id', NEW.id,
                'text', NEW.text,
                'task_type', message_task_type
            )
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for slogan and quote points
CREATE TRIGGER handle_slogan_quote_points
    AFTER INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION handle_slogan_quote_points();