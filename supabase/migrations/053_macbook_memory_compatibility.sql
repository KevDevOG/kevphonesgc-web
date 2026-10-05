BEGIN;

-- 1. INSERT MEMORY VARIANTS
WITH memory_data (category, model_name, variant_type, value, sort_order) AS (
  VALUES
  -- MacBook Air 13-inch (Intel, 2020)
  ('macbook', 'MacBook Air 13-inch (Intel, 2020)', 'memory', '8 GB', 1),
  ('macbook', 'MacBook Air 13-inch (Intel, 2020)', 'memory', '16 GB', 2),
  
  -- MacBook Air 13-inch (M1, 2020)
  ('macbook', 'MacBook Air 13-inch (M1, 2020)', 'memory', '8 GB', 1),
  ('macbook', 'MacBook Air 13-inch (M1, 2020)', 'memory', '16 GB', 2),
  
  -- MacBook Air 13-inch (M2, 2022)
  ('macbook', 'MacBook Air 13-inch (M2, 2022)', 'memory', '8 GB', 1),
  ('macbook', 'MacBook Air 13-inch (M2, 2022)', 'memory', '16 GB', 2),
  ('macbook', 'MacBook Air 13-inch (M2, 2022)', 'memory', '24 GB', 3),
  
  -- MacBook Air 15-inch (M2, 2023)
  ('macbook', 'MacBook Air 15-inch (M2, 2023)', 'memory', '8 GB', 1),
  ('macbook', 'MacBook Air 15-inch (M2, 2023)', 'memory', '16 GB', 2),
  ('macbook', 'MacBook Air 15-inch (M2, 2023)', 'memory', '24 GB', 3),

  -- MacBook Air 13-inch (M3, 2024)
  ('macbook', 'MacBook Air 13-inch (M3, 2024)', 'memory', '8 GB', 1),
  ('macbook', 'MacBook Air 13-inch (M3, 2024)', 'memory', '16 GB', 2),
  ('macbook', 'MacBook Air 13-inch (M3, 2024)', 'memory', '24 GB', 3),

  -- MacBook Air 15-inch (M3, 2024)
  ('macbook', 'MacBook Air 15-inch (M3, 2024)', 'memory', '8 GB', 1),
  ('macbook', 'MacBook Air 15-inch (M3, 2024)', 'memory', '16 GB', 2),
  ('macbook', 'MacBook Air 15-inch (M3, 2024)', 'memory', '24 GB', 3),

  -- MacBook Air 13-inch (M4, 2025)
  ('macbook', 'MacBook Air 13-inch (M4, 2025)', 'memory', '16 GB', 1),
  ('macbook', 'MacBook Air 13-inch (M4, 2025)', 'memory', '24 GB', 2),
  ('macbook', 'MacBook Air 13-inch (M4, 2025)', 'memory', '32 GB', 3),

  -- MacBook Air 15-inch (M4, 2025)
  ('macbook', 'MacBook Air 15-inch (M4, 2025)', 'memory', '16 GB', 1),
  ('macbook', 'MacBook Air 15-inch (M4, 2025)', 'memory', '24 GB', 2),
  ('macbook', 'MacBook Air 15-inch (M4, 2025)', 'memory', '32 GB', 3),

  -- MacBook Air 13-inch (M5, 2026)
  ('macbook', 'MacBook Air 13-inch (M5, 2026)', 'memory', '16 GB', 1),
  ('macbook', 'MacBook Air 13-inch (M5, 2026)', 'memory', '24 GB', 2),
  ('macbook', 'MacBook Air 13-inch (M5, 2026)', 'memory', '32 GB', 3),

  -- MacBook Air 15-inch (M5, 2026)
  ('macbook', 'MacBook Air 15-inch (M5, 2026)', 'memory', '16 GB', 1),
  ('macbook', 'MacBook Air 15-inch (M5, 2026)', 'memory', '24 GB', 2),
  ('macbook', 'MacBook Air 15-inch (M5, 2026)', 'memory', '32 GB', 3),

  -- MacBook Neo 13-inch (A18 Pro, 2026)
  ('macbook', 'MacBook Neo 13-inch (A18 Pro, 2026)', 'memory', '8 GB', 1),

  -- MacBook Pro 13-inch (Intel, 2 Thunderbolt 3, 2020)
  ('macbook', 'MacBook Pro 13-inch (Intel, 2 Thunderbolt 3, 2020)', 'memory', '8 GB', 1),
  ('macbook', 'MacBook Pro 13-inch (Intel, 2 Thunderbolt 3, 2020)', 'memory', '16 GB', 2),

  -- MacBook Pro 13-inch (Intel, 4 Thunderbolt 3, 2020)
  ('macbook', 'MacBook Pro 13-inch (Intel, 4 Thunderbolt 3, 2020)', 'memory', '16 GB', 1),
  ('macbook', 'MacBook Pro 13-inch (Intel, 4 Thunderbolt 3, 2020)', 'memory', '32 GB', 2),

  -- MacBook Pro 13-inch (M1, 2020)
  ('macbook', 'MacBook Pro 13-inch (M1, 2020)', 'memory', '8 GB', 1),
  ('macbook', 'MacBook Pro 13-inch (M1, 2020)', 'memory', '16 GB', 2),

  -- MacBook Pro 14-inch (M1 Pro/Max, 2021)
  ('macbook', 'MacBook Pro 14-inch (M1 Pro/Max, 2021)', 'memory', '16 GB', 1),
  ('macbook', 'MacBook Pro 14-inch (M1 Pro/Max, 2021)', 'memory', '32 GB', 2),
  ('macbook', 'MacBook Pro 14-inch (M1 Pro/Max, 2021)', 'memory', '64 GB', 3),

  -- MacBook Pro 16-inch (M1 Pro/Max, 2021)
  ('macbook', 'MacBook Pro 16-inch (M1 Pro/Max, 2021)', 'memory', '16 GB', 1),
  ('macbook', 'MacBook Pro 16-inch (M1 Pro/Max, 2021)', 'memory', '32 GB', 2),
  ('macbook', 'MacBook Pro 16-inch (M1 Pro/Max, 2021)', 'memory', '64 GB', 3),

  -- MacBook Pro 13-inch (M2, 2022)
  ('macbook', 'MacBook Pro 13-inch (M2, 2022)', 'memory', '8 GB', 1),
  ('macbook', 'MacBook Pro 13-inch (M2, 2022)', 'memory', '16 GB', 2),
  ('macbook', 'MacBook Pro 13-inch (M2, 2022)', 'memory', '24 GB', 3),

  -- MacBook Pro 14-inch (M2 Pro/Max, 2023)
  ('macbook', 'MacBook Pro 14-inch (M2 Pro/Max, 2023)', 'memory', '16 GB', 1),
  ('macbook', 'MacBook Pro 14-inch (M2 Pro/Max, 2023)', 'memory', '32 GB', 2),
  ('macbook', 'MacBook Pro 14-inch (M2 Pro/Max, 2023)', 'memory', '64 GB', 3),
  ('macbook', 'MacBook Pro 14-inch (M2 Pro/Max, 2023)', 'memory', '96 GB', 4),

  -- MacBook Pro 16-inch (M2 Pro/Max, 2023)
  ('macbook', 'MacBook Pro 16-inch (M2 Pro/Max, 2023)', 'memory', '16 GB', 1),
  ('macbook', 'MacBook Pro 16-inch (M2 Pro/Max, 2023)', 'memory', '32 GB', 2),
  ('macbook', 'MacBook Pro 16-inch (M2 Pro/Max, 2023)', 'memory', '64 GB', 3),
  ('macbook', 'MacBook Pro 16-inch (M2 Pro/Max, 2023)', 'memory', '96 GB', 4),

  -- MacBook Pro 14-inch (M3, 2023)
  ('macbook', 'MacBook Pro 14-inch (M3, 2023)', 'memory', '8 GB', 1),
  ('macbook', 'MacBook Pro 14-inch (M3, 2023)', 'memory', '16 GB', 2),
  ('macbook', 'MacBook Pro 14-inch (M3, 2023)', 'memory', '24 GB', 3),

  -- MacBook Pro 14-inch (M3 Pro/Max, 2023)
  ('macbook', 'MacBook Pro 14-inch (M3 Pro/Max, 2023)', 'memory', '18 GB', 1),
  ('macbook', 'MacBook Pro 14-inch (M3 Pro/Max, 2023)', 'memory', '36 GB', 2),
  ('macbook', 'MacBook Pro 14-inch (M3 Pro/Max, 2023)', 'memory', '48 GB', 3),
  ('macbook', 'MacBook Pro 14-inch (M3 Pro/Max, 2023)', 'memory', '64 GB', 4),
  ('macbook', 'MacBook Pro 14-inch (M3 Pro/Max, 2023)', 'memory', '96 GB', 5),
  ('macbook', 'MacBook Pro 14-inch (M3 Pro/Max, 2023)', 'memory', '128 GB', 6),

  -- MacBook Pro 16-inch (M3 Pro/Max, 2023)
  ('macbook', 'MacBook Pro 16-inch (M3 Pro/Max, 2023)', 'memory', '18 GB', 1),
  ('macbook', 'MacBook Pro 16-inch (M3 Pro/Max, 2023)', 'memory', '36 GB', 2),
  ('macbook', 'MacBook Pro 16-inch (M3 Pro/Max, 2023)', 'memory', '48 GB', 3),
  ('macbook', 'MacBook Pro 16-inch (M3 Pro/Max, 2023)', 'memory', '64 GB', 4),
  ('macbook', 'MacBook Pro 16-inch (M3 Pro/Max, 2023)', 'memory', '96 GB', 5),
  ('macbook', 'MacBook Pro 16-inch (M3 Pro/Max, 2023)', 'memory', '128 GB', 6),

  -- MacBook Pro 14-inch (M4, 2024)
  ('macbook', 'MacBook Pro 14-inch (M4, 2024)', 'memory', '16 GB', 1),
  ('macbook', 'MacBook Pro 14-inch (M4, 2024)', 'memory', '24 GB', 2),
  ('macbook', 'MacBook Pro 14-inch (M4, 2024)', 'memory', '32 GB', 3),

  -- MacBook Pro 14-inch (M4 Pro/Max, 2024)
  ('macbook', 'MacBook Pro 14-inch (M4 Pro/Max, 2024)', 'memory', '24 GB', 1),
  ('macbook', 'MacBook Pro 14-inch (M4 Pro/Max, 2024)', 'memory', '36 GB', 2),
  ('macbook', 'MacBook Pro 14-inch (M4 Pro/Max, 2024)', 'memory', '48 GB', 3),
  ('macbook', 'MacBook Pro 14-inch (M4 Pro/Max, 2024)', 'memory', '64 GB', 4),
  ('macbook', 'MacBook Pro 14-inch (M4 Pro/Max, 2024)', 'memory', '128 GB', 5),

  -- MacBook Pro 16-inch (M4 Pro/Max, 2024)
  ('macbook', 'MacBook Pro 16-inch (M4 Pro/Max, 2024)', 'memory', '24 GB', 1),
  ('macbook', 'MacBook Pro 16-inch (M4 Pro/Max, 2024)', 'memory', '36 GB', 2),
  ('macbook', 'MacBook Pro 16-inch (M4 Pro/Max, 2024)', 'memory', '48 GB', 3),
  ('macbook', 'MacBook Pro 16-inch (M4 Pro/Max, 2024)', 'memory', '64 GB', 4),
  ('macbook', 'MacBook Pro 16-inch (M4 Pro/Max, 2024)', 'memory', '128 GB', 5),

  -- MacBook Pro 14-inch (M5, 2025)
  ('macbook', 'MacBook Pro 14-inch (M5, 2025)', 'memory', '16 GB', 1),
  ('macbook', 'MacBook Pro 14-inch (M5, 2025)', 'memory', '24 GB', 2),
  ('macbook', 'MacBook Pro 14-inch (M5, 2025)', 'memory', '32 GB', 3),

  -- MacBook Pro 14-inch (M5 Pro/Max, 2026)
  ('macbook', 'MacBook Pro 14-inch (M5 Pro/Max, 2026)', 'memory', '24 GB', 1),
  ('macbook', 'MacBook Pro 14-inch (M5 Pro/Max, 2026)', 'memory', '36 GB', 2),
  ('macbook', 'MacBook Pro 14-inch (M5 Pro/Max, 2026)', 'memory', '48 GB', 3),
  ('macbook', 'MacBook Pro 14-inch (M5 Pro/Max, 2026)', 'memory', '64 GB', 4),
  ('macbook', 'MacBook Pro 14-inch (M5 Pro/Max, 2026)', 'memory', '128 GB', 5),

  -- MacBook Pro 16-inch (M5 Pro/Max, 2026)
  ('macbook', 'MacBook Pro 16-inch (M5 Pro/Max, 2026)', 'memory', '24 GB', 1),
  ('macbook', 'MacBook Pro 16-inch (M5 Pro/Max, 2026)', 'memory', '36 GB', 2),
  ('macbook', 'MacBook Pro 16-inch (M5 Pro/Max, 2026)', 'memory', '48 GB', 3),
  ('macbook', 'MacBook Pro 16-inch (M5 Pro/Max, 2026)', 'memory', '64 GB', 4),
  ('macbook', 'MacBook Pro 16-inch (M5 Pro/Max, 2026)', 'memory', '128 GB', 5)
)
INSERT INTO public.device_model_variants (model_id, variant_type, value, sort_order, active)
SELECT
  m.id,
  v.variant_type,
  v.value,
  v.sort_order,
  true
FROM memory_data v
JOIN public.device_models m
  ON m.category = 'macbook'
  AND m.name = v.model_name
ON CONFLICT (model_id, variant_type, value)
DO UPDATE SET
  sort_order = EXCLUDED.sort_order,
  active = EXCLUDED.active;

-- 2. INSERT COMPATIBILITY
WITH comp_data (model_name, chip, memory) AS (
  VALUES
  -- Single-chip models map their single chip to all their memory variants
  ('MacBook Air 13-inch (M1, 2020)', 'M1', '8 GB'),
  ('MacBook Air 13-inch (M1, 2020)', 'M1', '16 GB'),
  
  ('MacBook Air 13-inch (M2, 2022)', 'M2', '8 GB'),
  ('MacBook Air 13-inch (M2, 2022)', 'M2', '16 GB'),
  ('MacBook Air 13-inch (M2, 2022)', 'M2', '24 GB'),
  
  ('MacBook Air 15-inch (M2, 2023)', 'M2', '8 GB'),
  ('MacBook Air 15-inch (M2, 2023)', 'M2', '16 GB'),
  ('MacBook Air 15-inch (M2, 2023)', 'M2', '24 GB'),
  
  ('MacBook Air 13-inch (M3, 2024)', 'M3', '8 GB'),
  ('MacBook Air 13-inch (M3, 2024)', 'M3', '16 GB'),
  ('MacBook Air 13-inch (M3, 2024)', 'M3', '24 GB'),

  ('MacBook Air 15-inch (M3, 2024)', 'M3', '8 GB'),
  ('MacBook Air 15-inch (M3, 2024)', 'M3', '16 GB'),
  ('MacBook Air 15-inch (M3, 2024)', 'M3', '24 GB'),

  ('MacBook Air 13-inch (M4, 2025)', 'M4', '16 GB'),
  ('MacBook Air 13-inch (M4, 2025)', 'M4', '24 GB'),
  ('MacBook Air 13-inch (M4, 2025)', 'M4', '32 GB'),

  ('MacBook Air 15-inch (M4, 2025)', 'M4', '16 GB'),
  ('MacBook Air 15-inch (M4, 2025)', 'M4', '24 GB'),
  ('MacBook Air 15-inch (M4, 2025)', 'M4', '32 GB'),

  ('MacBook Air 13-inch (M5, 2026)', 'M5', '16 GB'),
  ('MacBook Air 13-inch (M5, 2026)', 'M5', '24 GB'),
  ('MacBook Air 13-inch (M5, 2026)', 'M5', '32 GB'),

  ('MacBook Air 15-inch (M5, 2026)', 'M5', '16 GB'),
  ('MacBook Air 15-inch (M5, 2026)', 'M5', '24 GB'),
  ('MacBook Air 15-inch (M5, 2026)', 'M5', '32 GB'),

  ('MacBook Neo 13-inch (A18 Pro, 2026)', 'A18 Pro', '8 GB'),

  ('MacBook Pro 13-inch (M1, 2020)', 'M1', '8 GB'),
  ('MacBook Pro 13-inch (M1, 2020)', 'M1', '16 GB'),

  ('MacBook Pro 13-inch (M2, 2022)', 'M2', '8 GB'),
  ('MacBook Pro 13-inch (M2, 2022)', 'M2', '16 GB'),
  ('MacBook Pro 13-inch (M2, 2022)', 'M2', '24 GB'),

  ('MacBook Pro 14-inch (M3, 2023)', 'M3', '8 GB'),
  ('MacBook Pro 14-inch (M3, 2023)', 'M3', '16 GB'),
  ('MacBook Pro 14-inch (M3, 2023)', 'M3', '24 GB'),

  ('MacBook Pro 14-inch (M4, 2024)', 'M4', '16 GB'),
  ('MacBook Pro 14-inch (M4, 2024)', 'M4', '24 GB'),
  ('MacBook Pro 14-inch (M4, 2024)', 'M4', '32 GB'),

  ('MacBook Pro 14-inch (M5, 2025)', 'M5', '16 GB'),
  ('MacBook Pro 14-inch (M5, 2025)', 'M5', '24 GB'),
  ('MacBook Pro 14-inch (M5, 2025)', 'M5', '32 GB'),

  -- Multi-chip models
  ('MacBook Air 13-inch (Intel, 2020)', 'Intel Core i3', '8 GB'),
  ('MacBook Air 13-inch (Intel, 2020)', 'Intel Core i3', '16 GB'),
  ('MacBook Air 13-inch (Intel, 2020)', 'Intel Core i5', '8 GB'),
  ('MacBook Air 13-inch (Intel, 2020)', 'Intel Core i5', '16 GB'),
  ('MacBook Air 13-inch (Intel, 2020)', 'Intel Core i7', '8 GB'),
  ('MacBook Air 13-inch (Intel, 2020)', 'Intel Core i7', '16 GB'),

  ('MacBook Pro 13-inch (Intel, 2 Thunderbolt 3, 2020)', 'Intel Core i5', '8 GB'),
  ('MacBook Pro 13-inch (Intel, 2 Thunderbolt 3, 2020)', 'Intel Core i5', '16 GB'),
  ('MacBook Pro 13-inch (Intel, 2 Thunderbolt 3, 2020)', 'Intel Core i7', '8 GB'),
  ('MacBook Pro 13-inch (Intel, 2 Thunderbolt 3, 2020)', 'Intel Core i7', '16 GB'),

  ('MacBook Pro 13-inch (Intel, 4 Thunderbolt 3, 2020)', 'Intel Core i5', '16 GB'),
  ('MacBook Pro 13-inch (Intel, 4 Thunderbolt 3, 2020)', 'Intel Core i5', '32 GB'),
  ('MacBook Pro 13-inch (Intel, 4 Thunderbolt 3, 2020)', 'Intel Core i7', '16 GB'),
  ('MacBook Pro 13-inch (Intel, 4 Thunderbolt 3, 2020)', 'Intel Core i7', '32 GB'),

  ('MacBook Pro 14-inch (M1 Pro/Max, 2021)', 'M1 Pro', '16 GB'),
  ('MacBook Pro 14-inch (M1 Pro/Max, 2021)', 'M1 Pro', '32 GB'),
  ('MacBook Pro 14-inch (M1 Pro/Max, 2021)', 'M1 Max', '32 GB'),
  ('MacBook Pro 14-inch (M1 Pro/Max, 2021)', 'M1 Max', '64 GB'),

  ('MacBook Pro 16-inch (M1 Pro/Max, 2021)', 'M1 Pro', '16 GB'),
  ('MacBook Pro 16-inch (M1 Pro/Max, 2021)', 'M1 Pro', '32 GB'),
  ('MacBook Pro 16-inch (M1 Pro/Max, 2021)', 'M1 Max', '32 GB'),
  ('MacBook Pro 16-inch (M1 Pro/Max, 2021)', 'M1 Max', '64 GB'),

  ('MacBook Pro 14-inch (M2 Pro/Max, 2023)', 'M2 Pro', '16 GB'),
  ('MacBook Pro 14-inch (M2 Pro/Max, 2023)', 'M2 Pro', '32 GB'),
  ('MacBook Pro 14-inch (M2 Pro/Max, 2023)', 'M2 Max', '32 GB'),
  ('MacBook Pro 14-inch (M2 Pro/Max, 2023)', 'M2 Max', '64 GB'),
  ('MacBook Pro 14-inch (M2 Pro/Max, 2023)', 'M2 Max', '96 GB'),

  ('MacBook Pro 16-inch (M2 Pro/Max, 2023)', 'M2 Pro', '16 GB'),
  ('MacBook Pro 16-inch (M2 Pro/Max, 2023)', 'M2 Pro', '32 GB'),
  ('MacBook Pro 16-inch (M2 Pro/Max, 2023)', 'M2 Max', '32 GB'),
  ('MacBook Pro 16-inch (M2 Pro/Max, 2023)', 'M2 Max', '64 GB'),
  ('MacBook Pro 16-inch (M2 Pro/Max, 2023)', 'M2 Max', '96 GB'),

  ('MacBook Pro 14-inch (M3 Pro/Max, 2023)', 'M3 Pro', '18 GB'),
  ('MacBook Pro 14-inch (M3 Pro/Max, 2023)', 'M3 Pro', '36 GB'),
  ('MacBook Pro 14-inch (M3 Pro/Max, 2023)', 'M3 Max', '36 GB'),
  ('MacBook Pro 14-inch (M3 Pro/Max, 2023)', 'M3 Max', '48 GB'),
  ('MacBook Pro 14-inch (M3 Pro/Max, 2023)', 'M3 Max', '64 GB'),
  ('MacBook Pro 14-inch (M3 Pro/Max, 2023)', 'M3 Max', '96 GB'),
  ('MacBook Pro 14-inch (M3 Pro/Max, 2023)', 'M3 Max', '128 GB'),

  ('MacBook Pro 16-inch (M3 Pro/Max, 2023)', 'M3 Pro', '18 GB'),
  ('MacBook Pro 16-inch (M3 Pro/Max, 2023)', 'M3 Pro', '36 GB'),
  ('MacBook Pro 16-inch (M3 Pro/Max, 2023)', 'M3 Max', '36 GB'),
  ('MacBook Pro 16-inch (M3 Pro/Max, 2023)', 'M3 Max', '48 GB'),
  ('MacBook Pro 16-inch (M3 Pro/Max, 2023)', 'M3 Max', '64 GB'),
  ('MacBook Pro 16-inch (M3 Pro/Max, 2023)', 'M3 Max', '96 GB'),
  ('MacBook Pro 16-inch (M3 Pro/Max, 2023)', 'M3 Max', '128 GB'),

  ('MacBook Pro 14-inch (M4 Pro/Max, 2024)', 'M4 Pro', '24 GB'),
  ('MacBook Pro 14-inch (M4 Pro/Max, 2024)', 'M4 Pro', '48 GB'),
  ('MacBook Pro 14-inch (M4 Pro/Max, 2024)', 'M4 Max', '36 GB'),
  ('MacBook Pro 14-inch (M4 Pro/Max, 2024)', 'M4 Max', '48 GB'),
  ('MacBook Pro 14-inch (M4 Pro/Max, 2024)', 'M4 Max', '64 GB'),
  ('MacBook Pro 14-inch (M4 Pro/Max, 2024)', 'M4 Max', '128 GB'),

  ('MacBook Pro 16-inch (M4 Pro/Max, 2024)', 'M4 Pro', '24 GB'),
  ('MacBook Pro 16-inch (M4 Pro/Max, 2024)', 'M4 Pro', '48 GB'),
  ('MacBook Pro 16-inch (M4 Pro/Max, 2024)', 'M4 Max', '36 GB'),
  ('MacBook Pro 16-inch (M4 Pro/Max, 2024)', 'M4 Max', '48 GB'),
  ('MacBook Pro 16-inch (M4 Pro/Max, 2024)', 'M4 Max', '64 GB'),
  ('MacBook Pro 16-inch (M4 Pro/Max, 2024)', 'M4 Max', '128 GB'),

  ('MacBook Pro 14-inch (M5 Pro/Max, 2026)', 'M5 Pro', '24 GB'),
  ('MacBook Pro 14-inch (M5 Pro/Max, 2026)', 'M5 Pro', '48 GB'),
  ('MacBook Pro 14-inch (M5 Pro/Max, 2026)', 'M5 Pro', '64 GB'),
  ('MacBook Pro 14-inch (M5 Pro/Max, 2026)', 'M5 Max', '36 GB'),
  ('MacBook Pro 14-inch (M5 Pro/Max, 2026)', 'M5 Max', '48 GB'),
  ('MacBook Pro 14-inch (M5 Pro/Max, 2026)', 'M5 Max', '64 GB'),
  ('MacBook Pro 14-inch (M5 Pro/Max, 2026)', 'M5 Max', '128 GB'),

  ('MacBook Pro 16-inch (M5 Pro/Max, 2026)', 'M5 Pro', '24 GB'),
  ('MacBook Pro 16-inch (M5 Pro/Max, 2026)', 'M5 Pro', '48 GB'),
  ('MacBook Pro 16-inch (M5 Pro/Max, 2026)', 'M5 Pro', '64 GB'),
  ('MacBook Pro 16-inch (M5 Pro/Max, 2026)', 'M5 Max', '36 GB'),
  ('MacBook Pro 16-inch (M5 Pro/Max, 2026)', 'M5 Max', '48 GB'),
  ('MacBook Pro 16-inch (M5 Pro/Max, 2026)', 'M5 Max', '64 GB'),
  ('MacBook Pro 16-inch (M5 Pro/Max, 2026)', 'M5 Max', '128 GB')
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
  'memory',
  c.memory
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
