import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CapitalMovementsPage } from '@/components/admin/capital/CapitalMovementsPage'

export const metadata = {
  title: 'Movimientos de Capital - Admin KevPhonesGC'
}

export default async function AdminCapitalMovementsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.id !== '76320352-4c29-42ad-a105-345e0b5928dd') {
    redirect('/admin/login')
  }

  const { data: movements } = await supabase
    .from('capital_movements')
    .select('*')
    .order('movement_date', { ascending: false })
    .order('created_at', { ascending: false })

  const validMovements = movements || []

  const totalContributions = validMovements
    .filter(m => m.movement_type === 'contribution')
    .reduce((acc, m) => acc + Number(m.amount), 0)

  const totalWithdrawals = validMovements
    .filter(m => m.movement_type === 'withdrawal')
    .reduce((acc, m) => acc + Number(m.amount), 0)

  const totalAdjustments = validMovements
    .filter(m => m.movement_type === 'adjustment')
    .reduce((acc, m) => acc + Number(m.amount), 0)

  const netCapitalMovements = totalContributions - totalWithdrawals + totalAdjustments

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>
      <link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800&family=Inter:wght@400;600&display=swap" rel="stylesheet"/>
      
      <div className="bg-[#131313] text-[#F7F7F7] font-body-md min-h-screen flex flex-col pb-24 md:pb-0" style={{ fontFamily: 'Inter, sans-serif' }}>
        <header className="bg-[#131313] border-b border-[#1F1F24] w-full top-0 sticky z-50">
          <div className="flex items-center justify-between px-4 py-2 w-full max-w-[1280px] mx-auto h-14">
            <div className="flex items-center gap-4">
              <a href="/admin" className="text-[#d7baff] hover:bg-[#353534] transition-colors rounded-full p-2 active:opacity-80 flex items-center justify-center -ml-2">
                <span className="material-symbols-outlined">arrow_back</span>
              </a>
              <h1 className="text-[24px] font-bold uppercase tracking-tighter text-[#d7baff]" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>KevPhonesGC Admin</h1>
            </div>
            <div className="w-10"></div>
          </div>
        </header>
        
        <main className="flex-grow px-4 py-4 md:max-w-2xl md:mx-auto w-full space-y-8 pb-8">
          <CapitalMovementsPage 
            movements={validMovements as any} 
            totalContributions={totalContributions}
            totalWithdrawals={totalWithdrawals}
            totalAdjustments={totalAdjustments}
            netCapitalMovements={netCapitalMovements}
          />
        </main>
      </div>
    </>
  )
}
