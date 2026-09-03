DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM public.sale_request_images
        LIMIT 1
    ) THEN
        RAISE EXCEPTION
            'sale_request_images contiene registros. Asigna photo_type antes de aplicar esta migración.';
    END IF;
END;
$$;

-- 1. SALE_REQUEST_IMAGES additions
ALTER TABLE public.sale_request_images
ADD COLUMN photo_type text NOT NULL
CHECK (
  photo_type IN (
    'front_off',
    'front_on',
    'back',
    'right_side',
    'left_side',
    'top',
    'bottom',
    'extra'
  )
);

-- 2. UNIQUE REQUIRED PHOTO TYPES
CREATE UNIQUE INDEX idx_sale_request_images_unique_type 
ON public.sale_request_images (request_id, photo_type) 
WHERE photo_type <> 'extra';

-- 3. PRIVATE STORAGE BUCKET
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'sale-request-images',
    'sale-request-images',
    false,
    8388608, -- 8 MB
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']::text[]
)
ON CONFLICT (id) DO UPDATE SET 
    public = false,
    file_size_limit = 8388608,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']::text[];

-- 4. ADMIN STORAGE ACCESS
-- Drop existing if any
DROP POLICY IF EXISTS "Admin SELECT on sale-request-images" ON storage.objects;
DROP POLICY IF EXISTS "Admin INSERT on sale-request-images" ON storage.objects;
DROP POLICY IF EXISTS "Admin UPDATE on sale-request-images" ON storage.objects;
DROP POLICY IF EXISTS "Admin DELETE on sale-request-images" ON storage.objects;

-- Create policies for admin
CREATE POLICY "Admin SELECT on sale-request-images"
ON storage.objects
FOR SELECT
TO authenticated
USING (
    bucket_id = 'sale-request-images' AND
    auth.uid() IS NOT DISTINCT FROM '76320352-4c29-42ad-a105-345e0b5928dd'::uuid
);

CREATE POLICY "Admin INSERT on sale-request-images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'sale-request-images' AND
    auth.uid() IS NOT DISTINCT FROM '76320352-4c29-42ad-a105-345e0b5928dd'::uuid
);

CREATE POLICY "Admin UPDATE on sale-request-images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
    bucket_id = 'sale-request-images' AND
    auth.uid() IS NOT DISTINCT FROM '76320352-4c29-42ad-a105-345e0b5928dd'::uuid
)
WITH CHECK (
    bucket_id = 'sale-request-images' AND
    auth.uid() IS NOT DISTINCT FROM '76320352-4c29-42ad-a105-345e0b5928dd'::uuid
);

CREATE POLICY "Admin DELETE on sale-request-images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = 'sale-request-images' AND
    auth.uid() IS NOT DISTINCT FROM '76320352-4c29-42ad-a105-345e0b5928dd'::uuid
);
