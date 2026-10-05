BEGIN;

-- 1. INSERT STORAGE VARIANTS
WITH storage_data (category, model_name, variant_type, value, sort_order) AS (
  VALUES
  -- MacBook Air 13-inch (Intel, 2020)
  ('macbook', 'MacBook Air 13-inch (Intel, 2020)', 'storage', '256 GB', 1),
  ('macbook', 'MacBook Air 13-inch (Intel, 2020)', 'storage', '512 GB', 2),
  ('macbook', 'MacBook Air 13-inch (Intel, 2020)', 'storage', '1 TB', 3),
  ('macbook', 'MacBook Air 13-inch (Intel, 2020)', 'storage', '2 TB', 4),

  -- MacBook Air 13-inch (M1, 2020)
  ('macbook', 'MacBook Air 13-inch (M1, 2020)', 'storage', '256 GB', 1),
  ('macbook', 'MacBook Air 13-inch (M1, 2020)', 'storage', '512 GB', 2),
  ('macbook', 'MacBook Air 13-inch (M1, 2020)', 'storage', '1 TB', 3),
  ('macbook', 'MacBook Air 13-inch (M1, 2020)', 'storage', '2 TB', 4),

  -- MacBook Air 13-inch (M2, 2022)
  ('macbook', 'MacBook Air 13-inch (M2, 2022)', 'storage', '256 GB', 1),
  ('macbook', 'MacBook Air 13-inch (M2, 2022)', 'storage', '512 GB', 2),
  ('macbook', 'MacBook Air 13-inch (M2, 2022)', 'storage', '1 TB', 3),
  ('macbook', 'MacBook Air 13-inch (M2, 2022)', 'storage', '2 TB', 4),

  -- MacBook Air 15-inch (M2, 2023)
  ('macbook', 'MacBook Air 15-inch (M2, 2023)', 'storage', '256 GB', 1),
  ('macbook', 'MacBook Air 15-inch (M2, 2023)', 'storage', '512 GB', 2),
  ('macbook', 'MacBook Air 15-inch (M2, 2023)', 'storage', '1 TB', 3),
  ('macbook', 'MacBook Air 15-inch (M2, 2023)', 'storage', '2 TB', 4),

  -- MacBook Air 13-inch (M3, 2024)
  ('macbook', 'MacBook Air 13-inch (M3, 2024)', 'storage', '256 GB', 1),
  ('macbook', 'MacBook Air 13-inch (M3, 2024)', 'storage', '512 GB', 2),
  ('macbook', 'MacBook Air 13-inch (M3, 2024)', 'storage', '1 TB', 3),
  ('macbook', 'MacBook Air 13-inch (M3, 2024)', 'storage', '2 TB', 4),

  -- MacBook Air 15-inch (M3, 2024)
  ('macbook', 'MacBook Air 15-inch (M3, 2024)', 'storage', '256 GB', 1),
  ('macbook', 'MacBook Air 15-inch (M3, 2024)', 'storage', '512 GB', 2),
  ('macbook', 'MacBook Air 15-inch (M3, 2024)', 'storage', '1 TB', 3),
  ('macbook', 'MacBook Air 15-inch (M3, 2024)', 'storage', '2 TB', 4),

  -- MacBook Air 13-inch (M4, 2025)
  ('macbook', 'MacBook Air 13-inch (M4, 2025)', 'storage', '256 GB', 1),
  ('macbook', 'MacBook Air 13-inch (M4, 2025)', 'storage', '512 GB', 2),
  ('macbook', 'MacBook Air 13-inch (M4, 2025)', 'storage', '1 TB', 3),
  ('macbook', 'MacBook Air 13-inch (M4, 2025)', 'storage', '2 TB', 4),

  -- MacBook Air 15-inch (M4, 2025)
  ('macbook', 'MacBook Air 15-inch (M4, 2025)', 'storage', '256 GB', 1),
  ('macbook', 'MacBook Air 15-inch (M4, 2025)', 'storage', '512 GB', 2),
  ('macbook', 'MacBook Air 15-inch (M4, 2025)', 'storage', '1 TB', 3),
  ('macbook', 'MacBook Air 15-inch (M4, 2025)', 'storage', '2 TB', 4),

  -- MacBook Air 13-inch (M5, 2026)
  ('macbook', 'MacBook Air 13-inch (M5, 2026)', 'storage', '512 GB', 1),
  ('macbook', 'MacBook Air 13-inch (M5, 2026)', 'storage', '1 TB', 2),
  ('macbook', 'MacBook Air 13-inch (M5, 2026)', 'storage', '2 TB', 3),
  ('macbook', 'MacBook Air 13-inch (M5, 2026)', 'storage', '4 TB', 4),

  -- MacBook Air 15-inch (M5, 2026)
  ('macbook', 'MacBook Air 15-inch (M5, 2026)', 'storage', '512 GB', 1),
  ('macbook', 'MacBook Air 15-inch (M5, 2026)', 'storage', '1 TB', 2),
  ('macbook', 'MacBook Air 15-inch (M5, 2026)', 'storage', '2 TB', 3),
  ('macbook', 'MacBook Air 15-inch (M5, 2026)', 'storage', '4 TB', 4),

  -- MacBook Neo 13-inch (A18 Pro, 2026)
  ('macbook', 'MacBook Neo 13-inch (A18 Pro, 2026)', 'storage', '256 GB', 1),
  ('macbook', 'MacBook Neo 13-inch (A18 Pro, 2026)', 'storage', '512 GB', 2),

  -- MacBook Pro 13-inch (Intel, 2 Thunderbolt 3, 2020)
  ('macbook', 'MacBook Pro 13-inch (Intel, 2 Thunderbolt 3, 2020)', 'storage', '256 GB', 1),
  ('macbook', 'MacBook Pro 13-inch (Intel, 2 Thunderbolt 3, 2020)', 'storage', '512 GB', 2),
  ('macbook', 'MacBook Pro 13-inch (Intel, 2 Thunderbolt 3, 2020)', 'storage', '1 TB', 3),
  ('macbook', 'MacBook Pro 13-inch (Intel, 2 Thunderbolt 3, 2020)', 'storage', '2 TB', 4),

  -- MacBook Pro 13-inch (Intel, 4 Thunderbolt 3, 2020)
  ('macbook', 'MacBook Pro 13-inch (Intel, 4 Thunderbolt 3, 2020)', 'storage', '512 GB', 1),
  ('macbook', 'MacBook Pro 13-inch (Intel, 4 Thunderbolt 3, 2020)', 'storage', '1 TB', 2),
  ('macbook', 'MacBook Pro 13-inch (Intel, 4 Thunderbolt 3, 2020)', 'storage', '2 TB', 3),
  ('macbook', 'MacBook Pro 13-inch (Intel, 4 Thunderbolt 3, 2020)', 'storage', '4 TB', 4),

  -- MacBook Pro 13-inch (M1, 2020)
  ('macbook', 'MacBook Pro 13-inch (M1, 2020)', 'storage', '256 GB', 1),
  ('macbook', 'MacBook Pro 13-inch (M1, 2020)', 'storage', '512 GB', 2),
  ('macbook', 'MacBook Pro 13-inch (M1, 2020)', 'storage', '1 TB', 3),
  ('macbook', 'MacBook Pro 13-inch (M1, 2020)', 'storage', '2 TB', 4),

  -- MacBook Pro 13-inch (M2, 2022)
  ('macbook', 'MacBook Pro 13-inch (M2, 2022)', 'storage', '256 GB', 1),
  ('macbook', 'MacBook Pro 13-inch (M2, 2022)', 'storage', '512 GB', 2),
  ('macbook', 'MacBook Pro 13-inch (M2, 2022)', 'storage', '1 TB', 3),
  ('macbook', 'MacBook Pro 13-inch (M2, 2022)', 'storage', '2 TB', 4),

  -- MacBook Pro 14-inch (M3, 2023)
  ('macbook', 'MacBook Pro 14-inch (M3, 2023)', 'storage', '512 GB', 1),
  ('macbook', 'MacBook Pro 14-inch (M3, 2023)', 'storage', '1 TB', 2),
  ('macbook', 'MacBook Pro 14-inch (M3, 2023)', 'storage', '2 TB', 3),

  -- MacBook Pro 14-inch (M4, 2024)
  ('macbook', 'MacBook Pro 14-inch (M4, 2024)', 'storage', '512 GB', 1),
  ('macbook', 'MacBook Pro 14-inch (M4, 2024)', 'storage', '1 TB', 2),
  ('macbook', 'MacBook Pro 14-inch (M4, 2024)', 'storage', '2 TB', 3),

  -- MacBook Pro 14-inch (M5, 2025)
  ('macbook', 'MacBook Pro 14-inch (M5, 2025)', 'storage', '512 GB', 1),
  ('macbook', 'MacBook Pro 14-inch (M5, 2025)', 'storage', '1 TB', 2),
  ('macbook', 'MacBook Pro 14-inch (M5, 2025)', 'storage', '2 TB', 3),
  ('macbook', 'MacBook Pro 14-inch (M5, 2025)', 'storage', '4 TB', 4),

  -- MacBook Pro 14-inch (M1 Pro/Max, 2021)
  ('macbook', 'MacBook Pro 14-inch (M1 Pro/Max, 2021)', 'storage', '512 GB', 1),
  ('macbook', 'MacBook Pro 14-inch (M1 Pro/Max, 2021)', 'storage', '1 TB', 2),
  ('macbook', 'MacBook Pro 14-inch (M1 Pro/Max, 2021)', 'storage', '2 TB', 3),
  ('macbook', 'MacBook Pro 14-inch (M1 Pro/Max, 2021)', 'storage', '4 TB', 4),
  ('macbook', 'MacBook Pro 14-inch (M1 Pro/Max, 2021)', 'storage', '8 TB', 5),

  -- MacBook Pro 16-inch (M1 Pro/Max, 2021)
  ('macbook', 'MacBook Pro 16-inch (M1 Pro/Max, 2021)', 'storage', '512 GB', 1),
  ('macbook', 'MacBook Pro 16-inch (M1 Pro/Max, 2021)', 'storage', '1 TB', 2),
  ('macbook', 'MacBook Pro 16-inch (M1 Pro/Max, 2021)', 'storage', '2 TB', 3),
  ('macbook', 'MacBook Pro 16-inch (M1 Pro/Max, 2021)', 'storage', '4 TB', 4),
  ('macbook', 'MacBook Pro 16-inch (M1 Pro/Max, 2021)', 'storage', '8 TB', 5),

  -- MacBook Pro 14-inch (M2 Pro/Max, 2023)
  ('macbook', 'MacBook Pro 14-inch (M2 Pro/Max, 2023)', 'storage', '512 GB', 1),
  ('macbook', 'MacBook Pro 14-inch (M2 Pro/Max, 2023)', 'storage', '1 TB', 2),
  ('macbook', 'MacBook Pro 14-inch (M2 Pro/Max, 2023)', 'storage', '2 TB', 3),
  ('macbook', 'MacBook Pro 14-inch (M2 Pro/Max, 2023)', 'storage', '4 TB', 4),
  ('macbook', 'MacBook Pro 14-inch (M2 Pro/Max, 2023)', 'storage', '8 TB', 5),

  -- MacBook Pro 16-inch (M2 Pro/Max, 2023)
  ('macbook', 'MacBook Pro 16-inch (M2 Pro/Max, 2023)', 'storage', '512 GB', 1),
  ('macbook', 'MacBook Pro 16-inch (M2 Pro/Max, 2023)', 'storage', '1 TB', 2),
  ('macbook', 'MacBook Pro 16-inch (M2 Pro/Max, 2023)', 'storage', '2 TB', 3),
  ('macbook', 'MacBook Pro 16-inch (M2 Pro/Max, 2023)', 'storage', '4 TB', 4),
  ('macbook', 'MacBook Pro 16-inch (M2 Pro/Max, 2023)', 'storage', '8 TB', 5),

  -- MacBook Pro 14-inch (M3 Pro/Max, 2023)
  ('macbook', 'MacBook Pro 14-inch (M3 Pro/Max, 2023)', 'storage', '512 GB', 1),
  ('macbook', 'MacBook Pro 14-inch (M3 Pro/Max, 2023)', 'storage', '1 TB', 2),
  ('macbook', 'MacBook Pro 14-inch (M3 Pro/Max, 2023)', 'storage', '2 TB', 3),
  ('macbook', 'MacBook Pro 14-inch (M3 Pro/Max, 2023)', 'storage', '4 TB', 4),
  ('macbook', 'MacBook Pro 14-inch (M3 Pro/Max, 2023)', 'storage', '8 TB', 5),

  -- MacBook Pro 16-inch (M3 Pro/Max, 2023)
  ('macbook', 'MacBook Pro 16-inch (M3 Pro/Max, 2023)', 'storage', '512 GB', 1),
  ('macbook', 'MacBook Pro 16-inch (M3 Pro/Max, 2023)', 'storage', '1 TB', 2),
  ('macbook', 'MacBook Pro 16-inch (M3 Pro/Max, 2023)', 'storage', '2 TB', 3),
  ('macbook', 'MacBook Pro 16-inch (M3 Pro/Max, 2023)', 'storage', '4 TB', 4),
  ('macbook', 'MacBook Pro 16-inch (M3 Pro/Max, 2023)', 'storage', '8 TB', 5),

  -- MacBook Pro 14-inch (M4 Pro/Max, 2024)
  ('macbook', 'MacBook Pro 14-inch (M4 Pro/Max, 2024)', 'storage', '512 GB', 1),
  ('macbook', 'MacBook Pro 14-inch (M4 Pro/Max, 2024)', 'storage', '1 TB', 2),
  ('macbook', 'MacBook Pro 14-inch (M4 Pro/Max, 2024)', 'storage', '2 TB', 3),
  ('macbook', 'MacBook Pro 14-inch (M4 Pro/Max, 2024)', 'storage', '4 TB', 4),
  ('macbook', 'MacBook Pro 14-inch (M4 Pro/Max, 2024)', 'storage', '8 TB', 5),

  -- MacBook Pro 16-inch (M4 Pro/Max, 2024)
  ('macbook', 'MacBook Pro 16-inch (M4 Pro/Max, 2024)', 'storage', '512 GB', 1),
  ('macbook', 'MacBook Pro 16-inch (M4 Pro/Max, 2024)', 'storage', '1 TB', 2),
  ('macbook', 'MacBook Pro 16-inch (M4 Pro/Max, 2024)', 'storage', '2 TB', 3),
  ('macbook', 'MacBook Pro 16-inch (M4 Pro/Max, 2024)', 'storage', '4 TB', 4),
  ('macbook', 'MacBook Pro 16-inch (M4 Pro/Max, 2024)', 'storage', '8 TB', 5),

  -- MacBook Pro 14-inch (M5 Pro/Max, 2026)
  ('macbook', 'MacBook Pro 14-inch (M5 Pro/Max, 2026)', 'storage', '1 TB', 1),
  ('macbook', 'MacBook Pro 14-inch (M5 Pro/Max, 2026)', 'storage', '2 TB', 2),
  ('macbook', 'MacBook Pro 14-inch (M5 Pro/Max, 2026)', 'storage', '4 TB', 3),
  ('macbook', 'MacBook Pro 14-inch (M5 Pro/Max, 2026)', 'storage', '8 TB', 4),

  -- MacBook Pro 16-inch (M5 Pro/Max, 2026)
  ('macbook', 'MacBook Pro 16-inch (M5 Pro/Max, 2026)', 'storage', '1 TB', 1),
  ('macbook', 'MacBook Pro 16-inch (M5 Pro/Max, 2026)', 'storage', '2 TB', 2),
  ('macbook', 'MacBook Pro 16-inch (M5 Pro/Max, 2026)', 'storage', '4 TB', 3),
  ('macbook', 'MacBook Pro 16-inch (M5 Pro/Max, 2026)', 'storage', '8 TB', 4)
)
INSERT INTO public.device_model_variants (model_id, variant_type, value, sort_order, active)
SELECT
  m.id,
  v.variant_type,
  v.value,
  v.sort_order,
  true
FROM storage_data v
JOIN public.device_models m
  ON m.category = 'macbook'
  AND m.name = v.model_name
ON CONFLICT (model_id, variant_type, value)
DO UPDATE SET
  sort_order = EXCLUDED.sort_order,
  active = EXCLUDED.active;

-- 2. INSERT COMPATIBILITY (CHIP -> STORAGE)
WITH comp_data (model_name, chip, storage) AS (
  VALUES
  -- Single chip models (Air and regular Pro) map chip to all their storages
  ('MacBook Air 13-inch (M1, 2020)', 'M1', '256 GB'),
  ('MacBook Air 13-inch (M1, 2020)', 'M1', '512 GB'),
  ('MacBook Air 13-inch (M1, 2020)', 'M1', '1 TB'),
  ('MacBook Air 13-inch (M1, 2020)', 'M1', '2 TB'),

  ('MacBook Air 13-inch (M2, 2022)', 'M2', '256 GB'),
  ('MacBook Air 13-inch (M2, 2022)', 'M2', '512 GB'),
  ('MacBook Air 13-inch (M2, 2022)', 'M2', '1 TB'),
  ('MacBook Air 13-inch (M2, 2022)', 'M2', '2 TB'),

  ('MacBook Air 15-inch (M2, 2023)', 'M2', '256 GB'),
  ('MacBook Air 15-inch (M2, 2023)', 'M2', '512 GB'),
  ('MacBook Air 15-inch (M2, 2023)', 'M2', '1 TB'),
  ('MacBook Air 15-inch (M2, 2023)', 'M2', '2 TB'),

  ('MacBook Air 13-inch (M3, 2024)', 'M3', '256 GB'),
  ('MacBook Air 13-inch (M3, 2024)', 'M3', '512 GB'),
  ('MacBook Air 13-inch (M3, 2024)', 'M3', '1 TB'),
  ('MacBook Air 13-inch (M3, 2024)', 'M3', '2 TB'),

  ('MacBook Air 15-inch (M3, 2024)', 'M3', '256 GB'),
  ('MacBook Air 15-inch (M3, 2024)', 'M3', '512 GB'),
  ('MacBook Air 15-inch (M3, 2024)', 'M3', '1 TB'),
  ('MacBook Air 15-inch (M3, 2024)', 'M3', '2 TB'),

  ('MacBook Air 13-inch (M4, 2025)', 'M4', '256 GB'),
  ('MacBook Air 13-inch (M4, 2025)', 'M4', '512 GB'),
  ('MacBook Air 13-inch (M4, 2025)', 'M4', '1 TB'),
  ('MacBook Air 13-inch (M4, 2025)', 'M4', '2 TB'),

  ('MacBook Air 15-inch (M4, 2025)', 'M4', '256 GB'),
  ('MacBook Air 15-inch (M4, 2025)', 'M4', '512 GB'),
  ('MacBook Air 15-inch (M4, 2025)', 'M4', '1 TB'),
  ('MacBook Air 15-inch (M4, 2025)', 'M4', '2 TB'),

  ('MacBook Air 13-inch (M5, 2026)', 'M5', '512 GB'),
  ('MacBook Air 13-inch (M5, 2026)', 'M5', '1 TB'),
  ('MacBook Air 13-inch (M5, 2026)', 'M5', '2 TB'),
  ('MacBook Air 13-inch (M5, 2026)', 'M5', '4 TB'),

  ('MacBook Air 15-inch (M5, 2026)', 'M5', '512 GB'),
  ('MacBook Air 15-inch (M5, 2026)', 'M5', '1 TB'),
  ('MacBook Air 15-inch (M5, 2026)', 'M5', '2 TB'),
  ('MacBook Air 15-inch (M5, 2026)', 'M5', '4 TB'),

  ('MacBook Neo 13-inch (A18 Pro, 2026)', 'A18 Pro', '256 GB'),
  ('MacBook Neo 13-inch (A18 Pro, 2026)', 'A18 Pro', '512 GB'),

  ('MacBook Pro 13-inch (M1, 2020)', 'M1', '256 GB'),
  ('MacBook Pro 13-inch (M1, 2020)', 'M1', '512 GB'),
  ('MacBook Pro 13-inch (M1, 2020)', 'M1', '1 TB'),
  ('MacBook Pro 13-inch (M1, 2020)', 'M1', '2 TB'),

  ('MacBook Pro 13-inch (M2, 2022)', 'M2', '256 GB'),
  ('MacBook Pro 13-inch (M2, 2022)', 'M2', '512 GB'),
  ('MacBook Pro 13-inch (M2, 2022)', 'M2', '1 TB'),
  ('MacBook Pro 13-inch (M2, 2022)', 'M2', '2 TB'),

  ('MacBook Pro 14-inch (M3, 2023)', 'M3', '512 GB'),
  ('MacBook Pro 14-inch (M3, 2023)', 'M3', '1 TB'),
  ('MacBook Pro 14-inch (M3, 2023)', 'M3', '2 TB'),

  ('MacBook Pro 14-inch (M4, 2024)', 'M4', '512 GB'),
  ('MacBook Pro 14-inch (M4, 2024)', 'M4', '1 TB'),
  ('MacBook Pro 14-inch (M4, 2024)', 'M4', '2 TB'),

  ('MacBook Pro 14-inch (M5, 2025)', 'M5', '512 GB'),
  ('MacBook Pro 14-inch (M5, 2025)', 'M5', '1 TB'),
  ('MacBook Pro 14-inch (M5, 2025)', 'M5', '2 TB'),
  ('MacBook Pro 14-inch (M5, 2025)', 'M5', '4 TB'),

  -- Multi-chip Intel models
  ('MacBook Air 13-inch (Intel, 2020)', 'Intel Core i3', '256 GB'),
  ('MacBook Air 13-inch (Intel, 2020)', 'Intel Core i3', '512 GB'),
  ('MacBook Air 13-inch (Intel, 2020)', 'Intel Core i3', '1 TB'),
  ('MacBook Air 13-inch (Intel, 2020)', 'Intel Core i3', '2 TB'),
  ('MacBook Air 13-inch (Intel, 2020)', 'Intel Core i5', '256 GB'),
  ('MacBook Air 13-inch (Intel, 2020)', 'Intel Core i5', '512 GB'),
  ('MacBook Air 13-inch (Intel, 2020)', 'Intel Core i5', '1 TB'),
  ('MacBook Air 13-inch (Intel, 2020)', 'Intel Core i5', '2 TB'),
  ('MacBook Air 13-inch (Intel, 2020)', 'Intel Core i7', '256 GB'),
  ('MacBook Air 13-inch (Intel, 2020)', 'Intel Core i7', '512 GB'),
  ('MacBook Air 13-inch (Intel, 2020)', 'Intel Core i7', '1 TB'),
  ('MacBook Air 13-inch (Intel, 2020)', 'Intel Core i7', '2 TB'),

  ('MacBook Pro 13-inch (Intel, 2 Thunderbolt 3, 2020)', 'Intel Core i5', '256 GB'),
  ('MacBook Pro 13-inch (Intel, 2 Thunderbolt 3, 2020)', 'Intel Core i5', '512 GB'),
  ('MacBook Pro 13-inch (Intel, 2 Thunderbolt 3, 2020)', 'Intel Core i5', '1 TB'),
  ('MacBook Pro 13-inch (Intel, 2 Thunderbolt 3, 2020)', 'Intel Core i5', '2 TB'),
  ('MacBook Pro 13-inch (Intel, 2 Thunderbolt 3, 2020)', 'Intel Core i7', '256 GB'),
  ('MacBook Pro 13-inch (Intel, 2 Thunderbolt 3, 2020)', 'Intel Core i7', '512 GB'),
  ('MacBook Pro 13-inch (Intel, 2 Thunderbolt 3, 2020)', 'Intel Core i7', '1 TB'),
  ('MacBook Pro 13-inch (Intel, 2 Thunderbolt 3, 2020)', 'Intel Core i7', '2 TB'),

  ('MacBook Pro 13-inch (Intel, 4 Thunderbolt 3, 2020)', 'Intel Core i5', '512 GB'),
  ('MacBook Pro 13-inch (Intel, 4 Thunderbolt 3, 2020)', 'Intel Core i5', '1 TB'),
  ('MacBook Pro 13-inch (Intel, 4 Thunderbolt 3, 2020)', 'Intel Core i5', '2 TB'),
  ('MacBook Pro 13-inch (Intel, 4 Thunderbolt 3, 2020)', 'Intel Core i5', '4 TB'),
  ('MacBook Pro 13-inch (Intel, 4 Thunderbolt 3, 2020)', 'Intel Core i7', '512 GB'),
  ('MacBook Pro 13-inch (Intel, 4 Thunderbolt 3, 2020)', 'Intel Core i7', '1 TB'),
  ('MacBook Pro 13-inch (Intel, 4 Thunderbolt 3, 2020)', 'Intel Core i7', '2 TB'),
  ('MacBook Pro 13-inch (Intel, 4 Thunderbolt 3, 2020)', 'Intel Core i7', '4 TB'),

  -- Multi-chip Apple Silicon models
  ('MacBook Pro 14-inch (M1 Pro/Max, 2021)', 'M1 Pro', '512 GB'),
  ('MacBook Pro 14-inch (M1 Pro/Max, 2021)', 'M1 Pro', '1 TB'),
  ('MacBook Pro 14-inch (M1 Pro/Max, 2021)', 'M1 Pro', '2 TB'),
  ('MacBook Pro 14-inch (M1 Pro/Max, 2021)', 'M1 Pro', '4 TB'),
  ('MacBook Pro 14-inch (M1 Pro/Max, 2021)', 'M1 Pro', '8 TB'),
  ('MacBook Pro 14-inch (M1 Pro/Max, 2021)', 'M1 Max', '1 TB'),
  ('MacBook Pro 14-inch (M1 Pro/Max, 2021)', 'M1 Max', '2 TB'),
  ('MacBook Pro 14-inch (M1 Pro/Max, 2021)', 'M1 Max', '4 TB'),
  ('MacBook Pro 14-inch (M1 Pro/Max, 2021)', 'M1 Max', '8 TB'),

  ('MacBook Pro 16-inch (M1 Pro/Max, 2021)', 'M1 Pro', '512 GB'),
  ('MacBook Pro 16-inch (M1 Pro/Max, 2021)', 'M1 Pro', '1 TB'),
  ('MacBook Pro 16-inch (M1 Pro/Max, 2021)', 'M1 Pro', '2 TB'),
  ('MacBook Pro 16-inch (M1 Pro/Max, 2021)', 'M1 Pro', '4 TB'),
  ('MacBook Pro 16-inch (M1 Pro/Max, 2021)', 'M1 Pro', '8 TB'),
  ('MacBook Pro 16-inch (M1 Pro/Max, 2021)', 'M1 Max', '1 TB'),
  ('MacBook Pro 16-inch (M1 Pro/Max, 2021)', 'M1 Max', '2 TB'),
  ('MacBook Pro 16-inch (M1 Pro/Max, 2021)', 'M1 Max', '4 TB'),
  ('MacBook Pro 16-inch (M1 Pro/Max, 2021)', 'M1 Max', '8 TB'),

  ('MacBook Pro 14-inch (M2 Pro/Max, 2023)', 'M2 Pro', '512 GB'),
  ('MacBook Pro 14-inch (M2 Pro/Max, 2023)', 'M2 Pro', '1 TB'),
  ('MacBook Pro 14-inch (M2 Pro/Max, 2023)', 'M2 Pro', '2 TB'),
  ('MacBook Pro 14-inch (M2 Pro/Max, 2023)', 'M2 Pro', '4 TB'),
  ('MacBook Pro 14-inch (M2 Pro/Max, 2023)', 'M2 Pro', '8 TB'),
  ('MacBook Pro 14-inch (M2 Pro/Max, 2023)', 'M2 Max', '1 TB'),
  ('MacBook Pro 14-inch (M2 Pro/Max, 2023)', 'M2 Max', '2 TB'),
  ('MacBook Pro 14-inch (M2 Pro/Max, 2023)', 'M2 Max', '4 TB'),
  ('MacBook Pro 14-inch (M2 Pro/Max, 2023)', 'M2 Max', '8 TB'),

  ('MacBook Pro 16-inch (M2 Pro/Max, 2023)', 'M2 Pro', '512 GB'),
  ('MacBook Pro 16-inch (M2 Pro/Max, 2023)', 'M2 Pro', '1 TB'),
  ('MacBook Pro 16-inch (M2 Pro/Max, 2023)', 'M2 Pro', '2 TB'),
  ('MacBook Pro 16-inch (M2 Pro/Max, 2023)', 'M2 Pro', '4 TB'),
  ('MacBook Pro 16-inch (M2 Pro/Max, 2023)', 'M2 Pro', '8 TB'),
  ('MacBook Pro 16-inch (M2 Pro/Max, 2023)', 'M2 Max', '1 TB'),
  ('MacBook Pro 16-inch (M2 Pro/Max, 2023)', 'M2 Max', '2 TB'),
  ('MacBook Pro 16-inch (M2 Pro/Max, 2023)', 'M2 Max', '4 TB'),
  ('MacBook Pro 16-inch (M2 Pro/Max, 2023)', 'M2 Max', '8 TB'),

  ('MacBook Pro 14-inch (M3 Pro/Max, 2023)', 'M3 Pro', '512 GB'),
  ('MacBook Pro 14-inch (M3 Pro/Max, 2023)', 'M3 Pro', '1 TB'),
  ('MacBook Pro 14-inch (M3 Pro/Max, 2023)', 'M3 Pro', '2 TB'),
  ('MacBook Pro 14-inch (M3 Pro/Max, 2023)', 'M3 Pro', '4 TB'),
  ('MacBook Pro 14-inch (M3 Pro/Max, 2023)', 'M3 Max', '1 TB'),
  ('MacBook Pro 14-inch (M3 Pro/Max, 2023)', 'M3 Max', '2 TB'),
  ('MacBook Pro 14-inch (M3 Pro/Max, 2023)', 'M3 Max', '4 TB'),
  ('MacBook Pro 14-inch (M3 Pro/Max, 2023)', 'M3 Max', '8 TB'),

  ('MacBook Pro 16-inch (M3 Pro/Max, 2023)', 'M3 Pro', '512 GB'),
  ('MacBook Pro 16-inch (M3 Pro/Max, 2023)', 'M3 Pro', '1 TB'),
  ('MacBook Pro 16-inch (M3 Pro/Max, 2023)', 'M3 Pro', '2 TB'),
  ('MacBook Pro 16-inch (M3 Pro/Max, 2023)', 'M3 Pro', '4 TB'),
  ('MacBook Pro 16-inch (M3 Pro/Max, 2023)', 'M3 Max', '1 TB'),
  ('MacBook Pro 16-inch (M3 Pro/Max, 2023)', 'M3 Max', '2 TB'),
  ('MacBook Pro 16-inch (M3 Pro/Max, 2023)', 'M3 Max', '4 TB'),
  ('MacBook Pro 16-inch (M3 Pro/Max, 2023)', 'M3 Max', '8 TB'),

  ('MacBook Pro 14-inch (M4 Pro/Max, 2024)', 'M4 Pro', '512 GB'),
  ('MacBook Pro 14-inch (M4 Pro/Max, 2024)', 'M4 Pro', '1 TB'),
  ('MacBook Pro 14-inch (M4 Pro/Max, 2024)', 'M4 Pro', '2 TB'),
  ('MacBook Pro 14-inch (M4 Pro/Max, 2024)', 'M4 Pro', '4 TB'),
  ('MacBook Pro 14-inch (M4 Pro/Max, 2024)', 'M4 Max', '1 TB'),
  ('MacBook Pro 14-inch (M4 Pro/Max, 2024)', 'M4 Max', '2 TB'),
  ('MacBook Pro 14-inch (M4 Pro/Max, 2024)', 'M4 Max', '4 TB'),
  ('MacBook Pro 14-inch (M4 Pro/Max, 2024)', 'M4 Max', '8 TB'),

  ('MacBook Pro 16-inch (M4 Pro/Max, 2024)', 'M4 Pro', '512 GB'),
  ('MacBook Pro 16-inch (M4 Pro/Max, 2024)', 'M4 Pro', '1 TB'),
  ('MacBook Pro 16-inch (M4 Pro/Max, 2024)', 'M4 Pro', '2 TB'),
  ('MacBook Pro 16-inch (M4 Pro/Max, 2024)', 'M4 Pro', '4 TB'),
  ('MacBook Pro 16-inch (M4 Pro/Max, 2024)', 'M4 Max', '1 TB'),
  ('MacBook Pro 16-inch (M4 Pro/Max, 2024)', 'M4 Max', '2 TB'),
  ('MacBook Pro 16-inch (M4 Pro/Max, 2024)', 'M4 Max', '4 TB'),
  ('MacBook Pro 16-inch (M4 Pro/Max, 2024)', 'M4 Max', '8 TB'),

  ('MacBook Pro 14-inch (M5 Pro/Max, 2026)', 'M5 Pro', '1 TB'),
  ('MacBook Pro 14-inch (M5 Pro/Max, 2026)', 'M5 Pro', '2 TB'),
  ('MacBook Pro 14-inch (M5 Pro/Max, 2026)', 'M5 Pro', '4 TB'),
  ('MacBook Pro 14-inch (M5 Pro/Max, 2026)', 'M5 Max', '2 TB'),
  ('MacBook Pro 14-inch (M5 Pro/Max, 2026)', 'M5 Max', '4 TB'),
  ('MacBook Pro 14-inch (M5 Pro/Max, 2026)', 'M5 Max', '8 TB'),

  ('MacBook Pro 16-inch (M5 Pro/Max, 2026)', 'M5 Pro', '1 TB'),
  ('MacBook Pro 16-inch (M5 Pro/Max, 2026)', 'M5 Pro', '2 TB'),
  ('MacBook Pro 16-inch (M5 Pro/Max, 2026)', 'M5 Pro', '4 TB'),
  ('MacBook Pro 16-inch (M5 Pro/Max, 2026)', 'M5 Max', '2 TB'),
  ('MacBook Pro 16-inch (M5 Pro/Max, 2026)', 'M5 Max', '4 TB'),
  ('MacBook Pro 16-inch (M5 Pro/Max, 2026)', 'M5 Max', '8 TB')
)
INSERT INTO public.device_variant_compatibility (
  model_id,
  parent_variant_type,
  parent_value,
  child_variant_type,
  child_value
)
SELECT
  m.id,
  'chip',
  c.chip,
  'storage',
  c.storage
FROM comp_data c
JOIN public.device_models m
  ON m.category = 'macbook'
  AND m.name = c.model_name
ON CONFLICT (
  model_id,
  parent_variant_type,
  parent_value,
  child_variant_type,
  child_value
)
DO NOTHING;

COMMIT;
