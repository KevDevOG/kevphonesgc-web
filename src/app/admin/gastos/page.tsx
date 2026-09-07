import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ExpensesPage } from '@/components/admin/expenses/ExpensesPage'
import { AdminPageShell } from '@/components/admin/layout/AdminPageShell'

export const metadata = {
  title: 'Gastos - Admin KevPhonesGC'
}

export default async function AdminGastosPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.id !== '76320352-4c29-42ad-a105-345e0b5928dd') {
    redirect('/admin/login')
  }

  const { data: categories } = await supabase
    .from('expense_categories')
    .select('id, name, slug')
    .eq('active', true)
    .order('sort_order', { ascending: true })

  const { data: allExpenses } = await supabase
    .from('expenses')
    .select(`
      id,
      amount,
      expense_date,
      note,
      created_at,
      expense_categories (
        id,
        name,
        slug
      )
    `)
    .order('expense_date', { ascending: false })
    .order('created_at', { ascending: false })

  // Current month calculation
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth()

  const currentMonthExpenses = (allExpenses || []).filter(exp => {
    const d = new Date(exp.expense_date)
    return d.getFullYear() === currentYear && d.getMonth() === currentMonth
  })

  const monthly_total = currentMonthExpenses.reduce((acc, exp) => acc + Number(exp.amount), 0)
  const monthly_count = currentMonthExpenses.length

  const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
  const current_month_label = `${months[currentMonth]} ${currentYear}`

  const categoryTotals = currentMonthExpenses.reduce((acc, exp) => {
    // Check if the relation is returned as an array or object
    const catData = Array.isArray(exp.expense_categories) ? exp.expense_categories[0] : exp.expense_categories
    const catName = catData?.name || 'Desconocido'
    acc[catName] = (acc[catName] || 0) + Number(exp.amount)
    return acc
  }, {} as Record<string, number>)

  // Clean up typing for expenses to match exactly what is expected (handling array vs single object for relation)
  const cleanedExpenses = (allExpenses || []).map(exp => ({
    ...exp,
    expense_categories: Array.isArray(exp.expense_categories) ? exp.expense_categories[0] : exp.expense_categories
  }))

  return (
    <AdminPageShell>
      <ExpensesPage 
        categories={categories || []}
        expenses={cleanedExpenses as any} 
        monthlyTotal={monthly_total}
        monthlyCount={monthly_count}
        monthLabel={current_month_label}
        categoryTotals={categoryTotals}
      />
    </AdminPageShell>
  )
}
