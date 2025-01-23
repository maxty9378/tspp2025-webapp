/*
  # Fix storage bucket and admin profile

  1. Storage
    - Create stories bucket if not exists
    - Set proper permissions
  
  2. Admin Profile
    - Ensure admin profile has proper initial values
    - Fix points and likes tracking
*/

-- Create storage bucket if not exists
INSERT INTO storage.buckets (id, name)
VALUES ('stories', 'stories')
ON CONFLICT (id) DO NOTHING;

-- Set bucket public
UPDATE storage.buckets
SET public = true
WHERE id = 'stories';

-- Create storage policy
CREATE POLICY "Allow public read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'stories');

CREATE POLICY "Allow authenticated uploads" 
ON storage.objects FOR INSERT 
TO authenticated
WITH CHECK (bucket_id = 'stories');

-- Ensure admin profile exists with proper values
INSERT INTO public.users (
    id,
    username,
    first_name,
    last_name,
    photo_url,
    points,
    visit_count,
    last_visit,
    last_active,
    is_admin,
    role,
    streak,
    created_at,
    updated_at,
    liked_by,
    likes,
    total_coins_earned
) VALUES (
    'admin',
    '@SNS',
    'Admin',
    'DOiRP',
    'https://static.tildacdn.com/tild3834-6331-4830-b162-626630356164/-2.jpg',
    100,
    1,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    true,
    'organizer',
    1,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    ARRAY[]::TEXT[],
    ARRAY[]::TEXT[],
    0
) ON CONFLICT (id) DO UPDATE SET
    username = EXCLUDED.username,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    photo_url = EXCLUDED.photo_url,
    points = EXCLUDED.points,
    is_admin = true,
    role = 'organizer',
    updated_at = CURRENT_TIMESTAMP;