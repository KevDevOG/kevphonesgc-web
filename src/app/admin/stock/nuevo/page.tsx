import { createClient } from '@/lib/supabase/server'
import { NewDeviceForm } from '@/components/admin/stock/NewDeviceForm'
import { redirect } from 'next/navigation'

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
    <>
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>
      <link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800&family=Inter:wght@400;600&display=swap" rel="stylesheet"/>
      <style suppressHydrationWarning>{`
        input[type="date"]::-webkit-calendar-picker-indicator {
            filter: invert(1);
        }
      `}</style>
      <div className="min-h-screen bg-[#050505] text-[#F7F7F7] pb-24 font-body-md" style={{ fontFamily: 'Inter, sans-serif' }}>
        <header className="fixed top-0 w-full z-50 bg-[#0B0B0D] border-b border-[#1F1F24] flex items-center px-4 h-14">
          <a href="/admin" aria-label="Volver" className="mr-4 text-[#d7baff] active:scale-95 duration-150 p-2 -ml-2 rounded-full hover:bg-[#1c1b1b] transition-colors">
            <span className="material-symbols-outlined text-[24px]">arrow_back</span>
          </a>
          <div>
            <h1 className="font-bold text-2xl text-[#B98AFF] uppercase tracking-tighter" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>KevPhonesGC</h1>
          </div>
        </header>
        
        <main className="pt-20 px-4 max-w-3xl mx-auto space-y-8">
          <div className="mb-8">
            <h2 className="font-bold text-3xl mb-2 tracking-wide" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>Añadir dispositivo</h2>
            <p className="text-[#A8A8B0]">Registra una nueva unidad en stock.</p>
          </div>
          
          <NewDeviceForm models={sortedModels} variants={sortedVariants} catalogImages={catalogImages || []} />
        </main>
      </div>
    </>
  )
}
