-- Optional receipt photo for capital withdrawals (documentation only).
-- Does NOT change amounts, types, balances or any financial calculation.

-- 1. RECEIPT REFERENCE (storage path only, never the binary)
ALTER TABLE public.capital_movements
    ADD COLUMN IF NOT EXISTS receipt_path text;

-- Only withdrawals may carry a receipt.
ALTER TABLE public.capital_movements
    DROP CONSTRAINT IF EXISTS capital_movements_receipt_withdrawal_only;
ALTER TABLE public.capital_movements
    ADD CONSTRAINT capital_movements_receipt_withdrawal_only
    CHECK (receipt_path IS NULL OR movement_type = 'withdrawal');

-- Only server-generated paths are accepted.
ALTER TABLE public.capital_movements
    DROP CONSTRAINT IF EXISTS capital_movements_receipt_path_format;
ALTER TABLE public.capital_movements
    ADD CONSTRAINT capital_movements_receipt_path_format
    CHECK (
        receipt_path IS NULL OR
        receipt_path ~ '^withdrawals/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp|heic|heif)$'
    );

CREATE UNIQUE INDEX IF NOT EXISTS idx_capital_movements_receipt_path
    ON public.capital_movements (receipt_path)
    WHERE receipt_path IS NOT NULL;

-- 2. PRIVATE STORAGE BUCKET
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'capital-movement-receipts',
    'capital-movement-receipts',
    false,
    10485760, -- 10 MB
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']::text[]
)
ON CONFLICT (id) DO UPDATE SET
    public = false,
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']::text[];

-- 3. ADMIN-ONLY STORAGE ACCESS
-- No UPDATE policy: stored receipts cannot be overwritten or moved.
DROP POLICY IF EXISTS "Admin SELECT on capital-movement-receipts" ON storage.objects;
DROP POLICY IF EXISTS "Admin INSERT on capital-movement-receipts" ON storage.objects;
DROP POLICY IF EXISTS "Admin DELETE on capital-movement-receipts" ON storage.objects;

CREATE POLICY "Admin SELECT on capital-movement-receipts"
ON storage.objects
FOR SELECT
TO authenticated
USING (
    bucket_id = 'capital-movement-receipts' AND
    auth.uid() IS NOT DISTINCT FROM '76320352-4c29-42ad-a105-345e0b5928dd'::uuid
);

CREATE POLICY "Admin INSERT on capital-movement-receipts"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'capital-movement-receipts' AND
    auth.uid() IS NOT DISTINCT FROM '76320352-4c29-42ad-a105-345e0b5928dd'::uuid
);

CREATE POLICY "Admin DELETE on capital-movement-receipts"
ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = 'capital-movement-receipts' AND
    auth.uid() IS NOT DISTINCT FROM '76320352-4c29-42ad-a105-345e0b5928dd'::uuid
);
