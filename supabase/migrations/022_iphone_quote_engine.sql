-- These base prices represent the MAXIMUM normal purchase valuation
-- for the model + storage assuming IDEAL CONDITION (like_new, 100% battery, all accessories, etc).
CREATE TABLE public.iphone_quote_base_prices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id uuid NOT NULL REFERENCES public.device_models(id) ON DELETE CASCADE,
  storage text NOT NULL CHECK (storage = trim(storage) AND storage <> ''),
  min_price numeric(10,2) NOT NULL CHECK (min_price >= 0),
  max_price numeric(10,2) NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT iphone_quote_base_prices_max_check CHECK (max_price >= min_price),
  UNIQUE (model_id, storage)
);

CREATE TRIGGER set_iphone_quote_base_prices_updated_at
  BEFORE UPDATE ON public.iphone_quote_base_prices
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Create table: iphone_quote_adjustments
CREATE TABLE public.iphone_quote_adjustments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id uuid REFERENCES public.device_models(id) ON DELETE CASCADE,
  rule_type text NOT NULL CHECK (rule_type IN ('condition', 'battery', 'color', 'box', 'cable', 'invoice', 'warranty', 'cycles')),
  rule_key text NOT NULL CHECK (rule_key = trim(rule_key) AND rule_key <> ''),
  min_delta numeric(10,2) NOT NULL DEFAULT 0 CHECK (min_delta <= 0),
  max_delta numeric(10,2) NOT NULL DEFAULT 0 CHECK (max_delta <= 0),
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT iphone_quote_adjustments_delta_check CHECK (min_delta <= max_delta)
);

CREATE UNIQUE INDEX idx_iphone_quote_adjustments_global 
ON public.iphone_quote_adjustments(rule_type, rule_key) 
WHERE model_id IS NULL;

CREATE UNIQUE INDEX idx_iphone_quote_adjustments_model 
ON public.iphone_quote_adjustments(model_id, rule_type, rule_key) 
WHERE model_id IS NOT NULL;

CREATE TRIGGER set_iphone_quote_adjustments_updated_at
  BEFORE UPDATE ON public.iphone_quote_adjustments
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Standard rule seeds
INSERT INTO public.iphone_quote_adjustments (rule_type, rule_key, sort_order) VALUES
  ('condition', 'sealed', 10),
  ('condition', 'like_new', 20),
  ('condition', 'good', 30),
  ('condition', 'marked', 40),

  ('battery', '100', 10),
  ('battery', '95_99', 20),
  ('battery', '90_94', 30),
  ('battery', '85_89', 40),
  ('battery', '80_84', 50),
  ('battery', 'under_80', 60),

  ('box', 'no', 10),
  ('cable', 'no', 10),
  ('invoice', 'no', 10),
  ('warranty', 'no', 10),

  ('cycles', '0_50', 10),
  ('cycles', '51_150', 20),
  ('cycles', '151_300', 30),
  ('cycles', '301_plus', 40)
ON CONFLICT (rule_type, rule_key) WHERE model_id IS NULL DO NOTHING;

-- Create table: iphone_quotes
CREATE TABLE public.iphone_quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_mode text NOT NULL CHECK (quote_mode IN ('sell', 'trade_in')),
  model_id uuid NOT NULL REFERENCES public.device_models(id),
  storage text NOT NULL CHECK (storage = trim(storage) AND storage <> ''),
  color text,
  battery_health integer CHECK (battery_health IS NULL OR (battery_health >= 0 AND battery_health <= 100)),
  battery_cycles integer CHECK (battery_cycles IS NULL OR battery_cycles >= 0),
  device_condition text NOT NULL CHECK (device_condition IN ('sealed', 'like_new', 'good', 'marked')),
  has_box boolean NOT NULL,
  has_cable boolean NOT NULL,
  has_invoice boolean NOT NULL,
  original_parts boolean NOT NULL,
  fully_functional boolean NOT NULL,
  blocked boolean NOT NULL,
  official_warranty_until date,
  estimated_min numeric(10,2) NOT NULL CHECK (estimated_min >= 0),
  estimated_max numeric(10,2) NOT NULL,
  target_device_id uuid REFERENCES public.devices(id) ON DELETE RESTRICT,
  target_listing_price_snapshot numeric(10,2),
  source text CHECK (source IS NULL OR source IN ('instagram', 'tiktok', 'google', 'direct', 'other')),
  created_at timestamptz NOT NULL DEFAULT now(),
  
  CONSTRAINT iphone_quotes_estimated_check CHECK (estimated_max >= estimated_min),
  CONSTRAINT iphone_quotes_target_check CHECK (
    (quote_mode = 'sell' AND target_device_id IS NULL AND target_listing_price_snapshot IS NULL) OR
    (quote_mode = 'trade_in' AND target_device_id IS NOT NULL AND target_listing_price_snapshot IS NOT NULL AND target_listing_price_snapshot >= 0)
  )
);

-- Indexes
CREATE INDEX idx_iphone_quote_base_prices_model_active ON public.iphone_quote_base_prices(model_id, active);
CREATE INDEX idx_iphone_quote_adjustments_model_type_active ON public.iphone_quote_adjustments(model_id, rule_type, active);
CREATE INDEX idx_iphone_quotes_created_desc ON public.iphone_quotes(created_at DESC);
CREATE INDEX idx_iphone_quotes_model_id ON public.iphone_quotes(model_id);
CREATE INDEX idx_iphone_quotes_quote_mode ON public.iphone_quotes(quote_mode);
CREATE INDEX idx_iphone_quotes_target_device ON public.iphone_quotes(target_device_id);

-- RLS Configuration
ALTER TABLE public.iphone_quote_base_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.iphone_quote_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.iphone_quotes ENABLE ROW LEVEL SECURITY;

-- Privileges
REVOKE ALL ON public.iphone_quote_base_prices FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.iphone_quote_adjustments FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.iphone_quotes FROM PUBLIC, anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.iphone_quote_base_prices TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.iphone_quote_adjustments TO authenticated;
GRANT SELECT ON public.iphone_quotes TO authenticated;

REVOKE ALL ON public.iphone_quote_base_prices FROM service_role;
REVOKE ALL ON public.iphone_quote_adjustments FROM service_role;
REVOKE ALL ON public.iphone_quotes FROM service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.iphone_quote_base_prices TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.iphone_quote_adjustments TO service_role;
GRANT SELECT, INSERT ON public.iphone_quotes TO service_role;

-- Policies for iphone_quote_base_prices
CREATE POLICY "Admin full access on iphone_quote_base_prices"
ON public.iphone_quote_base_prices
AS PERMISSIVE
FOR ALL
TO authenticated
USING (auth.uid() IS NOT DISTINCT FROM '76320352-4c29-42ad-a105-345e0b5928dd'::uuid)
WITH CHECK (auth.uid() IS NOT DISTINCT FROM '76320352-4c29-42ad-a105-345e0b5928dd'::uuid);

-- Policies for iphone_quote_adjustments
CREATE POLICY "Admin full access on iphone_quote_adjustments"
ON public.iphone_quote_adjustments
AS PERMISSIVE
FOR ALL
TO authenticated
USING (auth.uid() IS NOT DISTINCT FROM '76320352-4c29-42ad-a105-345e0b5928dd'::uuid)
WITH CHECK (auth.uid() IS NOT DISTINCT FROM '76320352-4c29-42ad-a105-345e0b5928dd'::uuid);

-- Policies for iphone_quotes
CREATE POLICY "Admin select access on iphone_quotes"
ON public.iphone_quotes
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT DISTINCT FROM '76320352-4c29-42ad-a105-345e0b5928dd'::uuid);
