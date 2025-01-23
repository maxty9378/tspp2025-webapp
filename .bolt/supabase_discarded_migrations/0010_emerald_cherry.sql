/*
  # Add Task Metadata and Game Functions

  1. Messages Table Updates
    - Add is_from_app column for tracking message source
    - Add index for efficient filtering

  2. Task Completion Metadata
    - Add JSONB metadata column
    - Add metadata validation trigger
    - Add GIN index for JSON querying

  3. Game Functions
    - Add team points calculation
    - Add safe team level updates
    - Update maze game policies
*/

-- Add is_from_app column to messages
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS is_from_app BOOLEAN DEFAULT false;

-- Create index for messages filtering
CREATE INDEX IF NOT EXISTS idx_messages_is_from_app 
ON public.messages(is_from_app);

-- Add metadata column to task_completions if it doesn't exist
ALTER TABLE public.task_completions 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Create function to safely handle task completion metadata
CREATE OR REPLACE FUNCTION check_task_completion_metadata()
RETURNS trigger AS $$
BEGIN
  -- Ensure metadata is valid JSON
  IF NEW.metadata IS NULL THEN
    NEW.metadata := '{}'::jsonb;
  END IF;

  -- Convert string values to proper JSON format
  IF NEW.metadata ? 'type' AND jsonb_typeof(NEW.metadata->'type') = 'string' THEN
    NEW.metadata := jsonb_set(NEW.metadata, '{type}', to_jsonb(NEW.metadata->>'type'));
  END IF;

  IF NEW.metadata ? 'first_time' AND jsonb_typeof(NEW.metadata->'first_time') = 'string' THEN
    NEW.metadata := jsonb_set(NEW.metadata, '{first_time}', 
      CASE WHEN NEW.metadata->>'first_time' = 'true' THEN 'true'::jsonb
           ELSE 'false'::jsonb
      END
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for task completion metadata validation
DROP TRIGGER IF EXISTS validate_task_completion_metadata ON public.task_completions;
CREATE TRIGGER validate_task_completion_metadata
  BEFORE INSERT OR UPDATE ON public.task_completions
  FOR EACH ROW
  EXECUTE FUNCTION check_task_completion_metadata();

-- Create index for task completion queries
CREATE INDEX IF NOT EXISTS idx_task_completions_metadata 
ON public.task_completions USING gin(metadata);

-- Add function to calculate team points
CREATE OR REPLACE FUNCTION calculate_team_points(team_data JSONB)
RETURNS INTEGER AS $$
BEGIN
  RETURN (team_data->>'level')::INTEGER * 50;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add function to safely update team levels
CREATE OR REPLACE FUNCTION update_team_level(
  game_id UUID,
  team_id TEXT,
  new_level INTEGER
) RETURNS VOID AS $$
DECLARE
  game_data JSONB;
BEGIN
  -- Get current game data
  SELECT teams INTO game_data
  FROM maze_games
  WHERE id = game_id;

  -- Update the specific team's level
  UPDATE maze_games
  SET teams = jsonb_set(
    teams,
    ARRAY[
      (
        SELECT ordinality - 1
        FROM jsonb_array_elements(teams) WITH ORDINALITY
        WHERE value->>'id' = team_id
      )::text,
      'level'
    ],
    to_jsonb(new_level)
  )
  WHERE id = game_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing policies first
DROP POLICY IF EXISTS "Enable update for active games" ON public.maze_games;
DROP POLICY IF EXISTS "Enable ending games" ON public.maze_games;

-- Create new policies
CREATE POLICY "Enable update for active games"
ON public.maze_games
FOR UPDATE TO authenticated
USING (active = true)
WITH CHECK (active = true);

CREATE POLICY "Enable ending games"
ON public.maze_games
FOR UPDATE TO authenticated
USING (active = true)
WITH CHECK (active = false AND ended_at IS NOT NULL);

-- Grant necessary permissions
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;