-- 1. Create sales table
CREATE TABLE sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id uuid NOT NULL,
  buyer_client_id uuid,
  final_sale_price numeric(10,2) NOT NULL,
  sold_at date NOT NULL DEFAULT current_date,
  sale_location text,
  observations text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  CONSTRAINT sales_device_id_fkey FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE RESTRICT,
  CONSTRAINT sales_device_id_key UNIQUE (device_id),
  CONSTRAINT sales_buyer_client_id_fkey FOREIGN KEY (buyer_client_id) REFERENCES clients(id) ON DELETE SET NULL,
  CONSTRAINT sales_final_sale_price_check CHECK (final_sale_price >= 0)
);

-- Indexes
CREATE INDEX sales_buyer_client_id_idx ON sales(buyer_client_id);
CREATE INDEX sales_sold_at_idx ON sales(sold_at);

-- 2. Trigger for updated_at
DROP TRIGGER IF EXISTS set_sales_updated_at ON sales;
CREATE TRIGGER set_sales_updated_at
  BEFORE UPDATE ON sales
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- 3. RLS Policies
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access sales"
  ON sales
  FOR ALL
  TO authenticated
  USING (auth.uid() = '76320352-4c29-42ad-a105-345e0b5928dd'::uuid)
  WITH CHECK (auth.uid() = '76320352-4c29-42ad-a105-345e0b5928dd'::uuid);

REVOKE ALL ON sales FROM PUBLIC;
REVOKE ALL ON sales FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON sales TO authenticated;

-- 4. Atomic RPC Function
CREATE OR REPLACE FUNCTION register_device_sale(
  p_device_id uuid,
  p_buyer_name text,
  p_buyer_phone text,
  p_buyer_location text,
  p_final_sale_price numeric,
  p_sold_at date,
  p_sale_location text,
  p_observations text
) RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_admin_uid uuid := '76320352-4c29-42ad-a105-345e0b5928dd'::uuid;
  v_client_id uuid;
  v_sale_id uuid;
  v_device_status text;
  v_norm_name text;
  v_norm_phone text;
  v_norm_location text;
  v_norm_sale_location text;
  v_norm_observations text;
BEGIN
  -- 4.1 Verify admin authorization
  IF auth.uid() IS NULL OR auth.uid() != v_admin_uid THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  -- 4.2 Normalize and validate inputs
  v_norm_name := btrim(p_buyer_name);
  v_norm_phone := btrim(p_buyer_phone);
  v_norm_location := btrim(p_buyer_location);
  v_norm_sale_location := btrim(p_sale_location);
  v_norm_observations := btrim(p_observations);

  IF p_device_id IS NULL THEN
    RAISE EXCEPTION 'device_id_required';
  END IF;

  IF v_norm_name IS NULL OR v_norm_name = '' THEN
    RAISE EXCEPTION 'buyer_name_required';
  END IF;

  IF v_norm_phone IS NULL OR v_norm_phone = '' THEN
    RAISE EXCEPTION 'buyer_phone_required';
  END IF;

  IF p_final_sale_price IS NULL OR p_final_sale_price < 0 THEN
    RAISE EXCEPTION 'invalid_sale_price';
  END IF;

  IF p_sold_at IS NULL THEN
    RAISE EXCEPTION 'sold_at_required';
  END IF;

  -- Nullify empty optional strings
  IF v_norm_location = '' THEN v_norm_location := NULL; END IF;
  IF v_norm_sale_location = '' THEN v_norm_sale_location := NULL; END IF;
  IF v_norm_observations = '' THEN v_norm_observations := NULL; END IF;

  -- 4.3 Lock device FOR UPDATE and check availability
  SELECT status INTO v_device_status
  FROM devices
  WHERE id = p_device_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'device_not_found';
  END IF;

  IF v_device_status != 'available' THEN
    RAISE EXCEPTION 'device_not_available';
  END IF;

  -- 4.4 Resolve or Create Client
  -- Try to insert client securely, handling conflicts if another process inserted the same phone
  INSERT INTO clients (name, phone, location)
  VALUES (v_norm_name, v_norm_phone, v_norm_location)
  ON CONFLICT (phone) DO UPDATE 
  SET 
    name = EXCLUDED.name,
    location = COALESCE(EXCLUDED.location, clients.location)
  RETURNING id INTO v_client_id;

  -- 4.5 Insert Sale
  INSERT INTO sales (
    device_id,
    buyer_client_id,
    final_sale_price,
    sold_at,
    sale_location,
    observations
  ) VALUES (
    p_device_id,
    v_client_id,
    p_final_sale_price,
    p_sold_at,
    v_norm_sale_location,
    v_norm_observations
  ) RETURNING id INTO v_sale_id;

  -- 4.6 Update Device status
  UPDATE devices
  SET status = 'sold'
  WHERE id = p_device_id;

  -- 4.7 Return new sale ID
  RETURN v_sale_id;
END;
$$;

-- 5. RPC Privileges
REVOKE ALL ON FUNCTION register_device_sale(uuid, text, text, text, numeric, date, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION register_device_sale(uuid, text, text, text, numeric, date, text, text) FROM anon;

GRANT EXECUTE ON FUNCTION register_device_sale(uuid, text, text, text, numeric, date, text, text) TO authenticated;
