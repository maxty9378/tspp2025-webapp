-- Create or update system user
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
VALUES (
    'system',
    'ТСПП',
    'ТСПП',
    '',
    true,
    'system',
    0,
    NOW(),
    NOW()
)
ON CONFLICT (id) DO UPDATE
SET 
    username = 'ТСПП',
    first_name = 'ТСПП',
    last_name = '',
    is_admin = true,
    role = 'system',
    updated_at = NOW();

-- Ensure proper indexes and constraints
CREATE INDEX IF NOT EXISTS stories_user_id_idx ON stories(user_id);
CREATE INDEX IF NOT EXISTS stories_is_admin_post_idx ON stories(is_admin_post);
CREATE INDEX IF NOT EXISTS stories_hashtag_idx ON stories(hashtag);

-- Grant permissions
GRANT ALL ON public.stories TO anon, authenticated;
GRANT ALL ON public.story_slides TO anon, authenticated;