'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

const ADMIN_UUID = '76320352-4c29-42ad-a105-345e0b5928dd'

export async function updateSaleRequestStatusAction(requestId: string, status: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.id !== ADMIN_UUID) {
    return { error: 'No autorizado' }
  }

  if (status === 'purchased') {
    return { error: 'El estado Comprado solo puede asignarse al convertir la solicitud en una compra.' }
  }

  if (!['new', 'in_progress', 'discarded'].includes(status)) {
    return { error: 'Estado inválido' }
  }

  const { error } = await supabase
    .from('sale_requests')
    .update({ status })
    .eq('id', requestId)

  if (error) {
    console.error('Error updating sale request status:', error)
    return { error: 'No se pudo actualizar el estado de la solicitud. Inténtalo de nuevo.' }
  }

  revalidatePath('/admin/solicitudes')
  revalidatePath(`/admin/solicitudes/${requestId}`)

  return { success: true }
}

export async function convertRequestToDeviceAction(requestId: string, formData: FormData) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.id !== ADMIN_UUID) {
    return { error: 'No autorizado' }
  }

  // 1. Verify request is not already purchased
  const { data: request, error: requestError } = await supabase
    .from('sale_requests')
    .select('status')
    .eq('id', requestId)
    .single()

  if (requestError || !request) {
    return { error: 'Solicitud no encontrada.' }
  }

  if (request.status === 'purchased') {
    return { error: 'Esta solicitud ya ha sido convertida en dispositivo.' }
  }

  // 2. Extract Data from FormData
  const modelId = formData.get('model_id') as string
  const storage = formData.get('storage') as string | null
  const color = formData.get('color') as string | null
  const imeiSerialRaw = formData.get('imei_serial') as string
  const imeiSerial = imeiSerialRaw?.trim() || null
  const condition = formData.get('condition') as string
  
  const sellerName = formData.get('seller_name') as string
  const sellerPhone = formData.get('seller_phone') as string
  const sellerLocationRaw = formData.get('seller_location') as string
  const sellerLocation = sellerLocationRaw?.trim() || null
  
  const batteryHealthStr = formData.get('battery_health') as string
  const batteryCyclesStr = formData.get('battery_cycles') as string
  
  const hasBox = formData.get('has_box') === 'on' || formData.get('has_box') === 'true'
  const hasCable = formData.get('has_cable') === 'on' || formData.get('has_cable') === 'true'
  const hasInvoice = formData.get('has_invoice') === 'on' || formData.get('has_invoice') === 'true'
  const originalParts = formData.get('original_parts') === 'on' || formData.get('original_parts') === 'true'
  const fullyFunctional = formData.get('fully_functional') === 'on' || formData.get('fully_functional') === 'true'
  
  const warrantyUntilRaw = formData.get('warranty_until') as string
  const warrantyUntil = warrantyUntilRaw ? warrantyUntilRaw : null
  
  const purchasePriceStr = formData.get('purchase_price') as string
  const listingPriceStr = formData.get('listing_price') as string
  const purchasedAtStr = formData.get('purchased_at') as string
  const purchaseLocationRaw = formData.get('purchase_location') as string
  const purchaseLocation = purchaseLocationRaw?.trim() || null
  const internalNotes = formData.get('internal_notes') as string || null

  if (!modelId || !condition || !purchasePriceStr || !listingPriceStr || !purchasedAtStr) {
    return { error: 'Faltan campos obligatorios del dispositivo.' }
  }

  if (!sellerName?.trim() || !sellerPhone?.trim()) {
    return { error: 'El nombre y teléfono del vendedor son obligatorios.' }
  }

  const purchasePrice = parseFloat(purchasePriceStr)
  const listingPrice = parseFloat(listingPriceStr)
  
  if (purchasePrice < 0 || listingPrice < 0) {
    return { error: 'Los precios no pueden ser negativos.' }
  }

  let batteryHealth: number | null = batteryHealthStr ? parseInt(batteryHealthStr, 10) : null
  let batteryCycles: number | null = batteryCyclesStr ? parseInt(batteryCyclesStr, 10) : null

  // Validate limits (model supports validations assumed successful if they reached here, 
  // but let's basic validate limits)
  if (batteryHealth !== null && (batteryHealth < 0 || batteryHealth > 100)) {
    return { error: 'La salud de la batería debe estar entre 0 y 100.' }
  }
  if (batteryCycles !== null && batteryCycles < 0) {
    return { error: 'Los ciclos de carga no pueden ser negativos.' }
  }

  // 3. Register Device using RPC
  const newDeviceId = crypto.randomUUID()
  
  const { error: rpcError } = await supabase.rpc('register_device', {
    p_id: newDeviceId,
    p_model_id: modelId,
    p_storage: storage || null,
    p_color: color || null,
    p_imei_serial: imeiSerial,
    p_battery_health: batteryHealth,
    p_battery_cycles: batteryCycles,
    p_condition: condition,
    p_has_box: hasBox,
    p_has_cable: hasCable,
    p_has_invoice: hasInvoice,
    p_warranty_until: warrantyUntil,
    p_original_parts: originalParts,
    p_fully_functional: fullyFunctional,
    p_purchase_price: purchasePrice,
    p_listing_price: listingPrice,
    p_purchase_location: purchaseLocation,
    p_purchased_at: purchasedAtStr,
    p_status: 'available',
    p_internal_notes: internalNotes,
    p_seller_name: sellerName,
    p_seller_phone: sellerPhone,
    p_seller_location: sellerLocation
  })

  if (rpcError) {
    console.error('Error in register_device RPC during conversion:', rpcError)
    if (rpcError.message?.includes('duplicate key value') || rpcError.message?.includes('IMEI')) {
      return { error: 'Ya existe un dispositivo registrado con ese IMEI o número de serie.' }
    }
    return { error: 'No se pudo crear el dispositivo. Revisa los datos e inténtalo de nuevo.' }
  }

  // 4. Update Sale Request Status
  const { error: updateError } = await supabase
    .from('sale_requests')
    .update({ status: 'purchased' })
    .eq('id', requestId)

  if (updateError) {
    console.error('Error updating sale request status after device creation:', updateError)
    
    // Partial success handling
    return { 
      partialSuccess: true, 
      deviceId: newDeviceId,
      error: 'El dispositivo se creó, pero no se pudo actualizar la solicitud. Revisa el stock antes de volver a intentarlo.' 
    }
  }

  // Fully successful
  revalidatePath('/admin/solicitudes')
  revalidatePath(`/admin/solicitudes/${requestId}`)
  revalidatePath('/admin/stock')
  
  return { success: true, deviceId: newDeviceId }
}
