import { createClient } from '@/lib/supabase/server'

// ============================================================================
// Types
// ============================================================================

export interface WhatsAppStockDevice {
  model_name: string
  storage: string | null
  color: string | null
  battery_health: number | null
  listing_price: number
  discount_price: number | null
}

export interface ActiveModelItem {
  id: string
  name: string
}

export interface BuyingPreferences {
  model?: string | null
  maxBudget?: number | null
  minBudget?: number | null
  storage?: string | null
  modelFamily?: string | null
  minBatteryHealth?: number | null
  bestBattery?: boolean | null
}

export interface FilteredStockResult {
  matches: WhatsAppStockDevice[]
  alternatives: WhatsAppStockDevice[]
  unmatchedReason?: string | null
  totalAvailable: number
}

export interface WhatsAppStockContext {
  matchedModel: ActiveModelItem | null
  devices: WhatsAppStockDevice[]
  totalCount: number
  filteredResult?: FilteredStockResult | null
  appliedPreferences?: BuyingPreferences | null
}

// ============================================================================
// Model Matching (Normalized, deterministic)
// ============================================================================

/**
 * Normalizes input text by converting to lowercase, removing diacritics/accents,
 * stripping punctuation, and trimming excessive whitespace.
 */
export function normalizeText(raw: string): string {
  return raw
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Escapes regex special characters in a string.
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Deterministically matches user input against REAL active iPhone models from the database.
 *
 * Rules:
 * - Checks longer, more specific models first (e.g. "iPhone 15 Pro Max" before "iPhone 15 Pro", before "iPhone 15").
 * - Supports model suffixes like "16 Pro Max", "15 Pro", "13 mini", "14 Plus", "16e", "17 Air".
 * - For base numbers (e.g. "15", "16", "17"), requires "iphone 15" or articles like "el 15", "un 15", "del 15"
 *   to avoid false positives with arbitrary numbers.
 * - Does NOT fuzzy-guess or invent models. Returns null if not confidently identified.
 */
export function findMatchingModel(
  rawText: string,
  models: ActiveModelItem[]
): ActiveModelItem | null {
  const normalized = normalizeText(rawText)
  if (!normalized) return null

  // Sort models by length of name descending to check the most specific first
  const sorted = [...models].sort((a, b) => b.name.length - a.name.length)

  for (const m of sorted) {
    const modelNorm = normalizeText(m.name)
    // Suffix without leading "iphone " (e.g. "15 pro max", "15 pro", "15", "se 2nd generation")
    const suffix = modelNorm.replace(/^iphone\s+/i, '').trim()
    const escapedSuffix = escapeRegex(suffix).replace(/\s+/g, '\\s*')

    let regex: RegExp
    const isBaseNumberOnly = /^[0-9]+$/.test(suffix)

    if (isBaseNumberOnly) {
      // Base numbers e.g. "15", "16", "17" require "iphone 15" or article "el/un/del/al 15"
      regex = new RegExp(`\\b(iphone\\s+${escapedSuffix}|(?:el|un|del|al)\\s+${escapedSuffix})\\b`, 'i')
    } else {
      // Models with qualifiers e.g. "15 pro", "16 pro max", "14 plus", "13 mini", "17 air", "16e"
      regex = new RegExp(`\\b(iphone\\s*)?${escapedSuffix}\\b`, 'i')
    }

    if (regex.test(normalized)) {
      return m
    }
  }

  return null
}

// ============================================================================
// Public Stock Data Access (Reuses public_stock view)
// ============================================================================

/**
 * Fetches real active iPhone model names from Supabase.
 */
export async function getActiveIphoneModels(): Promise<ActiveModelItem[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('device_models')
      .select('id, name')
      .eq('category', 'iphone')
      .eq('active', true)

    if (error || !data) {
      console.error('[WhatsApp Stock] Error fetching active models:', error)
      return []
    }

    return data
  } catch (err) {
    console.error('[WhatsApp Stock] Unhandled error fetching active models:', err)
    return []
  }
}

/**
 * Queries real public stock for a specific model from public_stock view.
 * Excludes private internal fields (purchase_price, seller info, IMEI, serial number).
 */
export async function getPublicStockForModel(
  modelName: string,
  limit = 5
): Promise<WhatsAppStockDevice[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('public_stock')
      .select('model_name, storage, color, battery_health, listing_price, discount_price')
      .eq('category', 'iphone')
      .eq('model_name', modelName)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error || !data) {
      console.error('[WhatsApp Stock] Error querying stock for model:', error)
      return []
    }

    return data as WhatsAppStockDevice[]
  } catch (err) {
    console.error('[WhatsApp Stock] Unhandled error querying stock for model:', err)
    return []
  }
}

/**
 * Queries a compact selection of currently available iPhones from public_stock view.
 * Maximum 5 units.
 */
export async function getGeneralPublicStock(
  limit = 5
): Promise<{ devices: WhatsAppStockDevice[]; totalCount: number }> {
  try {
    const supabase = await createClient()
    const { data, count, error } = await supabase
      .from('public_stock')
      .select('model_name, storage, color, battery_health, listing_price, discount_price', { count: 'exact' })
      .eq('category', 'iphone')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error || !data) {
      console.error('[WhatsApp Stock] Error querying general public stock:', error)
      return { devices: [], totalCount: 0 }
    }

    return {
      devices: data as WhatsAppStockDevice[],
      totalCount: count ?? data.length,
    }
  } catch (err) {
    console.error('[WhatsApp Stock] Unhandled error querying general public stock:', err)
    return { devices: [], totalCount: 0 }
  }
}

/**
 * Queries all currently available, published, active iPhones from public_stock view.
 * Maximum 100 devices for deterministic in-memory filtering and ranking.
 * Reuses existing public price logic and public view.
 * Never exposes internal notes, IMEI, serial number, or purchase price.
 */
export async function getAllAvailableIphones(): Promise<WhatsAppStockDevice[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('public_stock')
      .select('model_name, storage, color, battery_health, listing_price, discount_price')
      .eq('category', 'iphone')
      .order('created_at', { ascending: false })
      .limit(100)

    if (error || !data) {
      console.error('[WhatsApp Stock] Error fetching all available stock:', error)
      return []
    }

    return data as WhatsAppStockDevice[]
  } catch (err) {
    console.error('[WhatsApp Stock] Unhandled error fetching all available stock:', err)
    return []
  }
}

/**
 * Evaluates whether a device matches the model family filter.
 * Supported families from real iPhone models:
 * - 'Pro Max': matches /pro\s*max/i
 * - 'Pro': matches /pro/i (includes Pro and Pro Max; standard Pro ranked first)
 * - 'Plus': matches /plus/i
 * - 'mini': matches /mini/i
 * - 'Air': matches /air/i
 * - 'standard' / 'base': models without Pro, Plus, mini, Air (e.g. iPhone 13, 14, 15, 16)
 */
export function matchesModelFamily(modelName: string, family: string): boolean {
  const normFam = family.toLowerCase().trim()
  const normName = modelName.toLowerCase()

  if (normFam === 'pro max') {
    return normName.includes('pro max')
  }
  if (normFam === 'pro') {
    return normName.includes('pro') && !normName.includes('max')
  }
  if (normFam === 'plus') {
    return normName.includes('plus')
  }
  if (normFam === 'mini') {
    return normName.includes('mini')
  }
  if (normFam === 'air') {
    return normName.includes('air')
  }
  if (normFam === 'standard' || normFam === 'base') {
    return (
      !normName.includes('pro') &&
      !normName.includes('plus') &&
      !normName.includes('mini') &&
      !normName.includes('air')
    )
  }
  return false
}

/**
 * Deterministically filters and ranks stock based on user preferences.
 * - Maximum 5 matching results.
 * - Default ranking:
 *   1. Best match to requested constraints
 *   2. Lower price when equally matched (discount_price ?? listing_price)
 *   3. Better battery health when relevant
 * - If no exact match: identifies up to 3 nearest alternatives and explains why they differ.
 */
export function filterAndRankStock(
  allDevices: WhatsAppStockDevice[],
  filters: BuyingPreferences
): FilteredStockResult {
  const totalAvailable = allDevices.length

  const matches = allDevices.filter((d) => {
    const price = d.discount_price ?? d.listing_price

    // 1. Specific Model filter
    if (filters.model) {
      if (d.model_name.toLowerCase() !== filters.model.toLowerCase()) {
        return false
      }
    }

    // 2. Model Family filter
    if (filters.modelFamily) {
      if (!matchesModelFamily(d.model_name, filters.modelFamily)) {
        return false
      }
    }

    // 3. Storage filter
    if (filters.storage) {
      const targetNorm = filters.storage.toLowerCase().replace(/\s+/g, '')
      const devNorm = (d.storage || '').toLowerCase().replace(/\s+/g, '')
      if (targetNorm !== devNorm) {
        return false
      }
    }

    // 4. Budget filter
    if (filters.maxBudget != null && price > filters.maxBudget) {
      return false
    }
    if (filters.minBudget != null && price < filters.minBudget) {
      return false
    }

    // 5. Battery health filter
    if (filters.minBatteryHealth != null) {
      if (d.battery_health == null || d.battery_health < filters.minBatteryHealth) {
        return false
      }
    }

    return true
  })

  // Ranking (Section 5)
  const rankedMatches = [...matches].sort((a, b) => {
    const priceA = a.discount_price ?? a.listing_price
    const priceB = b.discount_price ?? b.listing_price
    const batA = a.battery_health ?? 0
    const batB = b.battery_health ?? 0

    // Priority for bestBattery ("el que tenga mejor batería")
    if (filters.bestBattery) {
      if (batB !== batA) return batB - batA
      return priceA - priceB
    }

    // If family is 'Pro' and not specifically 'Pro Max', prioritize standard Pro first
    if (filters.modelFamily?.toLowerCase() === 'pro') {
      const aIsMax = a.model_name.toLowerCase().includes('max')
      const bIsMax = b.model_name.toLowerCase().includes('max')
      if (!aIsMax && bIsMax) return -1
      if (aIsMax && !bIsMax) return 1
    }

    // Default ranking: lower price first, then better battery
    if (priceA !== priceB) {
      return priceA - priceB
    }
    return batB - batA
  }).slice(0, 5)

  if (rankedMatches.length > 0) {
    return {
      matches: rankedMatches,
      alternatives: [],
      totalAvailable,
    }
  }

  // No exact matches: find up to 3 nearest alternatives and explain differences (Section 6)
  let unmatchedReason: string | null = null

  if (filters.storage && filters.maxBudget != null) {
    unmatchedReason = `No tenemos ninguno de ${filters.storage} por menos de ${filters.maxBudget} €, pero estas son las opciones más cercanas:`
  } else if (filters.modelFamily && filters.maxBudget != null) {
    unmatchedReason = `No tenemos ningún ${filters.modelFamily} por menos de ${filters.maxBudget} €, pero estas son las opciones más cercanas:`
  } else if (filters.minBatteryHealth != null && filters.maxBudget != null) {
    unmatchedReason = `No tenemos ningún iPhone con mínimo ${filters.minBatteryHealth}% de batería por menos de ${filters.maxBudget} €, pero estas son las opciones más cercanas:`
  } else if (filters.maxBudget != null) {
    unmatchedReason = `No tenemos ningún iPhone disponible por menos de ${filters.maxBudget} €, pero estas son las opciones disponibles con precio más cercano:`
  } else if (filters.storage) {
    unmatchedReason = `No tenemos ningún iPhone de ${filters.storage} disponible ahora mismo, pero estas son las opciones más cercanas:`
  } else if (filters.modelFamily) {
    unmatchedReason = `No tenemos ningún iPhone ${filters.modelFamily} disponible ahora mismo, pero estas son las opciones más cercanas:`
  } else if (filters.minBatteryHealth != null) {
    unmatchedReason = `No tenemos ningún iPhone con más de ${filters.minBatteryHealth}% de batería ahora mismo, pero estas son las opciones disponibles:`
  } else {
    unmatchedReason = `No tenemos unidades que coincidan exactamente con esos filtros, pero estas son las opciones disponibles:`
  }

  // Rank alternatives by proximity
  const alternatives = [...allDevices].sort((a, b) => {
    const priceA = a.discount_price ?? a.listing_price
    const priceB = b.discount_price ?? b.listing_price

    let scoreA = 0
    let scoreB = 0

    if (filters.modelFamily) {
      if (matchesModelFamily(a.model_name, filters.modelFamily)) scoreA += 50
      if (matchesModelFamily(b.model_name, filters.modelFamily)) scoreB += 50
    }
    if (filters.storage) {
      if (a.storage === filters.storage) scoreA += 40
      if (b.storage === filters.storage) scoreB += 40
    }
    if (filters.maxBudget != null) {
      const diffA = Math.abs(priceA - filters.maxBudget)
      const diffB = Math.abs(priceB - filters.maxBudget)
      return (scoreB - scoreA) || (diffA - diffB)
    }

    return (scoreB - scoreA) || (priceA - priceB)
  }).slice(0, 3)

  return {
    matches: [],
    alternatives,
    unmatchedReason,
    totalAvailable,
  }
}

/**
 * Server-only orchestrator: identifies model and fetches real public stock data
 * for stock or buying questions, optionally applying user preferences.
 */
export async function resolveWhatsAppStock(
  rawText: string,
  preferences?: BuyingPreferences
): Promise<WhatsAppStockContext> {
  const activeModels = await getActiveIphoneModels()
  const matchedModel = findMatchingModel(rawText, activeModels)

  const hasPreferences =
    preferences &&
    (preferences.maxBudget != null ||
      preferences.minBudget != null ||
      preferences.storage != null ||
      preferences.modelFamily != null ||
      preferences.minBatteryHealth != null ||
      preferences.bestBattery != null ||
      preferences.model != null)

  // If user has specific preference filters or model preference
  if (hasPreferences) {
    const allDevices = await getAllAvailableIphones()
    const mergedFilters: BuyingPreferences = {
      ...preferences,
      model: preferences.model || matchedModel?.name || null,
    }
    const filteredResult = filterAndRankStock(allDevices, mergedFilters)

    return {
      matchedModel: matchedModel ?? (mergedFilters.model ? { id: 'filtered', name: mergedFilters.model } : null),
      devices: filteredResult.matches.length > 0 ? filteredResult.matches : filteredResult.alternatives,
      totalCount: allDevices.length,
      filteredResult,
      appliedPreferences: mergedFilters,
    }
  }

  if (matchedModel) {
    const devices = await getPublicStockForModel(matchedModel.name, 5)
    return {
      matchedModel,
      devices,
      totalCount: devices.length,
    }
  }

  const general = await getGeneralPublicStock(5)
  return {
    matchedModel: null,
    devices: general.devices,
    totalCount: general.totalCount,
  }
}
