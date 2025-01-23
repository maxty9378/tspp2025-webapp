/*
  # Fix storage policies

  1. Storage Policies
    - Drop existing policies to avoid conflicts
    - Create proper RLS policies for storage bucket
    - Grant necessary permissions
*/

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow public read access" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create storage policies with proper permissions
CREATE POLICY "Enable read access for all users"
ON storage.objects FOR SELECT
USING (bucket_id = 'stories');

CREATE POLICY "Enable insert for authenticated users"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'stories' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Enable update for authenticated users"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'stories' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Enable delete for authenticated users"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'stories' 
  AND auth.role() = 'authenticated'
);

-- Grant permissions
GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.buckets TO authenticated;