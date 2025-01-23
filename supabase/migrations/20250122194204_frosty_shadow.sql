/*
  # Add special tasks

  1. Changes
    - Adds unique constraint on tasks title
    - Adds 4 new special tasks:
      - Photo for portal (20 points)
      - Evening event participation (50 points)
      - TSPP evaluation (100 points)
      - Speaker coins (50 points)
  
  2. Security
    - Tasks are enabled by default
    - Points are validated
*/

-- Add unique constraint on title
ALTER TABLE tasks
ADD CONSTRAINT tasks_title_key UNIQUE (title);

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