-- 1. ADD COLUMN
ALTER TABLE devices
ADD COLUMN discount_price numeric;

-- 2. ADD CONSTRAINT
ALTER TABLE devices
ADD CONSTRAINT check_discount_price_validity
CHECK (
  discount_price IS NULL
  OR (
    discount_price > 0
    AND discount_price < listing_price
  )
);

-- 3. REDEFINE REGISTER_DEVICE
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
    p_discount_price numeric DEFAULT NULL
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
        status, internal_notes, discount_price
    ) VALUES (
        p_id, p_model_id, v_seller_client_id, p_storage, p_color, p_imei_serial,
        p_battery_health, p_battery_cycles, p_condition, p_has_box, p_has_cable,
        p_has_invoice, p_warranty_until, p_original_parts, p_fully_functional,
        p_purchase_price, p_listing_price, p_purchase_location, p_purchased_at,
        p_status, p_internal_notes, p_discount_price
    );

    RETURN p_id;
END;
$$;

-- Since the signature changed, we should drop the old one to avoid confusion (it had 23 arguments, this has 24 with the default, so they overload).
DROP FUNCTION IF EXISTS register_device(uuid, uuid, text, text, text, smallint, integer, text, boolean, boolean, boolean, date, boolean, boolean, numeric, numeric, text, date, text, text, text, text, text);

REVOKE ALL ON FUNCTION register_device(uuid, uuid, text, text, text, smallint, integer, text, boolean, boolean, boolean, date, boolean, boolean, numeric, numeric, text, date, text, text, text, text, text, numeric) FROM PUBLIC;
REVOKE ALL ON FUNCTION register_device(uuid, uuid, text, text, text, smallint, integer, text, boolean, boolean, boolean, date, boolean, boolean, numeric, numeric, text, date, text, text, text, text, text, numeric) FROM anon;
GRANT EXECUTE ON FUNCTION register_device(uuid, uuid, text, text, text, smallint, integer, text, boolean, boolean, boolean, date, boolean, boolean, numeric, numeric, text, date, text, text, text, text, text, numeric) TO authenticated;


-- 4. REDEFINE UPDATE_DEVICE
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
    p_discount_price numeric DEFAULT NULL
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
        discount_price = p_discount_price
    WHERE id = p_id;

    RETURN p_id;
END;
$$;

DROP FUNCTION IF EXISTS update_device(uuid, uuid, text, text, text, smallint, integer, text, boolean, boolean, boolean, date, boolean, boolean, numeric, numeric, text, date, text, text, text, text);

REVOKE ALL ON FUNCTION update_device(uuid, uuid, text, text, text, smallint, integer, text, boolean, boolean, boolean, date, boolean, boolean, numeric, numeric, text, date, text, text, text, text, numeric) FROM PUBLIC;
REVOKE ALL ON FUNCTION update_device(uuid, uuid, text, text, text, smallint, integer, text, boolean, boolean, boolean, date, boolean, boolean, numeric, numeric, text, date, text, text, text, text, numeric) FROM anon;
GRANT EXECUTE ON FUNCTION update_device(uuid, uuid, text, text, text, smallint, integer, text, boolean, boolean, boolean, date, boolean, boolean, numeric, numeric, text, date, text, text, text, text, numeric) TO authenticated;
