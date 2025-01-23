-- Add missing column
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS daily_likes_given INTEGER DEFAULT 0;

-- Create index for new column
CREATE INDEX IF NOT EXISTS users_daily_likes_given_idx ON users(daily_likes_given);

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';

-- Grant permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;