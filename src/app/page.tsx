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
  let wallapopUrl: string | null = null
  let instagramUrl: string | null = null
  let tiktokUrl: string | null = null

  // Wait for every independent query, including unexpected promise rejections.
  const [, reviewsResult, devicesResult, catalogImagesResult] = await Promise.allSettled([
    (async () => {
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
    })(),
    supabase
    .from('reviews')
    .select('id, author_name, review_text, source, rating, review_date, featured, sort_order, created_at')
    .eq('active', true)
    .order('featured', { ascending: false })
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })
    .limit(6),
    supabase
    .from('public_stock')
    .select(`
      device_id,
      model_id,
      storage,
      color,
      size,
      connectivity,
      chip,
      memory,
      case_type,
      case_material,
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
      supports_cycles,
      custom_product_type,
      custom_specs
    `)
    .order('created_at', { ascending: false }),
    supabase
    .from('device_model_catalog_images')
    .select('model_id, color, storage_path')
  ])

  // Feed rejections into each query's existing logging and safe fallback path.
  const { data: reviewsData, error: reviewsError } = reviewsResult.status === 'fulfilled'
    ? reviewsResult.value
    : { data: null, error: reviewsResult.reason || new Error('Unexpected query rejection') }
  const { data: devicesData, error: devicesError } = devicesResult.status === 'fulfilled'
    ? devicesResult.value
    : { data: null, error: devicesResult.reason || new Error('Unexpected query rejection') }
  const { data: catalogImagesData, error: catalogImagesError } = catalogImagesResult.status === 'fulfilled'
    ? catalogImagesResult.value
    : { data: null, error: catalogImagesResult.reason || new Error('Unexpected query rejection') }

  // Handle each query result independently.
  if (reviewsError) {
    console.error('Error fetching reviews:', reviewsError)
  }
  
  const publicReviews: PublicReview[] = reviewsData || []

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
      const colorKey = `${d.model_id}|${d.color || ''}`
      const defaultKey = `${d.model_id}|__default__`
      const catalog_image_url = (d.color ? imageMap.get(colorKey) : null) || imageMap.get(defaultKey) || null
      
      const realImages = realImageMap.get(d.device_id) || []

      publicStock.push({
        id: d.device_id,
        model_id: d.model_id,
        storage: d.storage,
        color: d.color,
        size: d.size,
        connectivity: d.connectivity,
        chip: d.chip,
        memory: d.memory,
        case_type: d.case_type,
        case_material: d.case_material,
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
        custom_product_type: d.custom_product_type,
        custom_specs: d.custom_specs,
        catalog_image_url,
        real_images: realImages
      })
    }
  }

  // 4. Sort by Category Order, then newest
  const categoryOrder: Record<string, number> = {
    iphone: 1,
    apple_watch: 2,
    airpods: 3,
    ipad: 4,
    ps5: 5,
    nintendo_switch: 6,
    other: 7
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
    <div className="kevphones-home flex flex-col min-h-screen bg-black pb-20 md:pb-0">
      <PublicHeader />

      <main className="flex-1 w-full bg-[#050506] overflow-hidden relative">
        <section className="kevphones-hero" aria-labelledby="home-title">
          <div className="kevphones-hero__layout">
            <div className="kevphones-hero__content">
              <h1 id="home-title">KEVPHONES</h1>
              <p className="kevphones-hero__headline">
                Compra y vende <span>iPhone en Canarias</span>
              </p>
              <p className="kevphones-hero__support">Stock real, dispositivos revisados y valoración de tu iPhone en pocos pasos.</p>
              <div className="kevphones-hero__actions">
                <a href="#stock" className="kevphones-hero__primary">
                  Ver stock
                </a>
                <Link href="/cotizar" className="kevphones-hero__secondary">
                  Cotizar el mío
                </Link>
              </div>
              <Link href="/vender" className="kevphones-hero__sell">
                <span>¿Quieres venderlo directamente?</span>
                <span>Vender mi iPhone</span>
              </Link>
            </div>

            <div className="kevphones-hero__visual">
              <div className="kevphones-hero__product">
                <Image
                  src="/iphone-14-pro-max.png"
                  alt="iPhone 14 Pro Max Deep Purple"
                  fill
                  className="object-contain"
                  loading="eager"
                  fetchPriority="high"
                  sizes="(min-width: 1280px) 632px, (min-width: 768px) 52vw, calc(100vw - 64px)"
                />
              </div>
            </div>
          </div>
        </section>

        <div className="kevphones-trust">
          <ul aria-label="Sobre KevPhonesGC">
            <li>
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                <path strokeLinecap="round" strokeLinejoin="round" d="m9 12 2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
              Dispositivos revisados
            </li>
            <li>
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h8m-8 4h5m-9 6 3-3h11a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v14Z" />
              </svg>
              Trato directo
            </li>
            <li>
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z" />
                <circle cx="12" cy="10" r="2.5" />
              </svg>
              Atención en Canarias
            </li>
          </ul>
        </div>

        <section id="stock" className="kevphones-stock-transition scroll-mt-16 md:scroll-mt-20">
          <PublicStockSection 
            devices={publicStock} 
            whatsappPhone={whatsappPhone}
            contactEnabled={contactEnabled}
          />
        </section>

        {publicReviews.length > 0 && (
          <section id="reviews" className="kevphones-lower-band">
            <PublicReviewsSection reviews={publicReviews} wallapopUrl={wallapopUrl} />
          </section>
        )}

        <section className="kevphones-conversion" aria-labelledby="conversion-title">
          <div className="kevphones-lower-section kevphones-conversion__inner">
            <div>
              <h2 id="conversion-title" className="kevphones-lower-title">Cotiza o vende tu dispositivo</h2>
              <p>Recibe una valoración orientativa o envía una solicitud de venta con los datos y fotografías del dispositivo.</p>
            </div>
            <div className="kevphones-conversion__actions">
              <Link href="/cotizar" className="kevphones-conversion__primary">Cotizar mi iPhone</Link>
              <Link href="/vender" className="kevphones-conversion__secondary">Vender mi dispositivo</Link>
            </div>
          </div>
        </section>

        <section id="faq" className="kevphones-lower-band">
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
