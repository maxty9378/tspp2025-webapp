/*
  # Add maze_games table

  1. New Tables
    - `maze_games` - Stores active maze game sessions
      - `id` (uuid, primary key)
      - `active` (boolean)
      - `teams` (jsonb)
      - `teams_locked` (boolean)
      - `started_at` (timestamp)
      - `ended_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS
    - Add policies for read/write access
*/

-- Create maze_games table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.maze_games (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    active BOOLEAN DEFAULT true,
    teams JSONB NOT NULL DEFAULT '[]'::jsonb,
    teams_locked BOOLEAN DEFAULT false,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS maze_games_active_idx ON public.maze_games(active);
CREATE INDEX IF NOT EXISTS maze_games_updated_at_idx ON public.maze_games(updated_at DESC);

-- Enable RLS
ALTER TABLE public.maze_games ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for all users"
ON public.maze_games FOR SELECT
USING (true);

CREATE POLICY "Enable update for active games"
ON public.maze_games FOR UPDATE
USING (active = true)
WITH CHECK (active = true);

-- Grant permissions
GRANT ALL ON public.maze_games TO anon, authenticated;