-- Drop existing policies if they exist
DROP POLICY IF EXISTS "maze_games_read_policy" ON public.maze_games;
DROP POLICY IF EXISTS "maze_games_write_policy" ON public.maze_games;

-- Drop existing index if exists
DROP INDEX IF EXISTS maze_games_active_idx;

-- Update maze_games table schema if exists
DO $$ 
BEGIN
    -- Add any missing columns
    ALTER TABLE public.maze_games 
    ADD COLUMN IF NOT EXISTS teams_locked BOOLEAN DEFAULT false;
    
    -- Update column defaults
    ALTER TABLE public.maze_games 
    ALTER COLUMN teams SET DEFAULT '[]'::jsonb,
    ALTER COLUMN active SET DEFAULT true;

EXCEPTION
    WHEN undefined_table THEN
        -- Create table if it doesn't exist
        CREATE TABLE public.maze_games (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            active BOOLEAN DEFAULT true,
            teams JSONB NOT NULL DEFAULT '[]'::jsonb,
            teams_locked BOOLEAN DEFAULT false,
            started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            ended_at TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
END $$;

-- Recreate index
CREATE INDEX IF NOT EXISTS maze_games_active_idx ON public.maze_games(active);

-- Enable RLS
ALTER TABLE public.maze_games ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "maze_games_read_policy"
ON public.maze_games FOR SELECT
USING (true);

CREATE POLICY "maze_games_write_policy"
ON public.maze_games FOR ALL
USING (true)
WITH CHECK (true);

-- Grant permissions
GRANT ALL ON public.maze_games TO anon, authenticated;