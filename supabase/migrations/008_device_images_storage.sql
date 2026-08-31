INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'device-images',
  'device-images',
  true,
  8388608, -- 8 MB in bytes
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- SELECT
DROP POLICY IF EXISTS "Admin select device-images" ON storage.objects;
CREATE POLICY "Admin select device-images"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'device-images' AND 
  auth.uid() = '76320352-4c29-42ad-a105-345e0b5928dd'::uuid
);

-- INSERT
DROP POLICY IF EXISTS "Admin insert device-images" ON storage.objects;
CREATE POLICY "Admin insert device-images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'device-images' AND 
  auth.uid() = '76320352-4c29-42ad-a105-345e0b5928dd'::uuid
);

-- UPDATE
DROP POLICY IF EXISTS "Admin update device-images" ON storage.objects;
CREATE POLICY "Admin update device-images"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'device-images' AND 
  auth.uid() = '76320352-4c29-42ad-a105-345e0b5928dd'::uuid
)
WITH CHECK (
  bucket_id = 'device-images' AND 
  auth.uid() = '76320352-4c29-42ad-a105-345e0b5928dd'::uuid
);

-- DELETE
DROP POLICY IF EXISTS "Admin delete device-images" ON storage.objects;
CREATE POLICY "Admin delete device-images"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'device-images' AND 
  auth.uid() = '76320352-4c29-42ad-a105-345e0b5928dd'::uuid
);
