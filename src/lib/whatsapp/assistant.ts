import {
  findMatchingModel,
  type ActiveModelItem,
  type BuyingPreferences,
  type FilteredStockResult,
  type WhatsAppStockContext,
  type WhatsAppStockDevice,
} from './stock'

// ============================================================================
// Types
// ============================================================================

export type WhatsAppAssistantAction = 'reply' | 'handoff' | 'ignore'

export type WhatsAppIntent =
  | 'human_request'
  | 'selling_device'
  | 'available_stock'
  | 'buying_iphone'
  | 'business_hours'
  | 'location_service_area'
  | 'greeting'
  | 'unknown_question'
  | 'empty_message'

export interface ConversationSellingState {
  model?: string | null
  storage?: string | null
  batteryHealth?: number | null
  condition?: string | null
  accessories?: string | null
}

export interface ConversationBuyingState {
  model?: string | null
  maxBudget?: number | null
  minBudget?: number | null
  storage?: string | null
  modelFamily?: string | null
  minBatteryHealth?: number | null
  bestBattery?: boolean | null
}

export interface WhatsAppConversationState {
  flow: 'none' | 'selling' | 'buying'
  selling?: ConversationSellingState
  buying?: ConversationBuyingState
  awaitingField?:
    | 'model'
    | 'storage'
    | 'battery_health'
    | 'condition'
    | 'accessories'
    | 'maxBudget'
    | null
}

export interface ValidatedAiExtraction {
  intent?: 'selling' | 'buying' | 'stock' | 'human' | 'greeting' | 'unknown'
  model?: string | null
  storage?: string | null
  batteryHealth?: number | null
  condition?: string | null
  accessories?: string | null
  maxBudget?: number | null
  minBudget?: number | null
  modelFamily?: string | null
  minBatteryHealth?: number | null
  bestBattery?: boolean | null
  confidence: number
}

export interface WhatsAppAssistantInput {
  text: string
  senderName?: string | null
  stockContext?: WhatsAppStockContext
  conversationState?: WhatsAppConversationState
  activeModels?: ActiveModelItem[]
  aiExtraction?: ValidatedAiExtraction | null
}

export interface WhatsAppAssistantOutput {
  action: WhatsAppAssistantAction
  text: string | null
  reason: string
  conversationState?: WhatsAppConversationState
  aiUsed?: boolean
  aiConfidence?: number | null
}

/**
 * Checks if the deterministic parser's result is uncertain and should try the AI fallback.
 */
export function isInterpretationUncertain(reason: string): boolean {
  return (
    reason === 'unknown_question' ||
    reason === 'unknown_query' ||
    reason.endsWith('_retry')
  )
}

// ============================================================================
// Constants
// ============================================================================

const REAL_QUOTATION_URL = 'https://kevphones.es/cotizar'
const REAL_STOCK_URL = 'https://kevphones.es/#stock'
const REAL_SITE_URL = 'https://kevphones.es'

// ============================================================================
// Text Normalization
// ============================================================================

export function normalizeText(raw: string): string {
  return raw
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// ============================================================================
// Field Parsing Helpers (Follow-up detection)
// ============================================================================

/**
 * Checks for explicit reset / cancellation commands.
 */
export function isResetCommand(rawText: string): boolean {
  const normalized = normalizeText(rawText)
  return /\b(cancelar|cancela|empezar de nuevo|reiniciar|reinicia|reset|volver a empezar|borrar)\b/i.test(normalized)
}

/**
 * Parses valid storage sizes (64 GB, 128 GB, 256 GB, 512 GB, 1 TB).
 */
export function parseStorageValue(rawText: string): string | null {
  const normalized = normalizeText(rawText)
  if (/\b1\s*tb\b/i.test(normalized)) return '1 TB'
  const match = normalized.match(/\b(64|128|256|512)\s*(?:gb)?\b/i)
  if (match) return `${match[1]} GB`
  return null
}

/**
 * Parses battery health percentage strictly between 0 and 100.
 * When isAwaitingField is true, allows bare numbers (e.g. "89", "tiene 89").
 * Otherwise, requires explicit %, "bateria", or "salud" to prevent false positives from model numbers (e.g. "15 Pro").
 */
export function parseBatteryHealthValue(rawText: string, isAwaitingField: boolean = false): number | null {
  const normalized = normalizeText(rawText)
  if (!normalized) return null

  if (isAwaitingField) {
    // If user provided a message like "es un 15 pro max y tiene como un 87 de batería",
    // prioritize the number attached to % or bateria/salud over isolated model numbers (e.g. 15).
    const explicitMatch =
      normalized.match(/\b(\d{1,3})\s*%/i) ||
      normalized.match(/(?:bateria|salud)\s*(?:al|de|tiene)?\s*(\d{1,3})\b/i) ||
      normalized.match(/\b(\d{1,3})\s*(?:de\s*)?(?:bateria|salud)\b/i)

    if (explicitMatch) {
      const num = parseInt(explicitMatch[1], 10)
      if (num >= 0 && num <= 100) return num
    }

    const numMatch = normalized.match(/\b(\d{1,3})\b/)
    if (!numMatch) return null
    const num = parseInt(numMatch[1], 10)
    if (num >= 0 && num <= 100) return num
    return null
  }

  // Multi-field text: requires explicit %, "bateria", or "salud"
  const explicitMatch =
    normalized.match(/\b(\d{1,3})\s*%/i) ||
    normalized.match(/(?:bateria|salud)\s*(?:al|de|tiene)?\s*(\d{1,3})\b/i) ||
    normalized.match(/\b(\d{1,3})\s*(?:de\s*)?(?:bateria|salud)\b/i)

  if (!explicitMatch) return null
  const num = parseInt(explicitMatch[1], 10)
  if (num >= 0 && num <= 100) return num
  return null
}

/**
 * Maps condition to supported project condition values.
 */
export function parseConditionValue(rawText: string): string | null {
  const normalized = normalizeText(rawText)
  if (/\b(precintado|precintada|nuevo a estrenar|sin abrir)\b/i.test(normalized)) {
    return 'Precintado'
  }
  if (/\b(como nuevo|impecable|perfecto|perfecto estado)\b/i.test(normalized)) {
    return 'Como nuevo'
  }
  if (/\b(buen estado|bueno|bien|correcto)\b/i.test(normalized)) {
    return 'Buen estado'
  }
  if (/\b(con marcas|tiene marcas|marcas|marcada|rayones|desgaste|usado|usada)\b/i.test(normalized)) {
    return 'Con marcas'
  }
  return null
}

/**
 * Maps accessories to clear normalized descriptions.
 */
export function parseAccessoriesValue(rawText: string): string | null {
  const normalized = normalizeText(rawText)
  if (/\b(caja y cable|cable y caja|ambos|los dos|todo)\b/i.test(normalized)) {
    return 'Caja y cable'
  }
  if (/\b(solo caja|con caja|la caja|caja)\b/i.test(normalized) && !/\bcable\b/i.test(normalized)) {
    return 'Solo caja'
  }
  if (/\b(solo cable|con cable|el cable|cable)\b/i.test(normalized) && !/\bcaja\b/i.test(normalized)) {
    return 'Solo cable'
  }
  if (/\b(sin nada|ninguno|nada|solo movil|solo el movil|solo telefono|ningun accesorio)\b/i.test(normalized)) {
    return 'Sin accesorios'
  }
  return null
}

// ============================================================================
// Buying Preference Parsing Helpers
// ============================================================================

/**
 * Parses budget constraints (maxBudget and/or minBudget) from text.
 * Handles:
 * - "entre 500 y 650 euros", "de 500 a 650", "entre 500 y 650€"
 * - "menos de 700", "por menos de 700 euros", "maximo 700", "hasta 700", "tope 700", "presupuesto de 700"
 * - "tengo 600 euros", "tengo 600€", "tengo 600"
 * - If isAwaitingBudget: bare numbers "700", "700 euros", "700€"
 */
export function parseBudgetValue(
  rawText: string,
  isAwaitingBudget = false
): { maxBudget?: number | null; minBudget?: number | null } {
  const normalized = normalizeText(rawText)
  if (!normalized) return {}

  // 1. Budget range: "entre 500 y 650 euros" / "de 500 a 650"
  const rangeMatch = normalized.match(
    /(?:entre|de)\s+(\d{2,4})\s*(?:€|euros|eur)?\s*(?:y|a)\s*(\d{2,4})\s*(?:€|euros|eur)?\b/i
  )
  if (rangeMatch) {
    const min = parseInt(rangeMatch[1], 10)
    const max = parseInt(rangeMatch[2], 10)
    if (min >= 50 && max <= 5000 && min < max) {
      return { minBudget: min, maxBudget: max }
    }
  }

  // 2. Max budget: "menos de 700", "por menos de 700", "maximo 700", "hasta 700", "tope 700"
  const maxMatch = normalized.match(
    /(?:menos de|por menos de|maximo|maximo de|hasta|tope de|tope|presupuesto de)\s+(\d{2,4})\s*(?:€|euros|eur)?\b/i
  )
  if (maxMatch) {
    const val = parseInt(maxMatch[1], 10)
    if (val >= 50 && val <= 5000) {
      return { maxBudget: val }
    }
  }

  // 3. "Tengo 600 euros" / "tengo 600"
  const tengoMatch = normalized.match(/\btengo\s+(\d{2,4})\s*(?:€|euros|eur)?\b/i)
  if (tengoMatch) {
    const val = parseInt(tengoMatch[1], 10)
    if (val >= 50 && val <= 5000) {
      return { maxBudget: val }
    }
  }

  // 4. If user is explicitly asked "¿Tienes un presupuesto máximo?", accept bare number: "700", "700€", "700 euros", "unos 700"
  if (isAwaitingBudget) {
    const bareMatch = normalized.match(/\b(\d{2,4})\s*(?:€|euros|eur)?\b/i)
    if (bareMatch) {
      const val = parseInt(bareMatch[1], 10)
      if (val >= 50 && val <= 5000) {
        return { maxBudget: val }
      }
    }
  }

  return {}
}

/**
 * Deterministically parses iPhone model families supported by real models:
 * - 'Pro Max'
 * - 'Pro'
 * - 'Plus'
 * - 'mini'
 * - 'Air'
 * - 'standard' / 'base'
 */
export function parseModelFamily(rawText: string): string | null {
  const normalized = normalizeText(rawText)
  if (!normalized) return null

  if (/\bpro\s*max\b/i.test(normalized)) {
    return 'Pro Max'
  }
  if (/\bpro\b/i.test(normalized)) {
    return 'Pro'
  }
  if (/\bplus\b/i.test(normalized)) {
    return 'Plus'
  }
  if (/\bmini\b/i.test(normalized)) {
    return 'mini'
  }
  if (/\bair\b/i.test(normalized)) {
    return 'Air'
  }
  if (/\b(base|estandar|normal)\b/i.test(normalized)) {
    return 'standard'
  }

  return null
}

/**
 * Parses battery preferences:
 * - "mejor bateria", "con mas salud" -> bestBattery: true
 * - "minimo 90% de bateria", "mas de 85%", "superior a 90" -> minBatteryHealth: number
 */
export function parseBatteryPreferences(rawText: string): {
  minBatteryHealth?: number | null
  bestBattery?: boolean | null
} {
  const normalized = normalizeText(rawText)
  if (!normalized) return {}

  const result: { minBatteryHealth?: number | null; bestBattery?: boolean | null } = {}

  if (/\b(mejor bateria|mas bateria|con mas bateria|mayor bateria|mas salud)\b/i.test(normalized)) {
    result.bestBattery = true
  }

  const minMatch = normalized.match(
    /(?:minimo|al menos|como minimo|superior a|mas de|mas del)\s+(\d{2,3})\s*(?:%|de bateria)?\b/i
  )
  if (minMatch) {
    const val = parseInt(minMatch[1], 10)
    if (val >= 50 && val <= 100) {
      result.minBatteryHealth = val
    }
  }

  return result
}

// ============================================================================
// Selling Flow Helpers
// ============================================================================

/**
 * Detects if a message indicates an explicit final price, negotiation,
 * or confirmation request that requires human review by Kevin.
 */
export function isSellingFinalOfferOrHandoff(normalized: string): boolean {
  return (
    /\b(precio final|valoracion final|tasacion final|oferta final)\b/i.test(normalized) ||
    /\b(confirmar oferta|confirmar valoracion|confirmar tasacion|confirmar precio)\b/i.test(normalized) ||
    /\b(negociar|negociable|regatear|cerrar trato)\b/i.test(normalized)
  )
}

/**
 * Detects if the user has already provided obvious device details in their selling inquiry.
 */
export function hasSellingDetails(normalized: string): boolean {
  const hasModel = /\b(iphone\s*\d+|1[1-9]\s*(pro|max|plus|mini|air|e))\b/i.test(normalized)
  const hasStorage = /\b(64|128|256|512)\s*(gb)?\b/i.test(normalized) || /\b1\s*tb\b/i.test(normalized)
  const hasBattery =
    /\b\d{2,3}\s*%/i.test(normalized) ||
    /\b(bateria|salud)\s*(al|de)?\s*\d{2,3}\b/i.test(normalized) ||
    /\b\d{2,3}\s*(de\s*)?(bateria|salud)\b/i.test(normalized)
  const hasConditionOrAccessories = /\b(como nuevo|impecable|buen estado|con caja|con cable|caja y cable|factura)\b/i.test(normalized)

  return hasModel || hasStorage || hasBattery || hasConditionOrAccessories
}

// ============================================================================
// Intent Detection (Pure & Deterministic)
// ============================================================================

export function detectWhatsAppIntent(rawText: string): WhatsAppIntent {
  if (!rawText || !rawText.trim()) {
    return 'empty_message'
  }

  const normalized = normalizeText(rawText)
  if (!normalized) {
    return 'empty_message'
  }

  // Selling intent phrases check
  const isSellingPhrase =
    /\b(vender|vendo|venta|tasar|tasacion|tasaciones|tasarme|valorar|valoracion|cotizar|cotizacion)\b/i.test(normalized) ||
    /\bcuanto (me das|me dais|me darias|pagan|pagais|ofreces|ofreceis)\b/i.test(normalized) ||
    /\b(compran|compras|comprais|comprariais|comprarian)\s+(iphone|iphones|telefono|telefonos|movil|moviles|dispositivo|dispositivos|apple)\b/i.test(normalized) ||
    /\b(te vendo|quiero vender|puedo vender|entrego como parte de pago)\b/i.test(normalized) ||
    /\btengo un (iphone|movil|telefono|dispositivo)\s+(para|a)\s+vender\b/i.test(normalized) ||
    /\b(precio final|valoracion final|tasacion final|oferta final|confirmar oferta|confirmar valoracion|confirmar tasacion|confirmar precio|negociar|negociable|regatear)\b/i.test(normalized)

  if (isSellingPhrase) {
    return 'selling_device'
  }

  // 1. Human / Kevin request (General human handoff when not in selling context)
  if (
    /\b(kevin|humano|humana|persona|personas|asesor|asesora|agente|alguien|operador|operadora)\b/i.test(normalized) ||
    /\b(hablar con|pasame con|pasame a|atencion al cliente)\b/i.test(normalized)
  ) {
    return 'human_request'
  }

  // 3. Available stock / catalogue
  if (
    /\b(stock|catalogo|catalogos)\b/i.test(normalized) ||
    /\b(disponible|disponibles|disponibilidad)\b/i.test(normalized) ||
    /\bque (tienes|teneis|te queda|les queda|hay disponible)\b/i.test(normalized) ||
    /\blista de (iphones|precios|modelos)\b/i.test(normalized) ||
    /\bmodelos disponibles\b/i.test(normalized)
  ) {
    return 'available_stock'
  }

  // 4. Buying an iPhone from KevPhones (including buying preferences & budget queries)
  if (
    /\b(comprar|compro|compra|quiero comprar)\b/i.test(normalized) ||
    /\b(busco|buscando)\b/i.test(normalized) ||
    /\b(cuanto cuesta|cuanto vale|a que precio|precio|precios)\b/i.test(normalized) ||
    /\binteresad[oa]\b/i.test(normalized) ||
    /\btengo\s+(?:entre\s+)?\d{2,4}\s*(?:€|euros|eur)?\b/i.test(normalized) ||
    /\b(?:por\s+)?menos de\s+\d{2,4}\s*(?:€|euros|eur)?\b/i.test(normalized) ||
    /\b(?:hasta|maximo|tope de)\s+\d{2,4}\s*(?:€|euros|eur)?\b/i.test(normalized) ||
    /\b(?:mejor|mas)\s+bateria\b/i.test(normalized) ||
    /\bentre\s+\d{2,4}\s*(?:€|euros|eur)?\s*(?:y|a)\s*\d{2,4}\b/i.test(normalized)
  ) {
    return 'buying_iphone'
  }

  // 5. Business hours / availability
  if (
    /\b(horario|horarios)\b/i.test(normalized) ||
    /\ba que hora[s]?\b/i.test(normalized) ||
    /\bcuando (abres|abren|abris|estan abiertos|estais abiertos)\b/i.test(normalized) ||
    /\b(abierto|abiertos|abierta|abiertas|cerrado|cerrados)\b/i.test(normalized) ||
    /\bdias de atencion\b/i.test(normalized)
  ) {
    return 'business_hours'
  }

  // 6. Location / service area
  if (
    /\b(ubicacion|ubicaciones|direccion|direcciones)\b/i.test(normalized) ||
    /\bdonde (estan|estais|queda|se encuentran|estan ubicados|estais ubicados)\b/i.test(normalized) ||
    /\b(tienda fisica|local fisico|punto de encuentro|entrega en mano)\b/i.test(normalized) ||
    /\b(gran canaria|las palmas)\b/i.test(normalized)
  ) {
    return 'location_service_area'
  }

  // 7. Greeting
  if (
    /\b(hola|buenas|buenos dias|buenas tardes|buenas noches|hey|saludos)\b/i.test(normalized)
  ) {
    return 'greeting'
  }

  // 8. Unknown question
  return 'unknown_question'
}

// ============================================================================
// Stock Response Formatters
// ============================================================================

function formatDeviceBlock(device: WhatsAppStockDevice): string {
  const parts: string[] = [device.model_name]
  if (device.storage) parts.push(device.storage)
  if (device.color) parts.push(device.color)

  const header = parts.join(' · ')
  const lines: string[] = [header]

  if (device.battery_health && device.battery_health > 0) {
    lines.push(`Batería: ${device.battery_health}%`)
  }

  const effectivePrice = device.discount_price ?? device.listing_price
  lines.push(`${effectivePrice} €`)

  return lines.join('\n')
}

function formatGeneralDeviceLine(device: WhatsAppStockDevice): string {
  const parts: string[] = [device.model_name]
  if (device.storage) parts.push(device.storage)
  if (device.color) parts.push(device.color)
  const effectivePrice = device.discount_price ?? device.listing_price
  parts.push(`${effectivePrice} €`)
  return parts.join(' · ')
}

function formatSpecificModelResponse(
  modelName: string,
  devices: WhatsAppStockDevice[]
): string {
  if (devices.length === 0) {
    return (
      `Ahora mismo no tenemos unidades disponibles del ${modelName}.\n\n` +
      `Puedes consultar el stock actualizado aquí:\n` +
      `${REAL_STOCK_URL}\n\n` +
      `Si quieres, Kevin puede revisar tu mensaje por si estás buscando una configuración concreta.`
    )
  }

  const visibleDevices = devices.slice(0, 5)
  const blocks = visibleDevices.map(formatDeviceBlock).join('\n\n')

  let message = `Ahora mismo tenemos:\n\n${blocks}`
  if (devices.length > 5) {
    message += `\n\n(Tenemos más unidades de este modelo disponibles en la web)`
  }

  message += `\n\nPuedes ver el stock actualizado en:\n${REAL_STOCK_URL}`
  return message
}

function formatGeneralStockResponse(
  devices: WhatsAppStockDevice[],
  totalCount = 0
): string {
  if (devices.length === 0) {
    return (
      `Ahora mismo no tenemos unidades disponibles en stock.\n\n` +
      `Puedes consultar el stock actualizado aquí:\n` +
      `${REAL_STOCK_URL}\n\n` +
      `Si estás buscando un modelo en concreto, déjanos tu mensaje y Kevin lo revisará en cuanto esté disponible.`
    )
  }

  const visibleDevices = devices.slice(0, 5)
  const lines = visibleDevices.map(formatGeneralDeviceLine).join('\n')

  let message = `Ahora mismo tenemos disponibles:\n\n${lines}`
  if (totalCount > 5) {
    message += `\n\n(Tenemos más modelos disponibles en la web)`
  }

  message += `\n\nPuedes ver todo el stock actualizado en:\n${REAL_STOCK_URL}`
  return message
}

function formatGeneralBuyingResponse(): string {
  return (
    `Para comprar un iPhone revisado, puedes consultar los modelos y precios disponibles en:\n` +
    `${REAL_STOCK_URL}\n\n` +
    `Si buscas un modelo en concreto o tienes alguna duda, déjanos tu mensaje y Kevin lo revisará en cuanto esté disponible.`
  )
}

export function formatFilteredStockResponse(
  filtered: FilteredStockResult,
  preferences: BuyingPreferences
): string {
  if (filtered.matches.length > 0) {
    let intro = 'Ahora mismo tenemos estas opciones disponibles según tus preferencias:'

    if (preferences.modelFamily && preferences.maxBudget != null) {
      intro = `Aquí tienes los ${preferences.modelFamily} disponibles por menos de ${preferences.maxBudget} €:`
    } else if (preferences.minBudget != null && preferences.maxBudget != null) {
      intro = `Aquí tienes los iPhones disponibles entre ${preferences.minBudget} € y ${preferences.maxBudget} €:`
    } else if (preferences.maxBudget != null) {
      intro = `Aquí tienes los iPhones disponibles por menos de ${preferences.maxBudget} €:`
    } else if (preferences.storage && preferences.minBatteryHealth != null) {
      intro = `Aquí tienes las opciones de ${preferences.storage} con al menos ${preferences.minBatteryHealth}% de batería:`
    } else if (preferences.storage) {
      intro = `Aquí tienes las opciones de ${preferences.storage} disponibles:`
    } else if (preferences.bestBattery) {
      intro = `Aquí tienes los iPhones disponibles ordenados por mejor salud de batería:`
    } else if (preferences.minBatteryHealth != null) {
      intro = `Aquí tienes las opciones con más de ${preferences.minBatteryHealth}% de batería:`
    } else if (preferences.modelFamily) {
      intro = `Aquí tienes los iPhone ${preferences.modelFamily} disponibles:`
    }

    const blocks = filtered.matches.slice(0, 5).map(formatDeviceBlock).join('\n\n')

    let message = `${intro}\n\n${blocks}`
    if (filtered.totalAvailable > 5) {
      message += `\n\n(Puedes consultar más fotos y modelos en la web)`
    }
    message += `\n\nPuedes ver todos los detalles y el stock actualizado en:\n${REAL_STOCK_URL}`
    return message
  }

  // No exact matches (Section 6: say clearly no exact matches, show up to 3 nearest alternatives, explain why)
  const reason =
    filtered.unmatchedReason ||
    'Ahora mismo no tenemos unidades que coincidan exactamente con esos filtros.'

  if (filtered.alternatives.length > 0) {
    const blocks = filtered.alternatives.slice(0, 3).map(formatDeviceBlock).join('\n\n')
    return (
      `${reason}\n\n${blocks}\n\n` +
      `Puedes ver todo el stock actualizado en:\n${REAL_STOCK_URL}\n\n` +
      `Si buscas algo específico, Kevin puede revisar si entrará stock próximamente.`
    )
  }

  return (
    `${reason}\n\n` +
    `Puedes consultar el stock actualizado aquí:\n${REAL_STOCK_URL}\n\n` +
    `Si buscas una configuración concreta, déjanos tu mensaje y Kevin lo revisará en cuanto esté disponible.`
  )
}

// ============================================================================
// Assistant Core (With Optional Conversational State for Simulator)
// ============================================================================

/**
 * Pure, deterministic assistant engine for KevPhonesGC WhatsApp messages.
 * Supports multi-turn contextual memory for simulator testing.
 */
export function generateWhatsAppResponse(
  input: WhatsAppAssistantInput
): WhatsAppAssistantOutput {
  const rawText = input.text ?? ''
  if (!rawText.trim()) {
    return {
      action: 'ignore',
      text: null,
      reason: 'empty_message',
      conversationState: input.conversationState,
    }
  }

  const normalized = normalizeText(rawText)

  // 1. Reset / Cancel Command (Section 8: clears conversational state)
  if (isResetCommand(rawText)) {
    return {
      action: 'reply',
      text: 'Perfecto. Empezamos de nuevo. ¿En qué puedo ayudarte?',
      reason: 'conversation_reset',
      conversationState: { flow: 'none' },
    }
  }

  // 2. Explicit Final Price / Negotiation Request (Section 5)
  if (isSellingFinalOfferOrHandoff(normalized)) {
    return {
      action: 'handoff',
      text: 'Perfecto. Kevin revisará tu caso para darte una valoración final.',
      reason: 'selling_final_offer',
      conversationState: input.conversationState,
    }
  }

  // 3. Explicit Human / Kevin Request (Section 6: overrides current flow)
  if (
    /\b(kevin|humano|humana|persona|personas|asesor|asesora|agente|alguien|operador|operadora)\b/i.test(normalized) ||
    /\b(hablar con|pasame con|pasame a|atencion al cliente)\b/i.test(normalized)
  ) {
    return {
      action: 'handoff',
      text: 'Perfecto. Te dejo con Kevin para que pueda atenderte personalmente.',
      reason: 'human_request',
      conversationState: input.conversationState,
    }
  }

  const currentState = input.conversationState
  const activeModels = input.activeModels || []

  // 4. Handle Active Buying Flow Follow-up (Section 7)
  if (currentState?.flow === 'buying' && currentState.awaitingField === 'maxBudget') {
    let budget = parseBudgetValue(rawText, true)
    if (budget.maxBudget == null && budget.minBudget == null && input.aiExtraction?.maxBudget != null) {
      budget = { maxBudget: input.aiExtraction.maxBudget, minBudget: input.aiExtraction.minBudget }
    }

    if (budget.maxBudget != null || budget.minBudget != null) {
      const buying: ConversationBuyingState = {
        ...(currentState.buying || {}),
        maxBudget: budget.maxBudget ?? currentState.buying?.maxBudget ?? null,
        minBudget: budget.minBudget ?? currentState.buying?.minBudget ?? null,
      }

      if (input.stockContext?.filteredResult) {
        const text = formatFilteredStockResponse(input.stockContext.filteredResult, buying)
        return {
          action: 'reply',
          text,
          reason: 'buying_preferences_filtered',
          conversationState: {
            flow: 'none',
            buying,
            awaitingField: null,
          },
          aiUsed: Boolean(input.aiExtraction),
          aiConfidence: input.aiExtraction?.confidence ?? null,
        }
      }

      if (input.stockContext?.devices && input.stockContext.devices.length > 0) {
        const blocks = input.stockContext.devices.slice(0, 5).map(formatDeviceBlock).join('\n\n')
        const famText = buying.modelFamily ? ` los iPhone ${buying.modelFamily}` : ' los iPhones'
        const budgetText = buying.maxBudget ? ` por menos de ${buying.maxBudget} €` : ''
        return {
          action: 'reply',
          text: `Aquí tienes${famText}${budgetText} disponibles:\n\n${blocks}\n\nPuedes ver todos los detalles y el stock actualizado en:\n${REAL_STOCK_URL}`,
          reason: 'buying_preferences_filtered',
          conversationState: {
            flow: 'none',
            buying,
            awaitingField: null,
          },
          aiUsed: Boolean(input.aiExtraction),
          aiConfidence: input.aiExtraction?.confidence ?? null,
        }
      }

      const famText = buying.modelFamily ? ` ${buying.modelFamily}` : ''
      const budgetText = buying.maxBudget ? ` por menos de ${buying.maxBudget} €` : ''
      return {
        action: 'reply',
        text: `Ahora mismo no tenemos unidades de iPhone${famText}${budgetText} disponibles en stock.\n\nPuedes consultar el stock actualizado en:\n${REAL_STOCK_URL}\n\nSi quieres, déjanos tu mensaje y Kevin lo revisará en cuanto esté disponible.`,
        reason: 'buying_preferences_filtered_empty',
        conversationState: {
          flow: 'none',
          buying,
          awaitingField: null,
        },
        aiUsed: Boolean(input.aiExtraction),
        aiConfidence: input.aiExtraction?.confidence ?? null,
      }
    } else {
      return {
        action: 'reply',
        text: 'Por favor, indícame un presupuesto aproximado en euros (ej. 600, 700€ o menos de 800) para mostrarte las mejores opciones.',
        reason: 'buying_ask_budget_retry',
        conversationState: currentState,
      }
    }
  }

  if (currentState?.flow === 'buying' && currentState.awaitingField === 'model') {
    let matched = findMatchingModel(rawText, activeModels)
    if (!matched && input.aiExtraction?.model) {
      matched = activeModels.find((m) => m.name === input.aiExtraction!.model) ?? null
    }

    if (matched) {
      const stock = input.stockContext
      const text = stock?.devices
        ? formatSpecificModelResponse(matched.name, stock.devices)
        : formatSpecificModelResponse(matched.name, [])

      return {
        action: 'reply',
        text,
        reason: 'buying_iphone_specific_model',
        conversationState: {
          flow: 'none',
          buying: { model: matched.name },
          awaitingField: null,
        },
        aiUsed: Boolean(input.aiExtraction),
        aiConfidence: input.aiExtraction?.confidence ?? null,
      }
    }

    // Check if user answered with a model family e.g. "un Pro" or "Plus"
    const family = parseModelFamily(rawText) || input.aiExtraction?.modelFamily || null
    if (family) {
      return {
        action: 'reply',
        text: '¿Tienes un presupuesto máximo?',
        reason: 'buying_ask_budget',
        conversationState: {
          flow: 'buying',
          buying: { ...(currentState.buying || {}), modelFamily: family },
          awaitingField: 'maxBudget',
        },
        aiUsed: Boolean(input.aiExtraction),
        aiConfidence: input.aiExtraction?.confidence ?? null,
      }
    }

    return {
      action: 'reply',
      text: 'No he podido identificar el modelo. ¿Qué modelo de iPhone estás buscando? (ej. iPhone 15 Pro, iPhone 16...)',
      reason: 'buying_ask_model_retry',
      conversationState: currentState,
    }
  }

  // 5. Handle Active Selling Flow Follow-up (Section 3, 4, 5, 6)
  if (currentState?.flow === 'selling') {
    // Check if user explicitly switches to buying or available stock
    const isExplicitBuying = /\b(comprar|compro|quiero comprar|busco|buscando)\b/i.test(normalized)
    const isExplicitStock = /\b(stock|catalogo|disponible|disponibles)\b/i.test(normalized)

    if (!isExplicitBuying && !isExplicitStock) {
      const selling: ConversationSellingState = { ...(currentState.selling || {}) }
      const awaiting = currentState.awaitingField

      // Follow-up field detection: ONLY interpret the short message according to the currently expected field
      if (awaiting === 'model') {
        const matched = findMatchingModel(rawText, activeModels)
        if (matched) {
          selling.model = matched.name
        } else if (input.aiExtraction?.model) {
          selling.model = input.aiExtraction.model
        } else {
          return {
            action: 'reply',
            text: 'No he podido identificar ese modelo exacto. ¿Podrías confirmarme el modelo completo de iPhone? (ej. iPhone 15 Pro, iPhone 14 Plus, iPhone 13 mini...)',
            reason: 'selling_ask_model_retry',
            conversationState: { flow: 'selling', selling, awaitingField: 'model' },
          }
        }
      } else if (awaiting === 'storage') {
        const st = parseStorageValue(rawText)
        if (st) {
          selling.storage = st
        } else if (input.aiExtraction?.storage) {
          selling.storage = input.aiExtraction.storage
        } else {
          return {
            action: 'reply',
            text: 'Por favor, indica una capacidad válida (ej. 128 GB, 256 GB, 512 GB o 1 TB).',
            reason: 'selling_ask_storage_retry',
            conversationState: { flow: 'selling', selling, awaitingField: 'storage' },
          }
        }
      } else if (awaiting === 'battery_health') {
        const bh = parseBatteryHealthValue(rawText, true)
        if (bh !== null) {
          selling.batteryHealth = bh
        } else if (input.aiExtraction?.batteryHealth != null) {
          selling.batteryHealth = input.aiExtraction.batteryHealth
        } else {
          return {
            action: 'reply',
            text: 'Por favor, indica un porcentaje de salud de batería válido entre 0 y 100 (ej. 89%).',
            reason: 'selling_ask_battery_retry',
            conversationState: { flow: 'selling', selling, awaitingField: 'battery_health' },
          }
        }
      } else if (awaiting === 'condition') {
        const cond = parseConditionValue(rawText)
        if (cond) {
          selling.condition = cond
        } else if (input.aiExtraction?.condition) {
          selling.condition = input.aiExtraction.condition
        } else {
          return {
            action: 'reply',
            text: 'Por favor, indica el estado del dispositivo: precintado, como nuevo, buen estado o tiene marcas.',
            reason: 'selling_ask_condition_retry',
            conversationState: { flow: 'selling', selling, awaitingField: 'condition' },
          }
        }
      } else if (awaiting === 'accessories') {
        const acc = parseAccessoriesValue(rawText)
        if (acc) {
          selling.accessories = acc
        } else if (input.aiExtraction?.accessories) {
          selling.accessories = input.aiExtraction.accessories
        } else {
          return {
            action: 'reply',
            text: '¿Qué accesorios incluyes? Puedes indicar: caja y cable, solo caja, con cable o sin nada.',
            reason: 'selling_ask_accessories_retry',
            conversationState: { flow: 'selling', selling, awaitingField: 'accessories' },
          }
        }
      }

      // If AI extracted additional valid fields, merge them to avoid redundant questions
      if (input.aiExtraction) {
        if (!selling.model && input.aiExtraction.model) selling.model = input.aiExtraction.model
        if (!selling.storage && input.aiExtraction.storage) selling.storage = input.aiExtraction.storage
        if (selling.batteryHealth == null && input.aiExtraction.batteryHealth != null) selling.batteryHealth = input.aiExtraction.batteryHealth
        if (!selling.condition && input.aiExtraction.condition) selling.condition = input.aiExtraction.condition
        if (!selling.accessories && input.aiExtraction.accessories) selling.accessories = input.aiExtraction.accessories
      }

      // Determine next question in guided selling sequence
      if (!selling.model) {
        return {
          action: 'reply',
          text: 'Claro. ¿Qué modelo de iPhone es?',
          reason: 'selling_ask_model',
          conversationState: { flow: 'selling', selling, awaitingField: 'model' },
          aiUsed: Boolean(input.aiExtraction),
          aiConfidence: input.aiExtraction?.confidence ?? null,
        }
      }

      if (!selling.storage) {
        return {
          action: 'reply',
          text: '¿Qué capacidad tiene?',
          reason: 'selling_ask_storage',
          conversationState: { flow: 'selling', selling, awaitingField: 'storage' },
          aiUsed: Boolean(input.aiExtraction),
          aiConfidence: input.aiExtraction?.confidence ?? null,
        }
      }

      if (selling.batteryHealth == null) {
        return {
          action: 'reply',
          text: '¿Qué salud de batería tiene?',
          reason: 'selling_ask_battery',
          conversationState: { flow: 'selling', selling, awaitingField: 'battery_health' },
          aiUsed: Boolean(input.aiExtraction),
          aiConfidence: input.aiExtraction?.confidence ?? null,
        }
      }

      if (!selling.condition) {
        return {
          action: 'reply',
          text: '¿En qué estado se encuentra? (ej. como nuevo, buen estado, con marcas, precintado)',
          reason: 'selling_ask_condition',
          conversationState: { flow: 'selling', selling, awaitingField: 'condition' },
          aiUsed: Boolean(input.aiExtraction),
          aiConfidence: input.aiExtraction?.confidence ?? null,
        }
      }

      if (!selling.accessories) {
        return {
          action: 'reply',
          text: '¿Tienes la caja o el cable original?',
          reason: 'selling_ask_accessories',
          conversationState: { flow: 'selling', selling, awaitingField: 'accessories' },
          aiUsed: Boolean(input.aiExtraction),
          aiConfidence: input.aiExtraction?.confidence ?? null,
        }
      }

      // Once all main fields are gathered:
      return {
        action: 'reply',
        text:
          'Perfecto. Ya tienes los datos principales preparados. Puedes completar la valoración aquí:\n' +
          REAL_QUOTATION_URL,
        reason: 'selling_completed',
        conversationState: { flow: 'none', selling, awaitingField: null },
        aiUsed: Boolean(input.aiExtraction),
        aiConfidence: input.aiExtraction?.confidence ?? null,
      }
    }
  }

  // 6. Regular Intent Detection
  let intent = detectWhatsAppIntent(rawText)
  if (intent === 'unknown_question' && input.aiExtraction?.intent) {
    if (input.aiExtraction.intent === 'selling') intent = 'selling_device'
    else if (input.aiExtraction.intent === 'buying') intent = 'buying_iphone'
    else if (input.aiExtraction.intent === 'stock') intent = 'available_stock'
    else if (input.aiExtraction.intent === 'human') intent = 'human_request'
    else if (input.aiExtraction.intent === 'greeting') intent = 'greeting'
  }

  // 6.1 Selling Intent (Initiates or progresses selling flow)
  if (intent === 'selling_device' || input.aiExtraction?.intent === 'selling') {
    // If user provided obvious details upfront
    const selling: ConversationSellingState = {}

    const matched = findMatchingModel(rawText, activeModels)
    if (matched) selling.model = matched.name
    else if (input.aiExtraction?.model) selling.model = input.aiExtraction.model

    const st = parseStorageValue(rawText)
    if (st) selling.storage = st
    else if (input.aiExtraction?.storage) selling.storage = input.aiExtraction.storage

    const bh = parseBatteryHealthValue(rawText)
    if (bh !== null) selling.batteryHealth = bh
    else if (input.aiExtraction?.batteryHealth != null) selling.batteryHealth = input.aiExtraction.batteryHealth

    const cond = parseConditionValue(rawText)
    if (cond) selling.condition = cond
    else if (input.aiExtraction?.condition) selling.condition = input.aiExtraction.condition

    const acc = parseAccessoriesValue(rawText)
    if (acc) selling.accessories = acc
    else if (input.aiExtraction?.accessories) selling.accessories = input.aiExtraction.accessories

    // If conversational memory is enabled (simulator context)
    if (currentState) {
      if (!selling.model) {
        return {
          action: 'reply',
          text: 'Claro. ¿Qué modelo de iPhone es?',
          reason: 'selling_ask_model',
          conversationState: { flow: 'selling', selling, awaitingField: 'model' },
          aiUsed: Boolean(input.aiExtraction),
          aiConfidence: input.aiExtraction?.confidence ?? null,
        }
      }

      if (!selling.storage) {
        return {
          action: 'reply',
          text: '¿Qué capacidad tiene?',
          reason: 'selling_ask_storage',
          conversationState: { flow: 'selling', selling, awaitingField: 'storage' },
          aiUsed: Boolean(input.aiExtraction),
          aiConfidence: input.aiExtraction?.confidence ?? null,
        }
      }

      if (selling.batteryHealth == null) {
        return {
          action: 'reply',
          text: '¿Qué salud de batería tiene?',
          reason: 'selling_ask_battery',
          conversationState: { flow: 'selling', selling, awaitingField: 'battery_health' },
          aiUsed: Boolean(input.aiExtraction),
          aiConfidence: input.aiExtraction?.confidence ?? null,
        }
      }

      if (!selling.condition) {
        return {
          action: 'reply',
          text: '¿En qué estado se encuentra? (ej. como nuevo, buen estado, con marcas, precintado)',
          reason: 'selling_ask_condition',
          conversationState: { flow: 'selling', selling, awaitingField: 'condition' },
          aiUsed: Boolean(input.aiExtraction),
          aiConfidence: input.aiExtraction?.confidence ?? null,
        }
      }

      if (!selling.accessories) {
        return {
          action: 'reply',
          text: '¿Tienes la caja o el cable original?',
          reason: 'selling_ask_accessories',
          conversationState: { flow: 'selling', selling, awaitingField: 'accessories' },
          aiUsed: Boolean(input.aiExtraction),
          aiConfidence: input.aiExtraction?.confidence ?? null,
        }
      }

      return {
        action: 'reply',
        text:
          'Perfecto. Ya tienes los datos principales preparados. Puedes completar la valoración aquí:\n' +
          REAL_QUOTATION_URL,
        reason: 'selling_completed',
        conversationState: { flow: 'none', selling, awaitingField: null },
        aiUsed: Boolean(input.aiExtraction),
        aiConfidence: input.aiExtraction?.confidence ?? null,
      }
    }

    // Single-turn fallback (e.g. production webhook without conversational state)
    if (hasSellingDetails(normalized)) {
      return {
        action: 'reply',
        text:
          'Perfecto, ya tienes buena parte de los datos preparados. Puedes completar la valoración aquí:\n' +
          REAL_QUOTATION_URL,
        reason: 'selling_with_details',
      }
    }

    return {
      action: 'reply',
      text:
        'Claro. Puedes obtener una valoración inicial desde nuestro cotizador.\n\n' +
        'Necesitarás indicar:\n' +
        '- modelo\n' +
        '- capacidad\n' +
        '- estado\n' +
        '- salud de batería si aplica\n' +
        '- accesorios\n\n' +
        'Puedes empezar aquí:\n' +
        REAL_QUOTATION_URL,
      reason: 'selling_device',
    }
  }

  // 6.2 Buying Intent
  if (intent === 'buying_iphone' || input.aiExtraction?.intent === 'buying') {
    const budget = parseBudgetValue(rawText)
    const family = parseModelFamily(rawText)
    const battery = parseBatteryPreferences(rawText)
    const storage = parseStorageValue(rawText)
    const matched = findMatchingModel(rawText, activeModels)

    // Merge with validated AI extraction if present
    const maxBudget = budget.maxBudget ?? input.aiExtraction?.maxBudget ?? null
    const minBudget = budget.minBudget ?? input.aiExtraction?.minBudget ?? null
    const modelFamily = family ?? input.aiExtraction?.modelFamily ?? null
    const storageVal = storage ?? input.aiExtraction?.storage ?? null
    const minBatteryHealth = battery.minBatteryHealth ?? input.aiExtraction?.minBatteryHealth ?? null
    const bestBattery = battery.bestBattery ?? input.aiExtraction?.bestBattery ?? null
    const modelName = matched?.name ?? input.aiExtraction?.model ?? null

    const stock = input.stockContext

    // 1. If user specified ONLY a modelFamily without budget or exact model (e.g. "Busco un Pro"):
    // Prompt Section 7: "Busco un Pro" -> "¿Tienes un presupuesto máximo?"
    if (
      modelFamily &&
      maxBudget == null &&
      minBudget == null &&
      !storageVal &&
      minBatteryHealth == null &&
      !bestBattery &&
      !modelName
    ) {
      if (currentState) {
        return {
          action: 'reply',
          text: '¿Tienes un presupuesto máximo?',
          reason: 'buying_ask_budget',
          conversationState: {
            flow: 'buying',
            buying: { modelFamily },
            awaitingField: 'maxBudget',
          },
          aiUsed: Boolean(input.aiExtraction),
          aiConfidence: input.aiExtraction?.confidence ?? null,
        }
      }
    }

    // 2. If filteredResult is available in stockContext
    if (stock?.filteredResult) {
      const mergedPrefs: BuyingPreferences = {
        model: modelName,
        modelFamily,
        maxBudget,
        minBudget,
        storage: storageVal,
        minBatteryHealth,
        bestBattery,
      }
      return {
        action: 'reply',
        text: formatFilteredStockResponse(stock.filteredResult, mergedPrefs),
        reason: 'buying_preferences_filtered',
        conversationState: {
          flow: 'none',
          buying: mergedPrefs,
          awaitingField: null,
        },
        aiUsed: Boolean(input.aiExtraction),
        aiConfidence: input.aiExtraction?.confidence ?? null,
      }
    }

    // 3. Exact specific model match (e.g. "iPhone 15 Pro", "iPhone 13")
    if (stock?.matchedModel) {
      return {
        action: 'reply',
        text: formatSpecificModelResponse(stock.matchedModel.name, stock.devices),
        reason: 'buying_iphone_specific_model',
        conversationState: { flow: 'none', buying: { model: stock.matchedModel.name }, awaitingField: null },
        aiUsed: Boolean(input.aiExtraction),
        aiConfidence: input.aiExtraction?.confidence ?? null,
      }
    }

    // 4. In conversational context, ask what model they are looking for (Section 7)
    if (currentState) {
      return {
        action: 'reply',
        text: '¿Qué modelo estás buscando?',
        reason: 'buying_ask_model',
        conversationState: { flow: 'buying', buying: { model: null }, awaitingField: 'model' },
        aiUsed: Boolean(input.aiExtraction),
        aiConfidence: input.aiExtraction?.confidence ?? null,
      }
    }

    return {
      action: 'reply',
      text: formatGeneralBuyingResponse(),
      reason: 'buying_iphone_general',
      conversationState: { flow: 'none' },
    }
  }

  // 6.3 Available Stock
  if (intent === 'available_stock') {
    const stock = input.stockContext

    if (stock?.filteredResult) {
      return {
        action: 'reply',
        text: formatFilteredStockResponse(stock.filteredResult, stock.appliedPreferences || {}),
        reason: 'available_stock_filtered',
        conversationState: { flow: 'none' },
        aiUsed: Boolean(input.aiExtraction),
        aiConfidence: input.aiExtraction?.confidence ?? null,
      }
    }

    if (stock?.matchedModel) {
      return {
        action: 'reply',
        text: formatSpecificModelResponse(stock.matchedModel.name, stock.devices),
        reason: 'available_stock_specific_model',
        conversationState: { flow: 'none' },
      }
    }

    if (stock?.devices) {
      return {
        action: 'reply',
        text: formatGeneralStockResponse(stock.devices, stock.totalCount),
        reason: 'available_stock_general',
        conversationState: { flow: 'none' },
      }
    }

    return {
      action: 'reply',
      text: `Puedes consultar todos los iPhones revisados disponibles en stock con fotos y precios actualizados en nuestra web:\n${REAL_STOCK_URL}`,
      reason: 'available_stock_fallback',
      conversationState: { flow: 'none' },
    }
  }

  // 6.4 Business Hours
  if (intent === 'business_hours') {
    return {
      action: 'reply',
      text: 'Kevin revisará tu mensaje en cuanto esté disponible.',
      reason: 'business_hours',
      conversationState: { flow: 'none' },
    }
  }

  // 6.5 Location / Service Area
  if (intent === 'location_service_area') {
    return {
      action: 'reply',
      text: `KevPhonesGC opera en Gran Canaria (Canarias). Puedes ver más información y consultar el catálogo en:\n${REAL_SITE_URL}`,
      reason: 'location_service_area',
      conversationState: { flow: 'none' },
    }
  }

  // 6.6 Greeting
  if (intent === 'greeting') {
    const greetingName = input.senderName?.trim() ? ` ${input.senderName.trim()}` : ''
    return {
      action: 'reply',
      text: `Hola${greetingName}, soy el asistente de KevPhonesGC. Puedo ayudarte a consultar el stock disponible, vender tu dispositivo o resolver dudas básicas. ¿En qué te puedo ayudar?`,
      reason: 'greeting',
      conversationState: { flow: 'none' },
    }
  }

  // 6.7 Unknown Question
  return {
    action: 'handoff',
    text: 'Gracias por tu mensaje. Kevin lo revisará en cuanto esté disponible para responderte personalmente.',
    reason: 'unknown_question',
    conversationState: { flow: 'none' },
  }
}
