import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { EditDeviceForm } from '@/components/admin/stock/EditDeviceForm'
import { AdminPageShell } from '@/components/admin/layout/AdminPageShell'

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
    <AdminPageShell>
      <div className="flex flex-col gap-6 lg:gap-8 w-full max-w-6xl mx-auto">
        <header className="flex flex-col gap-2">
          <a href={`/admin/stock/${device.id}`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-zinc-400 hover:text-white transition-colors w-fit mb-2">
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Volver al dispositivo
          </a>
          <h1 className="text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-none">
            Editar dispositivo
          </h1>
          <p className="text-sm text-zinc-400">
            Modifica los datos de esta unidad.
          </p>
        </header>
        <EditDeviceForm device={device} models={models || []} variants={variants || []} catalogImages={catalogImages || []} />
      </div>
    </AdminPageShell>
  )
}
