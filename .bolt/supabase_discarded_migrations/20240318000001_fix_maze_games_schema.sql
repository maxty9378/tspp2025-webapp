-- Drop existing maze_games table and its policies
DROP POLICY IF EXISTS "Enable read access for all users" ON public.maze_games;
DROP POLICY IF EXISTS "Enable write access for all users" ON public.maze_games;
DROP TABLE IF EXISTS public.maze_games;

-- Create maze_games table with proper schema
CREATE TABLE public.maze_games (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    active BOOLEAN DEFAULT true,
    teams JSONB NOT NULL,
    "teamsLocked" BOOLEAN DEFAULT false,
    "startedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX maze_games_active_idx ON public.maze_games(active);

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