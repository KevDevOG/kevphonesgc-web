BEGIN;

INSERT INTO public.device_models (
  category,
  brand,
  name,
  supports_battery_health,
  supports_cycles,
  active,
  sort_order
)
VALUES
  -- iPad (Base)
  ('ipad', 'Apple', 'iPad (8th generation)', false, false, true, 100),
  ('ipad', 'Apple', 'iPad (9th generation)', false, false, true, 101),
  ('ipad', 'Apple', 'iPad (10th generation)', false, false, true, 102),
  ('ipad', 'Apple', 'iPad (A16)', false, false, true, 103),

  -- iPad mini
  ('ipad', 'Apple', 'iPad mini (6th generation)', false, false, true, 200),
  ('ipad', 'Apple', 'iPad mini (A17 Pro)', false, false, true, 201),

  -- iPad Air
  ('ipad', 'Apple', 'iPad Air (4th generation)', false, false, true, 300),
  ('ipad', 'Apple', 'iPad Air (5th generation)', false, false, true, 301),
  ('ipad', 'Apple', 'iPad Air 11-inch (M2)', false, false, true, 302),
  ('ipad', 'Apple', 'iPad Air 13-inch (M2)', false, false, true, 303),
  ('ipad', 'Apple', 'iPad Air 11-inch (M3)', false, false, true, 304),
  ('ipad', 'Apple', 'iPad Air 13-inch (M3)', false, false, true, 305),
  ('ipad', 'Apple', 'iPad Air 11-inch (M4)', false, false, true, 306),
  ('ipad', 'Apple', 'iPad Air 13-inch (M4)', false, false, true, 307),

  -- iPad Pro 11-inch
  ('ipad', 'Apple', 'iPad Pro 11-inch (2nd generation)', false, false, true, 400),
  ('ipad', 'Apple', 'iPad Pro 11-inch (M1)', false, false, true, 401),
  ('ipad', 'Apple', 'iPad Pro 11-inch (M2)', false, false, true, 402),
  ('ipad', 'Apple', 'iPad Pro 11-inch (M4)', false, false, true, 403),
  ('ipad', 'Apple', 'iPad Pro 11-inch (M5)', false, false, true, 404),

  -- iPad Pro Large
  ('ipad', 'Apple', 'iPad Pro 12.9-inch (4th generation)', false, false, true, 500),
  ('ipad', 'Apple', 'iPad Pro 12.9-inch (M1)', false, false, true, 501),
  ('ipad', 'Apple', 'iPad Pro 12.9-inch (M2)', false, false, true, 502),
  ('ipad', 'Apple', 'iPad Pro 13-inch (M4)', false, false, true, 503),
  ('ipad', 'Apple', 'iPad Pro 13-inch (M5)', false, false, true, 504)

ON CONFLICT (category, name)
DO UPDATE SET
  brand = EXCLUDED.brand,
  supports_battery_health = EXCLUDED.supports_battery_health,
  supports_cycles = EXCLUDED.supports_cycles,
  active = EXCLUDED.active,
  sort_order = EXCLUDED.sort_order;

COMMIT;
