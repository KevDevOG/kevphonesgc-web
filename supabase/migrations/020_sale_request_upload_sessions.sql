-- 1. Table Creation
CREATE TABLE public.sale_request_upload_sessions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_phone text NOT NULL CHECK (trim(customer_phone) <> ''),
    category text NOT NULL CHECK (category IN ('iphone', 'ps5', 'nintendo_switch')),
    created_at timestamptz NOT NULL DEFAULT now(),
    expires_at timestamptz NOT NULL,
    completed_at timestamptz NULL,
    CHECK (expires_at > created_at),
    CHECK (completed_at IS NULL OR completed_at >= created_at)
);

-- 2. Indexes
CREATE INDEX idx_upload_sessions_expires_at ON public.sale_request_upload_sessions(expires_at);
CREATE INDEX idx_upload_sessions_customer_phone ON public.sale_request_upload_sessions(customer_phone);
CREATE INDEX idx_upload_sessions_completed_at ON public.sale_request_upload_sessions(completed_at);

-- 3. RLS & Privacy
ALTER TABLE public.sale_request_upload_sessions ENABLE ROW LEVEL SECURITY;

-- Revoke all table access from standard roles
REVOKE ALL ON TABLE public.sale_request_upload_sessions FROM PUBLIC;
REVOKE ALL ON TABLE public.sale_request_upload_sessions FROM anon;
REVOKE ALL ON TABLE public.sale_request_upload_sessions FROM authenticated;

-- Grant CRUD only to service_role
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.sale_request_upload_sessions TO service_role;



-- 4. Session Creation RPC
CREATE OR REPLACE FUNCTION public.create_sale_request_upload_session(
    p_customer_phone text,
    p_category text
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
    v_clean_phone text;
    v_new_id uuid;
BEGIN
    v_clean_phone := trim(p_customer_phone);

    IF v_clean_phone IS NULL OR v_clean_phone = '' THEN
        RAISE EXCEPTION 'Teléfono no válido';
    END IF;

    IF p_category IS NULL OR p_category NOT IN ('iphone', 'ps5', 'nintendo_switch') THEN
        RAISE EXCEPTION 'Categoría no válida';
    END IF;

    -- Serialize Session Creation Per Phone
    PERFORM pg_catalog.pg_advisory_xact_lock(
        pg_catalog.hashtextextended(v_clean_phone, 0)
    );

    -- Duplicate Session Guard
    IF EXISTS (
        SELECT 1 
        FROM public.sale_request_upload_sessions
        WHERE customer_phone = v_clean_phone
        AND completed_at IS NULL
        AND expires_at > now()
        AND created_at >= now() - interval '2 minutes'
    ) THEN
        RAISE EXCEPTION 'Ya existe una sesión de subida reciente con este teléfono';
    END IF;

    -- Insert new session
    INSERT INTO public.sale_request_upload_sessions (
        customer_phone,
        category,
        created_at,
        expires_at
    ) VALUES (
        v_clean_phone,
        p_category,
        now(),
        now() + interval '2 hours'
    ) RETURNING id INTO v_new_id;

    RETURN v_new_id;
END;
$$;

-- 5. RPC Privileges
REVOKE ALL ON FUNCTION public.create_sale_request_upload_session(text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_sale_request_upload_session(text, text) FROM anon;
REVOKE ALL ON FUNCTION public.create_sale_request_upload_session(text, text) FROM authenticated;

GRANT EXECUTE ON FUNCTION public.create_sale_request_upload_session(text, text) TO service_role;
