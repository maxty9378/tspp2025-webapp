/*
  # Add special tasks

  1. Changes
    - Add unique constraint on title for tasks table
    - Insert special tasks with proper error handling
    - Update existing tasks if they exist

  2. Tasks Added
    - Photo task (20 points)
    - Evening event participation (50 points) 
    - TSPP evaluation (100 points)
    - Speaker coins (50 points)
*/

-- First ensure tasks table exists and has proper constraints
CREATE TABLE IF NOT EXISTS tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL CHECK (type IN ('daily', 'achievement', 'story', 'aos')),
    points INTEGER NOT NULL DEFAULT 0,
    enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Add unique constraint on title if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'tasks_title_key'
    ) THEN
        ALTER TABLE tasks ADD CONSTRAINT tasks_title_key UNIQUE (title);
    END IF;
END $$;

-- Function to safely insert or update tasks
CREATE OR REPLACE FUNCTION upsert_task(
    p_title TEXT,
    p_description TEXT,
    p_type TEXT,
    p_points INTEGER
) RETURNS UUID AS $$
DECLARE
    v_task_id UUID;
BEGIN
    INSERT INTO tasks (
        id,
        title,
        description,
        type,
        points,
        enabled,
        created_at,
        updated_at
    ) VALUES (
        gen_random_uuid(),
        p_title,
        p_description,
        p_type,
        p_points,
        true,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    )
    ON CONFLICT (title) 
    DO UPDATE SET
        description = EXCLUDED.description,
        points = EXCLUDED.points,
        enabled = true,
        updated_at = CURRENT_TIMESTAMP
    RETURNING id INTO v_task_id;

    RETURN v_task_id;
END;
$$ LANGUAGE plpgsql;

-- Insert special tasks
SELECT upsert_task(
    'Сделать красивое фото для портала ДОиРП и SNS',
    'Сделайте качественное фото для размещения на портале',
    'achievement',
    20
);

SELECT upsert_task(
    'Принять участие в вечернем мероприятии',
    'Активное участие в вечерней программе',
    'achievement',
    50
);

SELECT upsert_task(
    'Пройти оценку ТСПП на 4,5 балла и выше',
    'Получите высокую оценку по результатам ТСПП',
    'achievement',
    100
);

SELECT upsert_task(
    'Получить монеты от спикера',
    'За полезную активность на мероприятии. У каждого из 6 спикеров есть 20 купюр номиналом 50 баллов',
    'achievement',
    50
);

-- Drop the temporary function
DROP FUNCTION IF EXISTS upsert_task(TEXT, TEXT, TEXT, INTEGER);

-- Grant permissions
GRANT ALL ON tasks TO authenticated;