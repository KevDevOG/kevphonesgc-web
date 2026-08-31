WITH new_variants (model_name, variant_type, value, sort_order) AS (
  VALUES
    -- iPhone 15 Storage
    ('iPhone 15', 'storage', '128 GB', 1),
    ('iPhone 15', 'storage', '256 GB', 2),
    ('iPhone 15', 'storage', '512 GB', 3),
    -- iPhone 15 Colors
    ('iPhone 15', 'color', 'Black', 1),
    ('iPhone 15', 'color', 'Blue', 2),
    ('iPhone 15', 'color', 'Green', 3),
    ('iPhone 15', 'color', 'Yellow', 4),
    ('iPhone 15', 'color', 'Pink', 5),

    -- iPhone 15 Plus Storage
    ('iPhone 15 Plus', 'storage', '128 GB', 1),
    ('iPhone 15 Plus', 'storage', '256 GB', 2),
    ('iPhone 15 Plus', 'storage', '512 GB', 3),
    -- iPhone 15 Plus Colors
    ('iPhone 15 Plus', 'color', 'Black', 1),
    ('iPhone 15 Plus', 'color', 'Blue', 2),
    ('iPhone 15 Plus', 'color', 'Green', 3),
    ('iPhone 15 Plus', 'color', 'Yellow', 4),
    ('iPhone 15 Plus', 'color', 'Pink', 5),

    -- iPhone 15 Pro Storage
    ('iPhone 15 Pro', 'storage', '128 GB', 1),
    ('iPhone 15 Pro', 'storage', '256 GB', 2),
    ('iPhone 15 Pro', 'storage', '512 GB', 3),
    ('iPhone 15 Pro', 'storage', '1 TB', 4),
    -- iPhone 15 Pro Colors
    ('iPhone 15 Pro', 'color', 'Black Titanium', 1),
    ('iPhone 15 Pro', 'color', 'White Titanium', 2),
    ('iPhone 15 Pro', 'color', 'Blue Titanium', 3),
    ('iPhone 15 Pro', 'color', 'Natural Titanium', 4),

    -- iPhone 15 Pro Max Storage
    ('iPhone 15 Pro Max', 'storage', '256 GB', 1),
    ('iPhone 15 Pro Max', 'storage', '512 GB', 2),
    ('iPhone 15 Pro Max', 'storage', '1 TB', 3),
    -- iPhone 15 Pro Max Colors
    ('iPhone 15 Pro Max', 'color', 'Black Titanium', 1),
    ('iPhone 15 Pro Max', 'color', 'White Titanium', 2),
    ('iPhone 15 Pro Max', 'color', 'Blue Titanium', 3),
    ('iPhone 15 Pro Max', 'color', 'Natural Titanium', 4),

    -- iPhone 16 Storage
    ('iPhone 16', 'storage', '128 GB', 1),
    ('iPhone 16', 'storage', '256 GB', 2),
    ('iPhone 16', 'storage', '512 GB', 3),
    -- iPhone 16 Colors
    ('iPhone 16', 'color', 'Black', 1),
    ('iPhone 16', 'color', 'White', 2),
    ('iPhone 16', 'color', 'Pink', 3),
    ('iPhone 16', 'color', 'Teal', 4),
    ('iPhone 16', 'color', 'Ultramarine', 5),

    -- iPhone 16 Plus Storage
    ('iPhone 16 Plus', 'storage', '128 GB', 1),
    ('iPhone 16 Plus', 'storage', '256 GB', 2),
    ('iPhone 16 Plus', 'storage', '512 GB', 3),
    -- iPhone 16 Plus Colors
    ('iPhone 16 Plus', 'color', 'Black', 1),
    ('iPhone 16 Plus', 'color', 'White', 2),
    ('iPhone 16 Plus', 'color', 'Pink', 3),
    ('iPhone 16 Plus', 'color', 'Teal', 4),
    ('iPhone 16 Plus', 'color', 'Ultramarine', 5),

    -- iPhone 16 Pro Storage
    ('iPhone 16 Pro', 'storage', '128 GB', 1),
    ('iPhone 16 Pro', 'storage', '256 GB', 2),
    ('iPhone 16 Pro', 'storage', '512 GB', 3),
    ('iPhone 16 Pro', 'storage', '1 TB', 4),
    -- iPhone 16 Pro Colors
    ('iPhone 16 Pro', 'color', 'Black Titanium', 1),
    ('iPhone 16 Pro', 'color', 'White Titanium', 2),
    ('iPhone 16 Pro', 'color', 'Natural Titanium', 3),
    ('iPhone 16 Pro', 'color', 'Desert Titanium', 4),

    -- iPhone 16 Pro Max Storage
    ('iPhone 16 Pro Max', 'storage', '256 GB', 1),
    ('iPhone 16 Pro Max', 'storage', '512 GB', 2),
    ('iPhone 16 Pro Max', 'storage', '1 TB', 3),
    -- iPhone 16 Pro Max Colors
    ('iPhone 16 Pro Max', 'color', 'Black Titanium', 1),
    ('iPhone 16 Pro Max', 'color', 'White Titanium', 2),
    ('iPhone 16 Pro Max', 'color', 'Natural Titanium', 3),
    ('iPhone 16 Pro Max', 'color', 'Desert Titanium', 4),

    -- iPhone 16e Storage
    ('iPhone 16e', 'storage', '128 GB', 1),
    ('iPhone 16e', 'storage', '256 GB', 2),
    ('iPhone 16e', 'storage', '512 GB', 3),
    -- iPhone 16e Colors
    ('iPhone 16e', 'color', 'Black', 1),
    ('iPhone 16e', 'color', 'White', 2),

    -- iPhone 17 Storage
    ('iPhone 17', 'storage', '256 GB', 1),
    ('iPhone 17', 'storage', '512 GB', 2),
    -- iPhone 17 Colors
    ('iPhone 17', 'color', 'Black', 1),
    ('iPhone 17', 'color', 'White', 2),
    ('iPhone 17', 'color', 'Mist Blue', 3),
    ('iPhone 17', 'color', 'Sage', 4),
    ('iPhone 17', 'color', 'Lavender', 5),

    -- iPhone Air Storage
    ('iPhone Air', 'storage', '256 GB', 1),
    ('iPhone Air', 'storage', '512 GB', 2),
    ('iPhone Air', 'storage', '1 TB', 3),
    -- iPhone Air Colors
    ('iPhone Air', 'color', 'Space Black', 1),
    ('iPhone Air', 'color', 'Cloud White', 2),
    ('iPhone Air', 'color', 'Light Gold', 3),
    ('iPhone Air', 'color', 'Sky Blue', 4),

    -- iPhone 17 Pro Storage
    ('iPhone 17 Pro', 'storage', '256 GB', 1),
    ('iPhone 17 Pro', 'storage', '512 GB', 2),
    ('iPhone 17 Pro', 'storage', '1 TB', 3),
    -- iPhone 17 Pro Colors
    ('iPhone 17 Pro', 'color', 'Silver', 1),
    ('iPhone 17 Pro', 'color', 'Cosmic Orange', 2),
    ('iPhone 17 Pro', 'color', 'Deep Blue', 3),

    -- iPhone 17 Pro Max Storage
    ('iPhone 17 Pro Max', 'storage', '256 GB', 1),
    ('iPhone 17 Pro Max', 'storage', '512 GB', 2),
    ('iPhone 17 Pro Max', 'storage', '1 TB', 3),
    ('iPhone 17 Pro Max', 'storage', '2 TB', 4),
    -- iPhone 17 Pro Max Colors
    ('iPhone 17 Pro Max', 'color', 'Silver', 1),
    ('iPhone 17 Pro Max', 'color', 'Cosmic Orange', 2),
    ('iPhone 17 Pro Max', 'color', 'Deep Blue', 3),

    -- iPhone 17e Storage
    ('iPhone 17e', 'storage', '256 GB', 1),
    ('iPhone 17e', 'storage', '512 GB', 2),
    -- iPhone 17e Colors
    ('iPhone 17e', 'color', 'Black', 1),
    ('iPhone 17e', 'color', 'White', 2),
    ('iPhone 17e', 'color', 'Soft Pink', 3)
)
INSERT INTO device_model_variants (model_id, variant_type, value, sort_order, active)
SELECT 
  dm.id, 
  nv.variant_type, 
  nv.value, 
  nv.sort_order, 
  true
FROM new_variants nv
JOIN device_models dm ON dm.name = nv.model_name AND dm.category = 'iphone'
ON CONFLICT (model_id, variant_type, value)
DO UPDATE SET
  sort_order = EXCLUDED.sort_order,
  active = EXCLUDED.active;
