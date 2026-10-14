BEGIN;

-- 1. EXPAND DEVICE_MODELS CATEGORY CHECK CONSTRAINT
ALTER TABLE public.device_models 
DROP CONSTRAINT IF EXISTS device_models_category_check;

ALTER TABLE public.device_models 
ADD CONSTRAINT device_models_category_check 
CHECK (category IN (
    'iphone', 
    'apple_watch', 
    'airpods', 
    'macbook', 
    'ipad', 
    'ps5', 
    'nintendo_switch',
    'other'
));

-- 2. ADD CUSTOM PRODUCT COLUMNS TO DEVICES
ALTER TABLE public.devices
ADD COLUMN IF NOT EXISTS custom_product_type text NULL,
ADD COLUMN IF NOT EXISTS custom_specs jsonb NOT NULL DEFAULT '{}'::jsonb;

-- 3. UPDATE REGISTER_DEVICE RPC
-- Drop previous signature (30 arguments from migration 045)
DROP FUNCTION IF EXISTS register_device(uuid, uuid, text, text, text, smallint, integer, text, boolean, boolean, boolean, date, boolean, boolean, numeric, numeric, text, date, text, text, text, text, text, numeric, text, text, text, text, text, text);

CREATE OR REPLACE FUNCTION register_device(
    -- Device fields
    p_id uuid,
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
    p_purchased_at date,
    p_status text,
    p_internal_notes text,
    -- Seller fields
    p_seller_name text,
    p_seller_phone text,
    p_seller_location text,
    -- Discount
    p_discount_price numeric DEFAULT NULL,
    -- Apple/hardware fields
    p_size text DEFAULT NULL,
    p_connectivity text DEFAULT NULL,
    p_chip text DEFAULT NULL,
    p_memory text DEFAULT NULL,
    p_case_type text DEFAULT NULL,
    p_case_material text DEFAULT NULL,
    -- Other category fields
    p_custom_product_type text DEFAULT NULL,
    p_custom_specs jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
    v_norm_seller_name text;
    v_norm_seller_phone text;
    v_norm_seller_location text;
    v_seller_client_id uuid;
BEGIN
    IF auth.uid() IS DISTINCT FROM '76320352-4c29-42ad-a105-345e0b5928dd'::uuid THEN
        RAISE EXCEPTION 'No autorizado';
    END IF;

    v_norm_seller_name := trim(p_seller_name);
    v_norm_seller_phone := trim(p_seller_phone);
    v_norm_seller_location := trim(p_seller_location);
    IF v_norm_seller_location = '' THEN
        v_norm_seller_location := NULL;
    END IF;

    IF v_norm_seller_name IS NULL OR v_norm_seller_name = '' OR v_norm_seller_phone IS NULL OR v_norm_seller_phone = '' THEN
        RAISE EXCEPTION 'Nombre y teléfono del vendedor son obligatorios';
    END IF;

    INSERT INTO clients (name, phone, location)
    VALUES (v_norm_seller_name, v_norm_seller_phone, v_norm_seller_location)
    ON CONFLICT (phone)
    DO UPDATE SET
        name = EXCLUDED.name,
        location = COALESCE(EXCLUDED.location, clients.location)
    RETURNING id INTO v_seller_client_id;

    INSERT INTO devices (
        id, model_id, seller_client_id, storage, color, imei_serial,
        battery_health, battery_cycles, condition, has_box, has_cable,
        has_invoice, warranty_until, original_parts, fully_functional,
        purchase_price, listing_price, purchase_location, purchased_at,
        status, internal_notes, discount_price,
        size, connectivity, chip, memory, case_type, case_material,
        custom_product_type, custom_specs
    ) VALUES (
        p_id, p_model_id, v_seller_client_id, p_storage, p_color, p_imei_serial,
        p_battery_health, p_battery_cycles, p_condition, p_has_box, p_has_cable,
        p_has_invoice, p_warranty_until, p_original_parts, p_fully_functional,
        p_purchase_price, p_listing_price, p_purchase_location, p_purchased_at,
        p_status, p_internal_notes, p_discount_price,
        p_size, p_connectivity, p_chip, p_memory, p_case_type, p_case_material,
        p_custom_product_type, COALESCE(p_custom_specs, '{}'::jsonb)
    );

    RETURN p_id;
END;
$$;

REVOKE ALL ON FUNCTION register_device(uuid, uuid, text, text, text, smallint, integer, text, boolean, boolean, boolean, date, boolean, boolean, numeric, numeric, text, date, text, text, text, text, text, numeric, text, text, text, text, text, text, text, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION register_device(uuid, uuid, text, text, text, smallint, integer, text, boolean, boolean, boolean, date, boolean, boolean, numeric, numeric, text, date, text, text, text, text, text, numeric, text, text, text, text, text, text, text, jsonb) FROM anon;
GRANT EXECUTE ON FUNCTION register_device(uuid, uuid, text, text, text, smallint, integer, text, boolean, boolean, boolean, date, boolean, boolean, numeric, numeric, text, date, text, text, text, text, text, numeric, text, text, text, text, text, text, text, jsonb) TO authenticated;

-- 4. UPDATE UPDATE_DEVICE RPC
-- Drop previous signature (30 arguments from migration 045)
DROP FUNCTION IF EXISTS update_device(uuid, uuid, text, text, text, smallint, integer, text, boolean, boolean, boolean, date, boolean, boolean, numeric, numeric, text, date, text, text, text, text, numeric, text, text, text, text, text, text);

CREATE OR REPLACE FUNCTION update_device(
    p_id uuid,
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
    p_purchased_at date,
    p_internal_notes text,
    p_seller_name text,
    p_seller_phone text,
    p_seller_location text,
    p_discount_price numeric DEFAULT NULL,
    -- Apple/hardware fields
    p_size text DEFAULT NULL,
    p_connectivity text DEFAULT NULL,
    p_chip text DEFAULT NULL,
    p_memory text DEFAULT NULL,
    p_case_type text DEFAULT NULL,
    p_case_material text DEFAULT NULL,
    -- Other category fields
    p_custom_product_type text DEFAULT NULL,
    p_custom_specs jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
    v_norm_seller_name text;
    v_norm_seller_phone text;
    v_norm_seller_location text;
    v_seller_client_id uuid;
    v_device_status text;
    v_existing_client_id uuid;
BEGIN
    IF auth.uid() IS DISTINCT FROM '76320352-4c29-42ad-a105-345e0b5928dd'::uuid THEN
        RAISE EXCEPTION 'No autorizado';
    END IF;

    SELECT status INTO v_device_status
    FROM devices
    WHERE id = p_id
    FOR UPDATE;

    IF v_device_status IS NULL THEN
        RAISE EXCEPTION 'El dispositivo no existe';
    END IF;

    IF v_device_status != 'available' THEN
        RAISE EXCEPTION 'No se puede actualizar un dispositivo vendido';
    END IF;

    v_norm_seller_name := trim(p_seller_name);
    v_norm_seller_phone := trim(p_seller_phone);
    v_norm_seller_location := trim(p_seller_location);
    IF v_norm_seller_location = '' THEN
        v_norm_seller_location := NULL;
    END IF;

    IF v_norm_seller_name IS NULL OR v_norm_seller_name = '' OR v_norm_seller_phone IS NULL OR v_norm_seller_phone = '' THEN
        RAISE EXCEPTION 'Nombre y teléfono del vendedor son obligatorios';
    END IF;

    SELECT id INTO v_existing_client_id
    FROM clients
    WHERE phone = v_norm_seller_phone;

    IF v_existing_client_id IS NOT NULL THEN
        v_seller_client_id := v_existing_client_id;
    ELSE
        INSERT INTO clients (name, phone, location)
        VALUES (v_norm_seller_name, v_norm_seller_phone, v_norm_seller_location)
        RETURNING id INTO v_seller_client_id;
    END IF;

    UPDATE devices SET
        model_id = p_model_id,
        seller_client_id = v_seller_client_id,
        storage = p_storage,
        color = p_color,
        imei_serial = p_imei_serial,
        battery_health = p_battery_health,
        battery_cycles = p_battery_cycles,
        condition = p_condition,
        has_box = p_has_box,
        has_cable = p_has_cable,
        has_invoice = p_has_invoice,
        warranty_until = p_warranty_until,
        original_parts = p_original_parts,
        fully_functional = p_fully_functional,
        purchase_price = p_purchase_price,
        listing_price = p_listing_price,
        purchase_location = p_purchase_location,
        purchased_at = p_purchased_at,
        internal_notes = p_internal_notes,
        discount_price = p_discount_price,
        size = p_size,
        connectivity = p_connectivity,
        chip = p_chip,
        memory = p_memory,
        case_type = p_case_type,
        case_material = p_case_material,
        custom_product_type = p_custom_product_type,
        custom_specs = COALESCE(p_custom_specs, '{}'::jsonb)
    WHERE id = p_id;

    RETURN p_id;
END;
$$;

REVOKE ALL ON FUNCTION update_device(uuid, uuid, text, text, text, smallint, integer, text, boolean, boolean, boolean, date, boolean, boolean, numeric, numeric, text, date, text, text, text, text, numeric, text, text, text, text, text, text, text, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION update_device(uuid, uuid, text, text, text, smallint, integer, text, boolean, boolean, boolean, date, boolean, boolean, numeric, numeric, text, date, text, text, text, text, numeric, text, text, text, text, text, text, text, jsonb) FROM anon;
GRANT EXECUTE ON FUNCTION update_device(uuid, uuid, text, text, text, smallint, integer, text, boolean, boolean, boolean, date, boolean, boolean, numeric, numeric, text, date, text, text, text, text, numeric, text, text, text, text, text, text, text, jsonb) TO authenticated;

COMMIT;
