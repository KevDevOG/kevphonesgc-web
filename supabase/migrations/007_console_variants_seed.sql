WITH new_variants (category, model_name, variant_type, value, sort_order) AS (
  VALUES
    -- PlayStation 5
    ('ps5', 'PlayStation 5', 'storage', '825 GB', 1),
    ('ps5', 'PlayStation 5', 'color', 'White', 1),

    -- PlayStation 5 Digital Edition
    ('ps5', 'PlayStation 5 Digital Edition', 'storage', '825 GB', 1),
    ('ps5', 'PlayStation 5 Digital Edition', 'color', 'White', 1),

    -- PlayStation 5 Slim
    ('ps5', 'PlayStation 5 Slim', 'storage', '1 TB', 1),
    ('ps5', 'PlayStation 5 Slim', 'color', 'White', 1),

    -- PlayStation 5 Slim Digital Edition
    ('ps5', 'PlayStation 5 Slim Digital Edition', 'storage', '825 GB', 1),
    ('ps5', 'PlayStation 5 Slim Digital Edition', 'storage', '1 TB', 2),
    ('ps5', 'PlayStation 5 Slim Digital Edition', 'color', 'White', 1),

    -- PlayStation 5 Pro
    ('ps5', 'PlayStation 5 Pro', 'storage', '2 TB', 1),
    ('ps5', 'PlayStation 5 Pro', 'color', 'White', 1),

    -- Nintendo Switch
    ('nintendo_switch', 'Nintendo Switch', 'storage', '32 GB', 1),
    ('nintendo_switch', 'Nintendo Switch', 'color', 'Gray', 1),
    ('nintendo_switch', 'Nintendo Switch', 'color', 'Neon Blue/Neon Red', 2),

    -- Nintendo Switch Lite
    ('nintendo_switch', 'Nintendo Switch Lite', 'storage', '32 GB', 1),
    ('nintendo_switch', 'Nintendo Switch Lite', 'color', 'Blue', 1),
    ('nintendo_switch', 'Nintendo Switch Lite', 'color', 'Yellow', 2),
    ('nintendo_switch', 'Nintendo Switch Lite', 'color', 'Gray', 3),
    ('nintendo_switch', 'Nintendo Switch Lite', 'color', 'Turquoise', 4),
    ('nintendo_switch', 'Nintendo Switch Lite', 'color', 'Coral', 5),

    -- Nintendo Switch OLED
    ('nintendo_switch', 'Nintendo Switch OLED', 'storage', '64 GB', 1),
    ('nintendo_switch', 'Nintendo Switch OLED', 'color', 'White', 1),
    ('nintendo_switch', 'Nintendo Switch OLED', 'color', 'Neon Blue/Neon Red', 2),
    ('nintendo_switch', 'Nintendo Switch OLED', 'color', 'Mario Red', 3),

    -- Nintendo Switch 2
    ('nintendo_switch', 'Nintendo Switch 2', 'storage', '256 GB', 1),
    ('nintendo_switch', 'Nintendo Switch 2', 'color', 'Black', 1)
)
INSERT INTO device_model_variants (model_id, variant_type, value, sort_order, active)
SELECT 
  dm.id, 
  nv.variant_type, 
  nv.value, 
  nv.sort_order, 
  true
FROM new_variants nv
JOIN device_models dm ON dm.name = nv.model_name AND dm.category = nv.category
ON CONFLICT (model_id, variant_type, value)
DO UPDATE SET
  sort_order = EXCLUDED.sort_order,
  active = EXCLUDED.active;
