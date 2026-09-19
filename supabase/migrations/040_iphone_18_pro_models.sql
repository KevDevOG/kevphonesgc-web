BEGIN;

INSERT INTO public.device_models (category, brand, name, active, supports_battery_health, supports_cycles, sort_order)
VALUES 
  ('iphone', 'Apple', 'iPhone 18 Pro', true, true, true, 32),
  ('iphone', 'Apple', 'iPhone 18 Pro Max', true, true, true, 33)
ON CONFLICT (category, name)
DO UPDATE SET
  brand = EXCLUDED.brand,
  active = EXCLUDED.active,
  supports_battery_health = EXCLUDED.supports_battery_health,
  supports_cycles = EXCLUDED.supports_cycles,
  sort_order = EXCLUDED.sort_order;

WITH new_models AS (
  SELECT id, name FROM public.device_models WHERE category = 'iphone' AND name IN ('iPhone 18 Pro', 'iPhone 18 Pro Max')
)
INSERT INTO public.device_model_variants (model_id, variant_type, value, sort_order, active)
SELECT m.id, v.variant_type, v.value, v.sort_order, true
FROM new_models m
CROSS JOIN (
  VALUES 
    ('storage', '256 GB', 1),
    ('storage', '512 GB', 2),
    ('storage', '1 TB', 3),
    ('storage', '2 TB', 4),
    ('color', 'Black', 1),
    ('color', 'Silver', 2),
    ('color', 'Glacier', 3),
    ('color', 'Burgundy', 4)
) AS v(variant_type, value, sort_order)
ON CONFLICT (model_id, variant_type, value)
DO UPDATE SET
  sort_order = EXCLUDED.sort_order,
  active = EXCLUDED.active;

COMMIT;
