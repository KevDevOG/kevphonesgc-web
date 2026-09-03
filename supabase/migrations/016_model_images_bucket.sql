INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'model-images',
    'model-images',
    true,
    8388608,
    ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Select for public
DROP POLICY IF EXISTS "Public read access on model-images bucket" ON storage.objects;
CREATE POLICY "Public read access on model-images bucket"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'model-images');

-- Insert for Admin
DROP POLICY IF EXISTS "Admin insert model-images bucket" ON storage.objects;
CREATE POLICY "Admin insert model-images bucket"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'model-images' AND 
    auth.uid() IS NOT DISTINCT FROM '76320352-4c29-42ad-a105-345e0b5928dd'::uuid
);

-- Update for Admin
DROP POLICY IF EXISTS "Admin update model-images bucket" ON storage.objects;
CREATE POLICY "Admin update model-images bucket"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
    bucket_id = 'model-images' AND 
    auth.uid() IS NOT DISTINCT FROM '76320352-4c29-42ad-a105-345e0b5928dd'::uuid
)
WITH CHECK (
    bucket_id = 'model-images' AND 
    auth.uid() IS NOT DISTINCT FROM '76320352-4c29-42ad-a105-345e0b5928dd'::uuid
);

-- Delete for Admin
DROP POLICY IF EXISTS "Admin delete model-images bucket" ON storage.objects;
CREATE POLICY "Admin delete model-images bucket"
ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = 'model-images' AND 
    auth.uid() IS NOT DISTINCT FROM '76320352-4c29-42ad-a105-345e0b5928dd'::uuid
);
