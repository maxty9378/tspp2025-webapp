-- Insert daily likes task
INSERT INTO tasks (
    id,
    title,
    description,
    type,
    points,
    enabled,
    created_at
) VALUES (
    gen_random_uuid(),
    'Поставить 10 лайков',
    'Поставьте 10 лайков сообщениям в чате. Можно выполнять ежедневно.',
    'daily',
    10,
    true,
    CURRENT_TIMESTAMP
)
ON CONFLICT (title) DO UPDATE SET
    description = EXCLUDED.description,
    points = EXCLUDED.points,
    enabled = true,
    updated_at = CURRENT_TIMESTAMP;