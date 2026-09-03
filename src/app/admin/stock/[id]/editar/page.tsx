import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { EditDeviceForm } from '@/components/admin/stock/EditDeviceForm'

export const metadata = {
  title: 'Editar Dispositivo - Admin'
}

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function EditDevicePage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: user } = await supabase.auth.getUser()
  if (!user.user || user.user.id !== '76320352-4c29-42ad-a105-345e0b5928dd') {
    redirect('/admin/login')
  }

  const { data: device, error: deviceError } = await supabase
    .from('devices')
    .select(`
      *,
      device_models (*),
      device_images (*),
      clients (*)
    `)
    .eq('id', id)
    .single()

  if (deviceError || !device) {
    notFound()
  }

  if (device.status !== 'available') {
    redirect(`/admin/stock/${device.id}`)
  }

  const { data: models } = await supabase
    .from('device_models')
    .select('*')
    .eq('active', true)
    .order('sort_order', { ascending: true })

  const { data: variants } = await supabase
    .from('device_model_variants')
    .select('*')
    .eq('active', true)
    .order('sort_order', { ascending: true })

  const { data: catalogImages } = await supabase
    .from('device_model_catalog_images')
    .select('model_id, color, storage_path')

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>
      <link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800&family=Inter:wght@400;600&display=swap" rel="stylesheet"/>
      
      <div className="bg-[#131313] text-[#F7F7F7] font-body-md min-h-screen flex flex-col pb-24" style={{ fontFamily: 'Inter, sans-serif' }}>
        <header className="bg-[#131313] border-b border-[#1F1F24] w-full top-0 sticky z-50">
          <div className="flex items-center justify-between px-4 py-2 w-full max-w-[1280px] mx-auto">
            <a href={`/admin/stock/${device.id}`} className="text-[#d7baff] hover:bg-[#353534] transition-colors rounded-full p-2 active:opacity-80">
              <span className="material-symbols-outlined">arrow_back</span>
            </a>
            <h1 className="text-[24px] font-bold uppercase tracking-tighter text-[#d7baff]" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>KevPhonesGC Admin</h1>
            <div className="w-10"></div>
          </div>
        </header>
        
        <main className="flex-grow px-4 py-4 md:max-w-2xl md:mx-auto w-full space-y-8 pb-8">
          <div>
            <h2 className="text-[32px] font-extrabold text-[#F7F7F7] uppercase tracking-wide" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>Editar Dispositivo</h2>
            <p className="text-[16px] text-[#A8A8B0] mt-2">Modifica los datos del dispositivo seleccionado.</p>
          </div>
          <EditDeviceForm device={device} models={models || []} variants={variants || []} catalogImages={catalogImages || []} />
        </main>
      </div>
    </>
  )
}
