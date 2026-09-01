import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { StockList } from '@/components/admin/stock/StockList'

export const metadata = {
  title: 'Stock Admin - KevPhonesGC'
}

export default async function StockPage() {
  const supabase = await createClient()

  const { data: user } = await supabase.auth.getUser()
  if (!user.user || user.user.id !== '76320352-4c29-42ad-a105-345e0b5928dd') {
    redirect('/admin/login')
  }

  const { data: devices, error } = await supabase
    .from('devices')
    .select(`
      id,
      model_id,
      storage,
      color,
      imei_serial,
      battery_health,
      battery_cycles,
      condition,
      purchase_price,
      listing_price,
      warranty_until,
      purchased_at,
      status,
      created_at,
      device_models (
        category,
        name
      ),
      device_images (
        storage_path
      )
    `)
    .order('created_at', { ascending: false })

  if (error || !devices) {
    return <div className="p-8 text-white">Error al cargar los dispositivos.</div>
  }

  const availableDevices = devices.filter(d => d.status === 'available')
  const soldDevices = devices.filter(d => d.status === 'sold')

  const categoryOrder = { 'iphone': 1, 'ps5': 2, 'nintendo_switch': 3 }
  availableDevices.sort((a, b) => {
    const timeDiff = new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    if (timeDiff !== 0) return timeDiff
    const catA = (a.device_models as any)?.category
    const catB = (b.device_models as any)?.category
    return (categoryOrder[catA as keyof typeof categoryOrder] || 99) - (categoryOrder[catB as keyof typeof categoryOrder] || 99)
  })

  soldDevices.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  const availableCount = availableDevices.length
  const stockCapital = availableDevices.reduce((sum, d) => sum + Number(d.purchase_price), 0)
  const soldCount = soldDevices.length

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>
      <link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800&family=Inter:wght@400;600&display=swap" rel="stylesheet"/>
      <div className="bg-[#131313] text-[#e5e2e1] font-body-md min-h-screen flex flex-col pb-[80px]" style={{ fontFamily: 'Inter, sans-serif' }}>
        <header className="bg-[#131313] text-[#d7baff] border-b border-[#1F1F24] flex justify-between items-center px-4 h-16 w-full sticky top-0 z-40">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#d7baff] tracking-tighter text-2xl" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>KevPhonesGC Admin</span>
          </div>
        </header>

        <main className="flex-1 px-4 py-4 flex flex-col gap-8 max-w-[1280px] mx-auto w-full">
          <section className="flex flex-col gap-2">
            <div>
              <h1 className="text-[32px] leading-[36px] font-extrabold text-[#F7F7F7]" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>Stock</h1>
              <p className="text-[#A8A8B0] text-[16px]">Gestiona tus dispositivos</p>
            </div>
            <a href="/admin/stock/nuevo" className="mt-2 w-full bg-gradient-to-r from-[#7a32d4] to-[#B98AFF] text-[#440087] font-semibold py-2 px-4 rounded hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>add</span> Añadir dispositivo
            </a>
          </section>
          
          <StockList 
            availableDevices={availableDevices} 
            soldDevices={soldDevices}
            availableCount={availableCount}
            stockCapital={stockCapital}
            soldCount={soldCount}
          />
        </main>

        <nav className="bg-[#1c1b1b] border-t border-[#1F1F24] fixed bottom-0 left-0 w-full z-50 flex justify-around items-center h-20 px-2 pb-safe md:hidden">
          <button className="flex flex-col items-center justify-center text-[#A8A8B0] hover:text-[#d7baff] active:scale-90 duration-150 flex-1 py-2">
            <span className="material-symbols-outlined mb-1">home</span>
            <span className="text-[14px] font-semibold">Inicio</span>
          </button>
          <button className="flex flex-col items-center justify-center text-[#d7baff] font-bold hover:text-[#d7baff] active:scale-90 duration-150 flex-1 py-2">
            <span className="material-symbols-outlined mb-1" style={{ fontVariationSettings: "'FILL' 1" }}>inventory_2</span>
            <span className="text-[14px] font-semibold">Stock</span>
          </button>
          <button className="flex flex-col items-center justify-center text-[#A8A8B0] hover:text-[#d7baff] active:scale-90 duration-150 flex-1 py-2">
            <span className="material-symbols-outlined mb-1">pending_actions</span>
            <span className="text-[14px] font-semibold">Solicitudes</span>
          </button>
          <button className="flex flex-col items-center justify-center text-[#A8A8B0] hover:text-[#d7baff] active:scale-90 duration-150 flex-1 py-2">
            <span className="material-symbols-outlined mb-1">more_horiz</span>
            <span className="text-[14px] font-semibold">Más</span>
          </button>
        </nav>
      </div>
    </>
  )
}
