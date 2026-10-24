import { createClient } from '@/lib/supabase/server'
import type { StoryGeneratorDevice } from '@/components/admin/stock/StoryGeneratorModal'

export type StoryCatalogImage = { model_id: string; color: string; storage_path: string }

export type StoryData = {
  device: StoryGeneratorDevice
  catalogImages: StoryCatalogImage[]
}

const first = <T,>(v: T | T[] | null | undefined): T | undefined => (Array.isArray(v) ? v[0] : v ?? undefined)

/**
 * Server-side loader with everything the Story generator needs for one device:
 * device fields, model, real photos (fallback) and the model's catalog images.
 * Caller is responsible for the admin authorization check.
 */
export async function fetchStoryData(deviceId: string): Promise<StoryData | null> {
  const supabase = await createClient()

  const { data: device, error } = await supabase
    .from('devices')
    .select(`
      id,
      model_id,
      storage,
      color,
      condition,
      battery_health,
      battery_cycles,
      has_box,
      has_cable,
      has_invoice,
      fully_functional,
      warranty_until,
      listing_price,
      discount_price,
      device_models ( name, category, brand ),
      device_images ( storage_path, position )
    `)
    .eq('id', deviceId)
    .single()

  if (error || !device) return null

  const { data: catalogImages } = device.model_id
    ? await supabase
        .from('device_model_catalog_images')
        .select('model_id, color, storage_path')
        .eq('model_id', device.model_id)
    : { data: [] as StoryCatalogImage[] }

  const images = ((device.device_images as { storage_path: string; position: number | null }[] | null) || [])
    .slice()
    .sort((a, b) => (a.position || 0) - (b.position || 0))
    .map(i => ({ storage_path: i.storage_path }))

  const model = first(device.device_models as any) as { name: string; category: string; brand?: string } | undefined

  return {
    device: {
      id: device.id,
      model_id: device.model_id,
      storage: device.storage,
      color: device.color,
      condition: device.condition,
      battery_health: device.battery_health,
      battery_cycles: device.battery_cycles,
      has_box: device.has_box,
      has_cable: device.has_cable,
      has_invoice: device.has_invoice,
      fully_functional: device.fully_functional,
      warranty_until: device.warranty_until,
      listing_price: Number(device.listing_price),
      discount_price: device.discount_price != null ? Number(device.discount_price) : null,
      device_models: model,
      device_images: images
    },
    catalogImages: (catalogImages as StoryCatalogImage[] | null) || []
  }
}
