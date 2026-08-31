-- 1. ADMIN RLS POLICIES

-- device_models
CREATE POLICY "Admin full access device_models"
ON device_models
FOR ALL
TO authenticated
USING (auth.uid() = '76320352-4c29-42ad-a105-345e0b5928dd'::uuid)
WITH CHECK (auth.uid() = '76320352-4c29-42ad-a105-345e0b5928dd'::uuid);

-- device_model_variants
CREATE POLICY "Admin full access device_model_variants"
ON device_model_variants
FOR ALL
TO authenticated
USING (auth.uid() = '76320352-4c29-42ad-a105-345e0b5928dd'::uuid)
WITH CHECK (auth.uid() = '76320352-4c29-42ad-a105-345e0b5928dd'::uuid);

-- clients
CREATE POLICY "Admin full access clients"
ON clients
FOR ALL
TO authenticated
USING (auth.uid() = '76320352-4c29-42ad-a105-345e0b5928dd'::uuid)
WITH CHECK (auth.uid() = '76320352-4c29-42ad-a105-345e0b5928dd'::uuid);

-- devices
CREATE POLICY "Admin full access devices"
ON devices
FOR ALL
TO authenticated
USING (auth.uid() = '76320352-4c29-42ad-a105-345e0b5928dd'::uuid)
WITH CHECK (auth.uid() = '76320352-4c29-42ad-a105-345e0b5928dd'::uuid);

-- device_images
CREATE POLICY "Admin full access device_images"
ON device_images
FOR ALL
TO authenticated
USING (auth.uid() = '76320352-4c29-42ad-a105-345e0b5928dd'::uuid)
WITH CHECK (auth.uid() = '76320352-4c29-42ad-a105-345e0b5928dd'::uuid);


-- 2. PUBLIC MODEL ACCESS POLICIES

CREATE POLICY "Anon select active models"
ON device_models
FOR SELECT
TO anon
USING (active = true);

CREATE POLICY "Anon select active variants"
ON device_model_variants
FOR SELECT
TO anon
USING (
  active = true AND 
  EXISTS (
    SELECT 1 FROM device_models 
    WHERE id = device_model_variants.model_id 
    AND active = true
  )
);


-- 3. PUBLIC STOCK VIEW

CREATE VIEW public_stock
WITH (security_barrier = true)
AS
SELECT 
  d.id AS device_id,
  m.category,
  m.brand,
  m.name AS model_name,
  d.storage,
  d.color,
  d.battery_health,
  d.battery_cycles,
  d.condition,
  d.has_box,
  d.has_cable,
  d.warranty_until,
  d.listing_price,
  d.created_at
FROM devices d
JOIN device_models m ON d.model_id = m.id
WHERE d.status = 'available' 
  AND m.active = true;


-- 4. PRIVILEGES & SENSITIVE TABLE ACCESS REVOCATION

-- Revoke all default access from PUBLIC and anon
REVOKE ALL ON clients FROM PUBLIC, anon;
REVOKE ALL ON devices FROM PUBLIC, anon;
REVOKE ALL ON device_images FROM PUBLIC, anon;
REVOKE ALL ON device_models FROM PUBLIC, anon;
REVOKE ALL ON device_model_variants FROM PUBLIC, anon;

-- Explicitly grant authenticated role access to base tables
GRANT SELECT, INSERT, UPDATE, DELETE ON device_models TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON device_model_variants TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON clients TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON devices TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON device_images TO authenticated;

-- Hardened view privileges
REVOKE ALL ON public_stock FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public_stock TO anon, authenticated;

-- Grant minimal required base privileges to anon
GRANT SELECT ON device_models TO anon;
GRANT SELECT ON device_model_variants TO anon;
