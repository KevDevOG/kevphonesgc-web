-- 1. FINANCIAL SETTINGS
CREATE TABLE financial_settings (
    id smallint PRIMARY KEY CHECK (id = 1),
    opening_cash numeric(12,2) CHECK (opening_cash IS NULL OR opening_cash >= 0),
    opening_date date,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT financial_settings_opening_check CHECK (
        (opening_cash IS NULL AND opening_date IS NULL) OR
        (opening_cash IS NOT NULL AND opening_date IS NOT NULL)
    )
);

INSERT INTO financial_settings (id, opening_cash, opening_date)
VALUES (1, NULL, NULL)
ON CONFLICT (id) DO NOTHING;

DROP TRIGGER IF EXISTS set_financial_settings_updated_at ON financial_settings;
CREATE TRIGGER set_financial_settings_updated_at
    BEFORE UPDATE ON financial_settings
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();


-- 2. CASH RECONCILIATIONS
CREATE TABLE cash_reconciliations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    expected_cash numeric(12,2) NOT NULL,
    actual_cash numeric(12,2) NOT NULL CHECK (actual_cash >= 0),
    difference numeric(12,2) GENERATED ALWAYS AS (actual_cash - expected_cash) STORED,
    reconciliation_date date NOT NULL DEFAULT current_date,
    note text,
    adjustment_movement_id uuid REFERENCES capital_movements(id) ON DELETE RESTRICT UNIQUE,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_cash_reconciliations_date ON cash_reconciliations(reconciliation_date);


-- 3. ATOMIC RPC FOR RECONCILIATION
CREATE OR REPLACE FUNCTION reconcile_cash(
    p_expected_cash numeric,
    p_actual_cash numeric,
    p_reconciliation_date date,
    p_note text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
    v_difference numeric(12,2);
    v_norm_expected numeric(12,2);
    v_norm_actual numeric(12,2);
    v_adj_movement_id uuid := NULL;
    v_reconciliation_id uuid;
    v_note text;
BEGIN
    -- 1. Validate auth and inputs
    IF auth.uid() IS DISTINCT FROM '76320352-4c29-42ad-a105-345e0b5928dd'::uuid THEN
        RAISE EXCEPTION 'No autorizado';
    END IF;

    IF p_expected_cash IS NULL OR p_actual_cash IS NULL OR p_reconciliation_date IS NULL THEN
        RAISE EXCEPTION 'Campos obligatorios faltantes';
    END IF;

    IF p_actual_cash < 0 THEN
        RAISE EXCEPTION 'El efectivo real no puede ser negativo';
    END IF;

    -- 2. Normalize and calculate
    v_norm_expected := ROUND(p_expected_cash, 2);
    v_norm_actual := ROUND(p_actual_cash, 2);
    v_difference := v_norm_actual - v_norm_expected;
    
    -- Normalize note
    v_note := trim(p_note);
    IF v_note = '' THEN
        v_note := NULL;
    END IF;

    -- 3. Handle adjustment movement if difference != 0
    IF v_difference != 0 THEN
        INSERT INTO capital_movements (movement_type, amount, movement_date, note)
        VALUES (
            'adjustment',
            v_difference,
            p_reconciliation_date,
            COALESCE(v_note, 'Conciliación de caja')
        )
        RETURNING id INTO v_adj_movement_id;
    END IF;

    -- 4. Insert reconciliation
    INSERT INTO cash_reconciliations (
        expected_cash,
        actual_cash,
        reconciliation_date,
        note,
        adjustment_movement_id
    ) VALUES (
        v_norm_expected,
        v_norm_actual,
        p_reconciliation_date,
        v_note,
        v_adj_movement_id
    )
    RETURNING id INTO v_reconciliation_id;

    RETURN v_reconciliation_id;
END;
$$;


-- 4. RLS AND PRIVILEGES

-- financial_settings
ALTER TABLE financial_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin access financial_settings" ON financial_settings
    FOR ALL TO authenticated
    USING (auth.uid() = '76320352-4c29-42ad-a105-345e0b5928dd'::uuid)
    WITH CHECK (auth.uid() = '76320352-4c29-42ad-a105-345e0b5928dd'::uuid);

REVOKE ALL ON financial_settings FROM PUBLIC;
REVOKE ALL ON financial_settings FROM anon;
GRANT SELECT, INSERT, UPDATE ON financial_settings TO authenticated;

-- cash_reconciliations
ALTER TABLE cash_reconciliations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin select cash_reconciliations" ON cash_reconciliations
    FOR SELECT TO authenticated
    USING (auth.uid() = '76320352-4c29-42ad-a105-345e0b5928dd'::uuid);

CREATE POLICY "Admin insert cash_reconciliations" ON cash_reconciliations
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = '76320352-4c29-42ad-a105-345e0b5928dd'::uuid);

REVOKE ALL ON cash_reconciliations FROM PUBLIC;
REVOKE ALL ON cash_reconciliations FROM anon;
GRANT SELECT, INSERT ON cash_reconciliations TO authenticated;

-- RPC Privileges
REVOKE ALL ON FUNCTION reconcile_cash(numeric, numeric, date, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION reconcile_cash(numeric, numeric, date, text) FROM anon;
GRANT EXECUTE ON FUNCTION reconcile_cash(numeric, numeric, date, text) TO authenticated;
