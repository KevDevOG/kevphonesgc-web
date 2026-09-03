import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { SaleRequestDetail } from '@/components/admin/requests/SaleRequestDetail'

const ADMIN_UUID = '76320352-4c29-42ad-a105-345e0b5928dd'

export default async function SaleRequestDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.id !== ADMIN_UUID) {
    redirect('/admin/login')
  }

  const { data: request, error } = await supabase
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
    .eq('id', params.id)
    .single()

  if (error || !request) {
    notFound()
  }

  const { data: images } = await supabase
    .from('sale_request_images')
    .select('id, storage_path, position, created_at')
    .eq('request_id', params.id)
    .order('position', { ascending: true })

  return <SaleRequestDetail request={request} images={images || []} />
}
