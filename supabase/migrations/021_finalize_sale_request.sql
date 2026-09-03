CREATE OR REPLACE FUNCTION public.finalize_public_sale_request(
    p_session_id uuid,
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
    p_customer_location text,
    p_notes text,
    p_source text,
    p_photos jsonb
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
    v_session record;
    v_photo jsonb;
    v_type text;
    v_path text;
    v_has_front_off boolean := false;
    v_has_front_on boolean := false;
    v_has_back boolean := false;
    v_has_right_side boolean := false;
    v_has_left_side boolean := false;
    v_has_top boolean := false;
    v_has_bottom boolean := false;
    v_extra_count integer := 0;
    v_paths text[] := ARRAY[]::text[];
    v_request_id uuid;
    v_pos integer;
BEGIN
    -- 1. Session Validation
    IF p_session_id IS NULL THEN
        RAISE EXCEPTION 'ID de sesión no proporcionado';
    END IF;

    SELECT * INTO v_session
    FROM public.sale_request_upload_sessions
    WHERE id = p_session_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Sesión no encontrada';
    END IF;

    IF v_session.completed_at IS NOT NULL THEN
        RAISE EXCEPTION 'Esta sesión ya fue utilizada';
    END IF;

    IF v_session.expires_at <= now() THEN
        RAISE EXCEPTION 'La sesión de subida ha caducado';
    END IF;

    -- 2. Category Support
    IF v_session.category <> 'iphone' THEN
        RAISE EXCEPTION 'La finalización de solicitudes para esta categoría todavía no está disponible';
    END IF;

    -- 3. Photos JSON Structure & Constraints
    IF p_photos IS NULL OR jsonb_typeof(p_photos) <> 'array' THEN
        RAISE EXCEPTION 'El parámetro p_photos debe ser un array JSON';
    END IF;

    IF jsonb_array_length(p_photos) < 7 OR jsonb_array_length(p_photos) > 10 THEN
        RAISE EXCEPTION 'Cantidad incorrecta de fotos (requerido: 7, extra: máximo 3)';
    END IF;

    FOR v_photo IN SELECT * FROM jsonb_array_elements(p_photos)
    LOOP
        IF jsonb_typeof(v_photo) <> 'object' THEN
            RAISE EXCEPTION 'Formato de foto inválido';
        END IF;

        v_type := v_photo->>'photo_type';
        v_path := v_photo->>'storage_path';

        IF v_type IS NULL OR v_type = '' OR v_path IS NULL OR v_path = '' THEN
            RAISE EXCEPTION 'Datos de foto inválidos';
        END IF;

        IF v_path = ANY(v_paths) THEN
            RAISE EXCEPTION 'Ruta de almacenamiento duplicada detectada';
        END IF;
        v_paths := array_append(v_paths, v_path);

        IF v_type NOT IN ('front_off', 'front_on', 'back', 'right_side', 'left_side', 'top', 'bottom', 'extra') THEN
            RAISE EXCEPTION 'Tipo de foto no soportado: %', v_type;
        END IF;

        IF v_type = 'extra' THEN
            IF NOT starts_with(v_path, p_session_id::text || '/extra/') THEN
                RAISE EXCEPTION 'La ruta de foto extra no pertenece a esta sesión';
            END IF;
            v_extra_count := v_extra_count + 1;
        ELSE
            IF NOT starts_with(v_path, p_session_id::text || '/' || v_type || '/') THEN
                RAISE EXCEPTION 'La ruta de foto requerida no pertenece a la sesión o al directorio correcto';
            END IF;

            CASE v_type
                WHEN 'front_off' THEN
                    IF v_has_front_off THEN RAISE EXCEPTION 'Foto duplicada: front_off'; END IF;
                    v_has_front_off := true;
                WHEN 'front_on' THEN
                    IF v_has_front_on THEN RAISE EXCEPTION 'Foto duplicada: front_on'; END IF;
                    v_has_front_on := true;
                WHEN 'back' THEN
                    IF v_has_back THEN RAISE EXCEPTION 'Foto duplicada: back'; END IF;
                    v_has_back := true;
                WHEN 'right_side' THEN
                    IF v_has_right_side THEN RAISE EXCEPTION 'Foto duplicada: right_side'; END IF;
                    v_has_right_side := true;
                WHEN 'left_side' THEN
                    IF v_has_left_side THEN RAISE EXCEPTION 'Foto duplicada: left_side'; END IF;
                    v_has_left_side := true;
                WHEN 'top' THEN
                    IF v_has_top THEN RAISE EXCEPTION 'Foto duplicada: top'; END IF;
                    v_has_top := true;
                WHEN 'bottom' THEN
                    IF v_has_bottom THEN RAISE EXCEPTION 'Foto duplicada: bottom'; END IF;
                    v_has_bottom := true;
            END CASE;
        END IF;
    END LOOP;

    IF NOT (v_has_front_off AND v_has_front_on AND v_has_back AND v_has_right_side AND v_has_left_side AND v_has_top AND v_has_bottom) THEN
        RAISE EXCEPTION 'Faltan tipos de foto requeridos';
    END IF;

    IF v_extra_count > 3 THEN
        RAISE EXCEPTION 'Demasiadas fotos extra';
    END IF;

    -- 4. Verify Physical Storage Objects
    IF (SELECT count(*) FROM storage.objects WHERE bucket_id = 'sale-request-images' AND name = ANY(v_paths)) <> array_length(v_paths, 1) THEN
        RAISE EXCEPTION 'No se encontraron todas las fotos requeridas';
    END IF;

    -- 4.5. Serialize Finalization Per Phone
    PERFORM pg_catalog.pg_advisory_xact_lock(
        pg_catalog.hashtextextended(v_session.customer_phone, 0)
    );

    IF v_session.expires_at <= now() THEN
        RAISE EXCEPTION 'La sesión de subida ha caducado';
    END IF;

    -- 5. Create Request via Trusted RPC
    v_request_id := public.create_public_sale_request(
        v_session.category,
        p_model_id,
        p_storage,
        p_color,
        p_battery_health,
        p_battery_cycles,
        p_device_condition,
        p_has_box,
        p_has_cable,
        p_has_invoice,
        p_original_parts,
        p_fully_functional,
        p_blocked,
        p_official_warranty_until,
        p_customer_name,
        v_session.customer_phone,
        p_customer_location,
        p_notes,
        p_source
    );

    -- 6. Insert Image Metadata
    v_pos := 7;
    FOR v_photo IN SELECT * FROM jsonb_array_elements(p_photos)
    LOOP
        v_type := v_photo->>'photo_type';
        v_path := v_photo->>'storage_path';
        
        IF v_type = 'front_off' THEN
            INSERT INTO public.sale_request_images (request_id, storage_path, photo_type, position) VALUES (v_request_id, v_path, v_type, 0);
        ELSIF v_type = 'front_on' THEN
            INSERT INTO public.sale_request_images (request_id, storage_path, photo_type, position) VALUES (v_request_id, v_path, v_type, 1);
        ELSIF v_type = 'back' THEN
            INSERT INTO public.sale_request_images (request_id, storage_path, photo_type, position) VALUES (v_request_id, v_path, v_type, 2);
        ELSIF v_type = 'right_side' THEN
            INSERT INTO public.sale_request_images (request_id, storage_path, photo_type, position) VALUES (v_request_id, v_path, v_type, 3);
        ELSIF v_type = 'left_side' THEN
            INSERT INTO public.sale_request_images (request_id, storage_path, photo_type, position) VALUES (v_request_id, v_path, v_type, 4);
        ELSIF v_type = 'top' THEN
            INSERT INTO public.sale_request_images (request_id, storage_path, photo_type, position) VALUES (v_request_id, v_path, v_type, 5);
        ELSIF v_type = 'bottom' THEN
            INSERT INTO public.sale_request_images (request_id, storage_path, photo_type, position) VALUES (v_request_id, v_path, v_type, 6);
        ELSE
            INSERT INTO public.sale_request_images (request_id, storage_path, photo_type, position) VALUES (v_request_id, v_path, v_type, v_pos);
            v_pos := v_pos + 1;
        END IF;
    END LOOP;

    -- 7. Complete Session
    UPDATE public.sale_request_upload_sessions
    SET completed_at = now()
    WHERE id = p_session_id;

    RETURN v_request_id;
END;
$$;

-- Security / Privileges
REVOKE ALL ON FUNCTION public.finalize_public_sale_request(
    uuid, uuid, text, text, integer, integer, text, boolean, boolean, boolean, boolean, boolean, boolean, date, text, text, text, text, jsonb
) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.finalize_public_sale_request(
    uuid, uuid, text, text, integer, integer, text, boolean, boolean, boolean, boolean, boolean, boolean, date, text, text, text, text, jsonb
) FROM anon;
REVOKE ALL ON FUNCTION public.finalize_public_sale_request(
    uuid, uuid, text, text, integer, integer, text, boolean, boolean, boolean, boolean, boolean, boolean, date, text, text, text, text, jsonb
) FROM authenticated;

GRANT EXECUTE ON FUNCTION public.finalize_public_sale_request(
    uuid, uuid, text, text, integer, integer, text, boolean, boolean, boolean, boolean, boolean, boolean, date, text, text, text, text, jsonb
) TO service_role;
