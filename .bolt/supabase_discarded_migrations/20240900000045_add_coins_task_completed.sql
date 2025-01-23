-- Add coins_task_completed column to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS coins_task_completed BOOLEAN DEFAULT false;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS users_coins_task_completed_idx ON users(coins_task_completed);

-- Update existing users
UPDATE users 
SET coins_task_completed = true 
WHERE total_coins_earned >= 1000;