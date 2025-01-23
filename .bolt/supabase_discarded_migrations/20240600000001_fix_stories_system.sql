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
VALUES (
    '@kadochkindesign',
    '@kadochkindesign',
    'Admin',
    'System',
    true,
    'admin',
    0,
    NOW(),
    NOW()
)
ON CONFLICT (id) DO UPDATE
SET 
    is_admin = true,
    role = 'admin',
    updated_at = NOW();

-- Fix stories foreign key constraint
ALTER TABLE public.stories DROP CONSTRAINT IF EXISTS stories_user_id_fkey;
ALTER TABLE public.stories ADD CONSTRAINT stories_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Grant permissions
GRANT ALL ON public.stories TO anon, authenticated;
GRANT ALL ON public.story_slides TO anon, authenticated;