import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { FinancePage } from '@/components/admin/finance/FinancePage'
import { getExpectedCashBreakdown } from '@/actions/finance'

export const metadata = {
  title: 'Finanzas - Admin KevPhonesGC'
}

export default async function AdminFinancePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.id !== '76320352-4c29-42ad-a105-345e0b5928dd') {
    redirect('/admin/login')
  }

  const { data: settingsRow } = await supabase
    .from('financial_settings')
    .select('*')
    .eq('id', 1)
    .single()

  const settings = settingsRow || { opening_cash: null, opening_date: null }

  const breakdown = await getExpectedCashBreakdown()

  const { data: reconciliations } = await supabase
    .from('cash_reconciliations')
    .select('*')
    .order('reconciliation_date', { ascending: false })
    .order('created_at', { ascending: false })

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
          <FinancePage 
            settings={settings as any} 
            breakdown={breakdown}
            reconciliations={reconciliations || []}
          />
        </main>
      </div>
    </>
  )
}
