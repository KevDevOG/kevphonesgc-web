import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { StockList } from '@/components/admin/stock/StockList'
import { AdminPageShell } from '@/components/admin/layout/AdminPageShell'

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
      is_published,
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
  let soldDevices = devices.filter(d => d.status === 'sold')

  const soldDeviceIds = soldDevices.map(d => d.id)
  
  let salesDataMap: Record<string, any> = {}

  if (soldDeviceIds.length > 0) {
    const { data: sales } = await supabase
      .from('sales')
      .select(`
        id,
        device_id,
        buyer_client_id,
        final_sale_price,
        sold_at,
        sale_location,
        observations,
        clients (
          id,
          name,
          phone,
          location
        )
      `)
      .in('device_id', soldDeviceIds)

    if (sales) {
      for (const sale of sales) {
        salesDataMap[sale.device_id] = {
          ...sale,
          clients: Array.isArray(sale.clients) ? sale.clients[0] : sale.clients
        }
      }
    }
  }

  soldDevices = soldDevices.map(d => ({
    ...d,
    sale_data: salesDataMap[d.id] || null
  }))

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
    <AdminPageShell>
      <StockList 
        availableDevices={availableDevices as any} 
        soldDevices={soldDevices as any}
        availableCount={availableCount}
        stockCapital={stockCapital}
        soldCount={soldCount}
      />
    </AdminPageShell>
  )
}
