-- Migration 062: Wanted devices request system ("Avísame cuando entre")

CREATE TABLE public.wanted_devices (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_name text NOT NULL CHECK (trim(customer_name) <> ''),
    phone text NOT NULL CHECK (trim(phone) <> ''),
    category text NULL CHECK (category IS NULL OR trim(category) <> ''),
    brand text NULL CHECK (brand IS NULL OR trim(brand) <> ''),
    model text NOT NULL CHECK (trim(model) <> ''),
    storage text NULL CHECK (storage IS NULL OR trim(storage) <> ''),
    color text NULL CHECK (color IS NULL OR trim(color) <> ''),
    max_budget numeric NULL CHECK (max_budget IS NULL OR max_budget > 0),
    notes text NULL,
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'found', 'closed')),
    source text NOT NULL CHECK (source IN ('home', 'stock', 'iphone_stock')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Trigger for updated_at
CREATE TRIGGER set_wanted_devices_updated_at
BEFORE UPDATE ON public.wanted_devices
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- Indexes
CREATE INDEX idx_wanted_devices_status ON public.wanted_devices(status);
CREATE INDEX idx_wanted_devices_created_at ON public.wanted_devices(created_at DESC);
CREATE INDEX idx_wanted_devices_model ON public.wanted_devices(model);
CREATE INDEX idx_wanted_devices_source ON public.wanted_devices(source);

-- RLS
ALTER TABLE public.wanted_devices ENABLE ROW LEVEL SECURITY;

-- Revoke all permissions from public/anon
REVOKE ALL ON public.wanted_devices FROM public, anon;

-- Grant permissions to authenticated
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wanted_devices TO authenticated;

-- Admin full access policy using existing project Admin UUID
CREATE POLICY "Admin full access on wanted_devices"
ON public.wanted_devices
AS PERMISSIVE
FOR ALL
TO authenticated
USING (auth.uid() IS NOT DISTINCT FROM '76320352-4c29-42ad-a105-345e0b5928dd'::uuid)
WITH CHECK (auth.uid() IS NOT DISTINCT FROM '76320352-4c29-42ad-a105-345e0b5928dd'::uuid);

