import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ClientList } from '@/components/admin/clients/ClientList'
import { AdminPageShell } from '@/components/admin/layout/AdminPageShell'

export const metadata = {
  title: 'Clientes - Admin KevPhonesGC'
}

export default async function ClientsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user || user.id !== '76320352-4c29-42ad-a105-345e0b5928dd') {
    redirect('/admin/login')
  }

  const { data: clients } = await supabase
    .from('clients')
    .select('id, name, phone, location, created_at')
    .order('created_at', { ascending: false })

  const { data: sales } = await supabase
    .from('sales')
    .select('buyer_client_id')
    .not('buyer_client_id', 'is', null)

  const { data: devices } = await supabase
    .from('devices')
    .select('seller_client_id')
    .not('seller_client_id', 'is', null)

  const processedClients = (clients || []).map(client => {
    const purchases_count = (sales || []).filter(s => s.buyer_client_id === client.id).length
    const sales_to_business_count = (devices || []).filter(d => d.seller_client_id === client.id).length
    return {
      ...client,
      purchases_count,
      sales_to_business_count
    }
  })

  return (
    <AdminPageShell>
      <ClientList clients={processedClients} />
    </AdminPageShell>
  )
}
