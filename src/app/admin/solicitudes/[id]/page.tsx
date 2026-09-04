import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { SaleRequestDetail } from '@/components/admin/requests/SaleRequestDetail'

const ADMIN_UUID = '76320352-4c29-42ad-a105-345e0b5928dd'

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function SaleRequestDetailPage({ params }: PageProps) {
  const { id } = await params
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
    .eq('id', id)
    .single()

  if (error || !request) {
    notFound()
  }

  const { data: images } = await supabase
    .from('sale_request_images')
    .select('id, storage_path, photo_type, position, created_at')
    .eq('request_id', id)
    .order('position', { ascending: true })

  const imagesWithUrls = []
  if (images) {
    for (const img of images) {
      try {
        const { data, error: urlError } = await supabase.storage
          .from('sale-request-images')
          .createSignedUrl(img.storage_path, 3600)
        
        imagesWithUrls.push({
          ...img,
          signedUrl: !urlError && data?.signedUrl ? data.signedUrl : null
        })
      } catch (err) {
        imagesWithUrls.push({
          ...img,
          signedUrl: null
        })
      }
    }
  }

  return <SaleRequestDetail request={request} images={imagesWithUrls} />
}
