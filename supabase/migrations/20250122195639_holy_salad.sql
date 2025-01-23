-- Drop existing policies
DROP POLICY IF EXISTS "tasks_select_policy" ON tasks;
DROP POLICY IF EXISTS "tasks_insert_policy" ON tasks;
DROP POLICY IF EXISTS "tasks_update_policy" ON tasks;
DROP POLICY IF EXISTS "tasks_select_v3" ON tasks;
DROP POLICY IF EXISTS "tasks_insert_v3" ON tasks;
DROP POLICY IF EXISTS "tasks_update_v3" ON tasks;

-- Create more permissive policies with unique names
CREATE POLICY "tasks_select_policy_v5"
ON tasks FOR SELECT
USING (true);

CREATE POLICY "tasks_insert_policy_v5"
ON tasks FOR INSERT
WITH CHECK (true);

CREATE POLICY "tasks_update_policy_v5"
ON tasks FOR UPDATE
USING (true)
WITH CHECK (true);

-- Grant permissions
GRANT ALL ON tasks TO authenticated;

-- Insert special tasks
INSERT INTO tasks (
    id,
    title,
    description,
    type,
    points,
    enabled,
    created_at
) VALUES 
    (
        gen_random_uuid(),
        'Сделать красивое фото для портала ДОиРП и SNS',
        'Сделайте качественное фото для размещения на портале',
        'achievement',
        20,
        true,
        CURRENT_TIMESTAMP
    ),
    (
        gen_random_uuid(),
        'Принять участие в вечернем мероприятии',
        'Активное участие в вечерней программе',
        'achievement',
        50,
        true,
        CURRENT_TIMESTAMP
    ),
    (
        gen_random_uuid(),
        'Пройти оценку ТСПП на 4,5 балла и выше',
        'Получите высокую оценку по результатам ТСПП',
        'achievement',
        100,
        true,
        CURRENT_TIMESTAMP
    ),
    (
        gen_random_uuid(),
        'Получить монеты от спикера',
        'За полезную активность на мероприятии. У каждого из 6 спикеров есть 20 купюр номиналом 50 баллов',
        'achievement',
        50,
        true,
        CURRENT_TIMESTAMP
    )
ON CONFLICT (title) DO UPDATE SET
    description = EXCLUDED.description,
    points = EXCLUDED.points,
    enabled = true,
    updated_at = CURRENT_TIMESTAMP;