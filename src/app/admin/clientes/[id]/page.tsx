import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { ClientDetail } from '@/components/admin/clients/ClientDetail'

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
    <>
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>
      <link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800&family=Inter:wght@400;600&display=swap" rel="stylesheet"/>
      
      <div className="bg-[#131313] text-[#F7F7F7] font-body-md min-h-screen flex flex-col pb-24" style={{ fontFamily: 'Inter, sans-serif' }}>
        <header className="bg-[#131313] border-b border-[#1F1F24] w-full top-0 sticky z-50">
          <div className="flex items-center justify-between px-4 py-2 w-full max-w-[1280px] mx-auto">
            <div className="flex items-center gap-4">
              <a href="/admin/clientes" className="text-[#d7baff] hover:bg-[#353534] transition-colors rounded-full p-2 active:opacity-80 flex items-center justify-center">
                <span className="material-symbols-outlined">arrow_back</span>
              </a>
              <h1 className="text-[24px] font-bold uppercase tracking-tighter text-[#d7baff]" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>KevPhonesGC Admin</h1>
            </div>
          </div>
        </header>
        
        <main className="flex-grow px-4 py-4 md:max-w-2xl md:mx-auto w-full space-y-8 pb-8">
          <ClientDetail client={client} sales={sortedSales as any} devices={devices as any} />
        </main>
      </div>
    </>
  )
}
