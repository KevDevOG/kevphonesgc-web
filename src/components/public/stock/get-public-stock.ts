import { createClient } from '@/lib/supabase/server'
import { PublicStockItem } from './PublicStockSection'

export type PublicStockData = {
  devices: PublicStockItem[]
  whatsappPhone: string | null
  contactEnabled: boolean
  instagramUrl: string | null
  tiktokUrl: string | null
  wallapopUrl: string | null
}

export async function getPublicStockData(): Promise<PublicStockData> {
  const supabase = await createClient()

  let whatsappPhone: string | null = null
  let contactEnabled = false
  let wallapopUrl: string | null = null
  let instagramUrl: string | null = null
  let tiktokUrl: string | null = null

  // Fetch business settings, public stock and catalog images in parallel
  const [, devicesResult, catalogImagesResult] = await Promise.allSettled([
    (async () => {
      try {
        const { data: settingsData, error: settingsError } = await supabase
          .from('business_settings')
          .select('whatsapp_phone, contact_enabled, wallapop_url, instagram_url, tiktok_url')
          .eq('singleton', true)
          .maybeSingle()

        if (!settingsError && settingsData) {
          contactEnabled = settingsData.contact_enabled === true
          whatsappPhone = settingsData.whatsapp_phone || null
          wallapopUrl = settingsData.wallapop_url?.trim() || null
          instagramUrl = settingsData.instagram_url?.trim() || null
          tiktokUrl = settingsData.tiktok_url?.trim() || null
        }
      } catch (err) {
        console.error('Error fetching business settings:', err)
      }
    })(),
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

  const devicesData = devicesResult.status === 'fulfilled' ? devicesResult.value.data : null
  const catalogImagesData = catalogImagesResult.status === 'fulfilled' ? catalogImagesResult.value.data : null

  const deviceIds = devicesData ? devicesData.map(d => d.device_id) : []

  // Fetch real device images
  let deviceImagesData: any[] = []
  if (deviceIds.length > 0) {
    const { data: imgData, error: imgError } = await supabase
      .from('public_device_images')
      .select('id, device_id, storage_path, position')
      .in('device_id', deviceIds)
      .order('position', { ascending: true })

    if (!imgError && imgData) {
      deviceImagesData = imgData
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

  // Map catalog images by "model_id|color"
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

  // Normalize and map data to explicit serializable type
  const publicStock: PublicStockItem[] = []
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

  // Sort by Category Order, then newest
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
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  return {
    devices: publicStock,
    whatsappPhone,
    contactEnabled,
    instagramUrl,
    tiktokUrl,
    wallapopUrl
  }
}
