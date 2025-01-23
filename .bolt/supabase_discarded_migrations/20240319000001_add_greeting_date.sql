-- Add last_greeting_date column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_greeting_date DATE;

-- Create index for last_greeting_date
CREATE INDEX IF NOT EXISTS users_last_greeting_date_idx ON users(last_greeting_date);

-- Add constraint to ensure points is not negative
ALTER TABLE users ADD CONSTRAINT points_not_negative CHECK (points >= 0);

-- Add constraint to ensure total_coins_earned is not negative  
ALTER TABLE users ADD CONSTRAINT total_coins_not_negative CHECK (total_coins_earned >= 0);