import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { DeviceDetail } from '@/components/admin/stock/DeviceDetail'

export const metadata = {
  title: 'Detalle de Dispositivo - Admin'
}

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function DeviceDetailPage({ params }: PageProps) {
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
      battery_health,
      battery_cycles,
      condition,
      has_box,
      has_cable,
      has_invoice,
      warranty_until,
      original_parts,
      fully_functional,
      purchase_price,
      listing_price,
      purchase_location,
      purchased_at,
      status,
      internal_notes,
      created_at,
      device_models (
        category,
        brand,
        name,
        supports_battery_health,
        supports_cycles
      ),
      device_images (
        id,
        storage_path,
        position
      ),
      clients (
        name,
        phone,
        location
      )
    `)
    .eq('id', id)
    .single()

  if (error || !device) {
    notFound()
  }

  const images = (device.device_images || []).sort((a: any, b: any) => (a.position || 0) - (b.position || 0))

  let tradeInContext = null
  
  // Is this device sold in a trade-in?
  const { data: salesData } = await supabase
    .from('sales')
    .select('id, final_sale_price, sold_at, device_id, sale_location, observations')
    .eq('device_id', id)
    .maybeSingle()
    
  let tradeInOperation: {
    direction: 'outgoing' | 'incoming'
    id: string
    sale_id: string
    received_device_id: string
    sale_request_id: string | null
    saleDetails: { final_sale_price: any; sold_at: any; device_id: any; sale_location: any; observations: any }
  } | null = null
  
  if (salesData) {
    const { data: tiA } = await supabase
      .from('trade_in_operations')
      .select('id, sale_id, received_device_id, sale_request_id')
      .eq('sale_id', salesData.id)
      .maybeSingle()
    if (tiA) tradeInOperation = { ...tiA, direction: 'outgoing', saleDetails: salesData }
  }
  
  if (!tradeInOperation) {
    const { data: tiB } = await supabase
      .from('trade_in_operations')
      .select('id, sale_id, received_device_id, sale_request_id')
      .eq('received_device_id', id)
      .maybeSingle()
    if (tiB) {
      // Need sale details
      const { data: sData } = await supabase
        .from('sales')
        .select('id, final_sale_price, sold_at, device_id, sale_location, observations')
        .eq('id', tiB.sale_id)
        .single()
      if (sData) {
        tradeInOperation = { ...tiB, direction: 'incoming', saleDetails: sData }
      }
    }
  }
  
  if (tradeInOperation) {
    const outgoingId = tradeInOperation.saleDetails.device_id || id
    const { data: outgoingDevice } = await supabase
      .from('devices')
      .select(`id, storage, color, device_models(name)`)
      .eq('id', outgoingId)
      .single()
      
    const { data: incomingDevice } = await supabase
      .from('devices')
      .select(`id, storage, color, purchase_price, listing_price, purchase_location, device_models(name)`)
      .eq('id', tradeInOperation.received_device_id)
      .single()
      
    tradeInContext = {
      direction: tradeInOperation.direction,
      id: tradeInOperation.id,
      saleId: tradeInOperation.sale_id,
      receivedDeviceId: tradeInOperation.received_device_id,
      saleRequestId: tradeInOperation.sale_request_id,
      finalSalePrice: Number(tradeInOperation.saleDetails.final_sale_price),
      soldAt: tradeInOperation.saleDetails.sold_at,
      saleLocation: tradeInOperation.saleDetails.sale_location || null,
      saleObservations: tradeInOperation.saleDetails.observations || null,
      purchaseLocation: incomingDevice?.purchase_location || null,
      receivedListingPrice: Number(incomingDevice?.listing_price || 0),
      outgoingDevice: {
        id: outgoingDevice?.id || '',
        storage: outgoingDevice?.storage || null,
        color: outgoingDevice?.color || null,
        modelName: (Array.isArray(outgoingDevice?.device_models) ? (outgoingDevice?.device_models[0] as any)?.name : (outgoingDevice?.device_models as any)?.name) || ''
      },
      incomingDevice: {
        id: incomingDevice?.id || '',
        storage: incomingDevice?.storage || null,
        color: incomingDevice?.color || null,
        purchasePrice: Number(incomingDevice?.purchase_price || 0),
        modelName: (Array.isArray(incomingDevice?.device_models) ? (incomingDevice?.device_models[0] as any)?.name : (incomingDevice?.device_models as any)?.name) || ''
      }
    }
  }

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>
      <link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800&family=Inter:wght@400;600&display=swap" rel="stylesheet"/>
      
      <div className="bg-[#050505] text-[#F7F7F7] font-body-md min-h-screen flex flex-col pb-24" style={{ fontFamily: 'Inter, sans-serif' }}>
        <header className="bg-[#131313] border-b border-[#1F1F24] w-full top-0 sticky z-50">
          <div className="flex items-center justify-between px-4 py-2 w-full max-w-[1280px] mx-auto">
            <a href="/admin/stock" className="text-[#d7baff] hover:bg-[#353534] transition-colors rounded-full p-2 active:opacity-80">
              <span className="material-symbols-outlined">arrow_back</span>
            </a>
            <h1 className="text-[24px] font-bold uppercase tracking-tighter text-[#d7baff]" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>KevPhonesGC Admin</h1>
            <div className="w-10"></div>
          </div>
        </header>
        
        <main className="flex-grow px-4 py-4 flex flex-col gap-8 max-w-lg mx-auto w-full">
          <DeviceDetail device={{...device, clients: Array.isArray(device.clients) ? device.clients[0] : device.clients, device_images: images} as any} tradeInContext={tradeInContext} />
        </main>
      </div>
    </>
  )
}
