import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AdminPageShell } from '@/components/admin/layout/AdminPageShell'
import { StatisticsOverview, type StatisticsMetric, type MonthlyStatistics, type SellingModel, type MarginModel, type StatisticsOperations } from '@/components/admin/statistics/StatisticsOverview'

export const metadata = { title: 'Estadísticas - KevPhonesGC Admin' }

type Purchase = { purchase_price: unknown; purchased_at: string | null; status: string; model_id: string | null; device_models: { name: string } | { name: string }[] | null }
type Sale = { id: string; device_id: string; final_sale_price: unknown; sold_at: string | null; devices: Purchase | Purchase[] | null }
type HistoricalSale = { id: string; purchase_price: unknown; sale_price: unknown; gross_profit: unknown; purchase_date: string | null; sale_date: string | null }
type Expense = { id: string; amount: unknown; expense_date: string | null; category_id: string | null; expense_categories: { name: string } | { name: string }[] | null }
type Stock = { id: string; purchase_price: unknown; listing_price: unknown; discount_price: unknown }

type DevicePurchase = { id: string; purchase_price: unknown; purchased_at: string | null }
type HistoricalPurchase = { id: string; purchase_price: unknown; purchase_date: string | null }
type RequestStatus = { id: string; status: string }

// Continue until an empty page, even when the API caps responses below our requested size.
async function readAll<T>(read: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>): Promise<T[]> {
  const rows: T[] = []
  let offset = 0
  while (true) {
    const { data, error } = await read(offset, offset + 499)
    if (error || !data) throw error || new Error('Statistics query returned no data')
    if (data.length === 0) return rows
    rows.push(...data)
    offset += data.length
  }
}

function numeric(value: unknown): number | null {
  if (typeof value !== 'number' && typeof value !== 'string') return null
  if (typeof value === 'string' && !value.trim()) return null
  const result = Number(value)
  return Number.isFinite(result) ? result : null
}

function price(value: unknown): number | null {
  const result = numeric(value)
  return result !== null && result >= 0 ? result : null
}

// Validate calendar dates before parsing; null and impossible dates must not become zero days.
function calendarDay(value: string | null): number | null {
  if (!value) return null
  const datePart = value.slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(datePart)) return null
  const [year, month, day] = datePart.split('-').map(Number)
  const timestamp = Date.UTC(year, month - 1, day)
  const parsed = new Date(timestamp)
  if (parsed.getUTCFullYear() !== year || parsed.getUTCMonth() !== month - 1 || parsed.getUTCDate() !== day) return null
  if (value.length === 10) return timestamp
  // Also accept valid ISO timestamps if a date field is returned with a time component.
  const instant = value[10] === 'T' ? Date.parse(value) : NaN
  return Number.isFinite(instant) ? instant : null
}

function daysBetween(purchased: string | null, sold: string | null): number | null {
  const start = calendarDay(purchased)
  const end = calendarDay(sold)
  return start !== null && end !== null && end >= start ? (end - start) / 86400000 : null
}

function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`
}

// Phase 2 aggregation is independent of the approved Phase 1 KPI calculations.
function aggregateEvolution(
  sales: Sale[] | null, historical: HistoricalSale[] | null, expenses: Expense[] | null,
  start: Date | null, end: Date
) {
  const buckets = new Map<number, { units: number; revenue: number; priced: number; gross: number; margins: number; expenses: number; expensesValid: boolean }>()
  const bucket = (index: number) => {
    if (!buckets.has(index)) buckets.set(index, { units: 0, revenue: 0, priced: 0, gross: 0, margins: 0, expenses: 0, expensesValid: true })
    return buckets.get(index)!
  }
  const monthIndex = (date: string | null) => {
    if (calendarDay(date) === null) return null
    const parsed = new Date(date!)
    return parsed.getFullYear() * 12 + parsed.getMonth()
  }
  let undated = 0
  let undatedSales = 0
  let undatedExpenses = 0
  for (const sale of sales || []) {
    const device = Array.isArray(sale.devices) ? sale.devices[0] : sale.devices
    if (device?.status === 'available') continue
    const index = monthIndex(sale.sold_at)
    if (index === null) { undated++; undatedSales++; continue }
    const entry = bucket(index)
    entry.units++
    const amount = price(sale.final_sale_price)
    const cost = price(device?.purchase_price)
    if (amount !== null) { entry.revenue += amount; entry.priced++ }
    if (amount !== null && cost !== null) { entry.gross += amount - cost; entry.margins++ }
  }
  for (const sale of historical || []) {
    const index = monthIndex(sale.sale_date)
    if (index === null) { undated++; undatedSales++; continue }
    const entry = bucket(index)
    entry.units++
    const amount = price(sale.sale_price)
    const gross = numeric(sale.gross_profit)
    if (amount !== null) { entry.revenue += amount; entry.priced++ }
    if (gross !== null) { entry.gross += gross; entry.margins++ }
  }
  for (const expense of expenses || []) {
    const index = monthIndex(expense.expense_date)
    if (index === null) { undated++; undatedExpenses++; continue }
    const entry = bucket(index)
    const amount = price(expense.amount)
    if (amount === null) entry.expensesValid = false
    else entry.expenses += amount
  }
  const indices = [...buckets.keys()]
  const first = start ? start.getFullYear() * 12 + start.getMonth() : indices.length ? Math.min(...indices) : null
  const last = start ? end.getFullYear() * 12 + end.getMonth() - 1 : indices.length ? Math.max(...indices) : null
  const series: MonthlyStatistics[] = []
  const label = new Intl.DateTimeFormat('es-ES', { month: 'short', year: 'numeric' })
  if (first !== null && last !== null) {
    for (let index = first; index <= last; index++) {
      const entry = bucket(index)
      const date = new Date(Math.floor(index / 12), index % 12, 1)
      const salesComplete = sales !== null && historical !== null && undatedSales === 0
      series.push({
        key: dateKey(date), label: label.format(date),
        revenue: salesComplete && entry.priced === entry.units ? entry.revenue : null,
        units: salesComplete ? entry.units : null,
        profit: salesComplete && expenses !== null && undatedExpenses === 0 && entry.margins === entry.units && entry.expensesValid ? entry.gross - entry.expenses : null
      })
    }
  }
  return { series, undated }
}

function aggregateModels(sales: Sale[]) {
  const models = new Map<string, { id: string; name: string; units: number; revenue: number; priced: number; marginUnits: number; grossMargin: number }>()
  let identified = 0
  let validMargins = 0
  for (const sale of sales) {
    const device = Array.isArray(sale.devices) ? sale.devices[0] : sale.devices
    if (!device || device.status === 'available' || !device.model_id) continue
    const model = Array.isArray(device.device_models) ? device.device_models[0] : device.device_models
    if (!model?.name) continue
    identified++
    const row = models.get(device.model_id) || { id: device.model_id, name: model.name, units: 0, revenue: 0, priced: 0, marginUnits: 0, grossMargin: 0 }
    row.units++
    const amount = price(sale.final_sale_price)
    const cost = price(device.purchase_price)
    if (amount !== null) { row.revenue += amount; row.priced++ }
    if (amount !== null && cost !== null) {
      row.marginUnits++; row.grossMargin += amount - cost; validMargins++
    }
    models.set(row.id, row)
  }
  const topSellingModels: SellingModel[] = [...models.values()].map(row => ({ id: row.id, name: row.name, units: row.units, revenue: row.priced === row.units ? row.revenue : null }))
    .sort((a, b) => b.units - a.units || (b.revenue ?? -Infinity) - (a.revenue ?? -Infinity) || a.name.localeCompare(b.name, 'es')).slice(0, 5)
  const topMarginModels: MarginModel[] = [...models.values()].filter(row => row.marginUnits > 0)
    .map(row => ({ id: row.id, name: row.name, units: row.marginUnits, grossMargin: row.grossMargin, averageMargin: row.grossMargin / row.marginUnits }))
    .sort((a, b) => b.grossMargin - a.grossMargin || b.units - a.units || a.name.localeCompare(b.name, 'es')).slice(0, 5)
  return { topSellingModels, topMarginModels, identified, validMargins }
}

function aggregateOperations(
  purchases: DevicePurchase[] | null, historicalPurchases: HistoricalPurchase[] | null,
  monthlySales: MonthlyStatistics[], salesAvailable: boolean,
  expenses: Expense[] | null, requests: RequestStatus[] | null, start: Date | null, end: Date
): StatisticsOperations {
  const purchaseMonths = new Map<string, { total: number; valid: number; rows: number }>()
  let purchaseRows = 0, validPurchases = 0
  for (const item of [
    ...(purchases || []).map(row => ({ amount: row.purchase_price, date: row.purchased_at })),
    ...(historicalPurchases || []).map(row => ({ amount: row.purchase_price, date: row.purchase_date }))
  ]) {
    purchaseRows++
    const amount = price(item.amount)
    if (calendarDay(item.date) === null) continue
    const key = dateKey(new Date(item.date!))
    const month = purchaseMonths.get(key) || { total: 0, valid: 0, rows: 0 }
    month.rows++
    if (amount !== null) { month.total += amount; month.valid++; validPurchases++ }
    purchaseMonths.set(key, month)
  }
  const purchasesAvailable = purchases !== null && historicalPurchases !== null
  const comparisonNotes: string[] = []
  if (!purchasesAvailable) comparisonNotes.push('No se pudieron cargar todas las compras. Sus importes no están disponibles.')
  if (!salesAvailable) comparisonNotes.push('No hay datos completos de ventas con fecha válida. Sus importes mensuales no están disponibles.')
  if (purchaseRows !== validPurchases) comparisonNotes.push(`${validPurchases} de ${purchaseRows} compras cargadas tienen fecha e importe válidos. Solo se suman esas compras.`)
  const salesByMonth = new Map(monthlySales.map(month => [month.key, month]))
  const keys = [...purchaseMonths.keys(), ...monthlySales.filter(month => month.units !== 0).map(month => month.key)].sort()
  const first = start ? new Date(start) : keys.length ? new Date(`${keys[0]}T12:00:00`) : null
  const last = start ? new Date(end.getFullYear(), end.getMonth() - 1, 1) : keys.length ? new Date(`${keys[keys.length - 1]}T12:00:00`) : null
  const purchaseSalesSeries: StatisticsOperations['purchaseSalesSeries'] = []
  const comparisonEmpty = purchasesAvailable && salesAvailable && purchaseRows === 0 && monthlySales.every(month => month.units === 0)
  const label = new Intl.DateTimeFormat('es-ES', { month: 'short', year: 'numeric' })
  if (!comparisonEmpty && first && last) {
    for (let date = new Date(first.getFullYear(), first.getMonth(), 1); date <= last; date = new Date(date.getFullYear(), date.getMonth() + 1, 1)) {
      const key = dateKey(date)
      const purchase = purchaseMonths.get(key)
      const sale = salesByMonth.get(key)
      purchaseSalesSeries.push({ key, label: label.format(date),
        purchases: purchasesAvailable ? purchase && !purchase.valid ? null : purchase?.total ?? 0 : null,
        sales: salesAvailable ? sale ? sale.revenue : 0 : null
      })
    }
  }

  const expenseGroups = new Map<string, { key: string; name: string; amount: number; valid: boolean }>()
  let expenseTotal = 0, validExpenses = 0
  for (const expense of expenses || []) {
    const category = Array.isArray(expense.expense_categories) ? expense.expense_categories[0] : expense.expense_categories
    const key = expense.category_id || 'unidentified'
    const group = expenseGroups.get(key) || { key, name: category?.name || 'Sin categoría identificada', amount: 0, valid: true }
    const amount = price(expense.amount)
    if (amount === null) group.valid = false
    else { group.amount += amount; expenseTotal += amount; validExpenses++ }
    expenseGroups.set(key, group)
  }
  const expenseCategoryBreakdown = [...expenseGroups.values()].map(group => ({
    key: group.key, name: group.name, amount: group.valid ? group.amount : null,
    percentage: group.valid && expenses !== null && validExpenses === expenses.length && expenseTotal > 0 ? group.amount / expenseTotal * 100 : null
  })).sort((a, b) => (b.amount ?? -1) - (a.amount ?? -1) || a.name.localeCompare(b.name, 'es'))

  const statusLabels: Record<string, string> = { new: 'Nuevas', in_progress: 'En proceso', purchased: 'Compradas', discarded: 'Descartadas' }
  const statusCounts = new Map(Object.keys(statusLabels).map(key => [key, 0]))
  for (const request of requests || []) statusCounts.set(request.status, (statusCounts.get(request.status) || 0) + 1)
  const requestStatusBreakdown = [...statusCounts].map(([key, count]) => ({ key, label: statusLabels[key] || 'Estado sin etiqueta', count }))

  return {
    purchaseSalesSeries, comparisonEmpty, comparisonNotes,
    expenseCategoryBreakdown, expenseCount: expenses === null ? null : expenses.length,
    expenseNote: expenses !== null && validExpenses !== expenses.length ? `${validExpenses} de ${expenses.length} gastos tienen importe válido. No se calculan porcentajes con un total incompleto.` : null,
    requestStatusBreakdown, requestTotal: requests === null ? null : requests.length
  }
}

export default async function StatisticsPage({ searchParams }: { searchParams: Promise<{ period?: string | string[] }> }) {
  const supabase = await createClient()
  const { data: user } = await supabase.auth.getUser()
  if (!user.user || user.user.id !== '76320352-4c29-42ad-a105-345e0b5928dd') redirect('/admin/login')

  const requested = (await searchParams).period
  const period = typeof requested === 'string' && ['1', '3', '6', '12', 'all'].includes(requested) ? requested : '1'
  const now = new Date()
  // Same local server calendar as the Dashboard; rolling groups of whole calendar months.
  const start = period === 'all' ? null : new Date(now.getFullYear(), now.getMonth() - Number(period) + 1, 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  const startKey = start ? dateKey(start) : null
  const endKey = dateKey(end)
  const month = new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' })
  const periodLabel = !start ? 'Todo el histórico registrado' : period === '1' ? month.format(now) : `${month.format(start)} – ${month.format(now)}`

  const results = await Promise.allSettled([
    readAll<Sale>((from, to) => {
      let query = supabase.from('sales').select('id, device_id, final_sale_price, sold_at, devices(purchase_price, purchased_at, status, model_id, device_models(name))').order('id').range(from, to)
      if (startKey) query = query.gte('sold_at', startKey).lt('sold_at', endKey)
      return query
    }),
    readAll<HistoricalSale>((from, to) => {
      let query = supabase.from('historical_sales').select('id, sale_price, gross_profit, purchase_price, purchase_date, sale_date').order('id').range(from, to)
      if (startKey) query = query.gte('sale_date', startKey).lt('sale_date', endKey)
      return query
    }),
    readAll<Expense>((from, to) => {
      let query = supabase.from('expenses').select('id, amount, expense_date, category_id, expense_categories(name)').order('id').range(from, to)
      if (startKey) query = query.gte('expense_date', startKey).lt('expense_date', endKey)
      return query
    }),
    readAll<Stock>((from, to) => supabase.from('devices').select('id, purchase_price, listing_price, discount_price').eq('status', 'available').order('id').range(from, to)),
    readAll<DevicePurchase>((from, to) => {
      let query = supabase.from('devices').select('id, purchase_price, purchased_at').order('id').range(from, to)
      if (startKey) query = query.gte('purchased_at', startKey).lt('purchased_at', endKey)
      return query
    }),
    // Todo already loads every historical sale; reuse that result for historical purchases.
    period === 'all' ? Promise.resolve(null) : readAll<HistoricalPurchase>((from, to) => {
      let query = supabase.from('historical_sales').select('id, purchase_price, purchase_date').order('id').range(from, to)
      if (startKey) query = query.gte('purchase_date', startKey).lt('purchase_date', endKey)
      return query
    }),
    readAll<RequestStatus>((from, to) => {
      let query = supabase.from('sale_requests').select('id, status').order('id').range(from, to)
      if (startKey) query = query.gte('created_at', startKey).lt('created_at', endKey)
      return query
    })
  ])
  const [salesResult, historyResult, expenseResult, stockResult, purchasesResult, historicalPurchasesResult, requestsResult] = results
  results.forEach((result, index) => {
    if (result.status === 'rejected') console.error(`Statistics source unavailable: ${['sales', 'historical_sales', 'expenses', 'stock', 'device_purchases', 'historical_purchases', 'sale_requests'][index]}`, result.reason)
  })

  const periodMetrics: StatisticsMetric[] = []
  const periodNotes: string[] = []
  const stockMetrics: StatisticsMetric[] = []
  const stockNotes: string[] = []
  const salesLoaded = salesResult.status === 'fulfilled' && historyResult.status === 'fulfilled'
  const expensesLoaded = expenseResult.status === 'fulfilled'
  let units: number | null = null
  let revenue: number | null = null
  let profit: number | null = null
  let averageMargin: number | null = null
  let averageDays: number | null = null
  let knownMargins = 0
  let knownDates = 0
  let inconsistencies = 0

  if (salesLoaded) {
    let revenueSum = 0
    let knownRevenue = 0
    let grossSum = 0
    let daysSum = 0
    units = 0
    for (const sale of salesResult.value) {
      const device = Array.isArray(sale.devices) ? sale.devices[0] : sale.devices
      if (device?.status === 'available') { inconsistencies++; continue }
      units++
      const amount = price(sale.final_sale_price)
      const cost = price(device?.purchase_price)
      if (amount !== null) { revenueSum += amount; knownRevenue++ }
      if (amount !== null && cost !== null) { grossSum += amount - cost; knownMargins++ }
      const days = daysBetween(device?.purchased_at ?? null, sale.sold_at)
      if (days !== null) { daysSum += days; knownDates++ }
    }
    for (const sale of historyResult.value) {
      units++
      const amount = price(sale.sale_price)
      const gross = numeric(sale.gross_profit)
      if (amount !== null) { revenueSum += amount; knownRevenue++ }
      if (gross !== null) { grossSum += gross; knownMargins++ }
      const days = daysBetween(sale.purchase_date, sale.sale_date)
      if (days !== null) { daysSum += days; knownDates++ }
    }
    revenue = knownRevenue === units ? revenueSum : null
    averageMargin = knownMargins ? grossSum / knownMargins : null
    averageDays = knownDates ? daysSum / knownDates : null
    if (expensesLoaded) {
      const amounts = expenseResult.value.map(expense => price(expense.amount))
      if (knownMargins === units && amounts.every(amount => amount !== null)) {
        profit = grossSum - amounts.reduce<number>((sum, amount) => sum + (amount as number), 0)
      } else periodNotes.push('El beneficio completo no está disponible: faltan importes o costes válidos.')
    }
    if (knownRevenue !== units) periodNotes.push(`Importe de venta válido en ${knownRevenue} de ${units} operaciones.`)
    if (inconsistencies) periodNotes.push(`${inconsistencies} operaciones requieren revisión; se han excluido del periodo.`)
  } else periodNotes.push('No se pudieron cargar todas las ventas del periodo. Los indicadores dependientes no están disponibles.')
  if (!expensesLoaded) periodNotes.push('No se pudieron cargar los gastos. El beneficio no está disponible.')

  periodMetrics.push(
    { label: 'Ventas', value: revenue, format: 'currency', context: 'Ingresos por ventas', primary: true },
    { label: 'Beneficio', value: profit, format: 'currency', context: 'Después de gastos', primary: true, semantic: true },
    { label: 'Unidades vendidas', value: units, format: 'count', context: 'Ventas actuales e históricas' },
    { label: 'Ticket medio', value: units && revenue !== null ? revenue / units : null, format: 'currency', context: 'Por venta registrada' },
    { label: 'Margen bruto medio', value: averageMargin, format: 'currency', context: 'Por dispositivo vendido', coverage: salesLoaded && knownMargins !== units ? `${knownMargins} de ${units} operaciones con margen conocido` : undefined },
    { label: 'Días medios en stock', value: averageDays, format: 'days', context: 'Hasta la venta', coverage: salesLoaded && knownDates !== units ? `${knownDates} de ${units} operaciones con fechas válidas` : undefined }
  )

  if (stockResult.status === 'fulfilled') {
    let costTotal = 0, saleTotal = 0, marginTotal = 0
    let costCount = 0, saleCount = 0, marginCount = 0
    const stock = stockResult.value
    for (const device of stock) {
      const cost = price(device.purchase_price)
      const listing = price(device.listing_price)
      const discount = numeric(device.discount_price)
      const effective = listing !== null && discount !== null && discount > 0 && discount < listing ? discount : listing
      if (cost !== null) { costTotal += cost; costCount++ }
      if (effective !== null) { saleTotal += effective; saleCount++ }
      if (cost !== null && effective !== null) { marginTotal += effective - cost; marginCount++ }
    }
    const coverage = (count: number) => count !== stock.length ? `${count} de ${stock.length} dispositivos con datos válidos` : undefined
    stockMetrics.push(
      { label: 'Dispositivos disponibles', value: stock.length, format: 'count', context: 'Disponibles ahora' },
      { label: 'Capital invertido', value: stock.length && !costCount ? null : costTotal, format: 'currency', context: 'A coste de compra', coverage: coverage(costCount) },
      { label: 'Valor potencial', value: stock.length && !saleCount ? null : saleTotal, format: 'currency', context: 'A precio actual', coverage: coverage(saleCount) },
      { label: 'Margen potencial', value: stock.length && !marginCount ? null : marginTotal, format: 'currency', context: 'Antes de gastos', semantic: true, coverage: coverage(marginCount) }
    )
  } else {
    stockNotes.push('No se pudo cargar el stock actual. Sus indicadores no están disponibles.')
    stockMetrics.push(
      { label: 'Dispositivos disponibles', value: null, format: 'count', context: 'Disponibles ahora' },
      { label: 'Capital invertido', value: null, format: 'currency', context: 'A coste de compra' },
      { label: 'Valor potencial', value: null, format: 'currency', context: 'A precio actual' },
      { label: 'Margen potencial', value: null, format: 'currency', context: 'Antes de gastos', semantic: true }
    )
  }

  const currentSales = salesResult.status === 'fulfilled' ? salesResult.value : null
  const historicalSales = historyResult.status === 'fulfilled' ? historyResult.value : null
  const periodExpenses = expenseResult.status === 'fulfilled' ? expenseResult.value : null
  const evolution = aggregateEvolution(currentSales, historicalSales, periodExpenses, start, end)
  const rankings = aggregateModels(currentSales || [])
  const rankingCoverage = currentSales === null
    ? 'No se pudieron cargar las ventas vinculadas a modelos.'
    : units !== null
      ? `${rankings.identified} de ${units} ventas con modelo identificado. Los históricos sin vínculo de modelo no se incluyen.`
      : `${rankings.identified} ventas con modelo identificado. No está disponible el total combinado con históricos.`

  const historicalPurchases = period === 'all'
    ? historicalSales
    : historicalPurchasesResult.status === 'fulfilled' ? historicalPurchasesResult.value : null
  const comparisonSalesAvailable = salesLoaded && (currentSales || []).every(sale => {
    const device = Array.isArray(sale.devices) ? sale.devices[0] : sale.devices
    return device?.status === 'available' || calendarDay(sale.sold_at) !== null
  }) && (historicalSales || []).every(sale => calendarDay(sale.sale_date) !== null)
  const operations = aggregateOperations(
    purchasesResult.status === 'fulfilled' ? purchasesResult.value : null, historicalPurchases,
    evolution.series, comparisonSalesAvailable, periodExpenses,
    requestsResult.status === 'fulfilled' ? requestsResult.value : null, start, end
  )

  return <AdminPageShell><StatisticsOverview period={period} periodLabel={periodLabel} periodMetrics={periodMetrics} periodNotes={periodNotes} stockMetrics={stockMetrics} stockNotes={stockNotes}
    monthlySeries={evolution.series} evolutionNote={evolution.undated ? `${evolution.undated} registros sin fecha válida impiden completar los indicadores mensuales afectados.` : undefined}
    topSellingModels={rankings.topSellingModels} topMarginModels={rankings.topMarginModels} rankingCoverage={rankingCoverage}
    marginCoverage={currentSales === null ? 'No está disponible la cobertura de márgenes.' : `${rankings.validMargins} de ${rankings.identified} ventas identificadas con margen bruto conocido.`} rankingsAvailable={currentSales !== null}
    operations={operations}
  /></AdminPageShell>
}
