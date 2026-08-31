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
  const imeiSerial = formData.get('imei_serial') as string
  const condition = formData.get('condition') as string
  
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

  if (!modelId || !imeiSerial || !condition || !purchasePriceStr || !listingPriceStr || !purchasedAtStr) {
    return { error: 'Faltan campos obligatorios.' }
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
    .from('devices')
    .insert({
      id: deviceId,
      model_id: modelId,
      seller_client_id: null,
      storage: storage || null,
      color: color || null,
      imei_serial: imeiSerial,
      battery_health: batteryHealth,
      battery_cycles: batteryCycles,
      condition,
      has_box: hasBox,
      has_cable: hasCable,
      has_invoice: hasInvoice,
      warranty_until: warrantyUntil || null,
      original_parts: originalParts,
      fully_functional: fullyFunctional,
      purchase_price: purchasePrice,
      listing_price: listingPrice,
      purchase_location: purchaseLocation,
      purchased_at: purchasedAtStr,
      status: 'available',
      internal_notes: internalNotes
    })

  if (deviceError) {
    if (imagePaths.length > 0) {
      await supabase.storage.from('device-images').remove(imagePaths)
    }
    return { error: 'Error al registrar el dispositivo. Comprueba que el IMEI/Serie no esté duplicado.' }
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
