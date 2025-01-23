-- Drop existing tables and their dependencies
DROP TABLE IF EXISTS public.story_comments CASCADE;
DROP TABLE IF EXISTS public.story_slides CASCADE;
DROP TABLE IF EXISTS public.stories CASCADE;

-- Recreate stories table with proper relationships
CREATE TABLE public.stories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    viewed BOOLEAN DEFAULT false,
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);

-- Recreate story_slides table
CREATE TABLE public.story_slides (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    story_id UUID NOT NULL,
    media_url TEXT NOT NULL,
    media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    likes INTEGER DEFAULT 0,
    liked_by TEXT[] DEFAULT ARRAY[]::TEXT[],
    FOREIGN KEY (story_id) REFERENCES public.stories(id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX stories_user_id_idx ON public.stories(user_id);
CREATE INDEX stories_expires_at_idx ON public.stories(expires_at);
CREATE INDEX story_slides_story_id_idx ON public.story_slides(story_id);
CREATE INDEX story_slides_liked_by_idx ON public.story_slides USING gin(liked_by);

-- Enable RLS
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_slides ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for all users"
ON public.stories FOR SELECT
USING (true);

CREATE POLICY "Enable insert for all users"
ON public.stories FOR INSERT
WITH CHECK (true);

CREATE POLICY "Enable update for all users"
ON public.stories FOR UPDATE
USING (true);

CREATE POLICY "Enable read access for all users"
ON public.story_slides FOR SELECT
USING (true);

CREATE POLICY "Enable insert for all users"
ON public.story_slides FOR INSERT
WITH CHECK (true);

CREATE POLICY "Enable update for all users"
ON public.story_slides FOR UPDATE
USING (true);

-- Grant permissions
GRANT ALL ON public.stories TO anon, authenticated;
GRANT ALL ON public.story_slides TO anon, authenticated;