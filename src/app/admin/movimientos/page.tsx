import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CapitalMovementsPage } from '@/components/admin/capital/CapitalMovementsPage'
import { AdminPageShell } from '@/components/admin/layout/AdminPageShell'

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

  const { data: reconciliations } = await supabase
    .from('cash_reconciliations')
    .select('adjustment_movement_id')
    .not('adjustment_movement_id', 'is', null)

  const reconciliationAdjustmentIds = new Set((reconciliations || []).map(r => r.adjustment_movement_id))

  const validMovements = (movements || []).map(m => ({
    ...m,
    is_reconciliation_adjustment: reconciliationAdjustmentIds.has(m.id)
  }))

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
    <AdminPageShell>
      <CapitalMovementsPage 
        movements={validMovements as any} 
        totalContributions={totalContributions}
        totalWithdrawals={totalWithdrawals}
        totalAdjustments={totalAdjustments}
        netCapitalMovements={netCapitalMovements}
      />
    </AdminPageShell>
  )
}
