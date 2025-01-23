-- Add position field to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS position TEXT;

-- Create index for position field
CREATE INDEX IF NOT EXISTS users_position_idx ON users(position);

-- Update existing speakers with their positions
UPDATE users
SET position = CASE
  WHEN id = 'katyurina' THEN 'Ведущий бизнес-тренер ООТПиЛР'
  WHEN id = 'sannikova' THEN 'Менеджер ОВОиОМР'
  WHEN id = 'sokolyanskaya' THEN 'Директор ДОиРП'
  WHEN id = 'temnov' THEN 'Начальник ООТПиЛР'
  WHEN id = 'klochkova' THEN 'Начальник ОКРиКС'
  WHEN id = 'uhova' THEN 'Начальник ОДОП'
END
WHERE id IN ('katyurina', 'sannikova', 'sokolyanskaya', 'temnov', 'klochkova', 'uhova');