import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { SaleRequestDetail } from '@/components/admin/requests/SaleRequestDetail'
import { PurchaseFromRequestForm } from '@/components/admin/requests/PurchaseFromRequestForm'
import { AdminPageShell } from '@/components/admin/layout/AdminPageShell'

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

  let tradeInContext = null
  if (request.quote_id) {
    try {
      const { data: quote, error: quoteError } = await supabase
        .from('iphone_quotes')
        .select('quote_mode, target_device_id, target_listing_price_snapshot')
        .eq('id', request.quote_id)
        .maybeSingle()

      if (quote?.quote_mode === 'trade_in' && quote.target_device_id) {
        const { data: targetDevice } = await supabase
          .from('devices')
          .select(`
            id,
            model_id,
            storage,
            color,
            listing_price,
            status,
            device_models (
              id,
              name,
              brand,
              category
            )
          `)
          .eq('id', quote.target_device_id)
          .maybeSingle()

        tradeInContext = {
          targetDeviceId: quote.target_device_id,
          targetListingPriceSnapshot: Number(quote.target_listing_price_snapshot),
          targetDevice: targetDevice ? {
            id: targetDevice.id,
            modelId: targetDevice.model_id,
            modelName: (targetDevice.device_models as any)?.name || '',
            storage: targetDevice.storage,
            color: targetDevice.color,
            listingPrice: targetDevice.listing_price,
            status: targetDevice.status
          } : null
        }
      }
    } catch (err) {
      console.error('Error fetching trade-in context:', err)
    }
  }

  return (
    <AdminPageShell>
      <div className="flex flex-col gap-6 lg:gap-8 w-full max-w-6xl mx-auto">
        <SaleRequestDetail request={request} images={imagesWithUrls} tradeInContext={tradeInContext} />
      </div>
    </AdminPageShell>
  )
}
