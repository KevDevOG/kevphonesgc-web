import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import IphoneQuoteFlow from '@/components/public/quote/IphoneQuoteFlow'

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
      .from('devices')
      .select('id, storage, color, listing_price, status, device_models(name)')
      .eq('id', targetId)
      .single()

    if (deviceError || !device || device.status !== 'available' || typeof device.listing_price !== 'number') {
      return (
        <main className="min-h-screen bg-black pt-24 pb-12 px-4 flex flex-col items-center justify-center">
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
      )
    }

    targetDevice = {
      id: device.id,
      model_name: (device.device_models as any)?.name || 'Dispositivo',
      storage: device.storage,
      color: device.color,
      listing_price: device.listing_price
    }
  }

  // --- 2. QUOTABLE IPHONE FILTERING ---
  const { data: basePrices, error: basePricesError } = await adminSupabase
    .from('iphone_quote_base_prices')
    .select('model_id, storage')
    .eq('active', true)

  if (basePricesError) {
    console.error('Error fetching base prices:', {
      code: basePricesError.code,
      message: basePricesError.message,
      details: basePricesError.details,
      hint: basePricesError.hint
    })
    return (
      <main className="min-h-screen bg-black pt-24 pb-12 px-4 flex items-center justify-center">
        <div className="text-center text-zinc-400">
          <p>El cotizador no está disponible en este momento.</p>
        </div>
      </main>
    )
  }

  if (!basePrices || basePrices.length === 0) {
    return (
      <main className="min-h-screen bg-black pt-24 pb-12 px-4 flex items-center justify-center">
        <div className="text-center text-zinc-400">
          <p>No hay configuraciones de cotización activas en este momento.</p>
        </div>
      </main>
    )
  }

  const activeModelIds = Array.from(new Set(basePrices.map(bp => bp.model_id)))

  // Public client already initialized above

  // Load models
  const { data: modelsData, error: modelsError } = await publicSupabase
    .from('device_models')
    .select('id, name, supports_battery_health, supports_cycles, sort_order')
    .in('id', activeModelIds)
    .eq('category', 'iphone')
    .eq('active', true)
    .order('sort_order', { ascending: true })

  if (modelsError) {
    console.error('Error fetching models:', {
      code: modelsError.code,
      message: modelsError.message,
      details: modelsError.details,
      hint: modelsError.hint
    })
    return (
      <main className="min-h-screen bg-black pt-24 pb-12 px-4 flex items-center justify-center">
        <div className="text-center text-zinc-400">
          <p>El cotizador no está disponible en este momento.</p>
        </div>
      </main>
    )
  }

  if (!modelsData || modelsData.length === 0) {
    return (
      <main className="min-h-screen bg-black pt-24 pb-12 px-4 flex items-center justify-center">
        <div className="text-center text-zinc-400">
          <p>No hay configuraciones de cotización activas en este momento.</p>
        </div>
      </main>
    )
  }

  // Load variants for these models
  const { data: variantsData, error: variantsError } = await publicSupabase
    .from('device_model_variants')
    .select('model_id, variant_type, value, sort_order')
    .in('model_id', activeModelIds)
    .in('variant_type', ['storage', 'color'])
    .eq('active', true)
    .order('sort_order', { ascending: true })

  if (variantsError) {
    console.error('Error fetching variants:', {
      code: variantsError.code,
      message: variantsError.message,
      details: variantsError.details,
      hint: variantsError.hint
    })
    return (
      <main className="min-h-screen bg-black pt-24 pb-12 px-4 flex items-center justify-center">
        <div className="text-center text-zinc-400">
          <p>El cotizador no está disponible en este momento.</p>
        </div>
      </main>
    )
  }

  // Format data for client
  const models = modelsData
    .map(m => {
      // Find storages that have active base prices
      const activeStorages = Array.from(new Set(
        basePrices
          .filter(bp => bp.model_id === m.id)
          .map(bp => bp.storage)
      ))

      // Find valid colors
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
    .filter(m => m.storages.length > 0) // Remove models that end up with zero quotable storage variants

  // Models are already sorted by the database via sort_order, no need to manually sort

  if (models.length === 0) {
    return (
      <main className="min-h-screen bg-black pt-24 pb-12 px-4 flex items-center justify-center">
        <div className="text-center text-zinc-400">
          <p>No hay configuraciones de cotización activas en este momento.</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-black pt-24 pb-12 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-2 text-center">Tasa tu iPhone</h1>
        <p className="text-zinc-400 text-center mb-8">Obtén una valoración orientativa en pocos pasos.</p>
        
        <IphoneQuoteFlow 
          models={models} 
          quoteMode={mode}
          targetDevice={targetDevice}
        />
      </div>
    </main>
  )
}
