import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { ClientDetail } from '@/components/admin/clients/ClientDetail'
import { AdminPageShell } from '@/components/admin/layout/AdminPageShell'

export const metadata = {
  title: 'Detalle de Cliente - Admin KevPhonesGC'
}

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function ClientDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.id !== '76320352-4c29-42ad-a105-345e0b5928dd') {
    redirect('/admin/login')
  }

  const { data: client, error: clientError } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .single()

  if (clientError || !client) {
    notFound()
  }

  const { data: sales } = await supabase
    .from('sales')
    .select(`
      id,
      final_sale_price,
      sold_at,
      sale_location,
      observations,
      created_at,
      devices (
        id,
        storage,
        color,
        imei_serial,
        purchase_price,
        listing_price,
        device_models (
          category,
          name
        )
      )
    `)
    .eq('buyer_client_id', id)
    .order('sold_at', { ascending: false })

  const { data: devices } = await supabase
    .from('devices')
    .select(`
      id,
      storage,
      color,
      imei_serial,
      purchase_price,
      listing_price,
      purchased_at,
      status,
      device_models (
        category,
        name
      )
    `)
    .eq('seller_client_id', id)
    .order('purchased_at', { ascending: false })

  // Sort sales fallback to created_at
  const sortedSales = (sales || []).sort((a: any, b: any) => {
    const timeA = new Date(a.sold_at).getTime()
    const timeB = new Date(b.sold_at).getTime()
    if (timeA === timeB && a.created_at && b.created_at) {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    }
    return timeB - timeA
  })

  return (
    <AdminPageShell>
      <div className="flex flex-col gap-6 lg:gap-8 w-full max-w-6xl mx-auto">
        <ClientDetail client={client} sales={sortedSales as any} devices={devices as any} />
      </div>
    </AdminPageShell>
  )
}
