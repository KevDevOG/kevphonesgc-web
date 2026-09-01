'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function registerExpense(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.id !== '76320352-4c29-42ad-a105-345e0b5928dd') {
    return { error: 'No autorizado' }
  }

  const categoryId = formData.get('category_id') as string
  const amountStr = formData.get('amount') as string
  const expenseDate = formData.get('expense_date') as string
  const note = (formData.get('note') as string || '').trim()

  if (!categoryId || !amountStr || !expenseDate) {
    return { error: 'Faltan campos obligatorios.' }
  }

  const amount = parseFloat(amountStr)
  if (isNaN(amount) || amount <= 0) {
    return { error: 'El importe debe ser mayor que 0.' }
  }

  const { data: category } = await supabase
    .from('expense_categories')
    .select('active')
    .eq('id', categoryId)
    .single()

  if (!category || !category.active) {
    return { error: 'Categoría no válida o inactiva.' }
  }

  const { error } = await supabase
    .from('expenses')
    .insert({
      category_id: categoryId,
      amount,
      expense_date: expenseDate,
      note: note || null
    })

  if (error) {
    return { error: 'No se pudo registrar el gasto. Inténtalo de nuevo.' }
  }

  revalidatePath('/admin/gastos')
  revalidatePath('/admin')
  
  return { success: true }
}
