'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function registerCapitalMovement(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.id !== '76320352-4c29-42ad-a105-345e0b5928dd') {
    return { error: 'No autorizado' }
  }

  const movementType = formData.get('movement_type') as string
  const amountStr = formData.get('amount') as string
  const movementDate = formData.get('movement_date') as string
  const note = (formData.get('note') as string || '').trim()

  if (!movementType || !amountStr || !movementDate) {
    return { error: 'Faltan campos obligatorios.' }
  }

  if (movementType !== 'contribution' && movementType !== 'withdrawal' && movementType !== 'adjustment') {
    return { error: 'Tipo de movimiento no válido.' }
  }

  const amount = parseFloat(amountStr)
  if (isNaN(amount)) {
    return { error: 'El importe debe ser un número válido.' }
  }

  if ((movementType === 'contribution' || movementType === 'withdrawal') && amount <= 0) {
    return { error: 'El importe debe ser mayor que 0 para este tipo de movimiento.' }
  }

  if (movementType === 'adjustment' && amount === 0) {
    return { error: 'El importe del ajuste no puede ser 0.' }
  }

  const { error } = await supabase
    .from('capital_movements')
    .insert({
      movement_type: movementType,
      amount,
      movement_date: movementDate,
      note: note || null
    })

  if (error) {
    return { error: 'No se pudo registrar el movimiento. Inténtalo de nuevo.' }
  }

  revalidatePath('/admin/movimientos')
  revalidatePath('/admin/finanzas')
  revalidatePath('/admin')
  
  return { success: true }
}

export async function editCapitalMovement(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.id !== '76320352-4c29-42ad-a105-345e0b5928dd') {
    return { error: 'No autorizado' }
  }

  const id = formData.get('id') as string
  const movementType = formData.get('movement_type') as string
  const amountStr = formData.get('amount') as string
  const movementDate = formData.get('movement_date') as string
  const note = (formData.get('note') as string || '').trim()

  if (!id || !movementType || !amountStr || !movementDate) {
    return { error: 'Faltan campos obligatorios.' }
  }

  const { data: movement } = await supabase
    .from('capital_movements')
    .select('id')
    .eq('id', id)
    .single()

  if (!movement) {
    return { error: 'Movimiento no encontrado.' }
  }

  const { data: recon } = await supabase
    .from('cash_reconciliations')
    .select('id')
    .eq('adjustment_movement_id', id)
    .single()

  if (recon) {
    return { error: 'Este movimiento pertenece a una conciliación y no puede editarse.' }
  }

  if (movementType !== 'contribution' && movementType !== 'withdrawal' && movementType !== 'adjustment') {
    return { error: 'Tipo de movimiento no válido.' }
  }

  const amount = parseFloat(amountStr)
  if (isNaN(amount)) {
    return { error: 'El importe debe ser un número válido.' }
  }

  if ((movementType === 'contribution' || movementType === 'withdrawal') && amount <= 0) {
    return { error: 'El importe debe ser mayor que 0 para este tipo de movimiento.' }
  }

  if (movementType === 'adjustment' && amount === 0) {
    return { error: 'El importe del ajuste no puede ser 0.' }
  }

  const { error } = await supabase
    .from('capital_movements')
    .update({
      movement_type: movementType,
      amount,
      movement_date: movementDate,
      note: note || null
    })
    .eq('id', id)

  if (error) {
    return { error: 'No se pudo actualizar el movimiento. Inténtalo de nuevo.' }
  }

  revalidatePath('/admin/movimientos')
  revalidatePath('/admin/finanzas')
  revalidatePath('/admin')
  
  return { success: true }
}

export async function deleteCapitalMovement(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.id !== '76320352-4c29-42ad-a105-345e0b5928dd') {
    return { error: 'No autorizado' }
  }

  const id = formData.get('id') as string

  if (!id) {
    return { error: 'ID de movimiento no proporcionado.' }
  }

  const { data: movement } = await supabase
    .from('capital_movements')
    .select('id')
    .eq('id', id)
    .single()

  if (!movement) {
    return { error: 'Movimiento no encontrado.' }
  }

  const { data: recon } = await supabase
    .from('cash_reconciliations')
    .select('id')
    .eq('adjustment_movement_id', id)
    .single()

  if (recon) {
    return { error: 'Este movimiento pertenece a una conciliación y no puede eliminarse.' }
  }

  const { error } = await supabase
    .from('capital_movements')
    .delete()
    .eq('id', id)

  if (error) {
    return { error: 'No se pudo eliminar el movimiento. Inténtalo de nuevo.' }
  }

  revalidatePath('/admin/movimientos')
  revalidatePath('/admin/finanzas')
  revalidatePath('/admin')
  
  return { success: true }
}
