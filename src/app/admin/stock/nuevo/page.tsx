import { createClient } from '@/lib/supabase/server'
import { NewDeviceForm } from '@/components/admin/stock/NewDeviceForm'
import { redirect } from 'next/navigation'
import { AdminPageShell } from '@/components/admin/layout/AdminPageShell'

export const metadata = {
  title: 'Añadir dispositivo - KevPhonesGC Admin'
}

export default async function NewDevicePage() {
  const supabase = await createClient()
  
  const { data: user } = await supabase.auth.getUser()
  if (!user.user || user.user.id !== '76320352-4c29-42ad-a105-345e0b5928dd') {
    redirect('/admin/login')
  }

  const { data: models } = await supabase
    .from('device_models')
    .select('id, category, name, supports_battery_health, supports_cycles, sort_order')
    .eq('active', true)
    
  const { data: variants } = await supabase
    .from('device_model_variants')
    .select('id, model_id, variant_type, value, sort_order')
    .eq('active', true)

  const { data: catalogImages } = await supabase
    .from('device_model_catalog_images')
    .select('model_id, color, storage_path')

  const sortedModels = (models || []).sort((a, b) => {
    const categoryOrder = { 'iphone': 1, 'ps5': 2, 'nintendo_switch': 3 }
    const catDiff = (categoryOrder[a.category as keyof typeof categoryOrder] || 99) - (categoryOrder[b.category as keyof typeof categoryOrder] || 99)
    if (catDiff !== 0) return catDiff
    return a.sort_order - b.sort_order
  })

  const sortedVariants = (variants || []).sort((a, b) => a.sort_order - b.sort_order)

  return (
    <AdminPageShell>
      <div className="flex flex-col gap-6 lg:gap-8 w-full max-w-6xl mx-auto">
        <header className="flex flex-col gap-2">
          <a href="/admin/stock" className="inline-flex items-center gap-1.5 text-sm font-semibold text-zinc-400 hover:text-white transition-colors w-fit mb-2">
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Volver a Stock
          </a>
          <h1 className="text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-none">
            Añadir dispositivo
          </h1>
          <p className="text-sm text-zinc-400">
            Registra una nueva unidad en stock.
          </p>
        </header>
        <NewDeviceForm models={sortedModels} variants={sortedVariants} catalogImages={catalogImages || []} />
      </div>
    </AdminPageShell>
  )
}
