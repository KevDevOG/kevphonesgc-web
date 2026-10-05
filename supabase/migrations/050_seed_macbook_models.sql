BEGIN;

WITH model_data (category, brand, name, supports_battery_health, supports_cycles, active, sort_order) AS (
  VALUES
  -- MacBook Air
  ('macbook', 'Apple', 'MacBook Air 13-inch (Intel, 2020)', true, true, true, 100),
  ('macbook', 'Apple', 'MacBook Air 13-inch (M1, 2020)', true, true, true, 101),
  ('macbook', 'Apple', 'MacBook Air 13-inch (M2, 2022)', true, true, true, 102),
  ('macbook', 'Apple', 'MacBook Air 15-inch (M2, 2023)', true, true, true, 103),
  ('macbook', 'Apple', 'MacBook Air 13-inch (M3, 2024)', true, true, true, 104),
  ('macbook', 'Apple', 'MacBook Air 15-inch (M3, 2024)', true, true, true, 105),
  ('macbook', 'Apple', 'MacBook Air 13-inch (M4, 2025)', true, true, true, 106),
  ('macbook', 'Apple', 'MacBook Air 15-inch (M4, 2025)', true, true, true, 107),
  ('macbook', 'Apple', 'MacBook Air 13-inch (M5, 2026)', true, true, true, 108),
  ('macbook', 'Apple', 'MacBook Air 15-inch (M5, 2026)', true, true, true, 109),

  -- MacBook Neo
  ('macbook', 'Apple', 'MacBook Neo 13-inch (A18 Pro, 2026)', true, true, true, 200),

  -- MacBook Pro
  ('macbook', 'Apple', 'MacBook Pro 13-inch (Intel, 2 Thunderbolt 3, 2020)', true, true, true, 300),
  ('macbook', 'Apple', 'MacBook Pro 13-inch (Intel, 4 Thunderbolt 3, 2020)', true, true, true, 301),
  ('macbook', 'Apple', 'MacBook Pro 13-inch (M1, 2020)', true, true, true, 302),
  ('macbook', 'Apple', 'MacBook Pro 14-inch (M1 Pro/Max, 2021)', true, true, true, 303),
  ('macbook', 'Apple', 'MacBook Pro 16-inch (M1 Pro/Max, 2021)', true, true, true, 304),
  ('macbook', 'Apple', 'MacBook Pro 13-inch (M2, 2022)', true, true, true, 305),
  ('macbook', 'Apple', 'MacBook Pro 14-inch (M2 Pro/Max, 2023)', true, true, true, 306),
  ('macbook', 'Apple', 'MacBook Pro 16-inch (M2 Pro/Max, 2023)', true, true, true, 307),
  ('macbook', 'Apple', 'MacBook Pro 14-inch (M3, 2023)', true, true, true, 308),
  ('macbook', 'Apple', 'MacBook Pro 14-inch (M3 Pro/Max, 2023)', true, true, true, 309),
  ('macbook', 'Apple', 'MacBook Pro 16-inch (M3 Pro/Max, 2023)', true, true, true, 310),
  ('macbook', 'Apple', 'MacBook Pro 14-inch (M4, 2024)', true, true, true, 311),
  ('macbook', 'Apple', 'MacBook Pro 14-inch (M4 Pro/Max, 2024)', true, true, true, 312),
  ('macbook', 'Apple', 'MacBook Pro 16-inch (M4 Pro/Max, 2024)', true, true, true, 313),
  ('macbook', 'Apple', 'MacBook Pro 14-inch (M5, 2025)', true, true, true, 314),
  ('macbook', 'Apple', 'MacBook Pro 14-inch (M5 Pro/Max, 2026)', true, true, true, 315),
  ('macbook', 'Apple', 'MacBook Pro 16-inch (M5 Pro/Max, 2026)', true, true, true, 316)
)
INSERT INTO public.device_models (category, brand, name, supports_battery_health, supports_cycles, active, sort_order)
SELECT category, brand, name, supports_battery_health, supports_cycles, active, sort_order
FROM model_data
ON CONFLICT (category, name)
DO UPDATE SET
  brand = EXCLUDED.brand,
  supports_battery_health = EXCLUDED.supports_battery_health,
  supports_cycles = EXCLUDED.supports_cycles,
  active = EXCLUDED.active,
  sort_order = EXCLUDED.sort_order;

COMMIT;
