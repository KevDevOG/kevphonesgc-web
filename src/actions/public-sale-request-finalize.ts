'use server'

import { createSupabaseAdminClient } from '@/lib/supabase/admin'

export type FinalizeRequestInput = {
  sessionId: string
  modelId: string
  storage?: string | null
  color?: string | null
  batteryHealth?: number | null
  batteryCycles?: number | null
  deviceCondition: string
  hasBox: boolean
  hasCable: boolean
  hasInvoice: boolean
  originalParts: boolean
  fullyFunctional: boolean
  blocked: boolean
  officialWarrantyUntil?: string | null
  customerName: string
  customerLocation?: string | null
  notes?: string | null
  source?: string | null
  photos: Array<{
    photoType: string
    storagePath: string
  }>
  quoteHandoffToken?: string | null
}

export type FinalizeRequestResponse = {
  success: boolean
  requestId?: string
  error?: string
}

const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/

function isValidDate(dateStr: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, d))
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d
}

function trimOrNull(val: string | null | undefined): string | null {
  if (val === undefined || val === null) return null
  const trimmed = val.trim()
  return trimmed === '' ? null : trimmed
}

export async function finalizePublicSaleRequestAction(
  input: FinalizeRequestInput
): Promise<FinalizeRequestResponse> {
  // 1. Input Object Validation
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return { success: false, error: 'Los datos de la solicitud no son válidos.' }
  }

  // 1.5 UUID Validation
  if (typeof input.sessionId !== 'string' || !UUID_REGEX.test(input.sessionId)) {
    return { success: false, error: 'Los datos de la solicitud no son válidos.' }
  }
  if (typeof input.modelId !== 'string' || !UUID_REGEX.test(input.modelId)) {
    return { success: false, error: 'Los datos de la solicitud no son válidos.' }
  }

  // 1.6 Quote Handoff Token (Optional)
  let safeQuoteHandoffToken: string | null = null
  if (input.quoteHandoffToken && typeof input.quoteHandoffToken === 'string') {
    if (UUID_REGEX.test(input.quoteHandoffToken)) {
      safeQuoteHandoffToken = input.quoteHandoffToken
    }
  }

  // 1.8 Strict String Runtime Validation
  if (typeof input.deviceCondition !== 'string' || typeof input.customerName !== 'string') {
    return { success: false, error: 'Los datos de la solicitud no son válidos.' }
  }

  const optionalStrings = [input.storage, input.color, input.officialWarrantyUntil, input.customerLocation, input.notes, input.source]
  for (const val of optionalStrings) {
    if (val !== undefined && val !== null && typeof val !== 'string') {
      return { success: false, error: 'Los datos de la solicitud no son válidos.' }
    }
  }

  // 2. Text Normalization
  const customerName = trimOrNull(input.customerName)
  if (!customerName) {
    return { success: false, error: 'El nombre del cliente es requerido.' }
  }
  const storage = trimOrNull(input.storage)
  const color = trimOrNull(input.color)
  const customerLocation = trimOrNull(input.customerLocation)
  const notes = trimOrNull(input.notes)
  const source = trimOrNull(input.source)

  // 3. Device Condition
  const validConditions = ['sealed', 'like_new', 'good', 'marked']
  if (!validConditions.includes(input.deviceCondition)) {
    return { success: false, error: 'Los datos de la solicitud no son válidos.' }
  }

  // 4. Battery Values
  if (input.batteryHealth !== null && input.batteryHealth !== undefined) {
    if (!Number.isInteger(input.batteryHealth) || input.batteryHealth < 0 || input.batteryHealth > 100) {
      return { success: false, error: 'Los datos de la solicitud no son válidos.' }
    }
  }
  if (input.batteryCycles !== null && input.batteryCycles !== undefined) {
    if (!Number.isInteger(input.batteryCycles) || input.batteryCycles < 0) {
      return { success: false, error: 'Los datos de la solicitud no son válidos.' }
    }
  }

  // 5. Boolean Values
  if (
    typeof input.hasBox !== 'boolean' ||
    typeof input.hasCable !== 'boolean' ||
    typeof input.hasInvoice !== 'boolean' ||
    typeof input.originalParts !== 'boolean' ||
    typeof input.fullyFunctional !== 'boolean' ||
    typeof input.blocked !== 'boolean'
  ) {
    return { success: false, error: 'Los datos de la solicitud no son válidos.' }
  }

  // 6. Warranty Date
  const warrantyDate = trimOrNull(input.officialWarrantyUntil)
  if (warrantyDate && !isValidDate(warrantyDate)) {
    return { success: false, error: 'Los datos de la solicitud no son válidos.' }
  }

  // 7. Source
  if (source && !['instagram', 'tiktok', 'google', 'direct', 'other'].includes(source)) {
    return { success: false, error: 'Los datos de la solicitud no son válidos.' }
  }

  // 8. Photo Metadata
  if (!Array.isArray(input.photos) || input.photos.length < 7 || input.photos.length > 10) {
    return { success: false, error: 'Cantidad de fotos no válida.' }
  }

  let hasFrontOff = false
  let hasFrontOn = false
  let hasBack = false
  let hasRightSide = false
  let hasLeftSide = false
  let hasTop = false
  let hasBottom = false
  let extraCount = 0

  const validPhotoTypes = ['front_off', 'front_on', 'back', 'right_side', 'left_side', 'top', 'bottom', 'extra']
  const storagePaths = new Set<string>()

  const mappedPhotos: Array<{ photo_type: string, storage_path: string }> = []

  for (const photo of input.photos) {
    if (typeof photo !== 'object' || photo === null) {
      return { success: false, error: 'Formato de foto inválido.' }
    }
    const { photoType, storagePath } = photo
    if (!photoType || !storagePath || typeof photoType !== 'string' || typeof storagePath !== 'string') {
      return { success: false, error: 'Formato de foto inválido.' }
    }

    const trimmedPath = storagePath.trim()
    if (!trimmedPath || storagePaths.has(trimmedPath)) {
      return { success: false, error: 'Fotos duplicadas o no válidas.' }
    }
    storagePaths.add(trimmedPath)

    if (!validPhotoTypes.includes(photoType)) {
      return { success: false, error: 'Tipo de foto no válido.' }
    }

    if (photoType === 'front_off') {
      if (hasFrontOff) return { success: false, error: 'Foto duplicada requerida.' }
      hasFrontOff = true
    } else if (photoType === 'front_on') {
      if (hasFrontOn) return { success: false, error: 'Foto duplicada requerida.' }
      hasFrontOn = true
    } else if (photoType === 'back') {
      if (hasBack) return { success: false, error: 'Foto duplicada requerida.' }
      hasBack = true
    } else if (photoType === 'right_side') {
      if (hasRightSide) return { success: false, error: 'Foto duplicada requerida.' }
      hasRightSide = true
    } else if (photoType === 'left_side') {
      if (hasLeftSide) return { success: false, error: 'Foto duplicada requerida.' }
      hasLeftSide = true
    } else if (photoType === 'top') {
      if (hasTop) return { success: false, error: 'Foto duplicada requerida.' }
      hasTop = true
    } else if (photoType === 'bottom') {
      if (hasBottom) return { success: false, error: 'Foto duplicada requerida.' }
      hasBottom = true
    } else if (photoType === 'extra') {
      extraCount++
      if (extraCount > 3) return { success: false, error: 'Demasiadas fotos extra.' }
    }

    mappedPhotos.push({
      photo_type: photoType,
      storage_path: trimmedPath
    })
  }

  if (!hasFrontOff || !hasFrontOn || !hasBack || !hasRightSide || !hasLeftSide || !hasTop || !hasBottom) {
    return { success: false, error: 'Faltan tipos de foto requeridos.' }
  }

  try {
    const adminClient = createSupabaseAdminClient()

    const { data: requestId, error: rpcError } = await adminClient.rpc(
      'finalize_public_sale_request',
      {
        p_session_id: input.sessionId,
        p_model_id: input.modelId,
        p_storage: storage,
        p_color: color,
        p_battery_health: input.batteryHealth ?? null,
        p_battery_cycles: input.batteryCycles ?? null,
        p_device_condition: input.deviceCondition,
        p_has_box: input.hasBox,
        p_has_cable: input.hasCable,
        p_has_invoice: input.hasInvoice,
        p_original_parts: input.originalParts,
        p_fully_functional: input.fullyFunctional,
        p_blocked: input.blocked,
        p_official_warranty_until: warrantyDate,
        p_customer_name: customerName,
        p_customer_location: customerLocation,
        p_notes: notes,
        p_source: source,
        p_photos: mappedPhotos,
        p_quote_handoff_token: safeQuoteHandoffToken
      }
    )

    if (rpcError || !requestId) {
      const msg = rpcError?.message || ''
      if (msg.includes('caducado')) {
        return { success: false, error: 'La sesión ha caducado. Vuelve a iniciar el proceso.' }
      }
      if (msg.includes('ya fue utilizada')) {
        return { success: false, error: 'Esta solicitud ya fue enviada.' }
      }
      if (msg.includes('fotos requeridas')) {
        return { success: false, error: 'No se encontraron todas las fotos requeridas.' }
      }
      if (msg.includes('solicitud reciente')) {
        return { success: false, error: 'Ya existe una solicitud reciente con este teléfono.' }
      }
      
      return { success: false, error: 'No se pudo enviar la solicitud. Inténtalo de nuevo.' }
    }

    if (typeof requestId !== 'string' || !UUID_REGEX.test(requestId)) {
      return { success: false, error: 'No se pudo enviar la solicitud. Inténtalo de nuevo.' }
    }

    return {
      success: true,
      requestId
    }

  } catch (err) {
    return {
      success: false,
      error: 'No se pudo enviar la solicitud. Inténtalo de nuevo.'
    }
  }
}
