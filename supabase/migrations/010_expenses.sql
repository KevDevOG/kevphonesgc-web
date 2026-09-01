-- 1. EXPENSE CATEGORIES
CREATE TABLE expense_categories (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL CHECK (char_length(trim(name)) > 0),
    slug text NOT NULL UNIQUE CHECK (char_length(trim(slug)) > 0),
    active boolean NOT NULL DEFAULT true,
    sort_order integer NOT NULL DEFAULT 0 CHECK (sort_order >= 0),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS set_expense_categories_updated_at ON expense_categories;
CREATE TRIGGER set_expense_categories_updated_at
    BEFORE UPDATE ON expense_categories
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

-- 2. EXPENSES
CREATE TABLE expenses (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id uuid NOT NULL REFERENCES expense_categories(id) ON DELETE RESTRICT,
    amount numeric(10,2) NOT NULL CHECK (amount > 0),
    expense_date date NOT NULL DEFAULT current_date,
    note text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_expenses_category_id ON expenses(category_id);
CREATE INDEX idx_expenses_expense_date ON expenses(expense_date);

DROP TRIGGER IF EXISTS set_expenses_updated_at ON expenses;
CREATE TRIGGER set_expenses_updated_at
    BEFORE UPDATE ON expenses
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

-- 3. RLS
ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access expense_categories" ON expense_categories
    FOR ALL
    TO authenticated
    USING (auth.uid() = '76320352-4c29-42ad-a105-345e0b5928dd'::uuid)
    WITH CHECK (auth.uid() = '76320352-4c29-42ad-a105-345e0b5928dd'::uuid);

CREATE POLICY "Admin full access expenses" ON expenses
    FOR ALL
    TO authenticated
    USING (auth.uid() = '76320352-4c29-42ad-a105-345e0b5928dd'::uuid)
    WITH CHECK (auth.uid() = '76320352-4c29-42ad-a105-345e0b5928dd'::uuid);

-- 4. PRIVILEGES
REVOKE ALL ON expense_categories FROM PUBLIC;
REVOKE ALL ON expense_categories FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON expense_categories TO authenticated;

REVOKE ALL ON expenses FROM PUBLIC;
REVOKE ALL ON expenses FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON expenses TO authenticated;

-- 5. INITIAL CATEGORIES (Idempotent seed)
INSERT INTO expense_categories (name, slug, active, sort_order)
VALUES
    ('Gasolina', 'gasolina', true, 1),
    ('Pasajes / Viajes', 'viajes', true, 2),
    ('Editora', 'editora', true, 3),
    ('Otros', 'otros', true, 4)
ON CONFLICT (slug) DO UPDATE
SET
    name = EXCLUDED.name,
    active = EXCLUDED.active,
    sort_order = EXCLUDED.sort_order;
