-- Add hashtag column to stories table
ALTER TABLE public.stories 
ADD COLUMN IF NOT EXISTS hashtag TEXT;

-- Create index for hashtag search
CREATE INDEX IF NOT EXISTS stories_hashtag_idx ON public.stories(hashtag);

-- Add constraint for valid hashtags
ALTER TABLE public.stories
ADD CONSTRAINT valid_hashtag CHECK (
  hashtag IS NULL OR 
  hashtag IN ('#ЯиСпикер', '#МояКоманда', '#МойУспех')
);