-- ==========================================
-- 061_fix_device_variant_compatibility_rls.sql
-- ==========================================

BEGIN;

-- 1. Ensure RLS is enabled on public.device_variant_compatibility
ALTER TABLE public.device_variant_compatibility ENABLE ROW LEVEL SECURITY;

-- 2. Revoke default and unnecessary privileges
REVOKE ALL PRIVILEGES ON TABLE public.device_variant_compatibility FROM PUBLIC;
REVOKE ALL PRIVILEGES ON TABLE public.device_variant_compatibility FROM anon;
REVOKE ALL PRIVILEGES ON TABLE public.device_variant_compatibility FROM authenticated;

-- 3. Grant minimum required privilege (SELECT only) to authenticated role
GRANT SELECT ON TABLE public.device_variant_compatibility TO authenticated;

-- 4. Idempotently drop the policy if it already exists
DROP POLICY IF EXISTS "Admin can view device variant compatibility" ON public.device_variant_compatibility;

-- 5. Create least-privilege SELECT policy restricted to Admin UUID
CREATE POLICY "Admin can view device variant compatibility"
  ON public.device_variant_compatibility
  FOR SELECT
  TO authenticated
  USING (auth.uid() = '76320352-4c29-42ad-a105-345e0b5928dd'::uuid);

COMMIT;

