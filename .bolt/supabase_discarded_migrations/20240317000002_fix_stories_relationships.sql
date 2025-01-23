-- Drop existing policies
DROP POLICY IF EXISTS "Enable read access for all users" ON public.stories;
DROP POLICY IF EXISTS "Enable insert for all users" ON public.stories;
DROP POLICY IF EXISTS "Enable update for all users" ON public.stories;

-- Recreate policies with proper permissions
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

-- Add viewed column if it doesn't exist
ALTER TABLE public.stories 
ADD COLUMN IF NOT EXISTS viewed BOOLEAN DEFAULT false;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS stories_user_id_idx ON public.stories(user_id);
CREATE INDEX IF NOT EXISTS stories_expires_at_idx ON public.stories(expires_at);
CREATE INDEX IF NOT EXISTS story_slides_story_id_idx ON public.story_slides(story_id);
CREATE INDEX IF NOT EXISTS story_slides_liked_by_idx ON public.story_slides USING gin(liked_by);

-- Grant permissions
GRANT ALL ON public.stories TO anon, authenticated;
GRANT ALL ON public.story_slides TO anon, authenticated;
GRANT ALL ON public.story_comments TO anon, authenticated;