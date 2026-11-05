import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import IphoneQuoteFlow from '@/components/public/quote/IphoneQuoteFlow'
import { PublicHeader } from '@/components/public/PublicHeader'
import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Valora tu iPhone en Gran Canaria',
  description: 'Obtén una valoración orientativa de tu iPhone en Gran Canaria. Consulta el valor estimado y continúa con tu solicitud de venta en KevPhonesGC.',
  alternates: {
    canonical: '/cotizar'
  },
  openGraph: {
    type: 'website',
    locale: 'es_ES',
    url: 'https://kevphones.es/cotizar',
    siteName: 'KevPhonesGC',
    title: 'Valora tu iPhone en Gran Canaria | KevPhonesGC',
    description: 'Obtén una valoración orientativa de tu iPhone en Gran Canaria. Consulta el valor estimado y continúa con tu solicitud de venta en KevPhonesGC.',
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'KevPhonesGC - Compra y vende iPhone en Gran Canaria'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Valora tu iPhone en Gran Canaria | KevPhonesGC',
    description: 'Obtén una valoración orientativa de tu iPhone en Gran Canaria. Consulta el valor estimado y continúa con tu solicitud de venta en KevPhonesGC.',
    images: ['/opengraph-image']
  }
}

export const dynamic = 'force-dynamic'

export default async function CotizarPage({
  searchParams
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedParams = await searchParams
  const mode = resolvedParams.mode === 'trade_in' ? 'trade_in' : 'sell'
  const targetId = typeof resolvedParams.target === 'string' ? resolvedParams.target : null

  const adminSupabase = createSupabaseAdminClient()
  const publicSupabase = await createClient()

  // --- 1. TRADE-IN TARGET RESOLUTION ---
  let targetDevice = null
  if (mode === 'trade_in' && targetId) {
    const { data: device, error: deviceError } = await publicSupabase
      .from('public_stock')
      .select('device_id, model_name, storage, color, listing_price, discount_price')
      .eq('device_id', targetId)
      .maybeSingle()

    const effectivePrice = device?.discount_price ?? device?.listing_price

    if (deviceError || !device || typeof effectivePrice !== 'number' || effectivePrice < 0) {
      return (
        <div className="kevphones-quote-page flex flex-col min-h-screen bg-black">
          <PublicHeader />
          <main className="kevphones-quote-page__unavailable flex-1 px-4 flex flex-col items-center justify-center">
            <div className="text-center max-w-md">
              <h2 className="text-xl text-white font-medium mb-4">Dispositivo no disponible</h2>
              <p className="text-zinc-400 mb-8">
                Este dispositivo ya no está disponible para parte de pago.
              </p>
              <a 
                href="/#stock"
                className="inline-block bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-6 rounded-xl transition-colors"
              >
                Ver stock disponible
              </a>
            </div>
          </main>
        </div>
      )
    }

    targetDevice = {
      id: device.device_id,
      model_name: device.model_name || 'Dispositivo',
      storage: device.storage,
      color: device.color,
      listing_price: effectivePrice
    }
  }

  // --- 2. IPHONE DATA LOADING ---
  const { data: basePrices, error: basePricesError } = await adminSupabase
    .from('iphone_quote_base_prices')
    .select('model_id, storage')
    .eq('active', true)

  let iphoneModels: any[] = []
  
  if (!basePricesError && basePrices && basePrices.length > 0) {
    const activeModelIds = Array.from(new Set(basePrices.map(bp => bp.model_id)))

    const [{ data: modelsData }, { data: variantsData }] = await Promise.all([
      publicSupabase
      .from('device_models')
      .select('id, name, supports_battery_health, supports_cycles, sort_order')
      .in('id', activeModelIds)
      .eq('category', 'iphone')
      .eq('active', true)
      .order('sort_order', { ascending: true }),
      publicSupabase
      .from('device_model_variants')
      .select('model_id, variant_type, value, sort_order')
      .in('model_id', activeModelIds)
      .in('variant_type', ['storage', 'color'])
      .eq('active', true)
      .order('sort_order', { ascending: true })
    ])

    if (modelsData) {
      iphoneModels = modelsData
        .map(m => {
          const activeStorages = Array.from(new Set(
            basePrices
              .filter(bp => bp.model_id === m.id)
              .map(bp => bp.storage)
          ))
          const colors = Array.from(new Set(
            (variantsData || [])
              .filter(v => v.model_id === m.id && v.variant_type === 'color')
              .map(v => v.value)
          ))
          return {
            id: m.id,
            name: m.name,
            supports_battery_health: m.supports_battery_health,
            supports_cycles: m.supports_cycles,
            storages: activeStorages,
            colors: colors
          }
        })
        .filter(m => m.storages.length > 0)
    }
  }

  if (iphoneModels.length === 0) {
    return (
      <div className="kevphones-quote-page flex flex-col min-h-screen bg-black">
        <PublicHeader />
        <main className="kevphones-quote-page__unavailable flex-1 px-4 flex items-center justify-center">
          <div className="text-center text-zinc-400">
            <p>El cotizador no está disponible en este momento.</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="kevphones-quote-page flex flex-col min-h-screen bg-[#050506]">
      <PublicHeader />
      <main className="kevphones-quote-page__main flex-1">
        <div className="kevphones-quote-page__container">
          <IphoneQuoteFlow 
            models={iphoneModels} 
            quoteMode={mode}
            targetDevice={targetDevice}
          />
        </div>
        <aside className="max-w-2xl mx-auto px-4 py-8 text-center text-xs text-zinc-500 space-y-2">
          <p>
            Valoración orientativa para comprar y vender iPhone en Gran Canaria. El precio final se confirma tras la revisión física del dispositivo.
          </p>
          <p>
            ¿Prefieres enviar fotos directamente? Puedes iniciar una{' '}
            <Link href="/vender" className="text-purple-400 hover:underline">
              solicitud de venta
            </Link>
            .
          </p>
        </aside>
      </main>
    </div>
  )
}
