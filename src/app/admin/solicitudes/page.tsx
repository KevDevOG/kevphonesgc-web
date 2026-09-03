import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SaleRequestsList } from '@/components/admin/requests/SaleRequestsList'

const ADMIN_UUID = '76320352-4c29-42ad-a105-345e0b5928dd'

export default async function SaleRequestsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.id !== ADMIN_UUID) {
    redirect('/admin/login')
  }

  const { data: requests, error } = await supabase
    .from('sale_requests')
    .select(`
      *,
      device_models (
        id,
        name,
        brand,
        category
      )
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching sale requests:', error)
  }

  return <SaleRequestsList initialRequests={requests || []} />
}
