INSERT INTO device_models (
  category, 
  brand, 
  name, 
  active, 
  supports_battery_health, 
  supports_cycles, 
  sort_order
)
VALUES
  -- IPHONE
  ('iphone', 'Apple', 'iPhone 11', true, true, false, 1),
  ('iphone', 'Apple', 'iPhone 11 Pro', true, true, false, 2),
  ('iphone', 'Apple', 'iPhone 11 Pro Max', true, true, false, 3),
  ('iphone', 'Apple', 'iPhone SE (2nd generation)', true, true, false, 4),
  ('iphone', 'Apple', 'iPhone 12 mini', true, true, false, 5),
  ('iphone', 'Apple', 'iPhone 12', true, true, false, 6),
  ('iphone', 'Apple', 'iPhone 12 Pro', true, true, false, 7),
  ('iphone', 'Apple', 'iPhone 12 Pro Max', true, true, false, 8),
  ('iphone', 'Apple', 'iPhone 13 mini', true, true, false, 9),
  ('iphone', 'Apple', 'iPhone 13', true, true, false, 10),
  ('iphone', 'Apple', 'iPhone 13 Pro', true, true, false, 11),
  ('iphone', 'Apple', 'iPhone 13 Pro Max', true, true, false, 12),
  ('iphone', 'Apple', 'iPhone SE (3rd generation)', true, true, false, 13),
  ('iphone', 'Apple', 'iPhone 14', true, true, false, 14),
  ('iphone', 'Apple', 'iPhone 14 Plus', true, true, false, 15),
  ('iphone', 'Apple', 'iPhone 14 Pro', true, true, false, 16),
  ('iphone', 'Apple', 'iPhone 14 Pro Max', true, true, false, 17),
  ('iphone', 'Apple', 'iPhone 15', true, true, true, 18),
  ('iphone', 'Apple', 'iPhone 15 Plus', true, true, true, 19),
  ('iphone', 'Apple', 'iPhone 15 Pro', true, true, true, 20),
  ('iphone', 'Apple', 'iPhone 15 Pro Max', true, true, true, 21),
  ('iphone', 'Apple', 'iPhone 16', true, true, true, 22),
  ('iphone', 'Apple', 'iPhone 16 Plus', true, true, true, 23),
  ('iphone', 'Apple', 'iPhone 16 Pro', true, true, true, 24),
  ('iphone', 'Apple', 'iPhone 16 Pro Max', true, true, true, 25),
  ('iphone', 'Apple', 'iPhone 16e', true, true, true, 26),
  ('iphone', 'Apple', 'iPhone 17', true, true, true, 27),
  ('iphone', 'Apple', 'iPhone 17 Air', true, true, true, 28),
  ('iphone', 'Apple', 'iPhone 17 Pro', true, true, true, 29),
  ('iphone', 'Apple', 'iPhone 17 Pro Max', true, true, true, 30),
  ('iphone', 'Apple', 'iPhone 17e', true, true, true, 31),
  
  -- PLAYSTATION 5
  ('ps5', 'Sony', 'PlayStation 5', true, false, false, 1),
  ('ps5', 'Sony', 'PlayStation 5 Digital Edition', true, false, false, 2),
  ('ps5', 'Sony', 'PlayStation 5 Slim', true, false, false, 3),
  ('ps5', 'Sony', 'PlayStation 5 Slim Digital Edition', true, false, false, 4),
  ('ps5', 'Sony', 'PlayStation 5 Pro', true, false, false, 5),
  
  -- NINTENDO SWITCH
  ('nintendo_switch', 'Nintendo', 'Nintendo Switch', true, false, false, 1),
  ('nintendo_switch', 'Nintendo', 'Nintendo Switch Lite', true, false, false, 2),
  ('nintendo_switch', 'Nintendo', 'Nintendo Switch OLED', true, false, false, 3),
  ('nintendo_switch', 'Nintendo', 'Nintendo Switch 2', true, false, false, 4)
  
ON CONFLICT (category, name) DO UPDATE SET
  brand = EXCLUDED.brand,
  active = EXCLUDED.active,
  supports_battery_health = EXCLUDED.supports_battery_health,
  supports_cycles = EXCLUDED.supports_cycles,
  sort_order = EXCLUDED.sort_order;
