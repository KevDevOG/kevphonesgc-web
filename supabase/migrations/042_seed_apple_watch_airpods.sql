BEGIN;

-- Apple Watch Models
INSERT INTO public.device_models (category, brand, name, active, supports_battery_health, supports_cycles, sort_order)
VALUES 
    ('apple_watch', 'Apple', 'Apple Watch Series 6', true, true, false, 1),
    ('apple_watch', 'Apple', 'Apple Watch SE', true, true, false, 2),
    ('apple_watch', 'Apple', 'Apple Watch Series 7', true, true, false, 3),
    ('apple_watch', 'Apple', 'Apple Watch SE 2', true, true, false, 4),
    ('apple_watch', 'Apple', 'Apple Watch Series 8', true, true, false, 5),
    ('apple_watch', 'Apple', 'Apple Watch Ultra', true, true, false, 6),
    ('apple_watch', 'Apple', 'Apple Watch Series 9', true, true, false, 7),
    ('apple_watch', 'Apple', 'Apple Watch Ultra 2', true, true, false, 8),
    ('apple_watch', 'Apple', 'Apple Watch Series 10', true, true, false, 9),
    ('apple_watch', 'Apple', 'Apple Watch Series 11', true, true, false, 10),
    ('apple_watch', 'Apple', 'Apple Watch Ultra 3', true, true, false, 11),
    ('apple_watch', 'Apple', 'Apple Watch SE 3', true, true, false, 12),
    ('apple_watch', 'Apple', 'Apple Watch Series 12', true, true, false, 13),
    ('apple_watch', 'Apple', 'Apple Watch Ultra 4', true, true, false, 14)
ON CONFLICT (category, name) 
DO UPDATE SET 
    brand = EXCLUDED.brand,
    active = EXCLUDED.active,
    supports_battery_health = EXCLUDED.supports_battery_health,
    supports_cycles = EXCLUDED.supports_cycles,
    sort_order = EXCLUDED.sort_order;

-- AirPods Models
INSERT INTO public.device_models (category, brand, name, active, supports_battery_health, supports_cycles, sort_order)
VALUES 
    ('airpods', 'Apple', 'AirPods Max 1 (Lightning)', true, false, false, 1),
    ('airpods', 'Apple', 'AirPods 3', true, false, false, 2),
    ('airpods', 'Apple', 'AirPods Pro 2 (Lightning)', true, false, false, 3),
    ('airpods', 'Apple', 'AirPods Pro 2 (USB-C)', true, false, false, 4),
    ('airpods', 'Apple', 'AirPods 4', true, false, false, 5),
    ('airpods', 'Apple', 'AirPods 4 (ANC)', true, false, false, 6),
    ('airpods', 'Apple', 'AirPods Pro 3', true, false, false, 7),
    ('airpods', 'Apple', 'AirPods 5', true, false, false, 8),
    ('airpods', 'Apple', 'AirPods 5 (Wireless Charging Case)', true, false, false, 9),
    ('airpods', 'Apple', 'AirPods Max 1 (USB-C)', true, false, false, 10),
    ('airpods', 'Apple', 'AirPods Max 2', true, false, false, 11)
ON CONFLICT (category, name) 
DO UPDATE SET 
    brand = EXCLUDED.brand,
    active = EXCLUDED.active,
    supports_battery_health = EXCLUDED.supports_battery_health,
    supports_cycles = EXCLUDED.supports_cycles,
    sort_order = EXCLUDED.sort_order;

COMMIT;
