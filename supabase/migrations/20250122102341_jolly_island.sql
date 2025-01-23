-- Drop existing policies
DROP POLICY IF EXISTS "Enable read access for all users" ON public.users;
DROP POLICY IF EXISTS "Enable insert for all users" ON public.users;
DROP POLICY IF EXISTS "Enable update for all users" ON public.users;

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create new policies with proper permissions
CREATE POLICY "Enable read access for all users"
ON public.users FOR SELECT
USING (true);

CREATE POLICY "Enable insert for new users"
ON public.users FOR INSERT
WITH CHECK (
  -- Allow insert if no row exists for this id
  NOT EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid()::text
  )
);

CREATE POLICY "Enable self updates"
ON public.users FOR UPDATE
USING (
  -- User can update their own row
  id = auth.uid()::text OR
  -- Or they are an admin
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid()::text 
    AND is_admin = true
  )
)
WITH CHECK (
  id = auth.uid()::text OR
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid()::text 
    AND is_admin = true
  )
);

-- Create function to safely update user points
CREATE OR REPLACE FUNCTION update_user_points(
  user_id TEXT,
  points_to_add INTEGER,
  reason TEXT DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  new_points INTEGER;
BEGIN
  UPDATE users
  SET 
    points = COALESCE(points, 0) + points_to_add,
    updated_at = CURRENT_TIMESTAMP
  WHERE id = user_id
  RETURNING points INTO new_points;

  -- Log points update
  INSERT INTO system_logs (
    level,
    event,
    user_id,
    details
  ) VALUES (
    'info',
    'Points updated',
    user_id,
    jsonb_build_object(
      'points_added', points_to_add,
      'new_total', new_points,
      'reason', reason
    )
  );

  RETURN new_points;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT ALL ON public.users TO anon, authenticated;