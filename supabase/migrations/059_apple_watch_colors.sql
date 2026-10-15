BEGIN;

WITH variant_data(category, model_name, variant_type, value, sort_order) AS (
    VALUES
    -- Apple Watch Series 6
    ('apple_watch', 'Apple Watch Series 6', 'color', 'Space Gray', 1),
    ('apple_watch', 'Apple Watch Series 6', 'color', 'Silver', 2),
    ('apple_watch', 'Apple Watch Series 6', 'color', 'Gold', 3),
    ('apple_watch', 'Apple Watch Series 6', 'color', 'Blue', 4),
    ('apple_watch', 'Apple Watch Series 6', 'color', '(PRODUCT)RED', 5),
    ('apple_watch', 'Apple Watch Series 6', 'color', 'Graphite', 6),
    ('apple_watch', 'Apple Watch Series 6', 'color', 'Natural Titanium', 7),
    ('apple_watch', 'Apple Watch Series 6', 'color', 'Space Black', 8),

    -- Apple Watch SE
    ('apple_watch', 'Apple Watch SE', 'color', 'Space Gray', 1),
    ('apple_watch', 'Apple Watch SE', 'color', 'Silver', 2),
    ('apple_watch', 'Apple Watch SE', 'color', 'Gold', 3),

    -- Apple Watch Series 7
    ('apple_watch', 'Apple Watch Series 7', 'color', 'Midnight', 1),
    ('apple_watch', 'Apple Watch Series 7', 'color', 'Starlight', 2),
    ('apple_watch', 'Apple Watch Series 7', 'color', 'Green', 3),
    ('apple_watch', 'Apple Watch Series 7', 'color', 'Blue', 4),
    ('apple_watch', 'Apple Watch Series 7', 'color', '(PRODUCT)RED', 5),
    ('apple_watch', 'Apple Watch Series 7', 'color', 'Silver', 6),
    ('apple_watch', 'Apple Watch Series 7', 'color', 'Graphite', 7),
    ('apple_watch', 'Apple Watch Series 7', 'color', 'Gold', 8),
    ('apple_watch', 'Apple Watch Series 7', 'color', 'Natural Titanium', 9),
    ('apple_watch', 'Apple Watch Series 7', 'color', 'Space Black', 10),

    -- Apple Watch SE 2
    ('apple_watch', 'Apple Watch SE 2', 'color', 'Midnight', 1),
    ('apple_watch', 'Apple Watch SE 2', 'color', 'Starlight', 2),
    ('apple_watch', 'Apple Watch SE 2', 'color', 'Silver', 3),

    -- Apple Watch Series 8
    ('apple_watch', 'Apple Watch Series 8', 'color', 'Midnight', 1),
    ('apple_watch', 'Apple Watch Series 8', 'color', 'Starlight', 2),
    ('apple_watch', 'Apple Watch Series 8', 'color', 'Silver', 3),
    ('apple_watch', 'Apple Watch Series 8', 'color', '(PRODUCT)RED', 4),
    ('apple_watch', 'Apple Watch Series 8', 'color', 'Graphite', 5),
    ('apple_watch', 'Apple Watch Series 8', 'color', 'Gold', 6),

    -- Apple Watch Ultra
    ('apple_watch', 'Apple Watch Ultra', 'color', 'Natural Titanium', 1),

    -- Apple Watch Series 9
    ('apple_watch', 'Apple Watch Series 9', 'color', 'Midnight', 1),
    ('apple_watch', 'Apple Watch Series 9', 'color', 'Starlight', 2),
    ('apple_watch', 'Apple Watch Series 9', 'color', 'Silver', 3),
    ('apple_watch', 'Apple Watch Series 9', 'color', 'Pink', 4),
    ('apple_watch', 'Apple Watch Series 9', 'color', '(PRODUCT)RED', 5),
    ('apple_watch', 'Apple Watch Series 9', 'color', 'Graphite', 6),
    ('apple_watch', 'Apple Watch Series 9', 'color', 'Gold', 7),

    -- Apple Watch Ultra 2
    ('apple_watch', 'Apple Watch Ultra 2', 'color', 'Natural Titanium', 1),
    ('apple_watch', 'Apple Watch Ultra 2', 'color', 'Black Titanium', 2),

    -- Apple Watch Series 10
    ('apple_watch', 'Apple Watch Series 10', 'color', 'Jet Black', 1),
    ('apple_watch', 'Apple Watch Series 10', 'color', 'Rose Gold', 2),
    ('apple_watch', 'Apple Watch Series 10', 'color', 'Silver', 3),
    ('apple_watch', 'Apple Watch Series 10', 'color', 'Natural Titanium', 4),
    ('apple_watch', 'Apple Watch Series 10', 'color', 'Gold Titanium', 5),
    ('apple_watch', 'Apple Watch Series 10', 'color', 'Slate Titanium', 6),

    -- Apple Watch Series 11
    ('apple_watch', 'Apple Watch Series 11', 'color', 'Jet Black', 1),
    ('apple_watch', 'Apple Watch Series 11', 'color', 'Rose Gold', 2),
    ('apple_watch', 'Apple Watch Series 11', 'color', 'Silver', 3),
    ('apple_watch', 'Apple Watch Series 11', 'color', 'Space Gray', 4),
    ('apple_watch', 'Apple Watch Series 11', 'color', 'Natural Titanium', 5),
    ('apple_watch', 'Apple Watch Series 11', 'color', 'Gold Titanium', 6),
    ('apple_watch', 'Apple Watch Series 11', 'color', 'Slate Titanium', 7),

    -- Apple Watch Ultra 3
    ('apple_watch', 'Apple Watch Ultra 3', 'color', 'Natural Titanium', 1),
    ('apple_watch', 'Apple Watch Ultra 3', 'color', 'Black Titanium', 2),

    -- Apple Watch SE 3
    ('apple_watch', 'Apple Watch SE 3', 'color', 'Midnight', 1),
    ('apple_watch', 'Apple Watch SE 3', 'color', 'Starlight', 2),

    -- Apple Watch Series 12
    ('apple_watch', 'Apple Watch Series 12', 'color', 'Dark Bronze', 1),
    ('apple_watch', 'Apple Watch Series 12', 'color', 'Light Gold', 2),
    ('apple_watch', 'Apple Watch Series 12', 'color', 'Black', 3),
    ('apple_watch', 'Apple Watch Series 12', 'color', 'Space Gray', 4),
    ('apple_watch', 'Apple Watch Series 12', 'color', 'Radiant Gold Titanium', 5),
    ('apple_watch', 'Apple Watch Series 12', 'color', 'Natural Titanium', 6),
    ('apple_watch', 'Apple Watch Series 12', 'color', 'Pearl White', 7),
    ('apple_watch', 'Apple Watch Series 12', 'color', 'Night Blue', 8),

    -- Apple Watch Ultra 4
    ('apple_watch', 'Apple Watch Ultra 4', 'color', 'Natural Titanium', 1),
    ('apple_watch', 'Apple Watch Ultra 4', 'color', 'Black Titanium', 2)
)
INSERT INTO public.device_model_variants (model_id, variant_type, value, sort_order, active)
SELECT m.id, v.variant_type, v.value, v.sort_order, true
FROM public.device_models m
JOIN variant_data v ON m.category = v.category AND m.name = v.model_name
ON CONFLICT (model_id, variant_type, value) 
DO UPDATE SET 
    sort_order = EXCLUDED.sort_order, 
    active = EXCLUDED.active;

COMMIT;
