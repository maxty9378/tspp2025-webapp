-- Create system user if not exists
INSERT INTO public.users (
    id,
    username,
    first_name,
    last_name,
    is_admin,
    role,
    points,
    created_at,
    updated_at
)
SELECT
    'system',
    'ТСПП',
    'ТСПП',
    '',
    true,
    'system',
    0,
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM public.users WHERE id = 'system'
);

-- Update system user if exists
UPDATE public.users
SET 
    username = 'ТСПП',
    first_name = 'ТСПП',
    last_name = '',
    is_admin = true,
    role = 'system'
WHERE id = 'system';