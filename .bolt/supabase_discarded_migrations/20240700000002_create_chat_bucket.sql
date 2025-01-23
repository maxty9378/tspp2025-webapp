-- Create chat bucket if not exists
INSERT INTO storage.buckets (id, name, public)
SELECT 'chat', 'chat', true
WHERE NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'chat'
);

-- Create storage policies for chat bucket
CREATE POLICY "ChatPublicRead"
ON storage.objects FOR SELECT
USING (bucket_id = 'chat');

CREATE POLICY "ChatPublicWrite"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'chat');

CREATE POLICY "ChatPublicUpdate"
ON storage.objects FOR UPDATE
USING (bucket_id = 'chat')
WITH CHECK (bucket_id = 'chat');

-- Grant permissions
GRANT ALL ON storage.objects TO anon, authenticated;
GRANT ALL ON storage.buckets TO anon, authenticated;