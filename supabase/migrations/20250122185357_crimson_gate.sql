-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Enable read access for all users" ON programs;
DROP POLICY IF EXISTS "Enable read access for all users" ON program_speakers;

-- Update speakers in users table
INSERT INTO users (id, username, first_name, last_name, is_admin, role)
VALUES 
    ('katyurina', '@katyurina', 'Дарья', 'Катюрина', false, 'speaker'),
    ('sannikova', '@sannikova', 'Оксана', 'Санникова', false, 'speaker'),
    ('sokolyanskaya', '@sokolyanskaya', 'Татьяна', 'Соколянская', false, 'speaker'),
    ('temnov', '@temnov', 'Георгий', 'Темнов', false, 'speaker'),
    ('klochkova', '@klochkova', 'Татьяна', 'Клочкова', false, 'speaker'),
    ('uhova', '@uhova', 'Екатерина', 'Ухова', false, 'speaker')
ON CONFLICT (id) DO UPDATE SET
    role = 'speaker',
    updated_at = CURRENT_TIMESTAMP;

-- Create programs table if not exists
CREATE TABLE IF NOT EXISTS programs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    day_index INTEGER NOT NULL CHECK (day_index BETWEEN 0 AND 4),
    time_start TIME NOT NULL,
    time_end TIME NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    location TEXT,
    duration TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_time_range CHECK (time_start < time_end)
);

-- Create program_speakers table if not exists
CREATE TABLE IF NOT EXISTS program_speakers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    program_id UUID REFERENCES programs(id) ON DELETE CASCADE,
    speaker_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('primary', 'secondary', 'tertiary')),
    UNIQUE (program_id, speaker_id)
);

-- Create indexes if not exist
CREATE INDEX IF NOT EXISTS programs_day_index_idx ON programs(day_index);
CREATE INDEX IF NOT EXISTS programs_time_start_idx ON programs(time_start);
CREATE INDEX IF NOT EXISTS program_speakers_program_id_idx ON program_speakers(program_id);
CREATE INDEX IF NOT EXISTS program_speakers_speaker_id_idx ON program_speakers(speaker_id);

-- Enable RLS
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_speakers ENABLE ROW LEVEL SECURITY;

-- Create policies with unique names
CREATE POLICY "programs_select_policy_v1"
ON programs FOR SELECT
USING (true);

CREATE POLICY "program_speakers_select_policy_v1"
ON program_speakers FOR SELECT
USING (true);

-- Create function to update timestamps if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updating timestamps if not exists
DROP TRIGGER IF EXISTS update_programs_updated_at ON programs;
CREATE TRIGGER update_programs_updated_at
    BEFORE UPDATE ON programs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Clear existing data
TRUNCATE TABLE program_speakers CASCADE;
TRUNCATE TABLE programs CASCADE;

-- Insert initial program data
DO $$ 
DECLARE
    mon_2 UUID := gen_random_uuid();
    mon_3 UUID := gen_random_uuid();
    mon_4 UUID := gen_random_uuid();
    mon_5 UUID := gen_random_uuid();
    mon_6 UUID := gen_random_uuid();
    mon_7 UUID := gen_random_uuid();
    tue_1 UUID := gen_random_uuid();
    tue_2 UUID := gen_random_uuid();
    tue_3 UUID := gen_random_uuid();
    tue_4 UUID := gen_random_uuid();
    tue_5 UUID := gen_random_uuid();
    tue_6 UUID := gen_random_uuid();
    tue_7 UUID := gen_random_uuid();
    tue_8 UUID := gen_random_uuid();
    tue_9 UUID := gen_random_uuid();
    tue_10 UUID := gen_random_uuid();
    wed_1 UUID := gen_random_uuid();
    wed_2 UUID := gen_random_uuid();
    wed_3 UUID := gen_random_uuid();
    thu_1 UUID := gen_random_uuid();
    thu_2 UUID := gen_random_uuid();
    thu_3 UUID := gen_random_uuid();
    fri_1 UUID := gen_random_uuid();
    fri_2 UUID := gen_random_uuid();
BEGIN
    -- Insert programs
    INSERT INTO programs (id, day_index, time_start, time_end, title, description, location, duration) VALUES
        -- Monday
        (mon_2, 0, '14:00', '16:00', 'Трансфер в отель', 'Посадка тренеров СПП в автобус, трансфер в Конгресс-отель', 'Стоянка ТЦ "Хорошо"', '2 ч.'),
        (mon_3, 0, '15:00', '16:00', 'Подготовка организаторами КП встречи Тренеров СПП в отеле', 'Прибытие организаторов КП в Конгресс-отель', 'Отель', '30 м.'),
        (mon_4, 0, '16:00', '16:30', 'Встреча организаторами КП Тренеров СПП в отеле', 'Встреча тренеров СПП в Конгресс-отеле', 'Отель', '30 м.'),
        (mon_5, 0, '17:30', '17:45', 'Установочное собрание всех участников КП', 'Проведение установочного собрания для всех участников КП', 'ТЗ', '15 м.'),
        (mon_6, 0, '17:45', '18:45', 'Общее знакомство участников КП', NULL, 'ТЗ', '1 ч.'),
        (mon_7, 0, '19:00', '20:00', 'Ужин', NULL, 'Ресторан', '1 ч.'),
        
        -- Tuesday
        (tue_1, 1, '08:00', '09:30', '🍳 Завтрак', NULL, 'Ресторан', '1 ч. 30 м.'),
        (tue_2, 1, '10:00', '11:00', 'Установочное организационное мероприятие', 'Презентация: «Стратегия ДОиРП 2025»', 'ТЗ', '15 м.'),
        (tue_3, 1, '11:00', '12:00', 'Подведение итогов отделов ДОиРП за 2024 г. и задачи на 2025 г.', 'Подведение итогов работы отделов ДОиРП по 2024 г. цели на 2025 г.', 'ТЗ', '1 ч.'),
        (tue_4, 1, '12:00', '12:20', '☕️ Кофе-брейк №1', NULL, 'ТЗ', '20 м.'),
        (tue_5, 1, '12:20', '14:00', 'Центр оценки', 'Проведение центра оценки ТСПП часть 1', 'ТЗ', '1 ч. 40 м.'),
        (tue_6, 1, '14:00', '15:00', '🍽 Обед', NULL, 'Ресторан', '1 ч.'),
        (tue_7, 1, '15:00', '16:20', 'Центр оценки', 'Проведение центра оценки ТСПП часть 2', 'ТЗ', '1 ч. 20 м.'),
        (tue_8, 1, '16:20', '16:40', '☕️ Кофе-брейк №1', NULL, 'ТЗ', '20 м.'),
        (tue_9, 1, '16:40', '18:00', 'Центр оценки', 'Проведение центра оценки ТСПП часть 3', 'ТЗ', '1 ч. 20 м.'),
        (tue_10, 1, '18:00', '18:10', '🏖 Перерыв', NULL, 'ТЗ', '20 м.'),
        
        -- Wednesday
        (wed_1, 2, '08:00', '09:00', 'Завтрак', NULL, 'Ресторан', '1 ч.'),
        (wed_2, 2, '10:00', '12:00', 'Рабочая сессия: "Стандарты ТСПП – обмен опытом"', NULL, 'ТЗ', '2 ч.'),
        (wed_3, 2, '15:00', '18:00', 'Тренинг на командное взаимодействие', NULL, 'ТЗ', '3 ч.'),
        
        -- Thursday
        (thu_1, 3, '08:00', '09:00', 'Завтрак', NULL, 'Ресторан', '30 м.'),
        (thu_2, 3, '10:00', '12:00', 'Презентация диагностической карты (часть 1)', NULL, 'ТЗ', '2 ч.'),
        (thu_3, 3, '15:00', '16:40', 'Тренинг: "Основы бизнеса FMCG"', NULL, 'ТЗ', '1 ч. 40 м.'),
        
        -- Friday
        (fri_1, 4, '08:00', '08:30', 'Завтрак', NULL, 'Ресторан', '30 м.'),
        (fri_2, 4, '10:00', '12:00', 'Торжественное закрытие КП', NULL, 'ТЗ', '2 ч.');

    -- Link speakers to programs
    INSERT INTO program_speakers (program_id, speaker_id, role) VALUES
        (mon_2, 'katyurina', 'primary'),
        (mon_3, 'sannikova', 'primary'),
        (mon_4, 'sannikova', 'primary'),
        (mon_4, 'katyurina', 'secondary'),
        (mon_5, 'sokolyanskaya', 'primary'),
        (mon_5, 'temnov', 'secondary'),
        (mon_6, 'katyurina', 'primary'),
        (tue_2, 'sokolyanskaya', 'primary'),
        (tue_3, 'klochkova', 'primary'),
        (tue_3, 'uhova', 'secondary'),
        (tue_3, 'temnov', 'tertiary'),
        (tue_5, 'katyurina', 'primary'),
        (tue_7, 'katyurina', 'primary'),
        (tue_9, 'katyurina', 'primary'),
        (wed_2, 'katyurina', 'primary');
END $$;

-- Grant permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;