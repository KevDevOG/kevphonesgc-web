WITH new_variants (model_name, variant_type, value, sort_order) AS (
  VALUES
    -- iPhone 11 Storage
    ('iPhone 11', 'storage', '64 GB', 1),
    ('iPhone 11', 'storage', '128 GB', 2),
    ('iPhone 11', 'storage', '256 GB', 3),
    -- iPhone 11 Colors
    ('iPhone 11', 'color', 'Black', 1),
    ('iPhone 11', 'color', 'White', 2),
    ('iPhone 11', 'color', 'Green', 3),
    ('iPhone 11', 'color', 'Yellow', 4),
    ('iPhone 11', 'color', 'Purple', 5),
    ('iPhone 11', 'color', '(PRODUCT)RED', 6),

    -- iPhone 11 Pro Storage
    ('iPhone 11 Pro', 'storage', '64 GB', 1),
    ('iPhone 11 Pro', 'storage', '256 GB', 2),
    ('iPhone 11 Pro', 'storage', '512 GB', 3),
    -- iPhone 11 Pro Colors
    ('iPhone 11 Pro', 'color', 'Silver', 1),
    ('iPhone 11 Pro', 'color', 'Space Gray', 2),
    ('iPhone 11 Pro', 'color', 'Gold', 3),
    ('iPhone 11 Pro', 'color', 'Midnight Green', 4),

    -- iPhone 11 Pro Max Storage
    ('iPhone 11 Pro Max', 'storage', '64 GB', 1),
    ('iPhone 11 Pro Max', 'storage', '256 GB', 2),
    ('iPhone 11 Pro Max', 'storage', '512 GB', 3),
    -- iPhone 11 Pro Max Colors
    ('iPhone 11 Pro Max', 'color', 'Silver', 1),
    ('iPhone 11 Pro Max', 'color', 'Space Gray', 2),
    ('iPhone 11 Pro Max', 'color', 'Gold', 3),
    ('iPhone 11 Pro Max', 'color', 'Midnight Green', 4),

    -- iPhone SE (2nd generation) Storage
    ('iPhone SE (2nd generation)', 'storage', '64 GB', 1),
    ('iPhone SE (2nd generation)', 'storage', '128 GB', 2),
    ('iPhone SE (2nd generation)', 'storage', '256 GB', 3),
    -- iPhone SE (2nd generation) Colors
    ('iPhone SE (2nd generation)', 'color', 'Black', 1),
    ('iPhone SE (2nd generation)', 'color', 'White', 2),
    ('iPhone SE (2nd generation)', 'color', '(PRODUCT)RED', 3),

    -- iPhone 12 mini Storage
    ('iPhone 12 mini', 'storage', '64 GB', 1),
    ('iPhone 12 mini', 'storage', '128 GB', 2),
    ('iPhone 12 mini', 'storage', '256 GB', 3),
    -- iPhone 12 mini Colors
    ('iPhone 12 mini', 'color', 'Black', 1),
    ('iPhone 12 mini', 'color', 'White', 2),
    ('iPhone 12 mini', 'color', '(PRODUCT)RED', 3),
    ('iPhone 12 mini', 'color', 'Green', 4),
    ('iPhone 12 mini', 'color', 'Blue', 5),
    ('iPhone 12 mini', 'color', 'Purple', 6),

    -- iPhone 12 Storage
    ('iPhone 12', 'storage', '64 GB', 1),
    ('iPhone 12', 'storage', '128 GB', 2),
    ('iPhone 12', 'storage', '256 GB', 3),
    -- iPhone 12 Colors
    ('iPhone 12', 'color', 'Black', 1),
    ('iPhone 12', 'color', 'White', 2),
    ('iPhone 12', 'color', '(PRODUCT)RED', 3),
    ('iPhone 12', 'color', 'Green', 4),
    ('iPhone 12', 'color', 'Blue', 5),
    ('iPhone 12', 'color', 'Purple', 6),

    -- iPhone 12 Pro Storage
    ('iPhone 12 Pro', 'storage', '128 GB', 1),
    ('iPhone 12 Pro', 'storage', '256 GB', 2),
    ('iPhone 12 Pro', 'storage', '512 GB', 3),
    -- iPhone 12 Pro Colors
    ('iPhone 12 Pro', 'color', 'Silver', 1),
    ('iPhone 12 Pro', 'color', 'Graphite', 2),
    ('iPhone 12 Pro', 'color', 'Gold', 3),
    ('iPhone 12 Pro', 'color', 'Pacific Blue', 4),

    -- iPhone 12 Pro Max Storage
    ('iPhone 12 Pro Max', 'storage', '128 GB', 1),
    ('iPhone 12 Pro Max', 'storage', '256 GB', 2),
    ('iPhone 12 Pro Max', 'storage', '512 GB', 3),
    -- iPhone 12 Pro Max Colors
    ('iPhone 12 Pro Max', 'color', 'Silver', 1),
    ('iPhone 12 Pro Max', 'color', 'Graphite', 2),
    ('iPhone 12 Pro Max', 'color', 'Gold', 3),
    ('iPhone 12 Pro Max', 'color', 'Pacific Blue', 4),

    -- iPhone 13 mini Storage
    ('iPhone 13 mini', 'storage', '128 GB', 1),
    ('iPhone 13 mini', 'storage', '256 GB', 2),
    ('iPhone 13 mini', 'storage', '512 GB', 3),
    -- iPhone 13 mini Colors
    ('iPhone 13 mini', 'color', '(PRODUCT)RED', 1),
    ('iPhone 13 mini', 'color', 'Starlight', 2),
    ('iPhone 13 mini', 'color', 'Midnight', 3),
    ('iPhone 13 mini', 'color', 'Blue', 4),
    ('iPhone 13 mini', 'color', 'Pink', 5),
    ('iPhone 13 mini', 'color', 'Green', 6),

    -- iPhone 13 Storage
    ('iPhone 13', 'storage', '128 GB', 1),
    ('iPhone 13', 'storage', '256 GB', 2),
    ('iPhone 13', 'storage', '512 GB', 3),
    -- iPhone 13 Colors
    ('iPhone 13', 'color', '(PRODUCT)RED', 1),
    ('iPhone 13', 'color', 'Starlight', 2),
    ('iPhone 13', 'color', 'Midnight', 3),
    ('iPhone 13', 'color', 'Blue', 4),
    ('iPhone 13', 'color', 'Pink', 5),
    ('iPhone 13', 'color', 'Green', 6),

    -- iPhone 13 Pro Storage
    ('iPhone 13 Pro', 'storage', '128 GB', 1),
    ('iPhone 13 Pro', 'storage', '256 GB', 2),
    ('iPhone 13 Pro', 'storage', '512 GB', 3),
    ('iPhone 13 Pro', 'storage', '1 TB', 4),
    -- iPhone 13 Pro Colors
    ('iPhone 13 Pro', 'color', 'Graphite', 1),
    ('iPhone 13 Pro', 'color', 'Gold', 2),
    ('iPhone 13 Pro', 'color', 'Silver', 3),
    ('iPhone 13 Pro', 'color', 'Sierra Blue', 4),
    ('iPhone 13 Pro', 'color', 'Alpine Green', 5),

    -- iPhone 13 Pro Max Storage
    ('iPhone 13 Pro Max', 'storage', '128 GB', 1),
    ('iPhone 13 Pro Max', 'storage', '256 GB', 2),
    ('iPhone 13 Pro Max', 'storage', '512 GB', 3),
    ('iPhone 13 Pro Max', 'storage', '1 TB', 4),
    -- iPhone 13 Pro Max Colors
    ('iPhone 13 Pro Max', 'color', 'Graphite', 1),
    ('iPhone 13 Pro Max', 'color', 'Gold', 2),
    ('iPhone 13 Pro Max', 'color', 'Silver', 3),
    ('iPhone 13 Pro Max', 'color', 'Sierra Blue', 4),
    ('iPhone 13 Pro Max', 'color', 'Alpine Green', 5),

    -- iPhone SE (3rd generation) Storage
    ('iPhone SE (3rd generation)', 'storage', '64 GB', 1),
    ('iPhone SE (3rd generation)', 'storage', '128 GB', 2),
    ('iPhone SE (3rd generation)', 'storage', '256 GB', 3),
    -- iPhone SE (3rd generation) Colors
    ('iPhone SE (3rd generation)', 'color', '(PRODUCT)RED', 1),
    ('iPhone SE (3rd generation)', 'color', 'Starlight', 2),
    ('iPhone SE (3rd generation)', 'color', 'Midnight', 3),

    -- iPhone 14 Storage
    ('iPhone 14', 'storage', '128 GB', 1),
    ('iPhone 14', 'storage', '256 GB', 2),
    ('iPhone 14', 'storage', '512 GB', 3),
    -- iPhone 14 Colors
    ('iPhone 14', 'color', 'Midnight', 1),
    ('iPhone 14', 'color', 'Starlight', 2),
    ('iPhone 14', 'color', 'Blue', 3),
    ('iPhone 14', 'color', 'Purple', 4),
    ('iPhone 14', 'color', '(PRODUCT)RED', 5),
    ('iPhone 14', 'color', 'Yellow', 6),

    -- iPhone 14 Plus Storage
    ('iPhone 14 Plus', 'storage', '128 GB', 1),
    ('iPhone 14 Plus', 'storage', '256 GB', 2),
    ('iPhone 14 Plus', 'storage', '512 GB', 3),
    -- iPhone 14 Plus Colors
    ('iPhone 14 Plus', 'color', 'Midnight', 1),
    ('iPhone 14 Plus', 'color', 'Starlight', 2),
    ('iPhone 14 Plus', 'color', 'Blue', 3),
    ('iPhone 14 Plus', 'color', 'Purple', 4),
    ('iPhone 14 Plus', 'color', '(PRODUCT)RED', 5),
    ('iPhone 14 Plus', 'color', 'Yellow', 6),

    -- iPhone 14 Pro Storage
    ('iPhone 14 Pro', 'storage', '128 GB', 1),
    ('iPhone 14 Pro', 'storage', '256 GB', 2),
    ('iPhone 14 Pro', 'storage', '512 GB', 3),
    ('iPhone 14 Pro', 'storage', '1 TB', 4),
    -- iPhone 14 Pro Colors
    ('iPhone 14 Pro', 'color', 'Space Black', 1),
    ('iPhone 14 Pro', 'color', 'Silver', 2),
    ('iPhone 14 Pro', 'color', 'Gold', 3),
    ('iPhone 14 Pro', 'color', 'Deep Purple', 4),

    -- iPhone 14 Pro Max Storage
    ('iPhone 14 Pro Max', 'storage', '128 GB', 1),
    ('iPhone 14 Pro Max', 'storage', '256 GB', 2),
    ('iPhone 14 Pro Max', 'storage', '512 GB', 3),
    ('iPhone 14 Pro Max', 'storage', '1 TB', 4),
    -- iPhone 14 Pro Max Colors
    ('iPhone 14 Pro Max', 'color', 'Space Black', 1),
    ('iPhone 14 Pro Max', 'color', 'Silver', 2),
    ('iPhone 14 Pro Max', 'color', 'Gold', 3),
    ('iPhone 14 Pro Max', 'color', 'Deep Purple', 4)
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
