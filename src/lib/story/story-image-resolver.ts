export type StoryImageSourceType =
  | 'catalog_exact'
  | 'catalog_default'
  | 'real_photo'
  | 'placeholder'

export interface StoryImageOption {
  type: StoryImageSourceType
  url: string | null
  label: string
  sourceName: string
  priority: number
}

export interface ResolveStoryImagesInput {
  modelId?: string
  modelName: string
  color: string | null
  catalogImages?: { model_id: string; color: string; storage_path: string }[]
  deviceImages?: { storage_path: string }[]
  supabaseUrl?: string
}

/**
 * Resolves images according to the strict 4-tier priority:
 * 1. Exact model + color catalog image
 * 2. General / default model catalog image
 * 3. Real device photo
 * 4. Neutral placeholder (never an invented phone design)
 */
export function resolveStoryImageCandidates(input: ResolveStoryImagesInput): {
  primary: StoryImageOption
  candidates: StoryImageOption[]
  hasExactCatalogImage: boolean
  isFallback: boolean
} {
  const candidates: StoryImageOption[] = []
  const supabaseUrl = (input.supabaseUrl || process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/$/, '')
  const cleanColor = (input.color || '').trim().toLowerCase()

  // 1. Exact model + color catalog image (Priority 1 - Default in normal flow)
  let foundExactCatalog: StoryImageOption | null = null
  if (cleanColor && input.catalogImages && input.catalogImages.length > 0 && supabaseUrl) {
    const exactCatalog = input.catalogImages.find(
      img => img.color && img.color.trim().toLowerCase() === cleanColor && img.color !== '__default__'
    )
    if (exactCatalog && exactCatalog.storage_path) {
      foundExactCatalog = {
        type: 'catalog_exact',
        url: `${supabaseUrl}/storage/v1/object/public/model-images/${exactCatalog.storage_path}`,
        label: `Catálogo oficial (${input.color})`,
        sourceName: 'Catálogo exacto',
        priority: 1
      }
      candidates.push(foundExactCatalog)
    }
  }

  // 2. General / default model catalog image (Priority 2 - Fallback 1)
  if (input.catalogImages && input.catalogImages.length > 0 && supabaseUrl) {
    const defaultCatalog = input.catalogImages.find(img => img.color === '__default__')
      || input.catalogImages[0]

    if (defaultCatalog && defaultCatalog.storage_path) {
      const isAlreadyAdded = candidates.some(c => c.url && c.url.includes(defaultCatalog.storage_path))
      if (!isAlreadyAdded) {
        candidates.push({
          type: 'catalog_default',
          url: `${supabaseUrl}/storage/v1/object/public/model-images/${defaultCatalog.storage_path}`,
          label: `Catálogo general (${input.modelName})`,
          sourceName: 'Catálogo general',
          priority: 2
        })
      }
    }
  }

  // 3. Real device photo (Priority 3 - Fallback 2)
  if (input.deviceImages && input.deviceImages.length > 0 && supabaseUrl) {
    const firstRealImage = input.deviceImages[0]
    if (firstRealImage && firstRealImage.storage_path) {
      candidates.push({
        type: 'real_photo',
        url: `${supabaseUrl}/storage/v1/object/public/device-images/${firstRealImage.storage_path}`,
        label: 'Foto real del dispositivo',
        sourceName: 'Foto real',
        priority: 3
      })
    }
  }

  // 4. Neutral placeholder (Priority 4 - Fallback 3, never an invented phone design)
  candidates.push({
    type: 'placeholder',
    url: null,
    label: `Marcador neutro (${input.modelName})`,
    sourceName: 'Marcador neutro',
    priority: 4
  })

  // Determine whether exact catalog image exists
  const hasExactCatalogImage = foundExactCatalog !== null
  const isFallback = !hasExactCatalogImage

  // If exact catalog exists, it is always the primary image by default
  // Otherwise, use the highest-priority available candidate
  candidates.sort((a, b) => a.priority - b.priority)
  const primary = foundExactCatalog ?? candidates[0]

  return {
    primary,
    candidates,
    hasExactCatalogImage,
    isFallback
  }
}
