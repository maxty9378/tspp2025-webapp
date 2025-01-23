-- Add missing columns to messages table
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'text';
ALTER TABLE public.messages ADD CONSTRAINT messages_type_check 
  CHECK (type IN ('text', 'image', 'task', 'system'));

-- Fix maze_games table
DROP TABLE IF EXISTS public.maze_games;
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
CREATE INDEX IF NOT EXISTS messages_type_idx ON public.messages(type);
CREATE INDEX IF NOT EXISTS maze_games_active_idx ON public.maze_games(active);

-- Enable RLS
ALTER TABLE public.maze_games ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for all users"
ON public.maze_games FOR SELECT
USING (true);

CREATE POLICY "Enable write access for all users"
ON public.maze_games FOR ALL
WITH CHECK (true);

-- Grant permissions
GRANT ALL ON public.maze_games TO anon, authenticated;