-- Drop existing policies if they exist
DROP POLICY IF EXISTS "maze_games_read_policy" ON public.maze_games;
DROP POLICY IF EXISTS "maze_games_write_policy" ON public.maze_games;

-- Create maze_games table if not exists
CREATE TABLE IF NOT EXISTS public.maze_games (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    active BOOLEAN DEFAULT true,
    teams JSONB NOT NULL DEFAULT '[]'::jsonb,
    teams_locked BOOLEAN DEFAULT false,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index if not exists
CREATE INDEX IF NOT EXISTS maze_games_active_idx ON maze_games(active);

-- Enable RLS
ALTER TABLE public.maze_games ENABLE ROW LEVEL SECURITY;

-- Create fresh policies
CREATE POLICY "maze_games_read_policy"
ON public.maze_games FOR SELECT
USING (true);

CREATE POLICY "maze_games_write_policy"
ON public.maze_games FOR ALL
USING (true)
WITH CHECK (true);

-- Grant permissions
GRANT ALL ON public.maze_games TO anon, authenticated;