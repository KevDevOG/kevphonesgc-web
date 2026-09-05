-- 1. Create trade_in_operations table
CREATE TABLE public.trade_in_operations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id uuid NOT NULL REFERENCES public.sales(id) ON DELETE RESTRICT,
    received_device_id uuid NOT NULL REFERENCES public.devices(id) ON DELETE RESTRICT,
    sale_request_id uuid NULL REFERENCES public.sale_requests(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE(sale_id),
    UNIQUE(received_device_id)
);

CREATE UNIQUE INDEX idx_trade_in_operations_request_id ON public.trade_in_operations(sale_request_id) WHERE sale_request_id IS NOT NULL;

-- 2. RLS for trade_in_operations
ALTER TABLE public.trade_in_operations ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.trade_in_operations FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT ON public.trade_in_operations TO authenticated;

CREATE POLICY "Admin select trade_in_operations" ON public.trade_in_operations
    FOR SELECT
    TO authenticated
    USING (auth.uid() = '76320352-4c29-42ad-a105-345e0b5928dd'::uuid);

CREATE POLICY "Admin insert trade_in_operations" ON public.trade_in_operations
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = '76320352-4c29-42ad-a105-345e0b5928dd'::uuid);

-- 3. Protect generic update_device_sale and cancel_device_sale
CREATE OR REPLACE FUNCTION update_device_sale(
    p_sale_id uuid,
    p_buyer_name text,
    p_buyer_phone text,
    p_buyer_location text,
    p_final_sale_price numeric,
    p_sold_at date,
    p_sale_location text,
    p_observations text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
    v_norm_buyer_name text;
    v_norm_buyer_phone text;
    v_norm_buyer_location text;
    v_norm_sale_location text;
    v_norm_observations text;
    v_device_id uuid;
    v_buyer_client_id uuid;
    v_device_status text;
BEGIN
    -- Auth check
    IF auth.uid() IS DISTINCT FROM '76320352-4c29-42ad-a105-345e0b5928dd'::uuid THEN
        RAISE EXCEPTION 'No autorizado';
    END IF;

    -- Trade-in protection
    IF EXISTS (SELECT 1 FROM public.trade_in_operations WHERE sale_id = p_sale_id) THEN
        RAISE EXCEPTION 'trade_in_requires_dedicated_flow';
    END IF;

    -- Validation
    IF p_sale_id IS NULL THEN
        RAISE EXCEPTION 'ID de venta es requerido';
    END IF;

    v_norm_buyer_name := trim(p_buyer_name);
    v_norm_buyer_phone := trim(p_buyer_phone);
    
    IF v_norm_buyer_name IS NULL
       OR v_norm_buyer_name = ''
       OR v_norm_buyer_phone IS NULL
       OR v_norm_buyer_phone = ''
    THEN
        RAISE EXCEPTION 'Nombre y teléfono del comprador son obligatorios';
    END IF;

    IF p_final_sale_price IS NULL OR p_final_sale_price < 0 THEN
        RAISE EXCEPTION 'El precio final de venta no es válido';
    END IF;

    IF p_sold_at IS NULL THEN
        RAISE EXCEPTION 'La fecha de venta es obligatoria';
    END IF;

    -- Normalize optional strings
    v_norm_buyer_location := trim(p_buyer_location);
    IF v_norm_buyer_location = '' THEN
        v_norm_buyer_location := NULL;
    END IF;

    v_norm_sale_location := trim(p_sale_location);
    IF v_norm_sale_location = '' THEN
        v_norm_sale_location := NULL;
    END IF;

    v_norm_observations := trim(p_observations);
    IF v_norm_observations = '' THEN
        v_norm_observations := NULL;
    END IF;

    -- Lock sale row and get device_id
    SELECT device_id INTO v_device_id
    FROM sales
    WHERE id = p_sale_id
    FOR UPDATE;

    IF v_device_id IS NULL THEN
        RAISE EXCEPTION 'Venta no encontrada';
    END IF;

    -- Check device status
    SELECT status INTO v_device_status
    FROM devices
    WHERE id = v_device_id
    FOR UPDATE;

    IF v_device_status IS DISTINCT FROM 'sold' THEN
        RAISE EXCEPTION 'El dispositivo no está marcado como vendido';
    END IF;

    -- Buyer client logic
    INSERT INTO clients (name, phone, location)
    VALUES (v_norm_buyer_name, v_norm_buyer_phone, v_norm_buyer_location)
    ON CONFLICT (phone) DO UPDATE 
    SET 
        name = EXCLUDED.name,
        location = COALESCE(EXCLUDED.location, clients.location),
        updated_at = now()
    RETURNING id INTO v_buyer_client_id;

    -- Update sale
    UPDATE sales
    SET 
        buyer_client_id = v_buyer_client_id,
        final_sale_price = p_final_sale_price,
        sold_at = p_sold_at,
        sale_location = v_norm_sale_location,
        observations = v_norm_observations,
        updated_at = now()
    WHERE id = p_sale_id;

    RETURN p_sale_id;
END;
$$;

CREATE OR REPLACE FUNCTION cancel_device_sale(
    p_sale_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
    v_device_id uuid;
    v_device_status text;
BEGIN
    -- Auth check
    IF auth.uid() IS DISTINCT FROM '76320352-4c29-42ad-a105-345e0b5928dd'::uuid THEN
        RAISE EXCEPTION 'No autorizado';
    END IF;

    -- Trade-in protection
    IF EXISTS (SELECT 1 FROM public.trade_in_operations WHERE sale_id = p_sale_id) THEN
        RAISE EXCEPTION 'trade_in_requires_dedicated_flow';
    END IF;

    -- Lock sale and get device_id
    SELECT device_id INTO v_device_id
    FROM sales
    WHERE id = p_sale_id
    FOR UPDATE;

    IF v_device_id IS NULL THEN
        RAISE EXCEPTION 'Venta no encontrada';
    END IF;

    -- Lock device and check status
    SELECT status INTO v_device_status
    FROM devices
    WHERE id = v_device_id
    FOR UPDATE;

    IF v_device_status IS DISTINCT FROM 'sold' THEN
        RAISE EXCEPTION 'El dispositivo no está marcado como vendido';
    END IF;

    -- Delete sale
    DELETE FROM sales
    WHERE id = p_sale_id;

    -- Update device status to available
    UPDATE devices
    SET 
        status = 'available',
        updated_at = now()
    WHERE id = v_device_id;

    RETURN v_device_id;
END;
$$;

-- 4. Create register_trade_in RPC
CREATE OR REPLACE FUNCTION register_trade_in(
  -- Target Device (Sale)
  p_target_device_id uuid,
  p_final_sale_price numeric,
  p_sold_at date,
  p_sale_location text,
  p_sale_observations text,
  -- Incoming Device (Purchase)
  p_model_id uuid,
  p_storage text,
  p_color text,
  p_imei_serial text,
  p_battery_health smallint,
  p_battery_cycles integer,
  p_condition text,
  p_has_box boolean,
  p_has_cable boolean,
  p_has_invoice boolean,
  p_warranty_until date,
  p_original_parts boolean,
  p_fully_functional boolean,
  p_purchase_price numeric,
  p_listing_price numeric,
  p_purchase_location text,
  p_internal_notes text,
  -- Customer / Request
  p_customer_name text,
  p_customer_phone text,
  p_customer_location text,
  p_sale_request_id uuid DEFAULT NULL
) RETURNS TABLE (
  trade_in_id uuid,
  sale_id uuid,
  received_device_id uuid
)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_admin_uid uuid := '76320352-4c29-42ad-a105-345e0b5928dd'::uuid;
  v_request public.sale_requests%ROWTYPE;
  v_quote public.iphone_quotes%ROWTYPE;
  v_received_device_id uuid := gen_random_uuid();
  v_trade_in_id uuid := gen_random_uuid();
  v_sale_id uuid;
  v_actual_customer_name text := trim(p_customer_name);
  v_actual_customer_phone text := trim(p_customer_phone);
  v_actual_customer_location text := trim(p_customer_location);
BEGIN
  -- A. Auth check
  IF auth.uid() IS DISTINCT FROM v_admin_uid THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;

  -- B & H. Lock and validate sale_request early if provided
  IF p_sale_request_id IS NOT NULL THEN
    SELECT * INTO v_request
    FROM public.sale_requests
    WHERE id = p_sale_request_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'La solicitud de venta no existe.';
    END IF;

    IF v_request.status NOT IN ('new', 'in_progress') THEN
      RAISE EXCEPTION 'Estado de solicitud no válido para completar compra/trade-in.';
    END IF;

    -- Request duplicate protection
    IF EXISTS (SELECT 1 FROM public.trade_in_operations WHERE sale_request_id = p_sale_request_id) THEN
      RAISE EXCEPTION 'La solicitud ya ha sido procesada en otro trade-in.';
    END IF;

    -- Customer consistency
    v_actual_customer_name := v_request.customer_name;
    v_actual_customer_phone := v_request.customer_phone;
    v_actual_customer_location := v_request.customer_location;

    -- Validate trade-in quote target if available
    IF v_request.quote_id IS NOT NULL THEN
      SELECT * INTO v_quote
      FROM public.iphone_quotes
      WHERE id = v_request.quote_id;

      IF v_quote.quote_mode = 'trade_in' AND v_quote.target_device_id IS DISTINCT FROM p_target_device_id THEN
        RAISE EXCEPTION 'El dispositivo objetivo no coincide con el de la valoración.';
      END IF;
    END IF;
  END IF;

  -- Ensure valid customer info
  IF v_actual_customer_name IS NULL 
     OR v_actual_customer_name = '' 
     OR v_actual_customer_phone IS NULL 
     OR v_actual_customer_phone = '' 
  THEN
    RAISE EXCEPTION 'Nombre y teléfono del cliente son obligatorios.';
  END IF;

  -- C & E. Sell target stock device at FULL final sale price
  -- register_device_sale naturally locks the device, checks status='available', creates/updates client, and creates sale
  v_sale_id := public.register_device_sale(
    p_target_device_id,
    v_actual_customer_name,
    v_actual_customer_phone,
    v_actual_customer_location,
    p_final_sale_price,
    p_sold_at,
    p_sale_location,
    p_sale_observations
  );

  -- F. Register incoming device at FULL purchase price
  -- register_device also creates/updates the client symmetrically
  PERFORM public.register_device(
    v_received_device_id,
    p_model_id,
    p_storage,
    p_color,
    p_imei_serial,
    p_battery_health,
    p_battery_cycles,
    p_condition,
    p_has_box,
    p_has_cable,
    p_has_invoice,
    p_warranty_until,
    p_original_parts,
    p_fully_functional,
    p_purchase_price,
    p_listing_price,
    p_purchase_location,
    p_sold_at, -- using p_sold_at as purchased_at to keep chronological consistency
    'available',
    p_internal_notes,
    v_actual_customer_name,
    v_actual_customer_phone,
    v_actual_customer_location
  );

  -- G. Insert trade_in_operations linking the two
  INSERT INTO public.trade_in_operations (
    id,
    sale_id,
    received_device_id,
    sale_request_id
  ) VALUES (
    v_trade_in_id,
    v_sale_id,
    v_received_device_id,
    p_sale_request_id
  );

  -- H (part 2). Mark sale_request purchased if supplied
  IF p_sale_request_id IS NOT NULL THEN
    UPDATE public.sale_requests
    SET 
      status = 'purchased',
      updated_at = now()
    WHERE id = p_sale_request_id;
  END IF;

  -- Return identifiers
  RETURN QUERY SELECT v_trade_in_id, v_sale_id, v_received_device_id;
END;
$$;

REVOKE ALL ON FUNCTION register_trade_in FROM PUBLIC;
REVOKE ALL ON FUNCTION register_trade_in FROM anon;
GRANT EXECUTE ON FUNCTION register_trade_in TO authenticated;
