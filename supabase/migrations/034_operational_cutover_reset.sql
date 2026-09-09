BEGIN;

DO $$
DECLARE
  v_hist_count integer;
  v_jul_count integer;
  v_jul_revenue numeric;
  v_jul_profit numeric;
  v_aug_count integer;
  v_aug_revenue numeric;
  v_aug_profit numeric;
  v_sep_count integer;
  v_sep_revenue numeric;
  v_sep_profit numeric;
  v_marker text := 'Importación histórica inicial KevPhonesGC 2026-07-01/2026-09-09%';
BEGIN
  -- PRE-DESTRUCTIVE VALIDATION
  SELECT COUNT(*) INTO v_hist_count
  FROM public.historical_sales
  WHERE note LIKE v_marker;

  IF v_hist_count <> 107 THEN
    RAISE EXCEPTION 'Pre-validation failed: expected 107 historical_sales rows, got %', v_hist_count;
  END IF;

  SELECT COUNT(*), COALESCE(SUM(sale_price),0), COALESCE(SUM(gross_profit),0)
  INTO v_jul_count, v_jul_revenue, v_jul_profit
  FROM public.historical_sales
  WHERE note LIKE v_marker
    AND sale_date >= DATE '2026-07-01'
    AND sale_date < DATE '2026-08-01';

  IF v_jul_count <> 36 OR v_jul_revenue <> 20215 OR v_jul_profit <> 2030 THEN
    RAISE EXCEPTION 'July validation failed: count %, revenue %, profit %', v_jul_count, v_jul_revenue, v_jul_profit;
  END IF;

  SELECT COUNT(*), COALESCE(SUM(sale_price),0), COALESCE(SUM(gross_profit),0)
  INTO v_aug_count, v_aug_revenue, v_aug_profit
  FROM public.historical_sales
  WHERE note LIKE v_marker
    AND sale_date >= DATE '2026-08-01'
    AND sale_date < DATE '2026-09-01';

  IF v_aug_count <> 59 OR v_aug_revenue <> 38630 OR v_aug_profit <> 4495 THEN
    RAISE EXCEPTION 'August validation failed: count %, revenue %, profit %', v_aug_count, v_aug_revenue, v_aug_profit;
  END IF;

  SELECT COUNT(*), COALESCE(SUM(sale_price),0), COALESCE(SUM(gross_profit),0)
  INTO v_sep_count, v_sep_revenue, v_sep_profit
  FROM public.historical_sales
  WHERE note LIKE v_marker
    AND sale_date >= DATE '2026-09-01'
    AND sale_date <= DATE '2026-09-09';

  IF v_sep_count <> 12 OR v_sep_revenue <> 7640 OR v_sep_profit <> 1215 THEN
    RAISE EXCEPTION 'September validation failed: count %, revenue %, profit %', v_sep_count, v_sep_revenue, v_sep_profit;
  END IF;
  
  -- DELETE OPERATIONAL DATA
  -- 1. trade_in_operations references sales and devices
  DELETE FROM public.trade_in_operations;
  
  -- 2. sales references devices
  DELETE FROM public.sales;
  
  -- 3. device_images references devices
  DELETE FROM public.device_images;
  
  -- 4. iphone_quotes target_device_id references devices
  -- We only delete quotes that prevent device deletion.
  DELETE FROM public.iphone_quotes
  WHERE target_device_id IS NOT NULL;
  
  -- 5. devices
  DELETE FROM public.devices;
  
  -- 6. clients
  DELETE FROM public.clients;
  
  -- 7. cash_reconciliations references capital_movements
  DELETE FROM public.cash_reconciliations;
  
  -- 8. capital_movements
  DELETE FROM public.capital_movements;
  
  -- 9. expenses
  DELETE FROM public.expenses;
  
  -- RESET FINANCIAL BASELINE
  UPDATE public.financial_settings
  SET opening_cash = NULL,
      opening_date = NULL
  WHERE id = 1;

  -- POST-RESET VALIDATION
  SELECT COUNT(*) INTO v_hist_count FROM public.historical_sales WHERE note LIKE v_marker;
  IF v_hist_count <> 107 THEN
    RAISE EXCEPTION 'Post-validation failed: historical_sales count is %', v_hist_count;
  END IF;
  
  IF (SELECT COUNT(*) FROM public.trade_in_operations) > 0 THEN RAISE EXCEPTION 'Failed to clear trade_in_operations'; END IF;
  IF (SELECT COUNT(*) FROM public.sales) > 0 THEN RAISE EXCEPTION 'Failed to clear sales'; END IF;
  IF (SELECT COUNT(*) FROM public.device_images) > 0 THEN RAISE EXCEPTION 'Failed to clear device_images'; END IF;
  IF (SELECT COUNT(*) FROM public.devices) > 0 THEN RAISE EXCEPTION 'Failed to clear devices'; END IF;
  IF (SELECT COUNT(*) FROM public.clients) > 0 THEN RAISE EXCEPTION 'Failed to clear clients'; END IF;
  IF (SELECT COUNT(*) FROM public.cash_reconciliations) > 0 THEN RAISE EXCEPTION 'Failed to clear cash_reconciliations'; END IF;
  IF (SELECT COUNT(*) FROM public.capital_movements) > 0 THEN RAISE EXCEPTION 'Failed to clear capital_movements'; END IF;
  IF (SELECT COUNT(*) FROM public.expenses) > 0 THEN RAISE EXCEPTION 'Failed to clear expenses'; END IF;
  
  IF (
    SELECT COUNT(*)
    FROM public.financial_settings
    WHERE id = 1
      AND opening_cash IS NULL
      AND opening_date IS NULL
  ) <> 1 THEN
    RAISE EXCEPTION 'Failed to reset financial_settings';
  END IF;

END $$;

COMMIT;
