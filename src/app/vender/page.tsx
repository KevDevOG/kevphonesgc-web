import { createClient } from '@/lib/supabase/server'
import { SellDeviceForm } from '@/components/public/sell/SellDeviceForm'
import { PublicHeader } from '@/components/public/PublicHeader'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Vende tu dispositivo',
  description: 'Envía los datos y fotos de tu dispositivo para solicitar una revisión y propuesta de compra de KevPhonesGC.',
  alternates: {
    canonical: '/vender'
  }
}

export const dynamic = 'force-dynamic'

export default async function VenderPage() {
  const supabase = await createClient()

  const [{ data: models }, { data: variants }] = await Promise.all([
    supabase
    .from('device_models')
    .select('id, name, supports_battery_health, supports_cycles')
    .eq('active', true)
    .eq('category', 'iphone')
    .order('sort_order', { ascending: true }),
    supabase
    .from('device_model_variants')
    .select('model_id, variant_type, value')
    .eq('active', true)
    .order('sort_order', { ascending: true })
  ])

  const typedModels = models || []
  const typedVariants = variants || []

  return (
    <div className="kevphones-sell-page flex flex-col min-h-screen bg-[#050506]">
      <PublicHeader />
      <main className="kevphones-sell-page__main flex-1">
        <SellDeviceForm 
          models={typedModels} 
          variants={typedVariants} 
        />
      </main>
    </div>
  )
}
