BEGIN;

WITH variant_data (category, model_name, variant_type, value, sort_order) AS (
  VALUES
  -- iPad (8th generation)
  ('ipad', 'iPad (8th generation)', 'color', 'Silver', 1),
  ('ipad', 'iPad (8th generation)', 'color', 'Space Gray', 2),
  ('ipad', 'iPad (8th generation)', 'color', 'Gold', 3),

  -- iPad (9th generation)
  ('ipad', 'iPad (9th generation)', 'color', 'Silver', 1),
  ('ipad', 'iPad (9th generation)', 'color', 'Space Gray', 2),

  -- iPad (10th generation)
  ('ipad', 'iPad (10th generation)', 'color', 'Silver', 1),
  ('ipad', 'iPad (10th generation)', 'color', 'Blue', 2),
  ('ipad', 'iPad (10th generation)', 'color', 'Pink', 3),
  ('ipad', 'iPad (10th generation)', 'color', 'Yellow', 4),

  -- iPad (A16)
  ('ipad', 'iPad (A16)', 'color', 'Silver', 1),
  ('ipad', 'iPad (A16)', 'color', 'Blue', 2),
  ('ipad', 'iPad (A16)', 'color', 'Pink', 3),
  ('ipad', 'iPad (A16)', 'color', 'Yellow', 4),

  -- iPad mini (6th generation)
  ('ipad', 'iPad mini (6th generation)', 'color', 'Space Gray', 1),
  ('ipad', 'iPad mini (6th generation)', 'color', 'Pink', 2),
  ('ipad', 'iPad mini (6th generation)', 'color', 'Purple', 3),
  ('ipad', 'iPad mini (6th generation)', 'color', 'Starlight', 4),

  -- iPad mini (A17 Pro)
  ('ipad', 'iPad mini (A17 Pro)', 'color', 'Blue', 1),
  ('ipad', 'iPad mini (A17 Pro)', 'color', 'Purple', 2),
  ('ipad', 'iPad mini (A17 Pro)', 'color', 'Starlight', 3),
  ('ipad', 'iPad mini (A17 Pro)', 'color', 'Space Gray', 4),

  -- iPad Air (4th generation)
  ('ipad', 'iPad Air (4th generation)', 'color', 'Silver', 1),
  ('ipad', 'iPad Air (4th generation)', 'color', 'Space Gray', 2),
  ('ipad', 'iPad Air (4th generation)', 'color', 'Rose Gold', 3),
  ('ipad', 'iPad Air (4th generation)', 'color', 'Green', 4),
  ('ipad', 'iPad Air (4th generation)', 'color', 'Sky Blue', 5),

  -- iPad Air (5th generation)
  ('ipad', 'iPad Air (5th generation)', 'color', 'Space Gray', 1),
  ('ipad', 'iPad Air (5th generation)', 'color', 'Starlight', 2),
  ('ipad', 'iPad Air (5th generation)', 'color', 'Pink', 3),
  ('ipad', 'iPad Air (5th generation)', 'color', 'Purple', 4),
  ('ipad', 'iPad Air (5th generation)', 'color', 'Blue', 5),

  -- iPad Air 11-inch (M2)
  ('ipad', 'iPad Air 11-inch (M2)', 'color', 'Blue', 1),
  ('ipad', 'iPad Air 11-inch (M2)', 'color', 'Purple', 2),
  ('ipad', 'iPad Air 11-inch (M2)', 'color', 'Starlight', 3),
  ('ipad', 'iPad Air 11-inch (M2)', 'color', 'Space Gray', 4),

  -- iPad Air 13-inch (M2)
  ('ipad', 'iPad Air 13-inch (M2)', 'color', 'Blue', 1),
  ('ipad', 'iPad Air 13-inch (M2)', 'color', 'Purple', 2),
  ('ipad', 'iPad Air 13-inch (M2)', 'color', 'Starlight', 3),
  ('ipad', 'iPad Air 13-inch (M2)', 'color', 'Space Gray', 4),

  -- iPad Air 11-inch (M3)
  ('ipad', 'iPad Air 11-inch (M3)', 'color', 'Blue', 1),
  ('ipad', 'iPad Air 11-inch (M3)', 'color', 'Purple', 2),
  ('ipad', 'iPad Air 11-inch (M3)', 'color', 'Starlight', 3),
  ('ipad', 'iPad Air 11-inch (M3)', 'color', 'Space Gray', 4),

  -- iPad Air 13-inch (M3)
  ('ipad', 'iPad Air 13-inch (M3)', 'color', 'Blue', 1),
  ('ipad', 'iPad Air 13-inch (M3)', 'color', 'Purple', 2),
  ('ipad', 'iPad Air 13-inch (M3)', 'color', 'Starlight', 3),
  ('ipad', 'iPad Air 13-inch (M3)', 'color', 'Space Gray', 4),

  -- iPad Air 11-inch (M4)
  ('ipad', 'iPad Air 11-inch (M4)', 'color', 'Blue', 1),
  ('ipad', 'iPad Air 11-inch (M4)', 'color', 'Purple', 2),
  ('ipad', 'iPad Air 11-inch (M4)', 'color', 'Starlight', 3),
  ('ipad', 'iPad Air 11-inch (M4)', 'color', 'Space Gray', 4),

  -- iPad Air 13-inch (M4)
  ('ipad', 'iPad Air 13-inch (M4)', 'color', 'Blue', 1),
  ('ipad', 'iPad Air 13-inch (M4)', 'color', 'Purple', 2),
  ('ipad', 'iPad Air 13-inch (M4)', 'color', 'Starlight', 3),
  ('ipad', 'iPad Air 13-inch (M4)', 'color', 'Space Gray', 4),

  -- iPad Pro 11-inch (2nd generation)
  ('ipad', 'iPad Pro 11-inch (2nd generation)', 'color', 'Silver', 1),
  ('ipad', 'iPad Pro 11-inch (2nd generation)', 'color', 'Space Gray', 2),

  -- iPad Pro 11-inch (M1)
  ('ipad', 'iPad Pro 11-inch (M1)', 'color', 'Silver', 1),
  ('ipad', 'iPad Pro 11-inch (M1)', 'color', 'Space Gray', 2),

  -- iPad Pro 11-inch (M2)
  ('ipad', 'iPad Pro 11-inch (M2)', 'color', 'Silver', 1),
  ('ipad', 'iPad Pro 11-inch (M2)', 'color', 'Space Gray', 2),

  -- iPad Pro 11-inch (M4)
  ('ipad', 'iPad Pro 11-inch (M4)', 'color', 'Silver', 1),
  ('ipad', 'iPad Pro 11-inch (M4)', 'color', 'Space Black', 2),

  -- iPad Pro 11-inch (M5)
  ('ipad', 'iPad Pro 11-inch (M5)', 'color', 'Silver', 1),
  ('ipad', 'iPad Pro 11-inch (M5)', 'color', 'Space Black', 2),

  -- iPad Pro 12.9-inch (4th generation)
  ('ipad', 'iPad Pro 12.9-inch (4th generation)', 'color', 'Silver', 1),
  ('ipad', 'iPad Pro 12.9-inch (4th generation)', 'color', 'Space Gray', 2),

  -- iPad Pro 12.9-inch (M1)
  ('ipad', 'iPad Pro 12.9-inch (M1)', 'color', 'Silver', 1),
  ('ipad', 'iPad Pro 12.9-inch (M1)', 'color', 'Space Gray', 2),

  -- iPad Pro 12.9-inch (M2)
  ('ipad', 'iPad Pro 12.9-inch (M2)', 'color', 'Silver', 1),
  ('ipad', 'iPad Pro 12.9-inch (M2)', 'color', 'Space Gray', 2),

  -- iPad Pro 13-inch (M4)
  ('ipad', 'iPad Pro 13-inch (M4)', 'color', 'Silver', 1),
  ('ipad', 'iPad Pro 13-inch (M4)', 'color', 'Space Black', 2),

  -- iPad Pro 13-inch (M5)
  ('ipad', 'iPad Pro 13-inch (M5)', 'color', 'Silver', 1),
  ('ipad', 'iPad Pro 13-inch (M5)', 'color', 'Space Black', 2)
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
