import { createClient } from '@/lib/supabase/server'
import { SellDeviceForm } from '@/components/public/sell/SellDeviceForm'

export const dynamic = 'force-dynamic'

export default async function VenderPage() {
  const supabase = await createClient()

  const { data: models } = await supabase
    .from('device_models')
    .select('id, name, supports_battery_health, supports_cycles')
    .eq('active', true)
    .eq('category', 'iphone')
    .order('sort_order', { ascending: true })

  const { data: variants } = await supabase
    .from('device_model_variants')
    .select('model_id, variant_type, value')
    .eq('active', true)
    .order('sort_order', { ascending: true })

  const typedModels = models || []
  const typedVariants = variants || []

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-purple-500/30">
      <main className="max-w-2xl mx-auto px-4 py-8 md:py-16">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold mb-2">Vende tu dispositivo</h1>
          <p className="text-zinc-400">
            Sigue los pasos para solicitar una valoración de tu dispositivo.
          </p>
        </div>

        <SellDeviceForm 
          models={typedModels} 
          variants={typedVariants} 
        />
      </main>
    </div>
  )
}
