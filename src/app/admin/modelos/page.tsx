import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ModelManagement from '@/components/admin/models/ModelManagement'

export const dynamic = 'force-dynamic'

export default async function AdminModelosPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.id !== '76320352-4c29-42ad-a105-345e0b5928dd') {
    redirect('/admin/login')
  }

  // 1. Fetch active device_models
  const { data: models } = await supabase
    .from('device_models')
    .select('id, name, brand, category, sort_order')
    .eq('active', true)
    .order('category')
    .order('sort_order')
    .order('name')

  // 2. Fetch active color variants
  const { data: colorVariants } = await supabase
    .from('device_model_variants')
    .select('model_id, value, sort_order')
    .eq('variant_type', 'color')
    .eq('active', true)
    .order('sort_order')

  // 3. Fetch existing catalog images
  const { data: catalogImages } = await supabase
    .from('device_model_catalog_images')
    .select('model_id, color, storage_path')

  return (
    <ModelManagement 
      models={models || []}
      colorVariants={colorVariants || []}
      catalogImages={catalogImages || []}
    />
  )
}
