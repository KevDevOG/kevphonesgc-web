BEGIN;

DROP VIEW IF EXISTS public.public_stock;

CREATE VIEW public.public_stock
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
  d.size,
  d.connectivity,
  d.chip,
  d.memory,
  d.case_type,
  d.case_material,
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

REVOKE ALL ON public.public_stock FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.public_stock TO anon, authenticated;

COMMIT;
