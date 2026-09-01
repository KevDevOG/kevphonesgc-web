-- 1. CAPITAL MOVEMENTS
CREATE TABLE capital_movements (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    movement_type text NOT NULL CHECK (movement_type IN ('contribution', 'withdrawal', 'adjustment')),
    amount numeric(10,2) NOT NULL,
    movement_date date NOT NULL DEFAULT current_date,
    note text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT capital_movements_amount_check CHECK (
        (movement_type IN ('contribution', 'withdrawal') AND amount > 0) OR
        (movement_type = 'adjustment' AND amount != 0)
    )
);

-- 2. INDEXES
CREATE INDEX idx_capital_movements_movement_date ON capital_movements(movement_date);
CREATE INDEX idx_capital_movements_movement_type ON capital_movements(movement_type);

-- 3. TRIGGERS
DROP TRIGGER IF EXISTS set_capital_movements_updated_at ON capital_movements;
CREATE TRIGGER set_capital_movements_updated_at
    BEFORE UPDATE ON capital_movements
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

-- 4. RLS
ALTER TABLE capital_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access capital_movements" ON capital_movements
    FOR ALL
    TO authenticated
    USING (auth.uid() = '76320352-4c29-42ad-a105-345e0b5928dd'::uuid)
    WITH CHECK (auth.uid() = '76320352-4c29-42ad-a105-345e0b5928dd'::uuid);

-- 5. PRIVILEGES
REVOKE ALL ON capital_movements FROM PUBLIC;
REVOKE ALL ON capital_movements FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON capital_movements TO authenticated;
