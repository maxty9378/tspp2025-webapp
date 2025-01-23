/*
  # Update maze games policies

  1. Changes
    - Safely drop and recreate policies for maze_games table
    - Add new policy for ending games
    - Update existing policies with better conditions

  2. Security
    - Maintain RLS security
    - Ensure proper access control
*/

-- First safely drop existing policies if they exist
DO $$ 
BEGIN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Enable update for active games" ON public.maze_games;
    DROP POLICY IF EXISTS "Enable ending games" ON public.maze_games;
    DROP POLICY IF EXISTS "Enable read access for all users" ON public.maze_games;
EXCEPTION
    WHEN undefined_object THEN 
        NULL;
END $$;

-- Recreate policies with better conditions
CREATE POLICY "Enable read access for all users"
ON public.maze_games FOR SELECT
USING (true);

CREATE POLICY "Enable update for active games"
ON public.maze_games FOR UPDATE
USING (active = true AND teams_locked = false)
WITH CHECK (active = true);

CREATE POLICY "Enable ending games"
ON public.maze_games FOR UPDATE
USING (active = true)
WITH CHECK (
    (active = false AND ended_at IS NOT NULL) OR
    (active = true AND teams_locked IS NOT NULL)
);