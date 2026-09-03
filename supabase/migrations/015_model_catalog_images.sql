CREATE TABLE public.device_model_catalog_images (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    model_id uuid NOT NULL REFERENCES public.device_models(id) ON DELETE CASCADE,
    color text NOT NULL CHECK (trim(color) <> ''),
    storage_path text NOT NULL CHECK (trim(storage_path) <> ''),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE(model_id, color)
);

CREATE TRIGGER handle_updated_at
BEFORE UPDATE ON public.device_model_catalog_images
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.device_model_catalog_images ENABLE ROW LEVEL SECURITY;

-- Admin full access
CREATE POLICY "Admin full access on device_model_catalog_images"
ON public.device_model_catalog_images
FOR ALL
TO authenticated
USING (auth.uid() IS NOT DISTINCT FROM '76320352-4c29-42ad-a105-345e0b5928dd'::uuid)
WITH CHECK (auth.uid() IS NOT DISTINCT FROM '76320352-4c29-42ad-a105-345e0b5928dd'::uuid);

-- Public read access
CREATE POLICY "Public read access on device_model_catalog_images"
ON public.device_model_catalog_images
FOR SELECT
TO public
USING (true);

-- Privileges
GRANT SELECT ON public.device_model_catalog_images TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.device_model_catalog_images TO authenticated;
GRANT ALL ON public.device_model_catalog_images TO service_role;
