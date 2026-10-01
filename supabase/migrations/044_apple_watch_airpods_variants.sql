BEGIN;

WITH variant_data(category, model_name, variant_type, value, sort_order) AS (
    -- Apple Watch SIZE
    VALUES
    ('apple_watch', 'Apple Watch Series 6', 'size', '40 mm', 1),
    ('apple_watch', 'Apple Watch Series 6', 'size', '44 mm', 2),
    
    ('apple_watch', 'Apple Watch SE', 'size', '40 mm', 1),
    ('apple_watch', 'Apple Watch SE', 'size', '44 mm', 2),
    
    ('apple_watch', 'Apple Watch Series 7', 'size', '41 mm', 1),
    ('apple_watch', 'Apple Watch Series 7', 'size', '45 mm', 2),
    
    ('apple_watch', 'Apple Watch SE 2', 'size', '40 mm', 1),
    ('apple_watch', 'Apple Watch SE 2', 'size', '44 mm', 2),
    
    ('apple_watch', 'Apple Watch Series 8', 'size', '41 mm', 1),
    ('apple_watch', 'Apple Watch Series 8', 'size', '45 mm', 2),
    
    ('apple_watch', 'Apple Watch Ultra', 'size', '49 mm', 1),
    
    ('apple_watch', 'Apple Watch Series 9', 'size', '41 mm', 1),
    ('apple_watch', 'Apple Watch Series 9', 'size', '45 mm', 2),
    
    ('apple_watch', 'Apple Watch Ultra 2', 'size', '49 mm', 1),
    
    ('apple_watch', 'Apple Watch Series 10', 'size', '42 mm', 1),
    ('apple_watch', 'Apple Watch Series 10', 'size', '46 mm', 2),
    
    ('apple_watch', 'Apple Watch Series 11', 'size', '42 mm', 1),
    ('apple_watch', 'Apple Watch Series 11', 'size', '46 mm', 2),
    
    ('apple_watch', 'Apple Watch Ultra 3', 'size', '49 mm', 1),
    
    ('apple_watch', 'Apple Watch SE 3', 'size', '40 mm', 1),
    ('apple_watch', 'Apple Watch SE 3', 'size', '44 mm', 2),
    
    ('apple_watch', 'Apple Watch Series 12', 'size', '42 mm', 1),
    ('apple_watch', 'Apple Watch Series 12', 'size', '46 mm', 2),
    
    ('apple_watch', 'Apple Watch Ultra 4', 'size', '49 mm', 1),

    -- Apple Watch CONNECTIVITY (GPS, GPS + Cellular)
    ('apple_watch', 'Apple Watch Series 6', 'connectivity', 'GPS', 1),
    ('apple_watch', 'Apple Watch Series 6', 'connectivity', 'GPS + Cellular', 2),
    
    ('apple_watch', 'Apple Watch SE', 'connectivity', 'GPS', 1),
    ('apple_watch', 'Apple Watch SE', 'connectivity', 'GPS + Cellular', 2),
    
    ('apple_watch', 'Apple Watch Series 7', 'connectivity', 'GPS', 1),
    ('apple_watch', 'Apple Watch Series 7', 'connectivity', 'GPS + Cellular', 2),
    
    ('apple_watch', 'Apple Watch SE 2', 'connectivity', 'GPS', 1),
    ('apple_watch', 'Apple Watch SE 2', 'connectivity', 'GPS + Cellular', 2),
    
    ('apple_watch', 'Apple Watch Series 8', 'connectivity', 'GPS', 1),
    ('apple_watch', 'Apple Watch Series 8', 'connectivity', 'GPS + Cellular', 2),
    
    ('apple_watch', 'Apple Watch Series 9', 'connectivity', 'GPS', 1),
    ('apple_watch', 'Apple Watch Series 9', 'connectivity', 'GPS + Cellular', 2),
    
    ('apple_watch', 'Apple Watch Series 10', 'connectivity', 'GPS', 1),
    ('apple_watch', 'Apple Watch Series 10', 'connectivity', 'GPS + Cellular', 2),
    
    ('apple_watch', 'Apple Watch Series 11', 'connectivity', 'GPS', 1),
    ('apple_watch', 'Apple Watch Series 11', 'connectivity', 'GPS + Cellular', 2),
    
    ('apple_watch', 'Apple Watch SE 3', 'connectivity', 'GPS', 1),
    ('apple_watch', 'Apple Watch SE 3', 'connectivity', 'GPS + Cellular', 2),
    
    ('apple_watch', 'Apple Watch Series 12', 'connectivity', 'GPS', 1),
    ('apple_watch', 'Apple Watch Series 12', 'connectivity', 'GPS + Cellular', 2),
    
    -- Apple Watch CONNECTIVITY (Ultra models)
    ('apple_watch', 'Apple Watch Ultra', 'connectivity', 'GPS + Cellular', 1),
    ('apple_watch', 'Apple Watch Ultra 2', 'connectivity', 'GPS + Cellular', 1),
    ('apple_watch', 'Apple Watch Ultra 3', 'connectivity', 'GPS + Cellular', 1),
    ('apple_watch', 'Apple Watch Ultra 4', 'connectivity', 'GPS + Cellular', 1),

    -- Apple Watch CASE MATERIAL
    ('apple_watch', 'Apple Watch Series 6', 'case_material', 'Aluminium', 1),
    ('apple_watch', 'Apple Watch Series 6', 'case_material', 'Stainless Steel', 2),
    ('apple_watch', 'Apple Watch Series 6', 'case_material', 'Titanium', 3),
    
    ('apple_watch', 'Apple Watch SE', 'case_material', 'Aluminium', 1),
    
    ('apple_watch', 'Apple Watch Series 7', 'case_material', 'Aluminium', 1),
    ('apple_watch', 'Apple Watch Series 7', 'case_material', 'Stainless Steel', 2),
    ('apple_watch', 'Apple Watch Series 7', 'case_material', 'Titanium', 3),
    
    ('apple_watch', 'Apple Watch SE 2', 'case_material', 'Aluminium', 1),
    
    ('apple_watch', 'Apple Watch Series 8', 'case_material', 'Aluminium', 1),
    ('apple_watch', 'Apple Watch Series 8', 'case_material', 'Stainless Steel', 2),
    
    ('apple_watch', 'Apple Watch Ultra', 'case_material', 'Titanium', 1),
    
    ('apple_watch', 'Apple Watch Series 9', 'case_material', 'Aluminium', 1),
    ('apple_watch', 'Apple Watch Series 9', 'case_material', 'Stainless Steel', 2),
    
    ('apple_watch', 'Apple Watch Ultra 2', 'case_material', 'Titanium', 1),
    
    ('apple_watch', 'Apple Watch Series 10', 'case_material', 'Aluminium', 1),
    ('apple_watch', 'Apple Watch Series 10', 'case_material', 'Titanium', 2),
    
    ('apple_watch', 'Apple Watch Series 11', 'case_material', 'Aluminium', 1),
    ('apple_watch', 'Apple Watch Series 11', 'case_material', 'Titanium', 2),
    
    ('apple_watch', 'Apple Watch Ultra 3', 'case_material', 'Titanium', 1),
    
    ('apple_watch', 'Apple Watch SE 3', 'case_material', 'Aluminium', 1),
    
    ('apple_watch', 'Apple Watch Series 12', 'case_material', 'Aluminium', 1),
    ('apple_watch', 'Apple Watch Series 12', 'case_material', 'Titanium', 2),
    ('apple_watch', 'Apple Watch Series 12', 'case_material', 'Ceramic', 3),
    
    ('apple_watch', 'Apple Watch Ultra 4', 'case_material', 'Titanium', 1),

    -- AirPods CASE TYPES
    ('airpods', 'AirPods 3', 'case_type', 'Lightning Charging Case', 1),
    ('airpods', 'AirPods 3', 'case_type', 'MagSafe Charging Case', 2),
    
    ('airpods', 'AirPods Pro 2 (Lightning)', 'case_type', 'MagSafe Lightning', 1),
    
    ('airpods', 'AirPods Pro 2 (USB-C)', 'case_type', 'MagSafe USB-C', 1),
    
    ('airpods', 'AirPods 4', 'case_type', 'USB-C Charging Case', 1),
    
    ('airpods', 'AirPods 4 (ANC)', 'case_type', 'USB-C Wireless Charging Case', 1),
    
    ('airpods', 'AirPods Pro 3', 'case_type', 'MagSafe USB-C', 1),
    
    ('airpods', 'AirPods 5', 'case_type', 'USB-C Charging Case', 1),
    
    ('airpods', 'AirPods 5 (Wireless Charging Case)', 'case_type', 'USB-C Wireless Charging Case', 1),

    -- AirPods COLORS
    ('airpods', 'AirPods 3', 'color', 'White', 1),
    ('airpods', 'AirPods Pro 2 (Lightning)', 'color', 'White', 1),
    ('airpods', 'AirPods Pro 2 (USB-C)', 'color', 'White', 1),
    ('airpods', 'AirPods 4', 'color', 'White', 1),
    ('airpods', 'AirPods 4 (ANC)', 'color', 'White', 1),
    ('airpods', 'AirPods Pro 3', 'color', 'White', 1),
    ('airpods', 'AirPods 5', 'color', 'White', 1),
    ('airpods', 'AirPods 5 (Wireless Charging Case)', 'color', 'White', 1)
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
