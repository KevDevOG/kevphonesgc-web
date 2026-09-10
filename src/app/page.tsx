import { createClient } from '@/lib/supabase/server'
import { PublicStockSection, PublicStockItem } from '@/components/public/stock/PublicStockSection'
import { PublicReviewsSection, PublicReview } from '@/components/public/reviews/PublicReviewsSection'
import { PublicFaqSection } from '@/components/public/faq/PublicFaqSection'
import { PublicFooter } from '@/components/public/footer/PublicFooter'
import { PublicHeader } from '@/components/public/PublicHeader'
import Image from 'next/image'
import Link from 'next/link'

export default async function Home() {
  const supabase = await createClient()

  // 0. Fetch business settings for contact info
  let whatsappPhone: string | null = null
  let contactEnabled: boolean = false
  let heroTitle = "iPhones revisados. Compra con confianza."
  let heroSubtitle = "Stock real, dispositivos revisados y valoración de tu iPhone en pocos pasos."
  let shippingText = "Atención en Canarias"
  let wallapopUrl: string | null = null
  let instagramUrl: string | null = null
  let tiktokUrl: string | null = null

  try {
    const { data: settingsData, error: settingsError } = await supabase
      .from('business_settings')
      .select('whatsapp_phone, contact_enabled, hero_title, hero_subtitle, shipping_text, wallapop_url, instagram_url, tiktok_url')
      .eq('singleton', true)
      .maybeSingle()
      
    if (settingsError) {
      console.error('Error fetching business settings:', settingsError)
    } else if (settingsData) {
      contactEnabled = settingsData.contact_enabled === true
      whatsappPhone = settingsData.whatsapp_phone || null
      
      const ht = settingsData.hero_title?.trim()
      if (ht) heroTitle = ht
      
      const hs = settingsData.hero_subtitle?.trim()
      if (hs) heroSubtitle = hs
      
      const st = settingsData.shipping_text?.trim()
      if (st) shippingText = st
      
      const wu = settingsData.wallapop_url?.trim()
      if (wu) wallapopUrl = wu

      const iu = settingsData.instagram_url?.trim()
      if (iu) instagramUrl = iu

      const tu = settingsData.tiktok_url?.trim()
      if (tu) tiktokUrl = tu
    }
  } catch (err) {
    console.error('Unhandled error fetching business settings:', err)
  }

  // 0.5. Fetch public reviews
  const { data: reviewsData, error: reviewsError } = await supabase
    .from('reviews')
    .select('id, author_name, review_text, source, rating, review_date, featured, sort_order, created_at')
    .eq('active', true)
    .order('featured', { ascending: false })
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })
    .limit(6)

  if (reviewsError) {
    console.error('Error fetching reviews:', reviewsError)
  }
  
  const publicReviews: PublicReview[] = reviewsData || []

  // 1. Fetch available devices
  const { data: devicesData, error: devicesError } = await supabase
    .from('public_stock')
    .select(`
      device_id,
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
      discount_price,
      created_at,
      model_name,
      brand,
      category,
      supports_battery_health,
      supports_cycles
    `)
    .order('created_at', { ascending: false })

  if (devicesError) {
    console.error('Error fetching devices:', devicesError)
  }

  const deviceIds = devicesData ? devicesData.map(d => d.device_id) : []

  // 1.5 Fetch device_images for real photos
  let deviceImagesData: any[] = []
  if (deviceIds.length > 0) {
    const { data: imgData, error: imgError } = await supabase
      .from('public_device_images')
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
      const imageKey = `${d.model_id}|${d.color || ''}`
      const catalog_image_url = imageMap.get(imageKey) || null
      
      const realImages = realImageMap.get(d.device_id) || []

      publicStock.push({
        id: d.device_id,
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
        discount_price: d.discount_price,
        created_at: d.created_at,
        model_name: d.model_name,
        brand: d.brand,
        category: d.category,
        supports_battery_health: d.supports_battery_health,
        supports_cycles: d.supports_cycles,
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



  return (
    <div className="flex flex-col min-h-screen bg-black pb-20 md:pb-0">
      <PublicHeader />

      <main className="flex-1 w-full bg-[#050506] overflow-hidden relative">
        {/* Background Ambient Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1000px] h-[400px] bg-purple-900/10 rounded-[100%] blur-[100px] pointer-events-none -z-10 animate-glow-pulse"></div>

        {/* Hero Section */}
        <div className="w-full max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 pt-8 pb-12 md:pt-20 md:pb-24 relative z-10 animate-fade-in-up">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10 lg:gap-12 items-center">
            
            {/* Left Content */}
            <div className="flex flex-col items-start text-left">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full border border-[#1F1F24] bg-[#0B0B0E]/80 mb-4 md:mb-6 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse shadow-[0_0_8px_#a855f7]"></span>
                <span className="text-[10px] font-semibold text-zinc-400 tracking-wider uppercase">COMPRA · VENTA · TASACIÓN · CANARIAS</span>
              </div>
              
              <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold text-white tracking-tight leading-[1.1] whitespace-pre-wrap">
                {heroTitle}
              </h1>
              
              <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl mt-2 md:mt-3 mb-3 md:mb-4 tracking-tight">
                <span className="text-zinc-100 font-medium">Compra y vende </span>
                <span className="font-semibold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-violet-300">iPhone en Canarias</span>
              </p>

              <p className="text-zinc-400 text-base sm:text-lg md:text-xl lg:text-2xl mb-6 md:mb-8 max-w-[580px] leading-snug md:leading-relaxed whitespace-pre-wrap font-light">
                {heroSubtitle}
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-3 md:gap-4 w-full sm:w-auto mb-6">
                <a 
                  href="#stock" 
                  className="w-full sm:w-auto px-6 py-3.5 md:px-8 md:py-4 bg-purple-600 hover:bg-purple-500 active:scale-95 text-white font-medium rounded-xl transition-all duration-200 shadow-[0_0_20px_rgba(147,51,234,0.2)] hover:shadow-[0_0_30px_rgba(147,51,234,0.4)] text-center flex items-center justify-center gap-2 hover:-translate-y-0.5"
                >
                  Ver stock
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </a>
                <Link 
                  href="/cotizar" 
                  className="w-full sm:w-auto px-6 py-3.5 md:px-8 md:py-4 bg-[#0B0B0E] border border-[#1F1F24] hover:bg-[#111114] hover:border-zinc-700 active:scale-95 text-white font-medium rounded-xl transition-all duration-200 text-center hover:-translate-y-0.5"
                >
                  Cotizar el mío
                </Link>
              </div>
              
              <Link 
                href="/vender" 
                className="text-sm text-zinc-400 hover:text-zinc-300 transition-colors inline-flex flex-wrap items-center gap-1 group mb-2"
              >
                ¿Quieres venderlo directamente? <span className="text-purple-400 ml-1 group-hover:text-purple-300 font-medium">Vender mi iPhone</span>
                <svg className="w-4 h-4 text-purple-400 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
              <p className="text-xs text-zinc-400 md:text-zinc-500 font-medium">
                5/5 en Wallapop · Stock real · Entrega en Canarias
              </p>
            </div>

            {/* Mobile Visual (< md) */}
            <div className="md:hidden relative flex justify-center items-center h-[240px] w-full mt-6 mb-2 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
              <div className="absolute inset-0 bg-purple-600/30 blur-[60px] rounded-full pointer-events-none scale-75"></div>
              <div className="relative w-full max-w-[180px] h-full drop-shadow-2xl">
                <Image 
                  src="/iphone-14-pro-max.png"
                  alt="iPhone 14 Pro Max Deep Purple"
                  fill
                  className="object-contain"
                  priority
                  sizes="(max-width: 768px) 100vw, 0vw"
                />
              </div>
            </div>

            {/* Right Visual (Desktop >= md) */}
            <div className="hidden md:flex relative justify-center items-center h-[340px] sm:h-[420px] md:h-[500px] lg:h-[600px] animate-fade-in-up md:-translate-x-4 md:-translate-y-6 lg:-translate-x-8 lg:-translate-y-8" style={{ animationDelay: '200ms' }}>
              <div className="absolute inset-0 bg-purple-600/20 blur-[80px] rounded-full pointer-events-none scale-90"></div>
              <div className="absolute inset-0 bg-white/10 blur-[60px] rounded-full pointer-events-none transform scale-50"></div>
              <div className="relative w-[75%] sm:w-[65%] md:w-[95%] lg:w-[100%] max-w-[400px] h-full drop-shadow-2xl">
                <Image 
                  src="/iphone-14-pro-max.png"
                  alt="iPhone 14 Pro Max Deep Purple"
                  fill
                  className="object-contain"
                  priority
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
            </div>
            
          </div>
        </div>

        {/* Trust Strip */}
        <div className="w-full border-y border-[#1F1F24] bg-[#050506] relative z-10">
          <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 py-8 md:py-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-4 divide-y md:divide-y-0 md:divide-x divide-[#1F1F24]">
              
              <div className="flex items-center gap-4 pt-2 md:pt-0 md:px-8 first:pt-0 md:justify-center">
                <div className="w-12 h-12 rounded-xl bg-[#0B0B0E] border border-[#1F1F24] flex items-center justify-center flex-shrink-0 text-purple-400 shadow-sm">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-white font-medium text-[15px] mb-0.5">Revisados</h3>
                  <p className="text-zinc-500 text-sm">Antes de publicar</p>
                </div>
              </div>

              <div className="flex items-center gap-4 pt-6 md:pt-0 md:px-8 md:justify-center">
                <div className="w-12 h-12 rounded-xl bg-[#0B0B0E] border border-[#1F1F24] flex items-center justify-center flex-shrink-0 text-purple-400 shadow-sm">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-white font-medium text-[15px] mb-0.5">Stock real</h3>
                  <p className="text-zinc-500 text-sm">Unidades disponibles</p>
                </div>
              </div>

              <div className="flex items-center gap-4 pt-6 md:pt-0 md:px-8 md:justify-center">
                <div className="w-12 h-12 rounded-xl bg-[#0B0B0E] border border-[#1F1F24] flex items-center justify-center flex-shrink-0 text-purple-400 shadow-sm">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-white font-medium text-[15px] mb-0.5">Trato directo</h3>
                  <p className="text-zinc-500 text-sm whitespace-pre-wrap">{shippingText}</p>
                </div>
              </div>

            </div>
          </div>
        </div>
        
        <section id="stock" className="pt-8 scroll-mt-20">
          <PublicStockSection 
            devices={publicStock} 
            whatsappPhone={whatsappPhone}
            contactEnabled={contactEnabled}
          />
        </section>

        {/* How it Works Section */}
        <section className="bg-[#050506] border-t border-[#1F1F24] py-20 md:py-32">
          <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-4">
                Cómo funciona
              </h2>
              <p className="text-lg text-zinc-400 max-w-2xl font-light">
                Compra, vende o valora tu dispositivo en pocos pasos.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
              
              {/* Card 1 */}
              <div className="bg-[#0B0B0E] border border-[#1F1F24] rounded-3xl p-8 flex flex-col items-start relative overflow-hidden group hover:border-[#383840] transition-colors duration-300">
                <div className="absolute top-0 right-0 p-8 opacity-5 font-bold text-9xl -mt-10 -mr-6 pointer-events-none text-white">1</div>
                <h3 className="text-xl font-bold text-white mb-6 relative z-10">Compra un dispositivo</h3>
                
                <ul className="flex flex-col gap-4 mb-8 flex-1 w-full relative z-10">
                  <li className="flex gap-3 items-start">
                    <span className="text-purple-400 font-bold text-sm mt-0.5">01</span>
                    <span className="text-sm text-zinc-400">Consulta nuestro stock disponible.</span>
                  </li>
                  <li className="flex gap-3 items-start">
                    <span className="text-purple-400 font-bold text-sm mt-0.5">02</span>
                    <span className="text-sm text-zinc-400">Revisa el estado y los detalles del dispositivo.</span>
                  </li>
                  <li className="flex gap-3 items-start">
                    <span className="text-purple-400 font-bold text-sm mt-0.5">03</span>
                    <span className="text-sm text-zinc-400">Contacta con nosotros para cerrar la operación.</span>
                  </li>
                </ul>
                
                <a href="#stock" className="mt-auto inline-flex items-center gap-2 text-sm font-medium text-purple-400 hover:text-purple-300 transition-colors group-hover:translate-x-1 relative z-10">
                  Ver stock
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </a>
              </div>

              {/* Card 2 */}
              <div className="bg-[#0B0B0E] border border-[#1F1F24] rounded-3xl p-8 flex flex-col items-start relative overflow-hidden group hover:border-[#383840] transition-colors duration-300">
                <div className="absolute top-0 right-0 p-8 opacity-5 font-bold text-9xl -mt-10 -mr-6 pointer-events-none text-white">2</div>
                <h3 className="text-xl font-bold text-white mb-6 relative z-10">Cotiza tu iPhone</h3>
                
                <ul className="flex flex-col gap-4 mb-8 flex-1 w-full relative z-10">
                  <li className="flex gap-3 items-start">
                    <span className="text-purple-400 font-bold text-sm mt-0.5">01</span>
                    <span className="text-sm text-zinc-400">Elige tu modelo y sus características.</span>
                  </li>
                  <li className="flex gap-3 items-start">
                    <span className="text-purple-400 font-bold text-sm mt-0.5">02</span>
                    <span className="text-sm text-zinc-400">Indica el estado del dispositivo.</span>
                  </li>
                  <li className="flex gap-3 items-start">
                    <span className="text-purple-400 font-bold text-sm mt-0.5">03</span>
                    <span className="text-sm text-zinc-400">Recibe una valoración orientativa al instante.</span>
                  </li>
                </ul>
                
                <Link href="/cotizar" className="mt-auto inline-flex items-center gap-2 text-sm font-medium text-purple-400 hover:text-purple-300 transition-colors group-hover:translate-x-1 relative z-10">
                  Cotizar ahora
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              </div>

              {/* Card 3 */}
              <div className="bg-[#0B0B0E] border border-[#1F1F24] rounded-3xl p-8 flex flex-col items-start relative overflow-hidden group hover:border-[#383840] transition-colors duration-300">
                <div className="absolute top-0 right-0 p-8 opacity-5 font-bold text-9xl -mt-10 -mr-6 pointer-events-none text-white">3</div>
                <h3 className="text-xl font-bold text-white mb-6 relative z-10">Vende tu dispositivo</h3>
                
                <ul className="flex flex-col gap-4 mb-8 flex-1 w-full relative z-10">
                  <li className="flex gap-3 items-start">
                    <span className="text-purple-400 font-bold text-sm mt-0.5">01</span>
                    <span className="text-sm text-zinc-400">Completa los datos del dispositivo.</span>
                  </li>
                  <li className="flex gap-3 items-start">
                    <span className="text-purple-400 font-bold text-sm mt-0.5">02</span>
                    <span className="text-sm text-zinc-400">Añade las fotografías solicitadas.</span>
                  </li>
                  <li className="flex gap-3 items-start">
                    <span className="text-purple-400 font-bold text-sm mt-0.5">03</span>
                    <span className="text-sm text-zinc-400">Revisaremos tu solicitud y te contactaremos.</span>
                  </li>
                </ul>
                
                <Link href="/vender" className="mt-auto inline-flex items-center gap-2 text-sm font-medium text-purple-400 hover:text-purple-300 transition-colors group-hover:translate-x-1 relative z-10">
                  Vender dispositivo
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              </div>

            </div>
          </div>
        </section>

        <section id="reviews" className="bg-[#060608] border-t border-[#1F1F24]">
          <PublicReviewsSection reviews={publicReviews} wallapopUrl={wallapopUrl} />
        </section>

        <section id="faq" className="bg-black border-t border-[#1F1F24]">
          <PublicFaqSection />
        </section>

        <PublicFooter 
          whatsappPhone={whatsappPhone}
          contactEnabled={contactEnabled}
          instagramUrl={instagramUrl}
          tiktokUrl={tiktokUrl}
          wallapopUrl={wallapopUrl}
        />
      </main>
    </div>
  )
}
