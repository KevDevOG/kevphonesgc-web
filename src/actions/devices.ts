'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createDeviceAction(prevState: any, formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user || user.id !== '76320352-4c29-42ad-a105-345e0b5928dd') {
    return { error: 'No autorizado' }
  }

  const deviceId = formData.get('device_uuid') as string
  if (!deviceId) return { error: 'Error interno: UUID de dispositivo faltante.' }

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
  
  const hasBox = formData.get('has_box') === 'on'
  const hasCable = formData.get('has_cable') === 'on'
  const hasInvoice = formData.get('has_invoice') === 'on'
  const originalParts = formData.get('original_parts') === 'on'
  const fullyFunctional = formData.get('fully_functional') === 'on'
  
  const warrantyUntil = formData.get('warranty_until') as string || null
  
  const purchasePriceStr = formData.get('purchase_price') as string
  const listingPriceStr = formData.get('listing_price') as string
  const purchasedAtStr = formData.get('purchased_at') as string
  const purchaseLocation = formData.get('purchase_location') as string || null
  const internalNotes = formData.get('internal_notes') as string || null

  const imagePathsRaw = formData.get('image_paths') as string
  const imagePaths: string[] = imagePathsRaw ? JSON.parse(imagePathsRaw) : []

  if (!modelId || !condition || !purchasePriceStr || !listingPriceStr || !purchasedAtStr) {
    return { error: 'Faltan campos obligatorios del dispositivo.' }
  }

  if (!sellerName?.trim() || !sellerPhone?.trim()) {
    return { error: 'Introduce el nombre y teléfono del vendedor.' }
  }

  const purchasePrice = parseFloat(purchasePriceStr)
  const listingPrice = parseFloat(listingPriceStr)
  
  if (purchasePrice < 0 || listingPrice < 0) {
    return { error: 'Los precios no pueden ser negativos.' }
  }

  const { data: model } = await supabase
    .from('device_models')
    .select('active, supports_battery_health, supports_cycles')
    .eq('id', modelId)
    .single()

  if (!model || !model.active) {
    return { error: 'El modelo seleccionado no es válido o está inactivo.' }
  }

  if (storage || color) {
    const { data: variants } = await supabase
      .from('device_model_variants')
      .select('variant_type, value')
      .eq('model_id', modelId)
      .eq('active', true)
      
    if (storage && !variants?.some(v => v.variant_type === 'storage' && v.value === storage)) {
      return { error: 'La capacidad seleccionada no es válida para este modelo.' }
    }
    if (color && !variants?.some(v => v.variant_type === 'color' && v.value === color)) {
      return { error: 'El color seleccionado no es válido para este modelo.' }
    }
  }

  const validConditions = ['sealed', 'like_new', 'good', 'marked']
  if (!validConditions.includes(condition)) {
    return { error: 'El estado seleccionado no es válido.' }
  }

  let batteryHealth: number | null = batteryHealthStr ? parseInt(batteryHealthStr, 10) : null
  let batteryCycles: number | null = batteryCyclesStr ? parseInt(batteryCyclesStr, 10) : null

  if (!model.supports_battery_health) {
    batteryHealth = null
    batteryCycles = null
  }
  
  if (condition === 'sealed') {
    batteryHealth = null
    batteryCycles = null
  }
  
  if (!model.supports_cycles || batteryHealth !== 100) {
    batteryCycles = null
  }
  
  if (batteryHealth !== null && (batteryHealth < 0 || batteryHealth > 100)) {
    return { error: 'La salud de la batería debe estar entre 0 y 100.' }
  }
  
  if (batteryCycles !== null && batteryCycles < 0) {
    return { error: 'Los ciclos de carga no pueden ser negativos.' }
  }

  for (const path of imagePaths) {
    if (!path.startsWith(`${deviceId}/`)) {
      return { error: 'Ruta de imagen inválida detectada.' }
    }
  }

  const { error: deviceError } = await supabase
    .rpc('register_device', {
      p_id: deviceId,
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
      p_warranty_until: warrantyUntil || null,
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

  if (deviceError) {
    if (imagePaths.length > 0) {
      await supabase.storage.from('device-images').remove(imagePaths)
    }
    console.error(deviceError)
    if (deviceError.message?.includes('duplicate key value') || deviceError.message?.includes('IMEI')) {
      return { error: 'Ya existe un dispositivo registrado con ese IMEI o número de serie.' }
    }
    return { error: 'No se pudo registrar el dispositivo. Inténtalo de nuevo.' }
  }

  if (imagePaths.length > 0) {
    const imagesToInsert = imagePaths.map((path, index) => ({
      device_id: deviceId,
      storage_path: path,
      position: index
    }))
    
    const { error: imagesError } = await supabase
      .from('device_images')
      .insert(imagesToInsert)
      
    if (imagesError) {
      await supabase.from('devices').delete().eq('id', deviceId)
      await supabase.storage.from('device-images').remove(imagePaths)
      return { error: 'Error al guardar las imágenes. Operación revertida.' }
    }
  }

  revalidatePath("/admin/stock")
  revalidatePath("/")

  return { success: true }
}

export async function deleteDeviceAction(deviceId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.id !== '76320352-4c29-42ad-a105-345e0b5928dd') {
    return { error: 'No autorizado' }
  }

  if (!deviceId) return { error: 'Error interno: UUID de dispositivo faltante.' }

  const { data: existingDevice } = await supabase
    .from('devices')
    .select('status')
    .eq('id', deviceId)
    .single()

  if (!existingDevice) {
    return { error: 'El dispositivo no existe.' }
  }

  if (existingDevice.status !== 'available') {
    return { error: 'No se puede eliminar un dispositivo vendido.' }
  }

  const { data: images } = await supabase
    .from('device_images')
    .select('storage_path')
    .eq('device_id', deviceId)

  const imagePaths = images?.map(img => img.storage_path) || []

  const { error: deleteError } = await supabase
    .from('devices')
    .delete()
    .eq('id', deviceId)
    .eq('status', 'available')

  if (deleteError) {
    return { error: 'Error al eliminar el dispositivo. Inténtalo de nuevo.' }
  }

  if (imagePaths.length > 0) {
    const { error: storageError } = await supabase.storage.from('device-images').remove(imagePaths)
    if (storageError) {
      console.warn('Advertencia: El dispositivo fue eliminado, pero algunas imágenes no se pudieron borrar.', storageError)
    }
  }

  revalidatePath('/admin/stock')
  revalidatePath('/')
  revalidatePath('/admin')

  return { success: true }
}

export async function updateDeviceAction(deviceId: string, formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.id !== '76320352-4c29-42ad-a105-345e0b5928dd') {
    return { error: 'No autorizado' }
  }

  if (!deviceId) return { error: 'Error interno: UUID de dispositivo faltante.' }

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
  
  const hasBox = formData.get('has_box') === 'on'
  const hasCable = formData.get('has_cable') === 'on'
  const hasInvoice = formData.get('has_invoice') === 'on'
  const originalParts = formData.get('original_parts') === 'on'
  const fullyFunctional = formData.get('fully_functional') === 'on'
  
  const warrantyUntil = formData.get('warranty_until') as string || null
  
  const purchasePriceStr = formData.get('purchase_price') as string
  const listingPriceStr = formData.get('listing_price') as string
  const purchasedAtStr = formData.get('purchased_at') as string
  const purchaseLocation = formData.get('purchase_location') as string || null
  const internalNotes = formData.get('internal_notes') as string || null

  const imagePathsRaw = formData.get('image_paths') as string
  const imagePaths: string[] = imagePathsRaw ? JSON.parse(imagePathsRaw) : []

  if (!modelId || !condition || !purchasePriceStr || !listingPriceStr || !purchasedAtStr) {
    return { error: 'Faltan campos obligatorios del dispositivo.' }
  }

  if (!sellerName?.trim() || !sellerPhone?.trim()) {
    return { error: 'Introduce el nombre y teléfono del vendedor.' }
  }

  const purchasePrice = parseFloat(purchasePriceStr)
  const listingPrice = parseFloat(listingPriceStr)
  
  if (purchasePrice < 0 || listingPrice < 0) {
    return { error: 'Los precios no pueden ser negativos.' }
  }

  // 1. Check device status
  const { data: existingDevice } = await supabase
    .from('devices')
    .select('status')
    .eq('id', deviceId)
    .single()

  if (!existingDevice || existingDevice.status !== 'available') {
    return { error: 'El dispositivo no existe o ya ha sido vendido.' }
  }

  const { data: model } = await supabase
    .from('device_models')
    .select('active, supports_battery_health, supports_cycles')
    .eq('id', modelId)
    .single()

  if (!model || !model.active) {
    return { error: 'El modelo seleccionado no es válido o está inactivo.' }
  }

  if (storage || color) {
    const { data: variants } = await supabase
      .from('device_model_variants')
      .select('variant_type, value')
      .eq('model_id', modelId)
      .eq('active', true)
      
    if (storage && !variants?.some(v => v.variant_type === 'storage' && v.value === storage)) {
      return { error: 'La capacidad seleccionada no es válida para este modelo.' }
    }
    if (color && !variants?.some(v => v.variant_type === 'color' && v.value === color)) {
      return { error: 'El color seleccionado no es válido para este modelo.' }
    }
  }

  const validConditions = ['sealed', 'like_new', 'good', 'marked']
  if (!validConditions.includes(condition)) {
    return { error: 'El estado seleccionado no es válido.' }
  }

  let batteryHealth: number | null = batteryHealthStr ? parseInt(batteryHealthStr, 10) : null
  let batteryCycles: number | null = batteryCyclesStr ? parseInt(batteryCyclesStr, 10) : null

  if (!model.supports_battery_health) {
    batteryHealth = null
    batteryCycles = null
  }
  
  if (condition === 'sealed') {
    batteryHealth = null
    batteryCycles = null
  }
  
  if (!model.supports_cycles || batteryHealth !== 100) {
    batteryCycles = null
  }
  
  if (batteryHealth !== null && (batteryHealth < 0 || batteryHealth > 100)) {
    return { error: 'La salud de la batería debe estar entre 0 y 100.' }
  }
  
  if (batteryCycles !== null && batteryCycles < 0) {
    return { error: 'Los ciclos de carga no pueden ser negativos.' }
  }

  for (const path of imagePaths) {
    if (!path.startsWith(`${deviceId}/`)) {
      return { error: 'Ruta de imagen inválida detectada.' }
    }
  }

  const { error: deviceError } = await supabase
    .rpc('update_device', {
      p_id: deviceId,
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
      p_warranty_until: warrantyUntil || null,
      p_original_parts: originalParts,
      p_fully_functional: fullyFunctional,
      p_purchase_price: purchasePrice,
      p_listing_price: listingPrice,
      p_purchase_location: purchaseLocation,
      p_purchased_at: purchasedAtStr,
      p_internal_notes: internalNotes,
      p_seller_name: sellerName,
      p_seller_phone: sellerPhone,
      p_seller_location: sellerLocation
    })

  if (deviceError) {
    console.error(deviceError)
    if (deviceError.message?.includes('duplicate key value') || deviceError.message?.includes('IMEI')) {
      return { error: 'Ya existe un dispositivo registrado con ese IMEI o número de serie.' }
    }
    return { error: 'No se pudo actualizar el dispositivo. Inténtalo de nuevo.' }
  }

  // Update images: delete existing and insert new order
  await supabase.from('device_images').delete().eq('device_id', deviceId)

  if (imagePaths.length > 0) {
    const imagesToInsert = imagePaths.map((path, index) => ({
      device_id: deviceId,
      storage_path: path,
      position: index
    }))
    
    await supabase.from('device_images').insert(imagesToInsert)
  }

  revalidatePath("/admin/stock")
  revalidatePath(`/admin/stock/${deviceId}`)
  revalidatePath("/")
  revalidatePath("/admin")

  return { success: true }
}
