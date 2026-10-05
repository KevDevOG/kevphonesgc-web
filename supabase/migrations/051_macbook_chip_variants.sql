BEGIN;

WITH variant_data (category, model_name, variant_type, value, sort_order) AS (
  VALUES
  -- MacBook Air 13-inch (Intel, 2020)
  ('macbook', 'MacBook Air 13-inch (Intel, 2020)', 'chip', 'Intel Core i3', 1),
  ('macbook', 'MacBook Air 13-inch (Intel, 2020)', 'chip', 'Intel Core i5', 2),
  ('macbook', 'MacBook Air 13-inch (Intel, 2020)', 'chip', 'Intel Core i7', 3),

  -- MacBook Air 13-inch (M1, 2020)
  ('macbook', 'MacBook Air 13-inch (M1, 2020)', 'chip', 'M1', 1),

  -- MacBook Air 13-inch (M2, 2022)
  ('macbook', 'MacBook Air 13-inch (M2, 2022)', 'chip', 'M2', 1),

  -- MacBook Air 15-inch (M2, 2023)
  ('macbook', 'MacBook Air 15-inch (M2, 2023)', 'chip', 'M2', 1),

  -- MacBook Air 13-inch (M3, 2024)
  ('macbook', 'MacBook Air 13-inch (M3, 2024)', 'chip', 'M3', 1),

  -- MacBook Air 15-inch (M3, 2024)
  ('macbook', 'MacBook Air 15-inch (M3, 2024)', 'chip', 'M3', 1),

  -- MacBook Air 13-inch (M4, 2025)
  ('macbook', 'MacBook Air 13-inch (M4, 2025)', 'chip', 'M4', 1),

  -- MacBook Air 15-inch (M4, 2025)
  ('macbook', 'MacBook Air 15-inch (M4, 2025)', 'chip', 'M4', 1),

  -- MacBook Air 13-inch (M5, 2026)
  ('macbook', 'MacBook Air 13-inch (M5, 2026)', 'chip', 'M5', 1),

  -- MacBook Air 15-inch (M5, 2026)
  ('macbook', 'MacBook Air 15-inch (M5, 2026)', 'chip', 'M5', 1),

  -- MacBook Neo 13-inch (A18 Pro, 2026)
  ('macbook', 'MacBook Neo 13-inch (A18 Pro, 2026)', 'chip', 'A18 Pro', 1),

  -- MacBook Pro 13-inch (Intel, 2 Thunderbolt 3, 2020)
  ('macbook', 'MacBook Pro 13-inch (Intel, 2 Thunderbolt 3, 2020)', 'chip', 'Intel Core i5', 1),
  ('macbook', 'MacBook Pro 13-inch (Intel, 2 Thunderbolt 3, 2020)', 'chip', 'Intel Core i7', 2),

  -- MacBook Pro 13-inch (Intel, 4 Thunderbolt 3, 2020)
  ('macbook', 'MacBook Pro 13-inch (Intel, 4 Thunderbolt 3, 2020)', 'chip', 'Intel Core i5', 1),
  ('macbook', 'MacBook Pro 13-inch (Intel, 4 Thunderbolt 3, 2020)', 'chip', 'Intel Core i7', 2),

  -- MacBook Pro 13-inch (M1, 2020)
  ('macbook', 'MacBook Pro 13-inch (M1, 2020)', 'chip', 'M1', 1),

  -- MacBook Pro 14-inch (M1 Pro/Max, 2021)
  ('macbook', 'MacBook Pro 14-inch (M1 Pro/Max, 2021)', 'chip', 'M1 Pro', 1),
  ('macbook', 'MacBook Pro 14-inch (M1 Pro/Max, 2021)', 'chip', 'M1 Max', 2),

  -- MacBook Pro 16-inch (M1 Pro/Max, 2021)
  ('macbook', 'MacBook Pro 16-inch (M1 Pro/Max, 2021)', 'chip', 'M1 Pro', 1),
  ('macbook', 'MacBook Pro 16-inch (M1 Pro/Max, 2021)', 'chip', 'M1 Max', 2),

  -- MacBook Pro 13-inch (M2, 2022)
  ('macbook', 'MacBook Pro 13-inch (M2, 2022)', 'chip', 'M2', 1),

  -- MacBook Pro 14-inch (M2 Pro/Max, 2023)
  ('macbook', 'MacBook Pro 14-inch (M2 Pro/Max, 2023)', 'chip', 'M2 Pro', 1),
  ('macbook', 'MacBook Pro 14-inch (M2 Pro/Max, 2023)', 'chip', 'M2 Max', 2),

  -- MacBook Pro 16-inch (M2 Pro/Max, 2023)
  ('macbook', 'MacBook Pro 16-inch (M2 Pro/Max, 2023)', 'chip', 'M2 Pro', 1),
  ('macbook', 'MacBook Pro 16-inch (M2 Pro/Max, 2023)', 'chip', 'M2 Max', 2),

  -- MacBook Pro 14-inch (M3, 2023)
  ('macbook', 'MacBook Pro 14-inch (M3, 2023)', 'chip', 'M3', 1),

  -- MacBook Pro 14-inch (M3 Pro/Max, 2023)
  ('macbook', 'MacBook Pro 14-inch (M3 Pro/Max, 2023)', 'chip', 'M3 Pro', 1),
  ('macbook', 'MacBook Pro 14-inch (M3 Pro/Max, 2023)', 'chip', 'M3 Max', 2),

  -- MacBook Pro 16-inch (M3 Pro/Max, 2023)
  ('macbook', 'MacBook Pro 16-inch (M3 Pro/Max, 2023)', 'chip', 'M3 Pro', 1),
  ('macbook', 'MacBook Pro 16-inch (M3 Pro/Max, 2023)', 'chip', 'M3 Max', 2),

  -- MacBook Pro 14-inch (M4, 2024)
  ('macbook', 'MacBook Pro 14-inch (M4, 2024)', 'chip', 'M4', 1),

  -- MacBook Pro 14-inch (M4 Pro/Max, 2024)
  ('macbook', 'MacBook Pro 14-inch (M4 Pro/Max, 2024)', 'chip', 'M4 Pro', 1),
  ('macbook', 'MacBook Pro 14-inch (M4 Pro/Max, 2024)', 'chip', 'M4 Max', 2),

  -- MacBook Pro 16-inch (M4 Pro/Max, 2024)
  ('macbook', 'MacBook Pro 16-inch (M4 Pro/Max, 2024)', 'chip', 'M4 Pro', 1),
  ('macbook', 'MacBook Pro 16-inch (M4 Pro/Max, 2024)', 'chip', 'M4 Max', 2),

  -- MacBook Pro 14-inch (M5, 2025)
  ('macbook', 'MacBook Pro 14-inch (M5, 2025)', 'chip', 'M5', 1),

  -- MacBook Pro 14-inch (M5 Pro/Max, 2026)
  ('macbook', 'MacBook Pro 14-inch (M5 Pro/Max, 2026)', 'chip', 'M5 Pro', 1),
  ('macbook', 'MacBook Pro 14-inch (M5 Pro/Max, 2026)', 'chip', 'M5 Max', 2),

  -- MacBook Pro 16-inch (M5 Pro/Max, 2026)
  ('macbook', 'MacBook Pro 16-inch (M5 Pro/Max, 2026)', 'chip', 'M5 Pro', 1),
  ('macbook', 'MacBook Pro 16-inch (M5 Pro/Max, 2026)', 'chip', 'M5 Max', 2)
)
INSERT INTO public.device_model_variants (model_id, variant_type, value, sort_order, active)
SELECT
  m.id,
  v.variant_type,
  v.value,
  v.sort_order,
  true
FROM variant_data v
JOIN public.device_models m
  ON m.category = v.category
  AND m.name = v.model_name
ON CONFLICT (model_id, variant_type, value)
DO UPDATE SET
  sort_order = EXCLUDED.sort_order,
  active = EXCLUDED.active;

COMMIT;
