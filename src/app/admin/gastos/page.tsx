import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ExpensesPage } from '@/components/admin/expenses/ExpensesPage'

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
    <>
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>
      <link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800&family=Inter:wght@400;600&display=swap" rel="stylesheet"/>
      
      <div className="bg-[#131313] text-[#F7F7F7] font-body-md min-h-screen flex flex-col pb-24" style={{ fontFamily: 'Inter, sans-serif' }}>
        <header className="bg-[#131313] border-b border-[#1F1F24] w-full top-0 sticky z-50">
          <div className="flex items-center justify-between px-4 py-2 w-full max-w-[1280px] mx-auto">
            <div className="flex items-center gap-4">
              <a href="/admin" className="text-[#d7baff] hover:bg-[#353534] transition-colors rounded-full p-2 active:opacity-80 flex items-center justify-center">
                <span className="material-symbols-outlined">arrow_back</span>
              </a>
              <h1 className="text-[24px] font-bold uppercase tracking-tighter text-[#d7baff]" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>KevPhonesGC Admin</h1>
            </div>
          </div>
        </header>
        
        <main className="flex-grow px-4 py-4 md:max-w-2xl md:mx-auto w-full space-y-8 pb-8">
          <ExpensesPage 
            categories={categories || []}
            expenses={cleanedExpenses as any} 
            monthlyTotal={monthly_total}
            monthlyCount={monthly_count}
            monthLabel={current_month_label}
            categoryTotals={categoryTotals}
          />
        </main>
      </div>
    </>
  )
}
