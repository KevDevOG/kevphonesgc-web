BEGIN;

DO $$
DECLARE
  v_cat_gasolina uuid;
  v_cat_viajes uuid;
  v_cat_editora uuid;
  v_cat_otros uuid;
  v_marker text := 'Importación histórica gastos KevPhonesGC 2026-07-01/2026-09-09';
  
  v_jul_count int;
  v_jul_total numeric;
  v_aug_count int;
  v_aug_total numeric;
  v_sep_count int;
  v_sep_total numeric;
  v_total_count int;
  v_total_amount numeric;
BEGIN
  -- 1. VERIFY CATEGORIES
  SELECT id INTO v_cat_gasolina FROM public.expense_categories WHERE slug = 'gasolina';
  SELECT id INTO v_cat_viajes FROM public.expense_categories WHERE slug = 'viajes';
  SELECT id INTO v_cat_editora FROM public.expense_categories WHERE slug = 'editora';
  SELECT id INTO v_cat_otros FROM public.expense_categories WHERE slug = 'otros';

  IF v_cat_gasolina IS NULL OR v_cat_viajes IS NULL OR v_cat_editora IS NULL OR v_cat_otros IS NULL THEN
    RAISE EXCEPTION 'Required expense categories not found';
  END IF;

  -- 2. DELETE PREVIOUS IMPORT
  DELETE FROM public.expenses WHERE note LIKE '%' || v_marker || '%';

  -- 3. INSERT EXPENSES
  INSERT INTO public.expenses (category_id, amount, expense_date, note) VALUES
  -- JULY
  (v_cat_gasolina, 30.00, DATE '2026-07-17', 'Gasolina; ' || v_marker),
  (v_cat_otros, 200.00, DATE '2026-07-24', 'Aire acondicionado + gasolina coche; ' || v_marker),
  (v_cat_gasolina, 40.00, DATE '2026-07-29', 'Gasolina; ' || v_marker),
  (v_cat_editora, 60.00, DATE '2026-07-31', 'Editora; fecha inferida; ' || v_marker),

  -- AUGUST
  (v_cat_gasolina, 50.00, DATE '2026-08-02', 'Gasolina; fecha inferida; ' || v_marker),
  (v_cat_gasolina, 50.00, DATE '2026-08-07', 'Gasolina; fecha inferida; ' || v_marker),
  (v_cat_gasolina, 100.00, DATE '2026-08-18', 'Gasolina; ' || v_marker),
  (v_cat_gasolina, 50.00, DATE '2026-08-22', 'Gasolina; ' || v_marker),
  (v_cat_gasolina, 50.00, DATE '2026-08-31', 'Gasolina; fecha inferida; ' || v_marker),
  (v_cat_otros, 70.00, DATE '2026-08-17', 'AirPods 4; ' || v_marker),
  (v_cat_otros, 80.00, DATE '2026-08-20', 'AirPods 4; fecha inferida; ' || v_marker),
  (v_cat_editora, 262.00, DATE '2026-08-31', 'Editora; fecha inferida; ' || v_marker),

  -- SEPTEMBER
  (v_cat_gasolina, 60.00, DATE '2026-09-02', 'Gasolina; ' || v_marker),
  (v_cat_viajes, 25.00, DATE '2026-09-03', 'Barco Fred Olsen; ' || v_marker),
  (v_cat_gasolina, 50.00, DATE '2026-09-08', 'Gasolina; ' || v_marker);

  -- 4. VALIDATION
  -- Overall
  SELECT COUNT(*), COALESCE(SUM(amount),0) INTO v_total_count, v_total_amount
  FROM public.expenses WHERE note LIKE '%' || v_marker || '%';

  IF v_total_count <> 15 OR v_total_amount <> 1177 THEN
    RAISE EXCEPTION 'Overall validation failed: expected 15 expenses for 1177, got % for %', v_total_count, v_total_amount;
  END IF;

  -- July
  SELECT COUNT(*), COALESCE(SUM(amount),0) INTO v_jul_count, v_jul_total
  FROM public.expenses
  WHERE note LIKE '%' || v_marker || '%'
    AND expense_date >= DATE '2026-07-01' AND expense_date < DATE '2026-08-01';

  IF v_jul_count <> 4 OR v_jul_total <> 330 THEN
    RAISE EXCEPTION 'July validation failed: expected 4 expenses for 330, got % for %', v_jul_count, v_jul_total;
  END IF;

  -- August
  SELECT COUNT(*), COALESCE(SUM(amount),0) INTO v_aug_count, v_aug_total
  FROM public.expenses
  WHERE note LIKE '%' || v_marker || '%'
    AND expense_date >= DATE '2026-08-01' AND expense_date < DATE '2026-09-01';

  IF v_aug_count <> 8 OR v_aug_total <> 712 THEN
    RAISE EXCEPTION 'August validation failed: expected 8 expenses for 712, got % for %', v_aug_count, v_aug_total;
  END IF;

  -- September
  SELECT COUNT(*), COALESCE(SUM(amount),0) INTO v_sep_count, v_sep_total
  FROM public.expenses
  WHERE note LIKE '%' || v_marker || '%'
    AND expense_date >= DATE '2026-09-01' AND expense_date < DATE '2026-10-01';

  IF v_sep_count <> 3 OR v_sep_total <> 135 THEN
    RAISE EXCEPTION 'September validation failed: expected 3 expenses for 135, got % for %', v_sep_count, v_sep_total;
  END IF;

END $$;

COMMIT;
