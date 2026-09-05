-- 1. update_trade_in_operation
CREATE OR REPLACE FUNCTION update_trade_in_operation(
  p_trade_in_id uuid,
  p_final_sale_price numeric,
  p_received_purchase_price numeric,
  p_received_listing_price numeric,
  p_operation_date date,
  p_sale_location text,
  p_purchase_location text,
  p_sale_observations text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_norm_sale_location text;
    v_norm_purchase_location text;
    v_norm_sale_observations text;
    v_sale_id uuid;
    v_outgoing_device_id uuid;
    v_received_device_id uuid;
    v_outgoing_status text;
    v_received_status text;
BEGIN
    -- 1. Auth Check
    IF auth.uid() IS DISTINCT FROM '76320352-4c29-42ad-a105-345e0b5928dd'::uuid THEN
        RAISE EXCEPTION 'No autorizado';
    END IF;

    -- 2. Validation
    IF p_trade_in_id IS NULL THEN
        RAISE EXCEPTION 'ID de operación es requerido';
    END IF;

    IF p_final_sale_price IS NULL OR p_final_sale_price < 0 THEN
        RAISE EXCEPTION 'El precio de venta no es válido';
    END IF;

    IF p_received_purchase_price IS NULL OR p_received_purchase_price < 0 THEN
        RAISE EXCEPTION 'El precio de compra no es válido';
    END IF;
    
    IF p_received_listing_price IS NULL OR p_received_listing_price < 0 THEN
        RAISE EXCEPTION 'El precio de publicación no es válido';
    END IF;

    IF p_operation_date IS NULL THEN
        RAISE EXCEPTION 'La fecha de operación es obligatoria';
    END IF;

    -- Normalize strings
    v_norm_sale_location := btrim(p_sale_location);
    IF v_norm_sale_location = '' THEN v_norm_sale_location := NULL; END IF;

    v_norm_purchase_location := btrim(p_purchase_location);
    IF v_norm_purchase_location = '' THEN v_norm_purchase_location := NULL; END IF;

    v_norm_sale_observations := btrim(p_sale_observations);
    IF v_norm_sale_observations = '' THEN v_norm_sale_observations := NULL; END IF;

    -- 3. Lock trade_in_operations
    SELECT sale_id, received_device_id
    INTO v_sale_id, v_received_device_id
    FROM public.trade_in_operations
    WHERE id = p_trade_in_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Operación de parte de pago no encontrada';
    END IF;

    -- 4. Lock sale and get outgoing device id
    SELECT device_id INTO v_outgoing_device_id
    FROM public.sales
    WHERE id = v_sale_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Venta original no encontrada';
    END IF;

    -- 5. Lock devices
    SELECT status INTO v_outgoing_status
    FROM public.devices
    WHERE id = v_outgoing_device_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Dispositivo saliente no encontrado';
    END IF;

    SELECT status INTO v_received_status
    FROM public.devices
    WHERE id = v_received_device_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Dispositivo recibido no encontrado';
    END IF;

    -- 6. Validate statuses
    IF v_outgoing_status IS DISTINCT FROM 'sold' THEN
        RAISE EXCEPTION 'El dispositivo saliente no está marcado como vendido';
    END IF;

    IF v_received_status IS DISTINCT FROM 'available' THEN
        RAISE EXCEPTION 'trade_in_received_device_not_available';
    END IF;

    -- 7. Update Sales
    UPDATE public.sales
    SET final_sale_price = p_final_sale_price,
        sold_at = p_operation_date,
        sale_location = v_norm_sale_location,
        observations = v_norm_sale_observations
    WHERE id = v_sale_id;

    -- 8. Update Received Device
    UPDATE public.devices
    SET purchase_price = p_received_purchase_price,
        listing_price = p_received_listing_price,
        purchased_at = p_operation_date,
        purchase_location = v_norm_purchase_location
    WHERE id = v_received_device_id;

    RETURN p_trade_in_id;
END;
$$;


-- 2. cancel_trade_in_operation
CREATE OR REPLACE FUNCTION cancel_trade_in_operation(
  p_trade_in_id uuid
)
RETURNS TABLE (
    outgoing_device_id uuid,
    received_device_id uuid,
    sale_request_id uuid,
    received_image_paths text[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_sale_id uuid;
    v_received_device_id uuid;
    v_sale_request_id uuid;
    v_outgoing_device_id uuid;
    v_outgoing_status text;
    v_received_status text;
    v_request_status text;
    v_image_paths text[];
BEGIN
    -- 1. Auth Check
    IF auth.uid() IS DISTINCT FROM '76320352-4c29-42ad-a105-345e0b5928dd'::uuid THEN
        RAISE EXCEPTION 'No autorizado';
    END IF;

    IF p_trade_in_id IS NULL THEN
        RAISE EXCEPTION 'ID de operación es requerido';
    END IF;

    -- 2. Lock trade_in_operations
    SELECT sale_id, t.received_device_id, t.sale_request_id
    INTO v_sale_id, v_received_device_id, v_sale_request_id
    FROM public.trade_in_operations t
    WHERE t.id = p_trade_in_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Operación de parte de pago no encontrada';
    END IF;

    -- 3. Lock sale
    SELECT device_id INTO v_outgoing_device_id
    FROM public.sales
    WHERE id = v_sale_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Venta original no encontrada';
    END IF;

    -- 4. Lock devices
    SELECT status INTO v_outgoing_status
    FROM public.devices
    WHERE id = v_outgoing_device_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Dispositivo saliente no encontrado';
    END IF;

    SELECT status INTO v_received_status
    FROM public.devices
    WHERE id = v_received_device_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Dispositivo recibido no encontrado';
    END IF;

    -- 5. Lock sale_request if present
    IF v_sale_request_id IS NOT NULL THEN
        SELECT status INTO v_request_status
        FROM public.sale_requests
        WHERE id = v_sale_request_id
        FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Solicitud vinculada no encontrada';
        END IF;
    END IF;

    -- 6. Validations
    IF v_outgoing_status IS DISTINCT FROM 'sold' THEN
        RAISE EXCEPTION 'El dispositivo saliente no está marcado como vendido';
    END IF;

    IF v_received_status IS DISTINCT FROM 'available' THEN
        RAISE EXCEPTION 'trade_in_received_device_already_sold';
    END IF;

    IF EXISTS (SELECT 1 FROM public.sales WHERE device_id = v_received_device_id) THEN
        RAISE EXCEPTION 'trade_in_received_device_already_sold';
    END IF;

    IF v_sale_request_id IS NOT NULL AND v_request_status IS DISTINCT FROM 'purchased' THEN
        RAISE EXCEPTION 'trade_in_request_state_invalid';
    END IF;

    -- 7. Collect image paths
    SELECT array_remove(array_agg(storage_path), NULL)
    INTO v_image_paths
    FROM public.device_images
    WHERE device_id = v_received_device_id;

    IF v_image_paths IS NULL THEN
        v_image_paths := ARRAY[]::text[];
    END IF;

    -- 8. Cancel Operation
    -- a) Delete trade_in_operations
    DELETE FROM public.trade_in_operations WHERE id = p_trade_in_id;
    
    -- b) Delete outgoing sales row
    DELETE FROM public.sales WHERE id = v_sale_id;

    -- c) Restore outgoing device status
    UPDATE public.devices SET status = 'available' WHERE id = v_outgoing_device_id;

    -- d) Restore sale request if exists
    IF v_sale_request_id IS NOT NULL THEN
        UPDATE public.sale_requests SET status = 'in_progress' WHERE id = v_sale_request_id;
    END IF;

    -- e) Delete received device (cascades to device_images)
    DELETE FROM public.devices WHERE id = v_received_device_id;

    -- 9. Return collected info
    RETURN QUERY SELECT 
        v_outgoing_device_id, 
        v_received_device_id, 
        v_sale_request_id, 
        v_image_paths;
END;
$$;

-- Revoke and Grant Permissions
REVOKE ALL ON FUNCTION public.update_trade_in_operation(
  uuid, numeric, numeric, numeric, date, text, text, text
) FROM PUBLIC;

REVOKE ALL ON FUNCTION public.update_trade_in_operation(
  uuid, numeric, numeric, numeric, date, text, text, text
) FROM anon;

GRANT EXECUTE ON FUNCTION public.update_trade_in_operation(
  uuid, numeric, numeric, numeric, date, text, text, text
) TO authenticated;

REVOKE ALL ON FUNCTION public.cancel_trade_in_operation(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.cancel_trade_in_operation(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.cancel_trade_in_operation(uuid) TO authenticated;
