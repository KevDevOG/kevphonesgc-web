-- Create sale_requests table
CREATE TABLE public.sale_requests (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    category text NOT NULL CHECK (category IN ('iphone', 'ps5', 'nintendo_switch')),
    model_id uuid NULL REFERENCES public.device_models(id) ON DELETE SET NULL,
    storage text NULL CHECK (storage IS NULL OR trim(storage) <> ''),
    color text NULL CHECK (color IS NULL OR trim(color) <> ''),
    battery_health integer NULL CHECK (battery_health IS NULL OR battery_health BETWEEN 0 AND 100),
    battery_cycles integer NULL CHECK (battery_cycles IS NULL OR battery_cycles >= 0),
    device_condition text NOT NULL CHECK (device_condition IN ('sealed', 'like_new', 'good', 'marked')),
    has_box boolean NOT NULL DEFAULT false,
    has_cable boolean NOT NULL DEFAULT false,
    has_invoice boolean NOT NULL DEFAULT false,
    original_parts boolean NOT NULL DEFAULT true,
    fully_functional boolean NOT NULL DEFAULT true,
    blocked boolean NOT NULL DEFAULT false,
    official_warranty_until date NULL,
    estimated_min numeric(10,2) NULL CHECK (estimated_min IS NULL OR estimated_min >= 0),
    estimated_max numeric(10,2) NULL CHECK (estimated_max IS NULL OR estimated_max >= 0),
    customer_name text NOT NULL CHECK (trim(customer_name) <> ''),
    customer_phone text NOT NULL CHECK (trim(customer_phone) <> ''),
    customer_location text NULL CHECK (customer_location IS NULL OR trim(customer_location) <> ''),
    notes text NULL,
    status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'purchased', 'discarded')),
    source text NULL CHECK (source IS NULL OR source IN ('instagram', 'tiktok', 'google', 'direct', 'other')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CHECK (estimated_max IS NULL OR estimated_min IS NULL OR estimated_max >= estimated_min)
);

-- Create sale_request_images table
CREATE TABLE public.sale_request_images (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id uuid NOT NULL REFERENCES public.sale_requests(id) ON DELETE CASCADE,
    storage_path text NOT NULL CHECK (trim(storage_path) <> ''),
    position integer NOT NULL DEFAULT 0 CHECK (position >= 0),
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Triggers
CREATE TRIGGER set_sale_requests_updated_at
BEFORE UPDATE ON public.sale_requests
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- Indexes
CREATE INDEX idx_sale_requests_status ON public.sale_requests(status);
CREATE INDEX idx_sale_requests_created_at ON public.sale_requests(created_at DESC);
CREATE INDEX idx_sale_requests_customer_phone ON public.sale_requests(customer_phone);
CREATE INDEX idx_sale_requests_model_id ON public.sale_requests(model_id);
CREATE INDEX idx_sale_request_images_request_id_position ON public.sale_request_images(request_id, position);

-- RLS
ALTER TABLE public.sale_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_request_images ENABLE ROW LEVEL SECURITY;

-- Revoke public access
REVOKE ALL ON public.sale_requests FROM public, anon;
REVOKE ALL ON public.sale_request_images FROM public, anon;

-- Grant to authenticated
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sale_requests TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sale_request_images TO authenticated;

-- Policies for sale_requests
CREATE POLICY "Admin full access on sale_requests"
ON public.sale_requests
AS PERMISSIVE
FOR ALL
TO authenticated
USING (auth.uid() IS NOT DISTINCT FROM '76320352-4c29-42ad-a105-345e0b5928dd'::uuid)
WITH CHECK (auth.uid() IS NOT DISTINCT FROM '76320352-4c29-42ad-a105-345e0b5928dd'::uuid);

-- Policies for sale_request_images
CREATE POLICY "Admin full access on sale_request_images"
ON public.sale_request_images
AS PERMISSIVE
FOR ALL
TO authenticated
USING (auth.uid() IS NOT DISTINCT FROM '76320352-4c29-42ad-a105-345e0b5928dd'::uuid)
WITH CHECK (auth.uid() IS NOT DISTINCT FROM '76320352-4c29-42ad-a105-345e0b5928dd'::uuid);
