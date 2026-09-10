BEGIN;

-- Validate existing sealed adjustments before changing constraints.
-- Existing rows are preserved; this migration does not rewrite values.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.iphone_quote_adjustments
    WHERE rule_type = 'condition'
      AND rule_key = 'sealed'
      AND (min_delta < 0 OR max_delta < 0)
  ) THEN
    RAISE EXCEPTION
      'Migration 037 aborted: existing sealed adjustment is negative. Set Precintado to 0 before applying this migration.';
  END IF;
END $$;

-- Remove the previous discount-only constraints.
ALTER TABLE public.iphone_quote_adjustments
  DROP CONSTRAINT IF EXISTS iphone_quote_adjustments_min_delta_check;

ALTER TABLE public.iphone_quote_adjustments
  DROP CONSTRAINT IF EXISTS iphone_quote_adjustments_max_delta_check;

ALTER TABLE public.iphone_quote_adjustments
  DROP CONSTRAINT IF EXISTS iphone_quote_adjustments_delta_check;

ALTER TABLE public.iphone_quote_adjustments
  DROP CONSTRAINT IF EXISTS iphone_quote_adjustments_sealed_check;

-- Precintado is the ONLY rule allowed to be positive.
ALTER TABLE public.iphone_quote_adjustments
  ADD CONSTRAINT iphone_quote_adjustments_sealed_check
  CHECK (
    (
      rule_type = 'condition'
      AND rule_key = 'sealed'
      AND min_delta >= 0
      AND max_delta >= 0
    )
    OR
    (
      NOT (rule_type = 'condition' AND rule_key = 'sealed')
      AND min_delta <= 0
      AND max_delta <= 0
    )
  );

-- Preserve range consistency.
ALTER TABLE public.iphone_quote_adjustments
  ADD CONSTRAINT iphone_quote_adjustments_delta_check
  CHECK (min_delta <= max_delta);

COMMIT;
