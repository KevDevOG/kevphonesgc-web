import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { SellDeviceForm } from '@/components/admin/stock/SellDeviceForm'
import { AdminPageShell } from '@/components/admin/layout/AdminPageShell'

export const metadata = {
  title: 'Vender Dispositivo - Admin'
}

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function SellDevicePage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: user } = await supabase.auth.getUser()
  if (!user.user || user.user.id !== '76320352-4c29-42ad-a105-345e0b5928dd') {
    redirect('/admin/login')
  }

  const { data: device, error } = await supabase
    .from('devices')
    .select(`
      id,
      storage,
      color,
      imei_serial,
      purchase_price,
      listing_price,
      status,
      device_models (
        category,
        name
      )
    `)
    .eq('id', id)
    .single()

  if (error || !device) {
    notFound()
  }

  if (device.status !== 'available') {
    redirect(`/admin/stock/${device.id}`)
  }

  return (
    <AdminPageShell>
      <div className="flex flex-col gap-6 lg:gap-8 w-full max-w-5xl mx-auto">
        <header className="flex flex-col gap-2">
          <a href={`/admin/stock/${device.id}`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-zinc-400 hover:text-white transition-colors w-fit mb-2">
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Volver al dispositivo
          </a>
          <h1 className="text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-none">
            Registrar venta
          </h1>
          <p className="text-sm text-zinc-400">
            Registra la venta del dispositivo.
          </p>
        </header>
        <SellDeviceForm device={device} />
      </div>
    </AdminPageShell>
  )
}
