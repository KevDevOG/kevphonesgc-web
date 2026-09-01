'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getExpectedCashBreakdown() {
  const supabase = await createClient()

  const { data: settings } = await supabase
    .from('financial_settings')
    .select('*')
    .eq('id', 1)
    .single()

  if (!settings || settings.opening_cash === null || settings.opening_date === null) {
    return null
  }

  const openingDate = settings.opening_date
  const openingCash = Number(settings.opening_cash)

  // Ventas
  const { data: sales } = await supabase
    .from('sales')
    .select('final_sale_price')
    .gte('sold_at', openingDate)
  
  const salesTotal = (sales || []).reduce((acc, s) => acc + Number(s.final_sale_price), 0)

  // Compras de dispositivos
  const { data: purchases } = await supabase
    .from('devices')
    .select('purchase_price')
    .gte('purchased_at', openingDate)

  const purchasesTotal = (purchases || []).reduce((acc, d) => acc + Number(d.purchase_price), 0)

  // Gastos
  const { data: expenses } = await supabase
    .from('expenses')
    .select('amount')
    .gte('expense_date', openingDate)

  const expensesTotal = (expenses || []).reduce((acc, e) => acc + Number(e.amount), 0)

  // Movimientos de capital
  const { data: capitalMovements } = await supabase
    .from('capital_movements')
    .select('movement_type, amount')
    .gte('movement_date', openingDate)

  let contributionsTotal = 0
  let withdrawalsTotal = 0
  let adjustmentsTotal = 0

  if (capitalMovements) {
    for (const mov of capitalMovements) {
      const amt = Number(mov.amount)
      if (mov.movement_type === 'contribution') contributionsTotal += amt
      else if (mov.movement_type === 'withdrawal') withdrawalsTotal += amt
      else if (mov.movement_type === 'adjustment') adjustmentsTotal += amt
    }
  }

  const expectedCash = openingCash + salesTotal - purchasesTotal - expensesTotal + contributionsTotal - withdrawalsTotal + adjustmentsTotal

  return {
    openingCash,
    salesTotal,
    purchasesTotal,
    expensesTotal,
    contributionsTotal,
    withdrawalsTotal,
    adjustmentsTotal,
    expectedCash
  }
}

export async function updateFinancialSettings(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.id !== '76320352-4c29-42ad-a105-345e0b5928dd') {
    return { error: 'No autorizado' }
  }

  const openingCashStr = formData.get('opening_cash') as string
  const openingDate = formData.get('opening_date') as string

  if (!openingCashStr || !openingDate) {
    return { error: 'Faltan campos obligatorios.' }
  }

  const openingCash = parseFloat(openingCashStr)
  if (isNaN(openingCash) || openingCash < 0) {
    return { error: 'El efectivo inicial debe ser un número válido mayor o igual a 0.' }
  }

  const { error } = await supabase
    .from('financial_settings')
    .update({
      opening_cash: openingCash,
      opening_date: openingDate
    })
    .eq('id', 1)

  if (error) {
    return { error: 'No se pudo guardar la configuración. Inténtalo de nuevo.' }
  }

  revalidatePath('/admin/finanzas')
  revalidatePath('/admin')
  
  return { success: true }
}

export async function registerReconciliation(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.id !== '76320352-4c29-42ad-a105-345e0b5928dd') {
    return { error: 'No autorizado' }
  }

  const actualCashStr = formData.get('actual_cash') as string
  const reconciliationDate = formData.get('reconciliation_date') as string
  const note = (formData.get('note') as string || '').trim()

  if (!actualCashStr || !reconciliationDate) {
    return { error: 'Faltan campos obligatorios.' }
  }

  const actualCash = parseFloat(actualCashStr)
  if (isNaN(actualCash) || actualCash < 0) {
    return { error: 'El efectivo real debe ser un número válido mayor o igual a 0.' }
  }

  // Calculate expected cash server-side
  const breakdown = await getExpectedCashBreakdown()
  if (!breakdown) {
    return { error: 'La configuración financiera no está inicializada.' }
  }

  const { error } = await supabase.rpc('reconcile_cash', {
    p_expected_cash: breakdown.expectedCash,
    p_actual_cash: actualCash,
    p_reconciliation_date: reconciliationDate,
    p_note: note || null
  })

  if (error) {
    return { error: 'No se pudo registrar la conciliación. Inténtalo de nuevo.' }
  }

  revalidatePath('/admin/finanzas')
  revalidatePath('/admin/movimientos')
  revalidatePath('/admin')
  
  return { success: true }
}
