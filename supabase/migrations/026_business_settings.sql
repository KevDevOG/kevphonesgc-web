-- ==========================================
-- 026_business_settings.sql
-- ==========================================


CREATE TABLE public.business_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  singleton boolean NOT NULL DEFAULT true UNIQUE,
  business_name text NOT NULL DEFAULT 'KevPhonesGC',
  whatsapp_phone text NULL,
  instagram_url text NULL,
  tiktok_url text NULL,
  contact_enabled boolean NOT NULL DEFAULT false,
  shipping_text text NULL,
  hero_title text NULL,
  hero_subtitle text NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  CONSTRAINT business_settings_singleton_check CHECK (singleton = true)
);

-- Seed exactly one row
INSERT INTO public.business_settings (
  business_name,
  whatsapp_phone,
  contact_enabled
) VALUES (
  'KevPhonesGC',
  '34600560853',
  true
);

-- Enable RLS
ALTER TABLE public.business_settings ENABLE ROW LEVEL SECURITY;

-- Grant required privileges
REVOKE ALL PRIVILEGES
ON TABLE public.business_settings
FROM anon, authenticated;

GRANT SELECT
ON TABLE public.business_settings
TO anon;

GRANT SELECT, UPDATE
ON TABLE public.business_settings
TO authenticated;

-- RLS Policies

-- Public/anon can SELECT
CREATE POLICY "Public can view business settings"
  ON public.business_settings
  FOR SELECT
  TO anon
  USING (true);

-- Authenticated can SELECT (restricted to admin)
CREATE POLICY "Admin can view business settings"
  ON public.business_settings
  FOR SELECT
  TO authenticated
  USING (auth.uid() = '76320352-4c29-42ad-a105-345e0b5928dd');

-- Authenticated can UPDATE (restricted to admin)
CREATE POLICY "Admin can update business settings"
  ON public.business_settings
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = '76320352-4c29-42ad-a105-345e0b5928dd')
  WITH CHECK (auth.uid() = '76320352-4c29-42ad-a105-345e0b5928dd');

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_business_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

REVOKE ALL ON FUNCTION public.update_business_settings_updated_at() FROM PUBLIC;

CREATE TRIGGER update_business_settings_timestamp
  BEFORE UPDATE ON public.business_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_business_settings_updated_at();
