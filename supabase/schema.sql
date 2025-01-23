-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.task_completions CASCADE;

-- Create users table
CREATE TABLE public.users (
    id TEXT PRIMARY KEY,
    username TEXT,
    first_name TEXT NOT NULL,
    last_name TEXT,
    photo_url TEXT,
    points INTEGER DEFAULT 0,
    visit_count INTEGER DEFAULT 0,
    last_visit TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_active TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_admin BOOLEAN DEFAULT false,
    role TEXT DEFAULT 'participant',
    streak INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    liked_by TEXT[] DEFAULT ARRAY[]::TEXT[],
    likes TEXT[] DEFAULT ARRAY[]::TEXT[],
    total_coins_earned INTEGER DEFAULT 0,
    daily_likes_given INTEGER DEFAULT 0,
    last_like_date TIMESTAMP WITH TIME ZONE,
    greeting_message TEXT,
    achievements JSONB[] DEFAULT ARRAY[]::JSONB[]
);

-- Create messages table
CREATE TABLE public.messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id TEXT REFERENCES public.users(id),
    text TEXT NOT NULL,
    type TEXT DEFAULT 'text' CHECK (type IN ('text', 'image', 'task', 'system')),
    sender_name TEXT,
    sender_username TEXT,
    telegram_message_id BIGINT,
    is_from_app BOOLEAN DEFAULT false,
    image_url TEXT,
    task_id INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create task_completions table
CREATE TABLE public.task_completions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id TEXT REFERENCES public.users(id),
    task_id TEXT NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    hashtag TEXT,
    points_awarded INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX users_username_idx ON public.users(username);
CREATE INDEX users_points_idx ON public.users(points DESC);
CREATE INDEX users_total_coins_earned_idx ON public.users(total_coins_earned DESC);
CREATE INDEX users_likes_idx ON public.users USING gin(likes);
CREATE INDEX users_liked_by_idx ON public.users USING gin(liked_by);
CREATE INDEX messages_type_idx ON public.messages(type);
CREATE INDEX messages_created_at_idx ON public.messages(created_at DESC);
CREATE INDEX task_completions_user_id_idx ON public.task_completions(user_id);
CREATE INDEX task_completions_hashtag_idx ON public.task_completions(hashtag);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_completions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for all users"
ON public.users FOR SELECT
USING (true);

CREATE POLICY "Enable insert for all users"
ON public.users FOR INSERT
WITH CHECK (true);

CREATE POLICY "Enable update for all users"
ON public.users FOR UPDATE
USING (true)
WITH CHECK (true);

CREATE POLICY "Enable read access for all messages"
ON public.messages FOR SELECT
USING (true);

CREATE POLICY "Enable insert for all messages"
ON public.messages FOR INSERT
WITH CHECK (true);

CREATE POLICY "Enable read access for all task completions"
ON public.task_completions FOR SELECT
USING (true);

CREATE POLICY "Enable insert for all task completions"
ON public.task_completions FOR INSERT
WITH CHECK (true);

-- Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;