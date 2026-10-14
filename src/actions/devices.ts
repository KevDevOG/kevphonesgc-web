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

  let modelId = formData.get('model_id') as string
  const categoryRaw = (formData.get('category') as string)?.trim() || null
  const customBrand = (formData.get('custom_brand') as string)?.trim() || null
  const customModelName = (formData.get('custom_model_name') as string)?.trim() || null
  const customProductTypeRaw = (formData.get('custom_product_type') as string)?.trim() || null
  const customSpecsRaw = formData.get('custom_specs') as string | null

  let customSpecs: Record<string, string> = {}
  if (customSpecsRaw) {
    try {
      const parsed = JSON.parse(customSpecsRaw)
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        for (const [k, v] of Object.entries(parsed)) {
          const keyTrim = String(k).trim()
          const valTrim = String(v ?? '').trim()
          if (keyTrim && valTrim) {
            customSpecs[keyTrim] = valTrim
          }
        }
      }
    } catch (e) {
      return { error: 'Formato de especificaciones personalizadas inválido.' }
    }
  }

  // Handle 'other' category model resolution or creation
  if (categoryRaw === 'other') {
    if (!customBrand) {
      return { error: 'Introduce la marca del producto.' }
    }
    if (!customModelName) {
      return { error: 'Introduce el modelo o nombre del producto.' }
    }

    // Search for existing model with category 'other' matching name & brand (case-insensitive)
    const { data: existingModels, error: searchError } = await supabase
      .from('device_models')
      .select('id, brand, name')
      .eq('category', 'other')
      .ilike('name', customModelName)

    if (searchError) {
      console.error(searchError)
      return { error: 'Error al buscar el modelo existente.' }
    }

    const matchedModel = existingModels?.find(
      m => m.brand.trim().toLowerCase() === customBrand.toLowerCase() &&
           m.name.trim().toLowerCase() === customModelName.toLowerCase()
    )

    if (matchedModel) {
      modelId = matchedModel.id
    } else {
      const { data: newModel, error: insertError } = await supabase
        .from('device_models')
        .insert({
          category: 'other',
          brand: customBrand,
          name: customModelName,
          active: true,
          supports_battery_health: false,
          supports_cycles: false,
          sort_order: 0
        })
        .select('id')
        .single()

      if (insertError) {
        if (insertError.code === '23505' || insertError.message?.includes('duplicate key')) {
          // Re-fetch existing models for category 'other' matching name to find the one matching both brand and name
          const { data: conflictModels } = await supabase
            .from('device_models')
            .select('id, brand, name')
            .eq('category', 'other')
            .ilike('name', customModelName)
          
          const conflictMatch = conflictModels?.find(
            m => m.brand.trim().toLowerCase() === customBrand.toLowerCase() &&
                 m.name.trim().toLowerCase() === customModelName.toLowerCase()
          )

          if (conflictMatch) {
            modelId = conflictMatch.id
          } else {
            return { error: 'Error de conflicto al registrar el modelo del producto.' }
          }
        } else {
          console.error(insertError)
          return { error: 'No se pudo crear el modelo en la base de datos.' }
        }
      } else if (newModel) {
        modelId = newModel.id
      }
    }
  }

  let storage = formData.get('storage') as string | null
  let color = formData.get('color') as string | null
  let size = (formData.get('size') as string)?.trim() || null
  let connectivity = (formData.get('connectivity') as string)?.trim() || null
  let chip = (formData.get('chip') as string)?.trim() || null
  let memory = (formData.get('memory') as string)?.trim() || null
  let caseType = (formData.get('case_type') as string)?.trim() || null
  let caseMaterial = (formData.get('case_material') as string)?.trim() || null
  const imeiSerialRaw = formData.get('imei_serial') as string
  const imeiSerial = imeiSerialRaw?.trim() || null
  const condition = formData.get('condition') as string
  
  let sellerName = formData.get('seller_name') as string
  let sellerPhone = formData.get('seller_phone') as string
  let sellerLocationRaw = formData.get('seller_location') as string
  let sellerLocation = sellerLocationRaw?.trim() || null

  const sellerClientId = formData.get('seller_client_id') as string | null

  if (sellerClientId) {
    const { data: client } = await supabase.from('clients').select('name, phone, location').eq('id', sellerClientId).single()
    if (!client) {
      return { error: 'El cliente seleccionado ya no existe.' }
    }
    sellerName = client.name
    sellerPhone = client.phone
    sellerLocation = client.location
  }
  
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
  const discountPriceStr = formData.get('discount_price') as string
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

  let discountPrice: number | null = null
  if (discountPriceStr && discountPriceStr.trim() !== '') {
    discountPrice = parseFloat(discountPriceStr)
    if (!Number.isFinite(discountPrice) || discountPrice <= 0 || discountPrice >= listingPrice) {
      return { error: 'El precio de descuento debe ser mayor a 0 y estrictamente menor que el precio de venta (base).' }
    }
  }

  const { data: model } = await supabase
    .from('device_models')
    .select('category, active, supports_battery_health, supports_cycles')
    .eq('id', modelId)
    .single()

  if (!model || !model.active) {
    return { error: 'El modelo seleccionado no es válido o está inactivo.' }
  }

  if (model.category === 'iphone') {
    size = null
    connectivity = null
    chip = null
    memory = null
    caseType = null
    caseMaterial = null
  } else if (model.category === 'apple_watch') {
    storage = null
    caseType = null
    chip = null
    memory = null
  } else if (model.category === 'airpods') {
    storage = null
    size = null
    connectivity = null
    chip = null
    memory = null
    caseMaterial = null
  } else if (model.category === 'ipad') {
    size = null
    chip = null
    memory = null
    caseType = null
    caseMaterial = null
  } else if (model.category === 'macbook') {
    size = null
    connectivity = null
    caseType = null
    caseMaterial = null
  } else if (model.category === 'ps5' || model.category === 'nintendo_switch') {
    size = null
    connectivity = null
    chip = null
    memory = null
    caseType = null
    caseMaterial = null
  } else if (model.category === 'other') {
    size = null
    connectivity = null
    chip = null
    memory = null
    caseType = null
    caseMaterial = null
  }

  if (model.category !== 'other' && (storage || color || size || connectivity || caseType || caseMaterial || chip || memory)) {
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
    if (size && !variants?.some(v => v.variant_type === 'size' && v.value === size)) {
      return { error: 'El tamaño seleccionado no es válido para este modelo.' }
    }
    if (connectivity && !variants?.some(v => v.variant_type === 'connectivity' && v.value === connectivity)) {
      return { error: 'La conectividad seleccionada no es válida para este modelo.' }
    }
    if (caseType && !variants?.some(v => v.variant_type === 'case_type' && v.value === caseType)) {
      return { error: 'El tipo de estuche seleccionado no es válido para este modelo.' }
    }
    if (caseMaterial && !variants?.some(v => v.variant_type === 'case_material' && v.value === caseMaterial)) {
      return { error: 'El material seleccionado no es válido para este modelo.' }
    }
    if (chip && !variants?.some(v => v.variant_type === 'chip' && v.value === chip)) {
      return { error: 'El procesador seleccionado no es válido para este modelo.' }
    }
    if (memory && !variants?.some(v => v.variant_type === 'memory' && v.value === memory)) {
      return { error: 'La memoria seleccionada no es válida para este modelo.' }
    }

    if (model.category === 'macbook' && chip) {
      const { data: compatibilities } = await supabase
        .from('device_variant_compatibility')
        .select('child_variant_type, child_value')
        .eq('model_id', modelId)
        .eq('parent_variant_type', 'chip')
        .eq('parent_value', chip)
      
      if (memory && !compatibilities?.some(c => c.child_variant_type === 'memory' && c.child_value === memory)) {
        return { error: 'La memoria seleccionada no es compatible con el procesador seleccionado.' }
      }
      
      if (storage && !compatibilities?.some(c => c.child_variant_type === 'storage' && c.child_value === storage)) {
        return { error: 'La capacidad seleccionada no es compatible con el procesador seleccionado.' }
      }
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
      p_seller_location: sellerLocation,
      p_discount_price: discountPrice,
      p_size: size,
      p_connectivity: connectivity,
      p_chip: chip,
      p_memory: memory,
      p_case_type: caseType,
      p_case_material: caseMaterial,
      p_custom_product_type: customProductTypeRaw || null,
      p_custom_specs: customSpecs
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

  let modelId = formData.get('model_id') as string
  const categoryRaw = (formData.get('category') as string)?.trim() || null
  const customBrand = (formData.get('custom_brand') as string)?.trim() || null
  const customModelName = (formData.get('custom_model_name') as string)?.trim() || null
  const customProductTypeRaw = (formData.get('custom_product_type') as string)?.trim() || null
  const customSpecsRaw = formData.get('custom_specs') as string | null

  let customSpecs: Record<string, string> = {}
  if (customSpecsRaw) {
    try {
      const parsed = JSON.parse(customSpecsRaw)
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        for (const [k, v] of Object.entries(parsed)) {
          const keyTrim = String(k).trim()
          const valTrim = String(v ?? '').trim()
          if (keyTrim && valTrim) {
            customSpecs[keyTrim] = valTrim
          }
        }
      }
    } catch (e) {
      return { error: 'Formato de especificaciones personalizadas inválido.' }
    }
  }

  // Handle 'other' category model resolution or creation
  if (categoryRaw === 'other') {
    if (!customBrand) {
      return { error: 'Introduce la marca del producto.' }
    }
    if (!customModelName) {
      return { error: 'Introduce el modelo o nombre del producto.' }
    }

    // Check if the current device already has a model with the exact same brand and name
    let keepCurrentModel = false
    if (modelId) {
      const { data: currModel } = await supabase
        .from('device_models')
        .select('id, category, brand, name')
        .eq('id', modelId)
        .maybeSingle()
      
      if (
        currModel &&
        currModel.category === 'other' &&
        currModel.brand.trim().toLowerCase() === customBrand.toLowerCase() &&
        currModel.name.trim().toLowerCase() === customModelName.toLowerCase()
      ) {
        keepCurrentModel = true
      }
    }

    if (!keepCurrentModel) {
      // Search for existing model with category 'other' matching name & brand (case-insensitive)
      const { data: existingModels, error: searchError } = await supabase
        .from('device_models')
        .select('id, brand, name')
        .eq('category', 'other')
        .ilike('name', customModelName)

      if (searchError) {
        console.error(searchError)
        return { error: 'Error al buscar el modelo existente.' }
      }

      const matchedModel = existingModels?.find(
        m => m.brand.trim().toLowerCase() === customBrand.toLowerCase() &&
             m.name.trim().toLowerCase() === customModelName.toLowerCase()
      )

      if (matchedModel) {
        modelId = matchedModel.id
      } else {
        const { data: newModel, error: insertError } = await supabase
          .from('device_models')
          .insert({
            category: 'other',
            brand: customBrand,
            name: customModelName,
            active: true,
            supports_battery_health: false,
            supports_cycles: false,
            sort_order: 0
          })
          .select('id')
          .single()

        if (insertError) {
          if (insertError.code === '23505' || insertError.message?.includes('duplicate key')) {
            const { data: conflictModels } = await supabase
              .from('device_models')
              .select('id, brand, name')
              .eq('category', 'other')
              .ilike('name', customModelName)
            
            const conflictMatch = conflictModels?.find(
              m => m.brand.trim().toLowerCase() === customBrand.toLowerCase() &&
                   m.name.trim().toLowerCase() === customModelName.toLowerCase()
            )

            if (conflictMatch) {
              modelId = conflictMatch.id
            } else {
              return { error: 'Error de conflicto al registrar el modelo del producto.' }
            }
          } else {
            console.error(insertError)
            return { error: 'No se pudo crear el modelo en la base de datos.' }
          }
        } else if (newModel) {
          modelId = newModel.id
        }
      }
    }
  }
  let storage = formData.get('storage') as string | null
  let color = formData.get('color') as string | null
  let size = (formData.get('size') as string)?.trim() || null
  let connectivity = (formData.get('connectivity') as string)?.trim() || null
  let chip = (formData.get('chip') as string)?.trim() || null
  let memory = (formData.get('memory') as string)?.trim() || null
  let caseType = (formData.get('case_type') as string)?.trim() || null
  let caseMaterial = (formData.get('case_material') as string)?.trim() || null
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
  const discountPriceStr = formData.get('discount_price') as string
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

  let discountPrice: number | null = null
  if (discountPriceStr && discountPriceStr.trim() !== '') {
    discountPrice = parseFloat(discountPriceStr)
    if (!Number.isFinite(discountPrice) || discountPrice <= 0 || discountPrice >= listingPrice) {
      return { error: 'El precio de descuento debe ser mayor a 0 y estrictamente menor que el precio de venta (base).' }
    }
  }

  // 1. Check device status
  const { data: existingDevice } = await supabase
    .from('devices')
    .select('status, purchase_price, purchased_at, purchase_location')
    .eq('id', deviceId)
    .single()

  if (!existingDevice || existingDevice.status !== 'available') {
    return { error: 'El dispositivo no existe o ya ha sido vendido.' }
  }

  // 1b. Check if this is a received trade-in device
  const { data: tradeInOp } = await supabase
    .from('trade_in_operations')
    .select('id')
    .eq('received_device_id', deviceId)
    .maybeSingle()

  let finalPurchasePrice = purchasePrice
  let finalPurchasedAtStr = purchasedAtStr
  let finalPurchaseLocation = purchaseLocation

  if (tradeInOp) {
    finalPurchasePrice = existingDevice.purchase_price
    finalPurchasedAtStr = existingDevice.purchased_at
    finalPurchaseLocation = existingDevice.purchase_location
  }

  const { data: model } = await supabase
    .from('device_models')
    .select('category, active, supports_battery_health, supports_cycles')
    .eq('id', modelId)
    .single()

  if (!model || !model.active) {
    return { error: 'El modelo seleccionado no es válido o está inactivo.' }
  }

  if (model.category === 'iphone') {
    size = null
    connectivity = null
    chip = null
    memory = null
    caseType = null
    caseMaterial = null
  } else if (model.category === 'apple_watch') {
    storage = null
    caseType = null
    chip = null
    memory = null
  } else if (model.category === 'airpods') {
    storage = null
    size = null
    connectivity = null
    chip = null
    memory = null
    caseMaterial = null
  } else if (model.category === 'ipad') {
    size = null
    chip = null
    memory = null
    caseType = null
    caseMaterial = null
  } else if (model.category === 'macbook') {
    size = null
    connectivity = null
    caseType = null
    caseMaterial = null
  } else if (model.category === 'ps5' || model.category === 'nintendo_switch') {
    size = null
    connectivity = null
    chip = null
    memory = null
    caseType = null
    caseMaterial = null
  } else if (model.category === 'other') {
    size = null
    connectivity = null
    chip = null
    memory = null
    caseType = null
    caseMaterial = null
  }

  if (model.category !== 'other' && (storage || color || size || connectivity || caseType || caseMaterial || chip || memory)) {
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
    if (size && !variants?.some(v => v.variant_type === 'size' && v.value === size)) {
      return { error: 'El tamaño seleccionado no es válido para este modelo.' }
    }
    if (connectivity && !variants?.some(v => v.variant_type === 'connectivity' && v.value === connectivity)) {
      return { error: 'La conectividad seleccionada no es válida para este modelo.' }
    }
    if (caseType && !variants?.some(v => v.variant_type === 'case_type' && v.value === caseType)) {
      return { error: 'El tipo de estuche seleccionado no es válido para este modelo.' }
    }
    if (caseMaterial && !variants?.some(v => v.variant_type === 'case_material' && v.value === caseMaterial)) {
      return { error: 'El material seleccionado no es válido para este modelo.' }
    }
    if (chip && !variants?.some(v => v.variant_type === 'chip' && v.value === chip)) {
      return { error: 'El procesador seleccionado no es válido para este modelo.' }
    }
    if (memory && !variants?.some(v => v.variant_type === 'memory' && v.value === memory)) {
      return { error: 'La memoria seleccionada no es válida para este modelo.' }
    }

    if (model.category === 'macbook' && chip) {
      const { data: compatibilities } = await supabase
        .from('device_variant_compatibility')
        .select('child_variant_type, child_value')
        .eq('model_id', modelId)
        .eq('parent_variant_type', 'chip')
        .eq('parent_value', chip)
      
      if (memory && !compatibilities?.some(c => c.child_variant_type === 'memory' && c.child_value === memory)) {
        return { error: 'La memoria seleccionada no es compatible con el procesador seleccionado.' }
      }
      
      if (storage && !compatibilities?.some(c => c.child_variant_type === 'storage' && c.child_value === storage)) {
        return { error: 'La capacidad seleccionada no es compatible con el procesador seleccionado.' }
      }
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
      p_purchase_price: finalPurchasePrice,
      p_listing_price: listingPrice,
      p_purchase_location: finalPurchaseLocation,
      p_purchased_at: finalPurchasedAtStr,
      p_internal_notes: internalNotes,
      p_seller_name: sellerName,
      p_seller_phone: sellerPhone,
      p_seller_location: sellerLocation,
      p_discount_price: discountPrice,
      p_size: size,
      p_connectivity: connectivity,
      p_chip: chip,
      p_memory: memory,
      p_case_type: caseType,
      p_case_material: caseMaterial,
      p_custom_product_type: customProductTypeRaw || null,
      p_custom_specs: customSpecs
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

export async function publishDeviceAction(deviceId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.id !== '76320352-4c29-42ad-a105-345e0b5928dd') {
    return { error: 'No autorizado' }
  }

  if (!deviceId) return { error: 'Error interno: UUID de dispositivo faltante.' }

  const { data: device } = await supabase
    .from('devices')
    .select('status, is_published')
    .eq('id', deviceId)
    .single()

  if (!device) {
    return { error: 'El dispositivo no existe.' }
  }

  if (device.status !== 'available') {
    return { error: 'Solo se pueden publicar dispositivos en estado disponible.' }
  }

  if (device.is_published) {
    return { success: true } // Already published
  }

  const { count, error: countError } = await supabase
    .from('device_images')
    .select('id', { count: 'exact', head: true })
    .eq('device_id', deviceId)

  if (countError) {
    return { error: 'Error al verificar las imágenes del dispositivo.' }
  }

  if (count === 0) {
    return { error: 'Añade al menos una foto real antes de publicar el dispositivo.' }
  }

  const { error: updateError } = await supabase
    .from('devices')
    .update({ is_published: true })
    .eq('id', deviceId)

  if (updateError) {
    return { error: 'No se pudo publicar el dispositivo. Inténtalo de nuevo.' }
  }

  revalidatePath('/admin')
  revalidatePath('/admin/stock')
  revalidatePath('/')

  return { success: true }
}
