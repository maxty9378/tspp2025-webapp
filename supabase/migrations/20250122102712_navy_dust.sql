-- Create task_completions table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.task_completions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    task_type TEXT NOT NULL CHECK (task_type IN (
        'daily', 'achievement', 'story', 'coins', 'likes', 
        'surveys', 'practice', 'mistake', 'greeting', 'quote', 'slogan',
        'team_activity', 'participants_photo', 'other', 'team_photo'
    )),
    points_awarded INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add foreign key constraint
ALTER TABLE task_completions
  ADD CONSTRAINT task_completions_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES users(id) 
  ON DELETE CASCADE;

-- Create indexes
CREATE INDEX IF NOT EXISTS task_completions_user_id_idx ON task_completions(user_id);
CREATE INDEX IF NOT EXISTS task_completions_task_type_idx ON task_completions(task_type);
CREATE INDEX IF NOT EXISTS task_completions_completed_at_idx ON task_completions(completed_at DESC);

-- Enable RLS
ALTER TABLE task_completions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for all users"
ON task_completions FOR SELECT
USING (true);

CREATE POLICY "Enable insert for all users"
ON task_completions FOR INSERT
WITH CHECK (true);

-- Add ON DELETE CASCADE to messages foreign key
ALTER TABLE IF EXISTS messages
  DROP CONSTRAINT IF EXISTS messages_user_id_fkey;

ALTER TABLE messages
  ADD CONSTRAINT messages_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES users(id)
  ON DELETE CASCADE;

-- Create index for messages foreign key
CREATE INDEX IF NOT EXISTS messages_user_id_idx ON messages(user_id);

-- Grant permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;