BEGIN;

ALTER TABLE public.iphone_quotes
  ADD COLUMN sealed_purchase_type text NULL;

ALTER TABLE public.iphone_quotes
  ADD CONSTRAINT iphone_quotes_sealed_purchase_type_check
  CHECK (
    sealed_purchase_type IS NULL
    OR (
      device_condition = 'sealed'
      AND sealed_purchase_type IN ('cash', 'financed')
    )
  );

COMMIT;
