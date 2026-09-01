-- 1. UPDATE DEVICE SALE
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


-- 2. CANCEL DEVICE SALE
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


-- Privileges
REVOKE ALL ON FUNCTION update_device_sale(uuid, text, text, text, numeric, date, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION update_device_sale(uuid, text, text, text, numeric, date, text, text) FROM anon;
GRANT EXECUTE ON FUNCTION update_device_sale(uuid, text, text, text, numeric, date, text, text) TO authenticated;

REVOKE ALL ON FUNCTION cancel_device_sale(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION cancel_device_sale(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION cancel_device_sale(uuid) TO authenticated;
