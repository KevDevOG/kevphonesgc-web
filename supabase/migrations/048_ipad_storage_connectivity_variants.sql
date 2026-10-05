BEGIN;

WITH variant_data (category, model_name, variant_type, value, sort_order) AS (
  VALUES
  -- iPad (8th generation)
  ('ipad', 'iPad (8th generation)', 'storage', '32 GB', 1),
  ('ipad', 'iPad (8th generation)', 'storage', '128 GB', 2),
  ('ipad', 'iPad (8th generation)', 'connectivity', 'Wi-Fi', 1),
  ('ipad', 'iPad (8th generation)', 'connectivity', 'Wi-Fi + Cellular', 2),

  -- iPad (9th generation)
  ('ipad', 'iPad (9th generation)', 'storage', '64 GB', 1),
  ('ipad', 'iPad (9th generation)', 'storage', '256 GB', 2),
  ('ipad', 'iPad (9th generation)', 'connectivity', 'Wi-Fi', 1),
  ('ipad', 'iPad (9th generation)', 'connectivity', 'Wi-Fi + Cellular', 2),

  -- iPad (10th generation)
  ('ipad', 'iPad (10th generation)', 'storage', '64 GB', 1),
  ('ipad', 'iPad (10th generation)', 'storage', '256 GB', 2),
  ('ipad', 'iPad (10th generation)', 'connectivity', 'Wi-Fi', 1),
  ('ipad', 'iPad (10th generation)', 'connectivity', 'Wi-Fi + Cellular', 2),

  -- iPad (A16)
  ('ipad', 'iPad (A16)', 'storage', '128 GB', 1),
  ('ipad', 'iPad (A16)', 'storage', '256 GB', 2),
  ('ipad', 'iPad (A16)', 'storage', '512 GB', 3),
  ('ipad', 'iPad (A16)', 'connectivity', 'Wi-Fi', 1),
  ('ipad', 'iPad (A16)', 'connectivity', 'Wi-Fi + Cellular', 2),

  -- iPad mini (6th generation)
  ('ipad', 'iPad mini (6th generation)', 'storage', '64 GB', 1),
  ('ipad', 'iPad mini (6th generation)', 'storage', '256 GB', 2),
  ('ipad', 'iPad mini (6th generation)', 'connectivity', 'Wi-Fi', 1),
  ('ipad', 'iPad mini (6th generation)', 'connectivity', 'Wi-Fi + Cellular', 2),

  -- iPad mini (A17 Pro)
  ('ipad', 'iPad mini (A17 Pro)', 'storage', '128 GB', 1),
  ('ipad', 'iPad mini (A17 Pro)', 'storage', '256 GB', 2),
  ('ipad', 'iPad mini (A17 Pro)', 'storage', '512 GB', 3),
  ('ipad', 'iPad mini (A17 Pro)', 'connectivity', 'Wi-Fi', 1),
  ('ipad', 'iPad mini (A17 Pro)', 'connectivity', 'Wi-Fi + Cellular', 2),

  -- iPad Air (4th generation)
  ('ipad', 'iPad Air (4th generation)', 'storage', '64 GB', 1),
  ('ipad', 'iPad Air (4th generation)', 'storage', '256 GB', 2),
  ('ipad', 'iPad Air (4th generation)', 'connectivity', 'Wi-Fi', 1),
  ('ipad', 'iPad Air (4th generation)', 'connectivity', 'Wi-Fi + Cellular', 2),

  -- iPad Air (5th generation)
  ('ipad', 'iPad Air (5th generation)', 'storage', '64 GB', 1),
  ('ipad', 'iPad Air (5th generation)', 'storage', '256 GB', 2),
  ('ipad', 'iPad Air (5th generation)', 'connectivity', 'Wi-Fi', 1),
  ('ipad', 'iPad Air (5th generation)', 'connectivity', 'Wi-Fi + Cellular', 2),

  -- iPad Air 11-inch (M2)
  ('ipad', 'iPad Air 11-inch (M2)', 'storage', '128 GB', 1),
  ('ipad', 'iPad Air 11-inch (M2)', 'storage', '256 GB', 2),
  ('ipad', 'iPad Air 11-inch (M2)', 'storage', '512 GB', 3),
  ('ipad', 'iPad Air 11-inch (M2)', 'storage', '1 TB', 4),
  ('ipad', 'iPad Air 11-inch (M2)', 'connectivity', 'Wi-Fi', 1),
  ('ipad', 'iPad Air 11-inch (M2)', 'connectivity', 'Wi-Fi + Cellular', 2),

  -- iPad Air 13-inch (M2)
  ('ipad', 'iPad Air 13-inch (M2)', 'storage', '128 GB', 1),
  ('ipad', 'iPad Air 13-inch (M2)', 'storage', '256 GB', 2),
  ('ipad', 'iPad Air 13-inch (M2)', 'storage', '512 GB', 3),
  ('ipad', 'iPad Air 13-inch (M2)', 'storage', '1 TB', 4),
  ('ipad', 'iPad Air 13-inch (M2)', 'connectivity', 'Wi-Fi', 1),
  ('ipad', 'iPad Air 13-inch (M2)', 'connectivity', 'Wi-Fi + Cellular', 2),

  -- iPad Air 11-inch (M3)
  ('ipad', 'iPad Air 11-inch (M3)', 'storage', '128 GB', 1),
  ('ipad', 'iPad Air 11-inch (M3)', 'storage', '256 GB', 2),
  ('ipad', 'iPad Air 11-inch (M3)', 'storage', '512 GB', 3),
  ('ipad', 'iPad Air 11-inch (M3)', 'storage', '1 TB', 4),
  ('ipad', 'iPad Air 11-inch (M3)', 'connectivity', 'Wi-Fi', 1),
  ('ipad', 'iPad Air 11-inch (M3)', 'connectivity', 'Wi-Fi + Cellular', 2),

  -- iPad Air 13-inch (M3)
  ('ipad', 'iPad Air 13-inch (M3)', 'storage', '128 GB', 1),
  ('ipad', 'iPad Air 13-inch (M3)', 'storage', '256 GB', 2),
  ('ipad', 'iPad Air 13-inch (M3)', 'storage', '512 GB', 3),
  ('ipad', 'iPad Air 13-inch (M3)', 'storage', '1 TB', 4),
  ('ipad', 'iPad Air 13-inch (M3)', 'connectivity', 'Wi-Fi', 1),
  ('ipad', 'iPad Air 13-inch (M3)', 'connectivity', 'Wi-Fi + Cellular', 2),

  -- iPad Air 11-inch (M4)
  ('ipad', 'iPad Air 11-inch (M4)', 'storage', '128 GB', 1),
  ('ipad', 'iPad Air 11-inch (M4)', 'storage', '256 GB', 2),
  ('ipad', 'iPad Air 11-inch (M4)', 'storage', '512 GB', 3),
  ('ipad', 'iPad Air 11-inch (M4)', 'storage', '1 TB', 4),
  ('ipad', 'iPad Air 11-inch (M4)', 'connectivity', 'Wi-Fi', 1),
  ('ipad', 'iPad Air 11-inch (M4)', 'connectivity', 'Wi-Fi + Cellular', 2),

  -- iPad Air 13-inch (M4)
  ('ipad', 'iPad Air 13-inch (M4)', 'storage', '128 GB', 1),
  ('ipad', 'iPad Air 13-inch (M4)', 'storage', '256 GB', 2),
  ('ipad', 'iPad Air 13-inch (M4)', 'storage', '512 GB', 3),
  ('ipad', 'iPad Air 13-inch (M4)', 'storage', '1 TB', 4),
  ('ipad', 'iPad Air 13-inch (M4)', 'connectivity', 'Wi-Fi', 1),
  ('ipad', 'iPad Air 13-inch (M4)', 'connectivity', 'Wi-Fi + Cellular', 2),

  -- iPad Pro 11-inch (2nd generation)
  ('ipad', 'iPad Pro 11-inch (2nd generation)', 'storage', '128 GB', 1),
  ('ipad', 'iPad Pro 11-inch (2nd generation)', 'storage', '256 GB', 2),
  ('ipad', 'iPad Pro 11-inch (2nd generation)', 'storage', '512 GB', 3),
  ('ipad', 'iPad Pro 11-inch (2nd generation)', 'storage', '1 TB', 4),
  ('ipad', 'iPad Pro 11-inch (2nd generation)', 'connectivity', 'Wi-Fi', 1),
  ('ipad', 'iPad Pro 11-inch (2nd generation)', 'connectivity', 'Wi-Fi + Cellular', 2),

  -- iPad Pro 11-inch (M1)
  ('ipad', 'iPad Pro 11-inch (M1)', 'storage', '128 GB', 1),
  ('ipad', 'iPad Pro 11-inch (M1)', 'storage', '256 GB', 2),
  ('ipad', 'iPad Pro 11-inch (M1)', 'storage', '512 GB', 3),
  ('ipad', 'iPad Pro 11-inch (M1)', 'storage', '1 TB', 4),
  ('ipad', 'iPad Pro 11-inch (M1)', 'storage', '2 TB', 5),
  ('ipad', 'iPad Pro 11-inch (M1)', 'connectivity', 'Wi-Fi', 1),
  ('ipad', 'iPad Pro 11-inch (M1)', 'connectivity', 'Wi-Fi + Cellular', 2),

  -- iPad Pro 11-inch (M2)
  ('ipad', 'iPad Pro 11-inch (M2)', 'storage', '128 GB', 1),
  ('ipad', 'iPad Pro 11-inch (M2)', 'storage', '256 GB', 2),
  ('ipad', 'iPad Pro 11-inch (M2)', 'storage', '512 GB', 3),
  ('ipad', 'iPad Pro 11-inch (M2)', 'storage', '1 TB', 4),
  ('ipad', 'iPad Pro 11-inch (M2)', 'storage', '2 TB', 5),
  ('ipad', 'iPad Pro 11-inch (M2)', 'connectivity', 'Wi-Fi', 1),
  ('ipad', 'iPad Pro 11-inch (M2)', 'connectivity', 'Wi-Fi + Cellular', 2),

  -- iPad Pro 11-inch (M4)
  ('ipad', 'iPad Pro 11-inch (M4)', 'storage', '256 GB', 1),
  ('ipad', 'iPad Pro 11-inch (M4)', 'storage', '512 GB', 2),
  ('ipad', 'iPad Pro 11-inch (M4)', 'storage', '1 TB', 3),
  ('ipad', 'iPad Pro 11-inch (M4)', 'storage', '2 TB', 4),
  ('ipad', 'iPad Pro 11-inch (M4)', 'connectivity', 'Wi-Fi', 1),
  ('ipad', 'iPad Pro 11-inch (M4)', 'connectivity', 'Wi-Fi + Cellular', 2),

  -- iPad Pro 11-inch (M5)
  ('ipad', 'iPad Pro 11-inch (M5)', 'storage', '256 GB', 1),
  ('ipad', 'iPad Pro 11-inch (M5)', 'storage', '512 GB', 2),
  ('ipad', 'iPad Pro 11-inch (M5)', 'storage', '1 TB', 3),
  ('ipad', 'iPad Pro 11-inch (M5)', 'storage', '2 TB', 4),
  ('ipad', 'iPad Pro 11-inch (M5)', 'connectivity', 'Wi-Fi', 1),
  ('ipad', 'iPad Pro 11-inch (M5)', 'connectivity', 'Wi-Fi + Cellular', 2),

  -- iPad Pro 12.9-inch (4th generation)
  ('ipad', 'iPad Pro 12.9-inch (4th generation)', 'storage', '128 GB', 1),
  ('ipad', 'iPad Pro 12.9-inch (4th generation)', 'storage', '256 GB', 2),
  ('ipad', 'iPad Pro 12.9-inch (4th generation)', 'storage', '512 GB', 3),
  ('ipad', 'iPad Pro 12.9-inch (4th generation)', 'storage', '1 TB', 4),
  ('ipad', 'iPad Pro 12.9-inch (4th generation)', 'connectivity', 'Wi-Fi', 1),
  ('ipad', 'iPad Pro 12.9-inch (4th generation)', 'connectivity', 'Wi-Fi + Cellular', 2),

  -- iPad Pro 12.9-inch (M1)
  ('ipad', 'iPad Pro 12.9-inch (M1)', 'storage', '128 GB', 1),
  ('ipad', 'iPad Pro 12.9-inch (M1)', 'storage', '256 GB', 2),
  ('ipad', 'iPad Pro 12.9-inch (M1)', 'storage', '512 GB', 3),
  ('ipad', 'iPad Pro 12.9-inch (M1)', 'storage', '1 TB', 4),
  ('ipad', 'iPad Pro 12.9-inch (M1)', 'storage', '2 TB', 5),
  ('ipad', 'iPad Pro 12.9-inch (M1)', 'connectivity', 'Wi-Fi', 1),
  ('ipad', 'iPad Pro 12.9-inch (M1)', 'connectivity', 'Wi-Fi + Cellular', 2),

  -- iPad Pro 12.9-inch (M2)
  ('ipad', 'iPad Pro 12.9-inch (M2)', 'storage', '128 GB', 1),
  ('ipad', 'iPad Pro 12.9-inch (M2)', 'storage', '256 GB', 2),
  ('ipad', 'iPad Pro 12.9-inch (M2)', 'storage', '512 GB', 3),
  ('ipad', 'iPad Pro 12.9-inch (M2)', 'storage', '1 TB', 4),
  ('ipad', 'iPad Pro 12.9-inch (M2)', 'storage', '2 TB', 5),
  ('ipad', 'iPad Pro 12.9-inch (M2)', 'connectivity', 'Wi-Fi', 1),
  ('ipad', 'iPad Pro 12.9-inch (M2)', 'connectivity', 'Wi-Fi + Cellular', 2),

  -- iPad Pro 13-inch (M4)
  ('ipad', 'iPad Pro 13-inch (M4)', 'storage', '256 GB', 1),
  ('ipad', 'iPad Pro 13-inch (M4)', 'storage', '512 GB', 2),
  ('ipad', 'iPad Pro 13-inch (M4)', 'storage', '1 TB', 3),
  ('ipad', 'iPad Pro 13-inch (M4)', 'storage', '2 TB', 4),
  ('ipad', 'iPad Pro 13-inch (M4)', 'connectivity', 'Wi-Fi', 1),
  ('ipad', 'iPad Pro 13-inch (M4)', 'connectivity', 'Wi-Fi + Cellular', 2),

  -- iPad Pro 13-inch (M5)
  ('ipad', 'iPad Pro 13-inch (M5)', 'storage', '256 GB', 1),
  ('ipad', 'iPad Pro 13-inch (M5)', 'storage', '512 GB', 2),
  ('ipad', 'iPad Pro 13-inch (M5)', 'storage', '1 TB', 3),
  ('ipad', 'iPad Pro 13-inch (M5)', 'storage', '2 TB', 4),
  ('ipad', 'iPad Pro 13-inch (M5)', 'connectivity', 'Wi-Fi', 1),
  ('ipad', 'iPad Pro 13-inch (M5)', 'connectivity', 'Wi-Fi + Cellular', 2)
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
