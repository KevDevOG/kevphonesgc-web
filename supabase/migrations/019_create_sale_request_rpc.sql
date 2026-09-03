CREATE OR REPLACE FUNCTION public.create_public_sale_request(
    p_category text,
    p_model_id uuid,
    p_storage text,
    p_color text,
    p_battery_health integer,
    p_battery_cycles integer,
    p_device_condition text,
    p_has_box boolean,
    p_has_cable boolean,
    p_has_invoice boolean,
    p_original_parts boolean,
    p_fully_functional boolean,
    p_blocked boolean,
    p_official_warranty_until date,
    p_customer_name text,
    p_customer_phone text,
    p_customer_location text,
    p_notes text,
    p_source text
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
    v_clean_name text;
    v_clean_phone text;
    v_clean_location text;
    v_clean_storage text;
    v_clean_color text;
    v_clean_notes text;
    v_clean_source text;
    v_model record;
    v_has_storage_variants boolean;
    v_storage_variant_valid boolean;
    v_has_color_variants boolean;
    v_color_variant_valid boolean;
    v_clean_battery_health integer;
    v_clean_battery_cycles integer;
    v_new_id uuid;
BEGIN
    -- 1. Normalization & Customer Validation
    v_clean_name := trim(p_customer_name);
    v_clean_phone := trim(p_customer_phone);
    
    IF v_clean_name IS NULL OR v_clean_name = '' OR v_clean_phone IS NULL OR v_clean_phone = '' THEN
        RAISE EXCEPTION 'Datos del cliente incompletos';
    END IF;

    v_clean_location := NULLIF(trim(p_customer_location), '');
    v_clean_storage := NULLIF(trim(p_storage), '');
    v_clean_color := NULLIF(trim(p_color), '');
    v_clean_notes := NULLIF(trim(p_notes), '');
    v_clean_source := NULLIF(trim(p_source), '');

    -- 2. Phone Abuse Guard
    IF EXISTS (
        SELECT 1 FROM public.sale_requests
        WHERE customer_phone = v_clean_phone
        AND created_at >= now() - interval '2 minutes'
    ) THEN
        RAISE EXCEPTION 'Ya existe una solicitud reciente con este teléfono';
    END IF;

    -- 3. Category Validation
    IF p_category IS NULL
       OR p_category NOT IN ('iphone', 'ps5', 'nintendo_switch')
    THEN
        RAISE EXCEPTION 'Categoría no válida';
    END IF;

    -- 4. Model Validation
    IF p_model_id IS NULL THEN
        RAISE EXCEPTION 'Modelo no válido';
    END IF;

    SELECT * INTO v_model 
    FROM public.device_models
    WHERE id = p_model_id AND active = true
    FOR SHARE; -- lock for read

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Modelo no válido';
    END IF;

    IF v_model.category <> p_category THEN
        RAISE EXCEPTION 'El modelo no pertenece a la categoría seleccionada';
    END IF;

    -- 5. Storage Variant Validation
    SELECT EXISTS (
        SELECT 1 FROM public.device_model_variants
        WHERE model_id = p_model_id AND variant_type = 'storage' AND active = true
    ) INTO v_has_storage_variants;

    IF v_has_storage_variants THEN
        IF v_clean_storage IS NULL THEN
            RAISE EXCEPTION 'Almacenamiento no válido';
        END IF;
        
        SELECT EXISTS (
            SELECT 1 FROM public.device_model_variants
            WHERE model_id = p_model_id AND variant_type = 'storage' AND active = true AND value = v_clean_storage
        ) INTO v_storage_variant_valid;

        IF NOT v_storage_variant_valid THEN
            RAISE EXCEPTION 'Almacenamiento no válido';
        END IF;
    ELSE
        v_clean_storage := NULL;
    END IF;

    -- 6. Color Variant Validation
    SELECT EXISTS (
        SELECT 1 FROM public.device_model_variants
        WHERE model_id = p_model_id AND variant_type = 'color' AND active = true
    ) INTO v_has_color_variants;

    IF v_has_color_variants THEN
        IF v_clean_color IS NULL THEN
            RAISE EXCEPTION 'Color no válido';
        END IF;
        
        SELECT EXISTS (
            SELECT 1 FROM public.device_model_variants
            WHERE model_id = p_model_id AND variant_type = 'color' AND active = true AND value = v_clean_color
        ) INTO v_color_variant_valid;

        IF NOT v_color_variant_valid THEN
            RAISE EXCEPTION 'Color no válido';
        END IF;
    ELSE
        v_clean_color := NULL;
    END IF;

    -- 7. Device Condition Validation
    IF p_device_condition IS NULL
       OR p_device_condition NOT IN ('sealed', 'like_new', 'good', 'marked')
    THEN
        RAISE EXCEPTION 'Condición del dispositivo no válida';
    END IF;

    -- 8. Battery Health Validation
    IF NOT COALESCE(v_model.supports_battery_health, false) THEN
        v_clean_battery_health := NULL;
    ELSE
        IF p_device_condition = 'sealed' AND p_battery_health IS NULL THEN
            v_clean_battery_health := NULL;
        ELSE
            IF p_battery_health IS NOT NULL AND (p_battery_health < 0 OR p_battery_health > 100) THEN
                RAISE EXCEPTION 'Salud de batería no válida';
            END IF;
            v_clean_battery_health := p_battery_health;
        END IF;
    END IF;

    -- 9. Battery Cycles Validation
    IF NOT COALESCE(v_model.supports_cycles, false) THEN
        v_clean_battery_cycles := NULL;
    ELSE
        IF p_battery_cycles IS NOT NULL AND p_battery_cycles < 0 THEN
            RAISE EXCEPTION 'Ciclos de batería no válidos';
        END IF;
        v_clean_battery_cycles := p_battery_cycles;
    END IF;

    -- 10. Source Validation
    IF v_clean_source IS NOT NULL AND v_clean_source NOT IN ('instagram', 'tiktok', 'google', 'direct', 'other') THEN
        RAISE EXCEPTION 'Origen no válido';
    END IF;

    -- 11. Insert Data
    INSERT INTO public.sale_requests (
        category,
        model_id,
        storage,
        color,
        battery_health,
        battery_cycles,
        device_condition,
        has_box,
        has_cable,
        has_invoice,
        original_parts,
        fully_functional,
        blocked,
        official_warranty_until,
        estimated_min,
        estimated_max,
        customer_name,
        customer_phone,
        customer_location,
        notes,
        status,
        source
    ) VALUES (
        p_category,
        p_model_id,
        v_clean_storage,
        v_clean_color,
        v_clean_battery_health,
        v_clean_battery_cycles,
        p_device_condition,
        COALESCE(p_has_box, false),
        COALESCE(p_has_cable, false),
        COALESCE(p_has_invoice, false),
        COALESCE(p_original_parts, true),
        COALESCE(p_fully_functional, true),
        COALESCE(p_blocked, false),
        p_official_warranty_until,
        NULL, -- estimated_min
        NULL, -- estimated_max
        v_clean_name,
        v_clean_phone,
        v_clean_location,
        v_clean_notes,
        'new', -- forced status
        v_clean_source
    ) RETURNING id INTO v_new_id;

    RETURN v_new_id;
END;
$$;

-- Security / Privileges
REVOKE ALL ON FUNCTION public.create_public_sale_request(text, uuid, text, text, integer, integer, text, boolean, boolean, boolean, boolean, boolean, boolean, date, text, text, text, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_public_sale_request(text, uuid, text, text, integer, integer, text, boolean, boolean, boolean, boolean, boolean, boolean, date, text, text, text, text, text) FROM anon;
REVOKE ALL ON FUNCTION public.create_public_sale_request(text, uuid, text, text, integer, integer, text, boolean, boolean, boolean, boolean, boolean, boolean, date, text, text, text, text, text) FROM authenticated;

GRANT EXECUTE ON FUNCTION public.create_public_sale_request(text, uuid, text, text, integer, integer, text, boolean, boolean, boolean, boolean, boolean, boolean, date, text, text, text, text, text) TO service_role;
