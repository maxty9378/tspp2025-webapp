-- Drop existing tables and their dependencies
DROP TABLE IF EXISTS public.story_comments CASCADE;
DROP TABLE IF EXISTS public.story_slides CASCADE;
DROP TABLE IF EXISTS public.stories CASCADE;

-- Create stories table with proper schema
CREATE TABLE public.stories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
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

-- Create story_slides table
CREATE TABLE public.story_slides (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
    media_url TEXT NOT NULL,
    media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    likes INTEGER DEFAULT 0,
    liked_by TEXT[] DEFAULT ARRAY[]::TEXT[],
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for better performance
CREATE INDEX stories_user_id_idx ON public.stories(user_id);
CREATE INDEX stories_hashtag_idx ON public.stories(hashtag);
CREATE INDEX stories_expires_at_idx ON public.stories(expires_at);
CREATE INDEX story_slides_story_id_idx ON public.story_slides(story_id);
CREATE INDEX story_slides_liked_by_idx ON public.story_slides USING gin(liked_by);

-- Enable RLS
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_slides ENABLE ROW LEVEL SECURITY;

-- Create policies for stories table
CREATE POLICY "Enable read access for all users"
ON public.stories FOR SELECT
USING (true);

CREATE POLICY "Enable insert for all users"
ON public.stories FOR INSERT
WITH CHECK (true);

CREATE POLICY "Enable update for all users"
ON public.stories FOR UPDATE
USING (true)
WITH CHECK (true);

-- Create policies for story_slides table
CREATE POLICY "Enable read access for all users"
ON public.story_slides FOR SELECT
USING (true);

CREATE POLICY "Enable insert for all users"
ON public.story_slides FOR INSERT
WITH CHECK (true);

CREATE POLICY "Enable update for all users"
ON public.story_slides FOR UPDATE
USING (true)
WITH CHECK (true);

-- Create storage bucket if not exists
INSERT INTO storage.buckets (id, name, public)
SELECT 'stories', 'stories', true
WHERE NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'stories'
);

-- Drop existing storage policies
DROP POLICY IF EXISTS "StoriesPublicAccess" ON storage.objects;
DROP POLICY IF EXISTS "StoriesUpload" ON storage.objects;
DROP POLICY IF EXISTS "StoriesUpdate" ON storage.objects;
DROP POLICY IF EXISTS "StoriesDelete" ON storage.objects;

-- Create storage policies
CREATE POLICY "Enable public access"
ON storage.objects FOR SELECT
USING (bucket_id = 'stories');

CREATE POLICY "Enable all operations"
ON storage.objects FOR ALL
USING (bucket_id = 'stories')
WITH CHECK (bucket_id = 'stories');

-- Disable RLS for storage temporarily
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON storage.objects TO anon, authenticated;
GRANT ALL ON storage.buckets TO anon, authenticated;
GRANT ALL ON public.stories TO anon, authenticated;
GRANT ALL ON public.story_slides TO anon, authenticated;