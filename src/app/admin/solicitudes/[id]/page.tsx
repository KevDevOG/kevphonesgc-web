import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { SaleRequestDetail } from '@/components/admin/requests/SaleRequestDetail'
import { PurchaseFromRequestForm } from '@/components/admin/requests/PurchaseFromRequestForm'

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
      const { data: quote } = await supabase
        .from('iphone_quotes')
        .select('quote_mode, target_device_id, target_listing_price_snapshot')
        .eq('id', request.quote_id)
        .single()

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
              name,
              brand,
              category
            )
          `)
          .eq('id', quote.target_device_id)
          .single()

        tradeInContext = {
          targetDeviceId: quote.target_device_id,
          targetListingPriceSnapshot: quote.target_listing_price_snapshot,
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

  const canPurchase = request.status !== 'purchased' && request.status !== 'discarded'

const statusLabels: Record<string, string> = {
  new: 'Nueva',
  in_progress: 'En proceso',
  purchased: 'Comprado',
  discarded: 'Descartada'
}

const statusColors: Record<string, string> = {
  new: 'bg-[#9867db]/10 text-[#d7baff] border-[#9867db]/20',
  in_progress: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  purchased: 'bg-green-500/10 text-green-500 border-green-500/20',
  discarded: 'bg-red-500/10 text-red-500 border-red-500/20'
}

  return (
    <div className="pb-28 max-w-[1280px] mx-auto px-4 md:px-8 pt-6 relative z-50">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2 bg-[#0B0B0D] p-5 rounded-xl border border-[#1F1F24]">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#F7F7F7] mb-1 leading-none" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
            {request.device_models?.name || 'Solicitud de venta'}
          </h1>
          <p className="text-sm text-[#A8A8B0]">
            Recibida el {new Date(request.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4 w-full md:w-auto">
          <span className={`px-3 py-1.5 rounded-full border text-sm font-medium ${statusColors[request.status] || 'bg-gray-500/10 text-gray-500 border-gray-500/20'}`}>
            {statusLabels[request.status] || request.status}
          </span>
          {/* Note: The purchase button logic is now handled in SaleRequestDetail entirely, to easily pass the same context and keep UI grouped. */}
        </div>
      </div>

      {/* 
        This style block overrides the fixed layout of AdminPageShell so the page scrolls 
        normally with our custom header. It also hides the duplicate header rendered 
        inside SaleRequestDetail.
      */}
      <style>{`
        div.fixed.inset-0.z-40.bg-\\[\\#050505\\] {
          position: static !important;
          padding-top: 0 !important;
          padding-bottom: 0 !important;
          background: transparent !important;
          overflow: visible !important;
          z-index: auto !important;
        }
        div.fixed.inset-0.z-40.bg-\\[\\#050505\\] > main {
          padding-top: 0 !important;
          padding-left: 0 !important;
          padding-right: 0 !important;
        }
        div.fixed.inset-0.z-40.bg-\\[\\#050505\\] > main > section.flex.flex-col {
          display: none !important;
        }
      `}</style>
      
      <SaleRequestDetail request={request} images={imagesWithUrls} tradeInContext={tradeInContext} />
    </div>
  )
}
