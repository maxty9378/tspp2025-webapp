-- Drop existing triggers and functions
DROP TRIGGER IF EXISTS story_points_trigger ON stories;
DROP FUNCTION IF EXISTS handle_story_points();
DROP FUNCTION IF EXISTS create_story_with_slide();

-- Recreate stories table with proper schema
CREATE TABLE IF NOT EXISTS public.stories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    hashtag TEXT,
    is_admin_post BOOLEAN DEFAULT false,
    task_type TEXT,
    points_awarded INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb,
    viewed BOOLEAN DEFAULT false,
    CONSTRAINT valid_hashtag CHECK (
        hashtag IS NULL OR 
        hashtag = ANY(ARRAY['#ЯиСпикер', '#МояКоманда', '#МойУспех'])
    )
);

-- Recreate story_slides table
CREATE TABLE IF NOT EXISTS public.story_slides (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
    media_url TEXT NOT NULL,
    media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    likes INTEGER DEFAULT 0,
    liked_by TEXT[] DEFAULT ARRAY[]::TEXT[]
);

-- Create indexes
CREATE INDEX IF NOT EXISTS stories_user_id_idx ON stories(user_id);
CREATE INDEX IF NOT EXISTS stories_hashtag_idx ON stories(hashtag);
CREATE INDEX IF NOT EXISTS story_slides_story_id_idx ON story_slides(story_id);

-- Disable RLS
ALTER TABLE stories DISABLE ROW LEVEL SECURITY;
ALTER TABLE story_slides DISABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON stories TO anon, authenticated;
GRANT ALL ON story_slides TO anon, authenticated;