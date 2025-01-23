-- Add quiz_completions table if not exists
CREATE TABLE IF NOT EXISTS public.quiz_completions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
    quiz_id TEXT NOT NULL,
    score INTEGER NOT NULL,
    total_questions INTEGER NOT NULL,
    points_awarded INTEGER NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS quiz_completions_user_id_idx ON quiz_completions(user_id);
CREATE INDEX IF NOT EXISTS quiz_completions_quiz_id_idx ON quiz_completions(quiz_id);
CREATE INDEX IF NOT EXISTS quiz_completions_completed_at_idx ON quiz_completions(completed_at);

-- Enable RLS
ALTER TABLE public.quiz_completions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for all users"
ON public.quiz_completions FOR SELECT
USING (true);

CREATE POLICY "Enable insert for all users"
ON public.quiz_completions FOR INSERT
WITH CHECK (true);

-- Grant permissions
GRANT ALL ON public.quiz_completions TO anon, authenticated;