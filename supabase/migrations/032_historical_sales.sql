CREATE TABLE public.historical_sales (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    product_name text NOT NULL,
    purchase_date date,
    purchase_price numeric(10,2) NOT NULL,
    sale_date date NOT NULL,
    sale_price numeric(10,2) NOT NULL,
    gross_profit numeric(10,2) GENERATED ALWAYS AS (sale_price - purchase_price) STORED,
    note text,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT product_name_not_empty CHECK (trim(product_name) <> ''),
    CONSTRAINT purchase_price_non_negative CHECK (purchase_price >= 0),
    CONSTRAINT sale_price_non_negative CHECK (sale_price >= 0)
);

CREATE INDEX historical_sales_sale_date_idx ON public.historical_sales(sale_date);
CREATE INDEX historical_sales_purchase_date_idx ON public.historical_sales(purchase_date);

-- Security
ALTER TABLE public.historical_sales ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.historical_sales FROM PUBLIC;
REVOKE ALL ON public.historical_sales FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.historical_sales TO authenticated;

CREATE POLICY "Admin full access historical_sales"
ON public.historical_sales
FOR ALL
TO authenticated
USING (auth.uid() = '76320352-4c29-42ad-a105-345e0b5928dd'::uuid)
WITH CHECK (auth.uid() = '76320352-4c29-42ad-a105-345e0b5928dd'::uuid);
