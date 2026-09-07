import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { FinancePage } from '@/components/admin/finance/FinancePage'
import { getExpectedCashBreakdown } from '@/actions/finance'
import { AdminPageShell } from '@/components/admin/layout/AdminPageShell'

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
    <AdminPageShell>
      <FinancePage 
        settings={settings as any} 
        breakdown={breakdown}
        reconciliations={reconciliations || []}
      />
    </AdminPageShell>
  )
}
