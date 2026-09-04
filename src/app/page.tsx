import { createClient } from '@/lib/supabase/server'
import { PublicStockSection, PublicStockItem } from '@/components/public/stock/PublicStockSection'

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
      original_parts,
      fully_functional,
      warranty_until,
      listing_price,
      created_at,
      device_models (
        id,
        name,
        brand,
        category
      )
    `)
    .eq('status', 'available')
    .order('created_at', { ascending: false })

  if (devicesError) {
    console.error('Error fetching devices:', devicesError)
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
        original_parts: d.original_parts,
        fully_functional: d.fully_functional,
        warranty_until: d.warranty_until,
        listing_price: d.listing_price,
        created_at: d.created_at,
        model_name: dm.name,
        brand: dm.brand,
        category: dm.category,
        catalog_image_url
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
    <div className="flex flex-col min-h-screen bg-black">
      <main className="flex-1 w-full bg-black">
        {/* Simple minimal hero to integrate properly with stock section */}
        <div className="w-full text-center py-20 px-4">
          <h1 className="text-4xl md:text-6xl font-bold text-white tracking-tight mb-4">
            KevPhonesGC
          </h1>
          <p className="text-[#A8A8B0] max-w-xl mx-auto text-lg">
            Compra y venta de dispositivos Apple y consolas.
          </p>
        </div>
        
        <PublicStockSection devices={publicStock} />
      </main>
    </div>
  )
}
