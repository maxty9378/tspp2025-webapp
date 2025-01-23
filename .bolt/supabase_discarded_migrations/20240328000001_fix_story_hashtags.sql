-- Drop existing constraint if it exists
ALTER TABLE public.stories 
DROP CONSTRAINT IF EXISTS valid_hashtag;

-- Add or update hashtag column
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 
                  FROM information_schema.columns 
                  WHERE table_name = 'stories' 
                  AND column_name = 'hashtag') THEN
        ALTER TABLE public.stories ADD COLUMN hashtag TEXT;
    END IF;
END $$;

-- Create or replace index
DROP INDEX IF EXISTS stories_hashtag_idx;
CREATE INDEX stories_hashtag_idx ON public.stories(hashtag);

-- Add new constraint
ALTER TABLE public.stories
ADD CONSTRAINT valid_hashtag CHECK (
    hashtag IS NULL OR 
    hashtag = ANY(ARRAY['#ЯиСпикер', '#МояКоманда', '#МойУспех'])
);