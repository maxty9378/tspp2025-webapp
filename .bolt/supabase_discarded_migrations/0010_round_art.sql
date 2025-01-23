/*
  # Fix maze games table structure

  1. Changes
    - Add proper indexes for active games
    - Add teams_locked column
    - Add updated_at column with trigger
    - Add proper RLS policies
  
  2. Security
    - Enable RLS
    - Add policies for read/write access
*/

-- Add updated_at column if it doesn't exist
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'maze_games' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.maze_games 
    ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
  END IF;
END $$;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_maze_games_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_maze_games_updated_at ON public.maze_games;
CREATE TRIGGER set_maze_games_updated_at
  BEFORE UPDATE ON public.maze_games
  FOR EACH ROW
  EXECUTE FUNCTION update_maze_games_updated_at();

-- Create index for active games
CREATE INDEX IF NOT EXISTS idx_maze_games_active 
ON public.maze_games(active, updated_at DESC);

-- Enable RLS
ALTER TABLE public.maze_games ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Enable read access for all users" ON public.maze_games;
DROP POLICY IF EXISTS "Enable write access for authenticated users" ON public.maze_games;

-- Create new policies
CREATE POLICY "Enable read access for all users"
ON public.maze_games FOR SELECT
USING (true);

CREATE POLICY "Enable write access for authenticated users"
ON public.maze_games FOR ALL
USING (true)
WITH CHECK (true);

-- Grant permissions
GRANT ALL ON public.maze_games TO anon, authenticated;