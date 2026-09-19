import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AdminPageShell } from '@/components/admin/layout/AdminPageShell'
import { AdminPageHeader } from '@/components/admin/layout/AdminPageHeader'
import { ActivityTable } from '@/components/admin/activity/ActivityTable'

export const metadata = {
  title: 'Historial de movimientos - KevPhonesGC'
}

export type UnifiedActivity = {
  id: string
  date: string
  timestamp: number
  type: string // 'Venta' | 'Compra' | 'Gasto' | 'Aportación' | 'Retirada' | 'Ajuste'
  filterType: 'Ventas' | 'En stock' | 'Gastos' | 'Capital'
  concept: string
  clientName: string | null
  clientPhone: string | null
  model: string | null
  storage: string | null
  color: string | null
  outflow: number | null
  listingPrice: number | null
  inflow: number | null
  profit: number | null
  status: string
  locationOrNote: string
  actionUrl: string
  createdAtTs: number
}

export default async function ActivityPage() {
  const supabase = await createClient()

  const { data: user } = await supabase.auth.getUser()
  if (!user.user || user.user.id !== '76320352-4c29-42ad-a105-345e0b5928dd') {
    redirect('/admin/login')
  }

  const [
    { data: sales, error: salesError },
    { data: devices, error: devicesError },
    { data: clients, error: clientsError },
    { data: deviceModels, error: modelsError },
    { data: expenses, error: expensesError },
    { data: capitalMovements, error: capitalError }
  ] = await Promise.all([
    supabase.from('sales').select('id, device_id, buyer_client_id, final_sale_price, sold_at, sale_location, observations, created_at'),
    supabase.from('devices').select('id, model_id, seller_client_id, storage, color, purchase_price, listing_price, purchase_location, purchased_at, status, internal_notes, created_at'),
    supabase.from('clients').select('id, name, phone, location'),
    supabase.from('device_models').select('id, name, category'),
    supabase.from('expenses').select('id, amount, expense_date, note, created_at, expense_categories(name)'),
    supabase.from('capital_movements').select('id, movement_type, amount, movement_date, note, created_at')
  ])

  if (salesError) console.error('Supabase error loading sales:', salesError.code, salesError.message, salesError.details, salesError.hint)
  if (devicesError) console.error('Supabase error loading devices:', devicesError.code, devicesError.message, devicesError.details, devicesError.hint)
  if (clientsError) console.error('Supabase error loading clients:', clientsError.code, clientsError.message, clientsError.details, clientsError.hint)
  if (modelsError) console.error('Supabase error loading models:', modelsError.code, modelsError.message, modelsError.details, modelsError.hint)
  if (expensesError) console.error('Supabase error loading expenses:', expensesError.code, expensesError.message, expensesError.details, expensesError.hint)
  if (capitalError) console.error('Supabase error loading capital movements:', capitalError.code, capitalError.message, capitalError.details, capitalError.hint)

  const clientMap = new Map()
  ;(clients || []).forEach(c => clientMap.set(c.id, c))

  const deviceMap = new Map()
  ;(devices || []).forEach(d => deviceMap.set(d.id, d))

  const modelMap = new Map()
  ;(deviceModels || []).forEach(m => modelMap.set(m.id, m))

  const unifiedActivities: UnifiedActivity[] = []

  ;(sales || []).forEach(sale => {
    const dev = deviceMap.get(sale.device_id)
    if (!dev) {
      console.warn(`Sale ${sale.id} references missing device ${sale.device_id}`)
      return
    }

    const model = modelMap.get(dev.model_id)
    const buyer = clientMap.get(sale.buyer_client_id)
    const profit = Number(sale.final_sale_price) - Number(dev.purchase_price)
    
    unifiedActivities.push({
      id: `sale-${sale.id}`,
      date: sale.sold_at,
      timestamp: new Date(sale.sold_at).getTime(),
      createdAtTs: new Date(sale.created_at).getTime(),
      type: 'Venta',
      filterType: 'Ventas',
      concept: model?.name || 'Dispositivo',
      clientName: buyer?.name || 'Cliente no disponible',
      clientPhone: buyer?.phone || null,
      model: model?.name || null,
      storage: dev.storage || null,
      color: dev.color || null,
      outflow: Number(dev.purchase_price),
      listingPrice: Number(dev.listing_price),
      inflow: Number(sale.final_sale_price),
      profit,
      status: 'Vendido',
      locationOrNote: sale.sale_location || sale.observations || '',
      actionUrl: `/admin/stock/${sale.device_id}`
    })
  })

  ;(devices || []).forEach(dev => {
    if (dev.status === 'available') {
      const model = modelMap.get(dev.model_id)
      const seller = clientMap.get(dev.seller_client_id)

      unifiedActivities.push({
        id: `dev-${dev.id}`,
        date: dev.purchased_at,
        timestamp: new Date(dev.purchased_at).getTime(),
        createdAtTs: new Date(dev.created_at).getTime(),
        type: 'Compra',
        filterType: 'En stock',
        concept: model?.name || 'Dispositivo',
        clientName: seller?.name || 'Vendedor no disponible',
        clientPhone: seller?.phone || null,
        model: model?.name || null,
        storage: dev.storage || null,
        color: dev.color || null,
        outflow: Number(dev.purchase_price),
        listingPrice: Number(dev.listing_price),
        inflow: null,
        profit: null,
        status: 'En stock',
        locationOrNote: dev.purchase_location || dev.internal_notes || '',
        actionUrl: `/admin/stock/${dev.id}`
      })
    }
  })

  ;(expenses || []).forEach(exp => {
    const catName = Array.isArray((exp.expense_categories as any)) ? (exp.expense_categories as any)[0]?.name : (exp.expense_categories as any)?.name
    unifiedActivities.push({
      id: `exp-${exp.id}`,
      date: exp.expense_date,
      timestamp: new Date(exp.expense_date).getTime(),
      createdAtTs: new Date(exp.created_at).getTime(),
      type: 'Gasto',
      filterType: 'Gastos',
      concept: catName || 'Gasto',
      clientName: null,
      clientPhone: null,
      model: null,
      storage: null,
      color: null,
      outflow: Number(exp.amount),
      listingPrice: null,
      inflow: null,
      profit: null,
      status: 'Gasto',
      locationOrNote: exp.note || '',
      actionUrl: `/admin/gastos`
    })
  })

  ;(capitalMovements || []).forEach(cap => {
    let capType = 'Ajuste'
    let outflow = null
    let inflow = null
    const amt = Number(cap.amount)
    
    if (cap.movement_type === 'contribution') {
      capType = 'Aportación'
      inflow = amt
    }
    else if (cap.movement_type === 'withdrawal') {
      capType = 'Retirada'
      outflow = amt
    }
    else {
      if (amt < 0) outflow = Math.abs(amt)
      else inflow = amt
    }

    unifiedActivities.push({
      id: `cap-${cap.id}`,
      date: cap.movement_date,
      timestamp: new Date(cap.movement_date).getTime(),
      createdAtTs: new Date(cap.created_at).getTime(),
      type: capType,
      filterType: 'Capital',
      concept: capType,
      clientName: null,
      clientPhone: null,
      model: null,
      storage: null,
      color: null,
      outflow,
      listingPrice: null,
      inflow,
      profit: null,
      status: 'Capital',
      locationOrNote: cap.note || '',
      actionUrl: `/admin/movimientos`
    })
  })

  // Sort desc by timestamp initially
  unifiedActivities.sort((a, b) => {
    if (b.timestamp !== a.timestamp) return b.timestamp - a.timestamp
    return b.createdAtTs - a.createdAtTs
  })

  return (
    <AdminPageShell>
      <AdminPageHeader 
        title="Historial de movimientos" 
        subtitle="Consulta todas las operaciones del negocio en detalle."
      />
      <div className="mt-4 pb-12">
        <ActivityTable initialActivities={unifiedActivities} />
      </div>
    </AdminPageShell>
  )
}
