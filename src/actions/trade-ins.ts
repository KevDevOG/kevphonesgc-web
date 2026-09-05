'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

const ADMIN_UUID = '76320352-4c29-42ad-a105-345e0b5928dd'
const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/

export type RegisterTradeInInput = {
  // TARGET STOCK DEVICE
  targetDeviceId: string
  finalSalePrice: number
  soldAt: string
  saleLocation?: string | null
  saleObservations?: string | null

  // INCOMING CUSTOMER DEVICE
  modelId: string
  storage?: string | null
  color?: string | null
  imeiSerial?: string | null
  batteryHealth?: number | null
  batteryCycles?: number | null
  condition: string
  hasBox: boolean
  hasCable: boolean
  hasInvoice: boolean
  warrantyUntil?: string | null
  originalParts: boolean
  fullyFunctional: boolean
  purchasePrice: number
  listingPrice: number
  purchaseLocation?: string | null
  internalNotes?: string | null

  // CUSTOMER
  customerName: string
  customerPhone: string
  customerLocation?: string | null

  // OPTIONAL
  saleRequestId?: string | null
}

export async function registerTradeInAction(input: RegisterTradeInInput) {
  try {
    const supabase = await createClient()

    // 1. AUTH
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.id !== ADMIN_UUID) {
      return { success: false, error: 'No autorizado' }
    }

    // 2. RUNTIME VALIDATION
    if (!input || typeof input !== 'object') {
      return { success: false, error: 'Datos no válidos.' }
    }

    if (!UUID_REGEX.test(input.targetDeviceId) || !UUID_REGEX.test(input.modelId)) {
      return { success: false, error: 'Datos de dispositivo no válidos.' }
    }

    const saleRequestId = input.saleRequestId && typeof input.saleRequestId === 'string' ? input.saleRequestId.trim() : null
    if (saleRequestId && !UUID_REGEX.test(saleRequestId)) {
      return { success: false, error: 'ID de solicitud no válido.' }
    }

    if (
      typeof input.finalSalePrice !== 'number' || !isFinite(input.finalSalePrice) || input.finalSalePrice < 0 ||
      typeof input.purchasePrice !== 'number' || !isFinite(input.purchasePrice) || input.purchasePrice < 0 ||
      typeof input.listingPrice !== 'number' || !isFinite(input.listingPrice) || input.listingPrice < 0
    ) {
      return { success: false, error: 'Los precios deben ser numéricos y no negativos.' }
    }

    if (!input.soldAt || !/^\d{4}-\d{2}-\d{2}$/.test(input.soldAt)) {
      return { success: false, error: 'La fecha de venta es inválida.' }
    }

    if (!['sealed', 'like_new', 'good', 'marked'].includes(input.condition)) {
      return { success: false, error: 'El estado del dispositivo no es válido.' }
    }

    const trimNull = (v: any) => (typeof v === 'string' && v.trim() !== '') ? v.trim() : null

    const saleLocation = trimNull(input.saleLocation)
    const saleObservations = trimNull(input.saleObservations)
    const storage = trimNull(input.storage)
    const color = trimNull(input.color)
    const imeiSerial = trimNull(input.imeiSerial)
    const warrantyUntil = trimNull(input.warrantyUntil)
    if (warrantyUntil && !/^\d{4}-\d{2}-\d{2}$/.test(warrantyUntil)) {
       return { success: false, error: 'La fecha de garantía es inválida.' }
    }
    const purchaseLocation = trimNull(input.purchaseLocation)
    const internalNotes = trimNull(input.internalNotes)

    const customerName = trimNull(input.customerName)
    const customerPhone = trimNull(input.customerPhone)
    const customerLocation = trimNull(input.customerLocation)

    if (!saleRequestId && (!customerName || !customerPhone)) {
      return { success: false, error: 'Nombre y teléfono son obligatorios.' }
    }

    // 3. MODEL VALIDATION
    const { data: model } = await supabase
      .from('device_models')
      .select('active, supports_battery_health, supports_cycles')
      .eq('id', input.modelId)
      .single()

    if (!model || !model.active) {
      return { success: false, error: 'El modelo seleccionado no es válido o está inactivo.' }
    }

    if (storage || color) {
      const { data: variants } = await supabase
        .from('device_model_variants')
        .select('variant_type, value')
        .eq('model_id', input.modelId)
        .eq('active', true)
        
      if (storage && !variants?.some(v => v.variant_type === 'storage' && v.value === storage)) {
        return { success: false, error: 'La capacidad seleccionada no es válida para este modelo.' }
      }
      if (color && !variants?.some(v => v.variant_type === 'color' && v.value === color)) {
        return { success: false, error: 'El color seleccionado no es válido para este modelo.' }
      }
    }

    // 4. BATTERY NORMALIZATION
    let batteryHealth = input.batteryHealth
    let batteryCycles = input.batteryCycles

    if (!model.supports_battery_health || input.condition === 'sealed') {
      batteryHealth = null
      batteryCycles = null
    }

    if (batteryHealth !== null && batteryHealth !== undefined) {
      if (!Number.isInteger(batteryHealth) || batteryHealth < 0 || batteryHealth > 100) {
        return { success: false, error: 'La salud de batería debe ser entre 0 y 100.' }
      }
    } else {
      batteryHealth = null
    }

    if (!model.supports_cycles || batteryHealth !== 100) {
      batteryCycles = null
    }

    if (batteryCycles !== null && batteryCycles !== undefined) {
      if (!Number.isInteger(batteryCycles) || batteryCycles < 0) {
        return { success: false, error: 'Los ciclos deben ser 0 o mayor.' }
      }
    } else {
      batteryCycles = null
    }

    // 5. RPC CALL
    const { data, error: rpcError } = await supabase.rpc('register_trade_in', {
      p_target_device_id: input.targetDeviceId,
      p_final_sale_price: input.finalSalePrice,
      p_sold_at: input.soldAt,
      p_sale_location: saleLocation,
      p_sale_observations: saleObservations,

      p_model_id: input.modelId,
      p_storage: storage,
      p_color: color,
      p_imei_serial: imeiSerial,
      p_battery_health: batteryHealth,
      p_battery_cycles: batteryCycles,
      p_condition: input.condition,
      p_has_box: Boolean(input.hasBox),
      p_has_cable: Boolean(input.hasCable),
      p_has_invoice: Boolean(input.hasInvoice),
      p_warranty_until: warrantyUntil,
      p_original_parts: Boolean(input.originalParts),
      p_fully_functional: Boolean(input.fullyFunctional),
      p_purchase_price: input.purchasePrice,
      p_listing_price: input.listingPrice,
      p_purchase_location: purchaseLocation,
      p_internal_notes: internalNotes,

      p_customer_name: customerName,
      p_customer_phone: customerPhone,
      p_customer_location: customerLocation,
      p_sale_request_id: saleRequestId
    })

    // 7. ERROR HANDLING
    if (rpcError || !data || data.length === 0) {
      console.error('RPC Error register_trade_in:', rpcError)
      const msg = rpcError?.message || ''
      
      if (msg.includes('duplicate key value') || msg.includes('IMEI') || msg.includes('imei_serial')) {
        return { success: false, error: 'Ya existe un dispositivo registrado con ese IMEI o número de serie.' }
      }
      if (msg.includes('No autorizado')) {
        return { success: false, error: 'No autorizado' }
      }
      if (msg.includes('La solicitud de venta no existe') || msg.includes('Estado de solicitud no válido')) {
        return { success: false, error: 'La solicitud no es válida, ha sido descartada o ya fue procesada.' }
      }
      if (msg.includes('procesada en otro trade-in')) {
        return { success: false, error: 'Esta solicitud ya ha sido procesada en otro trade-in.' }
      }
      if (msg.includes('objetivo no coincide')) {
        return { success: false, error: 'El dispositivo objetivo no coincide con el de la valoración del trade-in.' }
      }
      if (msg.includes('Nombre y teléfono') || msg.includes('obligatorios')) {
        return { success: false, error: 'El nombre y teléfono del cliente son obligatorios.' }
      }
      if (msg.includes('no está marcado como disponible') || msg.includes('dispositivo no encontrado') || msg.includes('vendido') || msg.includes('disponible')) {
        return { success: false, error: 'El dispositivo que intentas vender ya no está disponible.' }
      }

      return { success: false, error: 'No se pudo registrar la parte de pago. Inténtalo de nuevo.' }
    }

    const result = data[0]

    // 8. REVALIDATION
    revalidatePath('/admin')
    revalidatePath('/admin/stock')
    revalidatePath('/admin/finanzas')
    revalidatePath('/admin/clientes')
    revalidatePath('/admin/solicitudes')
    if (saleRequestId) {
      revalidatePath(`/admin/solicitudes/${saleRequestId}`)
    }
    revalidatePath('/')

    // 6. RPC RESULT
    return {
      success: true,
      tradeInId: result.trade_in_id,
      saleId: result.sale_id,
      receivedDeviceId: result.received_device_id
    }

  } catch (err) {
    console.error('Unhandled error in registerTradeInAction:', err)
    return { success: false, error: 'No se pudo registrar la parte de pago. Inténtalo de nuevo.' }
  }
}
