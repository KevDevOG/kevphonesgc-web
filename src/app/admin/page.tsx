import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AdminDashboard } from '@/components/admin/dashboard/AdminDashboard'

export const metadata = {
  title: 'KevPhonesGC Admin - Resumen'
}

export default async function AdminPage() {
  const supabase = await createClient()

  const { data: user } = await supabase.auth.getUser()
  if (!user.user || user.user.id !== '76320352-4c29-42ad-a105-345e0b5928dd') {
    redirect('/admin/login')
  }

  // 1. Fetch financial settings
  const { data: finSettings } = await supabase
    .from('financial_settings')
    .select('*')
    .eq('id', 1)
    .single()

  const openingCash = finSettings?.opening_cash
  const openingDateStr = finSettings?.opening_date
  
  if (openingCash === undefined || openingCash === null || !openingDateStr) {
    return (
      <div className="bg-[#131313] min-h-screen text-[#F7F7F7] flex flex-col items-center justify-center p-4">
        <p className="text-[#A8A8B0] mb-4 text-center">Configura el punto de partida financiero para calcular el efectivo.</p>
        <a href="/admin/finanzas" className="bg-[#7a32d4] hover:bg-[#6e02d2] px-6 py-3 rounded-lg font-bold text-[14px]">
          Configurar finanzas
        </a>
      </div>
    )
  }

  const openingDate = new Date(openingDateStr).getTime()

  // 2. Fetch all data
  const [
    { data: sales },
    { data: devices },
    { data: expenses },
    { data: capitalMovements }
  ] = await Promise.all([
    supabase.from('sales').select('id, device_id, final_sale_price, sold_at, created_at'),
    supabase.from('devices').select('id, purchase_price, purchased_at, status, created_at, device_models(name)'),
    supabase.from('expenses').select('id, category_id, amount, expense_date, created_at, expense_categories(name)'),
    supabase.from('capital_movements').select('id, movement_type, amount, movement_date, created_at')
  ])

  // Parse arrays
  const salesArr = sales || []
  const devicesArr = devices || []
  const expensesArr = expenses || []
  const capArr = capitalMovements || []

  // Device Map for easy lookup
  const deviceMap = new Map()
  devicesArr.forEach(d => deviceMap.set(d.id, d))

  // ------------------------------------------------------------------
  // EXPECTED CASH
  // ------------------------------------------------------------------
  let expectedCash = Number(openingCash)

  // + sales_since_opening
  const salesSinceOpening = salesArr.filter(s => new Date(s.sold_at).getTime() >= openingDate)
  expectedCash += salesSinceOpening.reduce((sum, s) => sum + Number(s.final_sale_price), 0)

  // - device_purchases_since_opening
  const purchasesSinceOpening = devicesArr.filter(d => new Date(d.purchased_at).getTime() >= openingDate)
  expectedCash -= purchasesSinceOpening.reduce((sum, d) => sum + Number(d.purchase_price), 0)

  // - expenses_since_opening
  const expensesSinceOpening = expensesArr.filter(e => new Date(e.expense_date).getTime() >= openingDate)
  expectedCash -= expensesSinceOpening.reduce((sum, e) => sum + Number(e.amount), 0)

  // Capital movements
  const capSinceOpening = capArr.filter(c => new Date(c.movement_date).getTime() >= openingDate)
  capSinceOpening.forEach(c => {
    const amt = Number(c.amount)
    if (c.movement_type === 'contribution' || c.movement_type === 'adjustment') {
      expectedCash += amt
    } else if (c.movement_type === 'withdrawal') {
      expectedCash -= amt
    }
  })

  // ------------------------------------------------------------------
  // STOCK CAPITAL
  // ------------------------------------------------------------------
  const availableStockCount = devicesArr.filter(d => d.status === 'available').length
  const stockCapital = devicesArr
    .filter(d => d.status === 'available')
    .reduce((sum, d) => sum + Number(d.purchase_price), 0)

  const totalCapital = expectedCash + stockCapital
  const soldTotalCount = salesArr.length

  // ------------------------------------------------------------------
  // CURRENT MONTH
  // ------------------------------------------------------------------
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth()

  const monthsEs = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
  const monthLabel = `${monthsEs[currentMonth]} ${currentYear}`

  const currentMonthSales = salesArr.filter(s => {
    const d = new Date(s.sold_at)
    return d.getFullYear() === currentYear && d.getMonth() === currentMonth
  })
  
  const monthlySalesRevenue = currentMonthSales.reduce((sum, s) => sum + Number(s.final_sale_price), 0)
  const monthlySoldCount = currentMonthSales.length

  let monthlyOperationProfit = 0
  currentMonthSales.forEach(s => {
    const dev = deviceMap.get(s.device_id)
    if (dev) {
      monthlyOperationProfit += (Number(s.final_sale_price) - Number(dev.purchase_price))
    }
  })

  const currentMonthExpenses = expensesArr.filter(e => {
    const d = new Date(e.expense_date)
    return d.getFullYear() === currentYear && d.getMonth() === currentMonth
  })
  const monthlyExpenses = currentMonthExpenses.reduce((sum, e) => sum + Number(e.amount), 0)

  const monthlyFinalProfit = monthlyOperationProfit - monthlyExpenses

  // ------------------------------------------------------------------
  // PROFIT EVOLUTION (Last 6 months)
  // ------------------------------------------------------------------
  const profitEvolution = []
  for (let i = 5; i >= 0; i--) {
    let d = new Date(currentYear, currentMonth - i, 1)
    let y = d.getFullYear()
    let m = d.getMonth()
    
    let mSales = salesArr.filter(s => {
      const sd = new Date(s.sold_at)
      return sd.getFullYear() === y && sd.getMonth() === m
    })
    
    let mOpProfit = 0
    mSales.forEach(s => {
      const dev = deviceMap.get(s.device_id)
      if (dev) mOpProfit += (Number(s.final_sale_price) - Number(dev.purchase_price))
    })
    
    let mExps = expensesArr.filter(e => {
      const ed = new Date(e.expense_date)
      return ed.getFullYear() === y && ed.getMonth() === m
    })
    let mExpsTotal = mExps.reduce((sum, e) => sum + Number(e.amount), 0)
    
    profitEvolution.push({
      label: monthsEs[m].substring(0, 3), // Jul, Ago, Sep...
      profit: mOpProfit - mExpsTotal,
      isCurrent: i === 0
    })
  }

  // ------------------------------------------------------------------
  // RECENT ACTIVITY (6 most recent)
  // ------------------------------------------------------------------
  let allActivities: any[] = []

  salesArr.forEach(s => {
    const dev = deviceMap.get(s.device_id)
    const devName = Array.isArray((dev as any)?.device_models) ? (dev as any)?.device_models[0]?.name : (dev as any)?.device_models?.name
    allActivities.push({
      type: 'sale',
      dateStr: s.sold_at, // Use business date for sorting conceptually, or created_at
      timestamp: new Date(s.created_at).getTime(),
      title: `Venta: ${devName || 'Dispositivo'}`,
      amount: Number(s.final_sale_price),
      sign: '+'
    })
  })

  devicesArr.forEach(d => {
    const devName = Array.isArray((d as any).device_models) ? (d as any).device_models[0]?.name : (d as any).device_models?.name
    allActivities.push({
      type: 'purchase',
      dateStr: d.purchased_at,
      timestamp: new Date(d.created_at).getTime(),
      title: `Compra: ${devName || 'Dispositivo'}`,
      amount: Number(d.purchase_price),
      sign: '-'
    })
  })

  expensesArr.forEach(e => {
    const catName = Array.isArray((e as any).expense_categories) ? (e as any).expense_categories[0]?.name : (e as any).expense_categories?.name
    allActivities.push({
      type: 'expense',
      dateStr: e.expense_date,
      timestamp: new Date(e.created_at).getTime(),
      title: `Gasto: ${catName || 'General'}`,
      amount: Number(e.amount),
      sign: '-'
    })
  })

  capArr.forEach(c => {
    let title = 'Movimiento'
    let sign = '+'
    if (c.movement_type === 'contribution') { title = 'Aportación: Capital' }
    else if (c.movement_type === 'withdrawal') { title = 'Retirada: Capital'; sign = '-' }
    else if (c.movement_type === 'adjustment') { 
      title = 'Ajuste: Conciliación'
      sign = Number(c.amount) < 0 ? '-' : '+'
    }

    allActivities.push({
      type: 'capital',
      dateStr: c.movement_date,
      timestamp: new Date(c.created_at).getTime(),
      title,
      amount: Math.abs(Number(c.amount)),
      sign,
      originalAmount: Number(c.amount)
    })
  })

  // Sort by real creation/registration time for an accurate activity feed
  allActivities.sort((a, b) => b.timestamp - a.timestamp)
  const recentActivities = allActivities.slice(0, 6)

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>
      <link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800&family=Inter:wght@400;600&display=swap" rel="stylesheet"/>
      
      <AdminDashboard 
        expectedCash={expectedCash}
        stockCapital={stockCapital}
        totalCapital={totalCapital}
        monthLabel={monthLabel}
        monthlySalesRevenue={monthlySalesRevenue}
        monthlySoldCount={monthlySoldCount}
        monthlyOperationProfit={monthlyOperationProfit}
        monthlyExpenses={monthlyExpenses}
        monthlyFinalProfit={monthlyFinalProfit}
        availableStockCount={availableStockCount}
        profitEvolution={profitEvolution}
        recentActivities={recentActivities}
      />
    </>
  )
}
