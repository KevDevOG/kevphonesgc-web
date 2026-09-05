import { createClient } from '@/lib/supabase/server'
import { PublicStockSection, PublicStockItem } from '@/components/public/stock/PublicStockSection'
import { PublicHeader } from '@/components/public/PublicHeader'
import Link from 'next/link'

export default async function Home() {
  const supabase = await createClient()

  // 1. Fetch available devices
  const { data: devicesData, error: devicesError } = await supabase
    .from('devices')
    .select(`
      id,
      model_id,
      storage,
      color,
      battery_health,
      battery_cycles,
      condition,
      has_box,
      has_cable,
      has_invoice,
      original_parts,
      fully_functional,
      warranty_until,
      listing_price,
      created_at,
      device_models (
        id,
        name,
        brand,
        category,
        supports_battery_health,
        supports_cycles
      )
    `)
    .eq('status', 'available')
    .order('created_at', { ascending: false })

  if (devicesError) {
    console.error('Error fetching devices:', devicesError)
  }

  const deviceIds = devicesData ? devicesData.map(d => d.id) : []

  // 1.5 Fetch device_images for real photos
  let deviceImagesData: any[] = []
  if (deviceIds.length > 0) {
    const { data: imgData, error: imgError } = await supabase
      .from('device_images')
      .select('id, device_id, storage_path, position')
      .in('device_id', deviceIds)
      .order('position', { ascending: true })
      
    if (imgError) {
      console.error('Error fetching real device images:', imgError)
    } else {
      deviceImagesData = imgData || []
    }
  }
  
  const realImageMap = new Map<string, { id: string, url: string, position: number }[]>()
  for (const img of deviceImagesData) {
    const { data } = supabase.storage.from('device-images').getPublicUrl(img.storage_path)
    if (data?.publicUrl) {
      if (!realImageMap.has(img.device_id)) {
        realImageMap.set(img.device_id, [])
      }
      realImageMap.get(img.device_id)!.push({
        id: img.id,
        url: data.publicUrl,
        position: img.position
      })
    }
  }

  // 2. Fetch catalog images to map exactly to model_id + color
  const { data: catalogImagesData, error: catalogImagesError } = await supabase
    .from('device_model_catalog_images')
    .select('model_id, color, storage_path')

  if (catalogImagesError) {
    console.error('Error fetching catalog images:', catalogImagesError)
  }

  // Map images by "model_id|color"
  const imageMap = new Map<string, string>()
  if (catalogImagesData) {
    for (const img of catalogImagesData) {
      const key = `${img.model_id}|${img.color || ''}`
      const { data } = supabase.storage.from('model-images').getPublicUrl(img.storage_path)
      if (data?.publicUrl) {
        imageMap.set(key, data.publicUrl)
      }
    }
  }

  // 3. Normalize and map data to explicit serializable type
  let publicStock: PublicStockItem[] = []

  if (devicesData) {
    for (const d of devicesData) {
      const dm = Array.isArray(d.device_models) ? d.device_models[0] : d.device_models
      if (!dm) continue

      const imageKey = `${d.model_id}|${d.color || ''}`
      const catalog_image_url = imageMap.get(imageKey) || null
      
      const realImages = realImageMap.get(d.id) || []

      publicStock.push({
        id: d.id,
        model_id: d.model_id,
        storage: d.storage,
        color: d.color,
        battery_health: d.battery_health,
        battery_cycles: d.battery_cycles,
        condition: d.condition,
        has_box: d.has_box,
        has_cable: d.has_cable,
        has_invoice: d.has_invoice,
        original_parts: d.original_parts,
        fully_functional: d.fully_functional,
        warranty_until: d.warranty_until,
        listing_price: d.listing_price,
        created_at: d.created_at,
        model_name: dm.name,
        brand: dm.brand,
        category: dm.category,
        supports_battery_health: dm.supports_battery_health,
        supports_cycles: dm.supports_cycles,
        catalog_image_url,
        real_images: realImages
      })
    }
  }

  // 4. Sort by Category Order, then newest
  const categoryOrder: Record<string, number> = {
    iphone: 1,
    ps5: 2,
    nintendo_switch: 3
  }

  publicStock.sort((a, b) => {
    const catA = categoryOrder[a.category] || 99
    const catB = categoryOrder[b.category] || 99
    if (catA !== catB) {
      return catA - catB
    }
    // Same category, order by created_at desc
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  const heroImage = publicStock.find(d => d.category === 'iphone' && d.catalog_image_url)?.catalog_image_url || null

  return (
    <div className="flex flex-col min-h-screen bg-black pb-20 md:pb-0">
      <PublicHeader />

      <main className="flex-1 w-full bg-black">
        {/* Hero Section */}
        <div className="w-full max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 pt-12 pb-16 md:pt-24 md:pb-24">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            
            {/* Left Content */}
            <div className="flex flex-col items-start text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-zinc-800 bg-zinc-900/50 mb-6">
                <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></span>
                <span className="text-[10px] sm:text-xs font-semibold text-zinc-300 tracking-widest uppercase">COMPRA · VENTA · TASACIÓN · CANARIAS</span>
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold text-white tracking-tight mb-6 leading-[1.1]">
                iPhones revisados.<br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-purple-600">
                  Compra con confianza.
                </span>
              </h1>
              
              <p className="text-zinc-400 text-lg md:text-xl mb-10 max-w-lg leading-relaxed">
                Stock real, dispositivos revisados y valoración de tu iPhone en pocos pasos.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto mb-6">
                <a 
                  href="#stock" 
                  className="w-full sm:w-auto px-8 py-4 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-xl transition-all shadow-[0_0_20px_rgba(147,51,234,0.3)] hover:shadow-[0_0_30px_rgba(147,51,234,0.5)] text-center flex items-center justify-center gap-2"
                >
                  Ver stock
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </a>
                <Link 
                  href="/cotizar" 
                  className="w-full sm:w-auto px-8 py-4 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-white font-medium rounded-xl transition-all text-center"
                >
                  Cotizar el mío
                </Link>
              </div>
              
              <Link 
                href="/vender" 
                className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors inline-flex items-center gap-1"
              >
                ¿Quieres vender directamente? <span className="text-purple-400 ml-1">Vender mi iPhone</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            {/* Right Visual */}
            <div className="relative flex justify-center items-center h-64 sm:h-80 md:h-full">
              <div className="absolute inset-0 bg-purple-600/20 blur-[80px] md:blur-[120px] rounded-full"></div>
              {heroImage ? (
                <img src={heroImage} alt="iPhone stock" className="relative z-10 w-[60%] sm:w-[50%] md:w-[70%] max-w-[280px] drop-shadow-2xl hover:-translate-y-2 transition-transform duration-700" />
              ) : (
                <div className="relative z-10 w-40 h-80 rounded-[2.5rem] border-[6px] border-zinc-900 bg-black shadow-2xl overflow-hidden flex flex-col">
                  <div className="h-5 w-1/2 bg-zinc-900 mx-auto rounded-b-xl absolute top-0 inset-x-0"></div>
                  <div className="flex-1 bg-gradient-to-br from-zinc-800/50 to-black"></div>
                </div>
              )}
            </div>
            
          </div>
        </div>

        {/* Trust Strip */}
        <div className="w-full border-y border-zinc-900 bg-[#060608]">
          <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 py-10 md:py-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-4 divide-y md:divide-y-0 md:divide-x divide-zinc-900">
              
              <div className="flex items-start gap-4 pt-4 md:pt-0 md:px-8 first:pt-0">
                <div className="w-10 h-10 rounded-full bg-purple-900/20 flex items-center justify-center flex-shrink-0 text-purple-400">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-white font-medium mb-1">Revisados</h3>
                  <p className="text-zinc-500 text-sm">Antes de publicar</p>
                </div>
              </div>

              <div className="flex items-start gap-4 pt-6 md:pt-0 md:px-8">
                <div className="w-10 h-10 rounded-full bg-purple-900/20 flex items-center justify-center flex-shrink-0 text-purple-400">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-white font-medium mb-1">Stock real</h3>
                  <p className="text-zinc-500 text-sm">Unidades disponibles</p>
                </div>
              </div>

              <div className="flex items-start gap-4 pt-6 md:pt-0 md:px-8">
                <div className="w-10 h-10 rounded-full bg-purple-900/20 flex items-center justify-center flex-shrink-0 text-purple-400">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-white font-medium mb-1">Trato directo</h3>
                  <p className="text-zinc-500 text-sm">Atención en Canarias</p>
                </div>
              </div>

            </div>
          </div>
        </div>
        
        <section id="stock" className="pt-8 scroll-mt-20">
          <PublicStockSection devices={publicStock} />
        </section>
      </main>
    </div>
  )
}
