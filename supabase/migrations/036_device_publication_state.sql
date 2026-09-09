-- Add publication state flag
ALTER TABLE public.devices ADD COLUMN is_published boolean NOT NULL DEFAULT false;

-- 1. RECREATE PUBLIC STOCK VIEW (to only include published devices)
DROP VIEW IF EXISTS public_stock;

CREATE VIEW public_stock
WITH (security_barrier = true)
AS
SELECT 
  d.id AS device_id,
  m.id AS model_id,
  m.category,
  m.brand,
  m.name AS model_name,
  m.supports_battery_health,
  m.supports_cycles,
  d.storage,
  d.color,
  d.battery_health,
  d.battery_cycles,
  d.condition,
  d.has_box,
  d.has_cable,
  d.has_invoice,
  d.original_parts,
  d.fully_functional,
  d.warranty_until,
  d.listing_price,
  d.discount_price,
  d.created_at
FROM devices d
JOIN device_models m ON d.model_id = m.id
WHERE d.status = 'available' 
  AND d.is_published = true
  AND m.active = true;

-- Hardened view privileges
REVOKE ALL ON public_stock FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public_stock TO anon, authenticated;


-- 2. CREATE PUBLIC DEVICE IMAGES VIEW (to only include published device images)
DROP VIEW IF EXISTS public_device_images;

CREATE VIEW public_device_images
WITH (security_barrier = true)
AS
SELECT 
  di.id,
  di.device_id,
  di.storage_path,
  di.position
FROM device_images di
JOIN devices d ON di.device_id = d.id
WHERE d.status = 'available'
  AND d.is_published = true;

-- Hardened view privileges
REVOKE ALL ON public_device_images FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public_device_images TO anon, authenticated;
