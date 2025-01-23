-- Drop existing tables and their dependencies
DROP TABLE IF EXISTS public.story_slides CASCADE;
DROP TABLE IF EXISTS public.stories CASCADE;

-- Create stories table with proper schema
CREATE TABLE public.stories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    hashtag TEXT,
    is_admin_post BOOLEAN DEFAULT false,
    viewed BOOLEAN DEFAULT false,
    CONSTRAINT valid_hashtag CHECK (
        hashtag IS NULL OR 
        hashtag = ANY(ARRAY['#ЯиСпикер', '#МояКоманда', '#МойУспех'])
    ),
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);

-- Create story_slides table
CREATE TABLE public.story_slides (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
    media_url TEXT NOT NULL,
    media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    likes INTEGER DEFAULT 0,
    liked_by TEXT[] DEFAULT ARRAY[]::TEXT[]
);

-- Create indexes
CREATE INDEX stories_user_id_idx ON stories(user_id);
CREATE INDEX stories_hashtag_idx ON stories(hashtag);
CREATE INDEX stories_expires_at_idx ON stories(expires_at);
CREATE INDEX story_slides_story_id_idx ON story_slides(story_id);
CREATE INDEX story_slides_liked_by_idx ON story_slides USING gin(liked_by);