BEGIN;

WITH color_data (category, model_name, variant_type, value, sort_order) AS (
  VALUES
  -- MacBook Air 13-inch (Intel, 2020)
  ('macbook', 'MacBook Air 13-inch (Intel, 2020)', 'color', 'Plata', 1),
  ('macbook', 'MacBook Air 13-inch (Intel, 2020)', 'color', 'Gris espacial', 2),
  ('macbook', 'MacBook Air 13-inch (Intel, 2020)', 'color', 'Oro', 3),

  -- MacBook Air 13-inch (M1, 2020)
  ('macbook', 'MacBook Air 13-inch (M1, 2020)', 'color', 'Plata', 1),
  ('macbook', 'MacBook Air 13-inch (M1, 2020)', 'color', 'Gris espacial', 2),
  ('macbook', 'MacBook Air 13-inch (M1, 2020)', 'color', 'Oro', 3),

  -- MacBook Air 13-inch (M2, 2022)
  ('macbook', 'MacBook Air 13-inch (M2, 2022)', 'color', 'Plata', 1),
  ('macbook', 'MacBook Air 13-inch (M2, 2022)', 'color', 'Blanco estrella', 2),
  ('macbook', 'MacBook Air 13-inch (M2, 2022)', 'color', 'Gris espacial', 3),
  ('macbook', 'MacBook Air 13-inch (M2, 2022)', 'color', 'Medianoche', 4),

  -- MacBook Air 15-inch (M2, 2023)
  ('macbook', 'MacBook Air 15-inch (M2, 2023)', 'color', 'Plata', 1),
  ('macbook', 'MacBook Air 15-inch (M2, 2023)', 'color', 'Blanco estrella', 2),
  ('macbook', 'MacBook Air 15-inch (M2, 2023)', 'color', 'Gris espacial', 3),
  ('macbook', 'MacBook Air 15-inch (M2, 2023)', 'color', 'Medianoche', 4),

  -- MacBook Air 13-inch (M3, 2024)
  ('macbook', 'MacBook Air 13-inch (M3, 2024)', 'color', 'Plata', 1),
  ('macbook', 'MacBook Air 13-inch (M3, 2024)', 'color', 'Blanco estrella', 2),
  ('macbook', 'MacBook Air 13-inch (M3, 2024)', 'color', 'Gris espacial', 3),
  ('macbook', 'MacBook Air 13-inch (M3, 2024)', 'color', 'Medianoche', 4),

  -- MacBook Air 15-inch (M3, 2024)
  ('macbook', 'MacBook Air 15-inch (M3, 2024)', 'color', 'Plata', 1),
  ('macbook', 'MacBook Air 15-inch (M3, 2024)', 'color', 'Blanco estrella', 2),
  ('macbook', 'MacBook Air 15-inch (M3, 2024)', 'color', 'Gris espacial', 3),
  ('macbook', 'MacBook Air 15-inch (M3, 2024)', 'color', 'Medianoche', 4),

  -- MacBook Air 13-inch (M4, 2025)
  ('macbook', 'MacBook Air 13-inch (M4, 2025)', 'color', 'Plata', 1),
  ('macbook', 'MacBook Air 13-inch (M4, 2025)', 'color', 'Blanco estrella', 2),
  ('macbook', 'MacBook Air 13-inch (M4, 2025)', 'color', 'Azul cielo', 3),
  ('macbook', 'MacBook Air 13-inch (M4, 2025)', 'color', 'Medianoche', 4),

  -- MacBook Air 15-inch (M4, 2025)
  ('macbook', 'MacBook Air 15-inch (M4, 2025)', 'color', 'Plata', 1),
  ('macbook', 'MacBook Air 15-inch (M4, 2025)', 'color', 'Blanco estrella', 2),
  ('macbook', 'MacBook Air 15-inch (M4, 2025)', 'color', 'Azul cielo', 3),
  ('macbook', 'MacBook Air 15-inch (M4, 2025)', 'color', 'Medianoche', 4),

  -- MacBook Air 13-inch (M5, 2026)
  ('macbook', 'MacBook Air 13-inch (M5, 2026)', 'color', 'Plata', 1),
  ('macbook', 'MacBook Air 13-inch (M5, 2026)', 'color', 'Blanco estrella', 2),
  ('macbook', 'MacBook Air 13-inch (M5, 2026)', 'color', 'Azul cielo', 3),
  ('macbook', 'MacBook Air 13-inch (M5, 2026)', 'color', 'Medianoche', 4),

  -- MacBook Air 15-inch (M5, 2026)
  ('macbook', 'MacBook Air 15-inch (M5, 2026)', 'color', 'Plata', 1),
  ('macbook', 'MacBook Air 15-inch (M5, 2026)', 'color', 'Blanco estrella', 2),
  ('macbook', 'MacBook Air 15-inch (M5, 2026)', 'color', 'Azul cielo', 3),
  ('macbook', 'MacBook Air 15-inch (M5, 2026)', 'color', 'Medianoche', 4),

  -- MacBook Neo 13-inch (A18 Pro, 2026)
  ('macbook', 'MacBook Neo 13-inch (A18 Pro, 2026)', 'color', 'Plata', 1),
  ('macbook', 'MacBook Neo 13-inch (A18 Pro, 2026)', 'color', 'Rosa nube', 2),
  ('macbook', 'MacBook Neo 13-inch (A18 Pro, 2026)', 'color', 'Cítrico', 3),
  ('macbook', 'MacBook Neo 13-inch (A18 Pro, 2026)', 'color', 'Índigo', 4),

  -- MacBook Pro 13-inch (Intel, 2 Thunderbolt 3, 2020)
  ('macbook', 'MacBook Pro 13-inch (Intel, 2 Thunderbolt 3, 2020)', 'color', 'Plata', 1),
  ('macbook', 'MacBook Pro 13-inch (Intel, 2 Thunderbolt 3, 2020)', 'color', 'Gris espacial', 2),

  -- MacBook Pro 13-inch (Intel, 4 Thunderbolt 3, 2020)
  ('macbook', 'MacBook Pro 13-inch (Intel, 4 Thunderbolt 3, 2020)', 'color', 'Plata', 1),
  ('macbook', 'MacBook Pro 13-inch (Intel, 4 Thunderbolt 3, 2020)', 'color', 'Gris espacial', 2),

  -- MacBook Pro 13-inch (M1, 2020)
  ('macbook', 'MacBook Pro 13-inch (M1, 2020)', 'color', 'Plata', 1),
  ('macbook', 'MacBook Pro 13-inch (M1, 2020)', 'color', 'Gris espacial', 2),

  -- MacBook Pro 14-inch (M1 Pro/Max, 2021)
  ('macbook', 'MacBook Pro 14-inch (M1 Pro/Max, 2021)', 'color', 'Plata', 1),
  ('macbook', 'MacBook Pro 14-inch (M1 Pro/Max, 2021)', 'color', 'Gris espacial', 2),

  -- MacBook Pro 16-inch (M1 Pro/Max, 2021)
  ('macbook', 'MacBook Pro 16-inch (M1 Pro/Max, 2021)', 'color', 'Plata', 1),
  ('macbook', 'MacBook Pro 16-inch (M1 Pro/Max, 2021)', 'color', 'Gris espacial', 2),

  -- MacBook Pro 13-inch (M2, 2022)
  ('macbook', 'MacBook Pro 13-inch (M2, 2022)', 'color', 'Plata', 1),
  ('macbook', 'MacBook Pro 13-inch (M2, 2022)', 'color', 'Gris espacial', 2),

  -- MacBook Pro 14-inch (M2 Pro/Max, 2023)
  ('macbook', 'MacBook Pro 14-inch (M2 Pro/Max, 2023)', 'color', 'Plata', 1),
  ('macbook', 'MacBook Pro 14-inch (M2 Pro/Max, 2023)', 'color', 'Gris espacial', 2),

  -- MacBook Pro 16-inch (M2 Pro/Max, 2023)
  ('macbook', 'MacBook Pro 16-inch (M2 Pro/Max, 2023)', 'color', 'Plata', 1),
  ('macbook', 'MacBook Pro 16-inch (M2 Pro/Max, 2023)', 'color', 'Gris espacial', 2),

  -- MacBook Pro 14-inch (M3, 2023)
  ('macbook', 'MacBook Pro 14-inch (M3, 2023)', 'color', 'Plata', 1),
  ('macbook', 'MacBook Pro 14-inch (M3, 2023)', 'color', 'Gris espacial', 2),

  -- MacBook Pro 14-inch (M3 Pro/Max, 2023)
  ('macbook', 'MacBook Pro 14-inch (M3 Pro/Max, 2023)', 'color', 'Plata', 1),
  ('macbook', 'MacBook Pro 14-inch (M3 Pro/Max, 2023)', 'color', 'Negro espacial', 2),

  -- MacBook Pro 16-inch (M3 Pro/Max, 2023)
  ('macbook', 'MacBook Pro 16-inch (M3 Pro/Max, 2023)', 'color', 'Plata', 1),
  ('macbook', 'MacBook Pro 16-inch (M3 Pro/Max, 2023)', 'color', 'Negro espacial', 2),

  -- MacBook Pro 14-inch (M4, 2024)
  ('macbook', 'MacBook Pro 14-inch (M4, 2024)', 'color', 'Plata', 1),
  ('macbook', 'MacBook Pro 14-inch (M4, 2024)', 'color', 'Negro espacial', 2),

  -- MacBook Pro 14-inch (M4 Pro/Max, 2024)
  ('macbook', 'MacBook Pro 14-inch (M4 Pro/Max, 2024)', 'color', 'Plata', 1),
  ('macbook', 'MacBook Pro 14-inch (M4 Pro/Max, 2024)', 'color', 'Negro espacial', 2),

  -- MacBook Pro 16-inch (M4 Pro/Max, 2024)
  ('macbook', 'MacBook Pro 16-inch (M4 Pro/Max, 2024)', 'color', 'Plata', 1),
  ('macbook', 'MacBook Pro 16-inch (M4 Pro/Max, 2024)', 'color', 'Negro espacial', 2),

  -- MacBook Pro 14-inch (M5, 2025)
  ('macbook', 'MacBook Pro 14-inch (M5, 2025)', 'color', 'Plata', 1),
  ('macbook', 'MacBook Pro 14-inch (M5, 2025)', 'color', 'Negro espacial', 2),

  -- MacBook Pro 14-inch (M5 Pro/Max, 2026)
  ('macbook', 'MacBook Pro 14-inch (M5 Pro/Max, 2026)', 'color', 'Plata', 1),
  ('macbook', 'MacBook Pro 14-inch (M5 Pro/Max, 2026)', 'color', 'Negro espacial', 2),

  -- MacBook Pro 16-inch (M5 Pro/Max, 2026)
  ('macbook', 'MacBook Pro 16-inch (M5 Pro/Max, 2026)', 'color', 'Plata', 1),
  ('macbook', 'MacBook Pro 16-inch (M5 Pro/Max, 2026)', 'color', 'Negro espacial', 2)
)
INSERT INTO public.device_model_variants (model_id, variant_type, value, sort_order, active)
SELECT
  m.id,
  v.variant_type,
  v.value,
  v.sort_order,
  true
FROM color_data v
JOIN public.device_models m
  ON m.category = 'macbook'
  AND m.name = v.model_name
ON CONFLICT (model_id, variant_type, value)
DO UPDATE SET
  sort_order = EXCLUDED.sort_order,
  active = EXCLUDED.active;

COMMIT;
