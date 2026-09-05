'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function saveBasePricesBulk(prices: {
  model_id: string
  storage: string
  ideal_price: number
}[]) {
  const supabase = await createClient()

  // Authenticate admin
  const { data: user } = await supabase.auth.getUser()
  if (!user.user || user.user.id !== '76320352-4c29-42ad-a105-345e0b5928dd') {
    return { success: false, error: 'No autorizado' }
  }

  if (!Array.isArray(prices)) {
    return { success: false, error: 'Formato de datos inválido' }
  }

  // Pre-fetch active iphone models and their variants to validate the inputs
  const { data: models, error: modelsError } = await supabase
    .from('device_models')
    .select('id')
    .eq('active', true)
    .eq('category', 'iphone')

  if (modelsError) {
    console.error('Error fetching models:', modelsError)
    return { success: false, error: 'Error interno de validación' }
  }

  const { data: variants, error: variantsError } = await supabase
    .from('device_model_variants')
    .select('model_id, value')
    .eq('active', true)
    .eq('variant_type', 'storage')

  if (variantsError) {
    console.error('Error fetching variants:', variantsError)
    return { success: false, error: 'Error interno de validación' }
  }

  const validModelIds = new Set(models?.map(m => m.id))

  // Validate EVERY row
  const rowsToUpsert = []
  const seenRows = new Set<string>()

  for (const p of prices) {
    if (!p.model_id || !p.storage) {
      return { success: false, error: 'Faltan datos de modelo o almacenamiento' }
    }

    const duplicateKey = `${p.model_id}_${p.storage}`
    if (seenRows.has(duplicateKey)) {
      return { success: false, error: 'Se han enviado precios duplicados para el mismo modelo y almacenamiento' }
    }
    seenRows.add(duplicateKey)

    if (typeof p.ideal_price !== 'number' || p.ideal_price < 30 || !Number.isFinite(p.ideal_price)) {
      return { success: false, error: 'Precio ideal inválido (mínimo 30 €) en una de las filas' }
    }
    if (!validModelIds.has(p.model_id)) {
      return { success: false, error: 'Modelo inválido o inactivo' }
    }

    const isValidVariant = variants?.some(v => v.model_id === p.model_id && v.value === p.storage)
    if (!isValidVariant) {
      return { success: false, error: `Almacenamiento no válido para el modelo ${p.model_id}` }
    }

    const max_price = Number(p.ideal_price.toFixed(2))
    const min_price = Number((p.ideal_price - 30).toFixed(2))

    rowsToUpsert.push({
      model_id: p.model_id,
      storage: p.storage,
      min_price,
      max_price,
      active: true // As per requirement: "Newly created rows should use active = true. Existing ... keep current active value." But upsert overrides. Let's fix this in a moment.
    })
  }

  // To preserve active state for existing rows, we should fetch existing prices first
  const { data: existingPrices, error: existingError } = await supabase
    .from('iphone_quote_base_prices')
    .select('model_id, storage, active')

  if (existingError) {
    console.error('Error fetching existing prices:', existingError)
    return { success: false, error: 'Error interno de validación' }
  }

  const existingMap = new Map()
  existingPrices?.forEach(ep => {
    existingMap.set(`${ep.model_id}_${ep.storage}`, ep.active)
  })

  const finalRowsToUpsert = rowsToUpsert.map(row => {
    const key = `${row.model_id}_${row.storage}`
    const active = existingMap.has(key) ? existingMap.get(key) : true
    return { ...row, active }
  })

  if (finalRowsToUpsert.length > 0) {
    const { error } = await supabase
      .from('iphone_quote_base_prices')
      .upsert(finalRowsToUpsert, { onConflict: 'model_id,storage' })

    if (error) {
      console.error('Bulk upsert error:', error)
      return { success: false, error: 'Error guardando los precios' }
    }
  }

  revalidatePath('/admin/cotizador')
  return { success: true }
}

const ALLOWED_GLOBAL_RULES: Record<string, string[]> = {
  condition: ['sealed', 'like_new', 'good', 'marked'],
  battery: ['100', '95_99', '90_94', '85_89', '80_84', 'under_80'],
  box: ['no'],
  cable: ['no'],
  invoice: ['no'],
  warranty: ['no'],
  cycles: ['0_50', '51_150', '151_300', '301_plus']
}

export async function updateGlobalQuoteAdjustment(data: {
  ruleType: string
  ruleKey: string
  discount: number
  active: boolean
}) {
  const supabase = await createClient()

  const { data: user } = await supabase.auth.getUser()
  if (!user.user || user.user.id !== '76320352-4c29-42ad-a105-345e0b5928dd') {
    return { success: false, error: 'No autorizado' }
  }

  if (typeof data.active !== 'boolean') {
    return { success: false, error: 'Estado activo inválido' }
  }

  const allowedKeys = ALLOWED_GLOBAL_RULES[data.ruleType]
  if (!allowedKeys || !allowedKeys.includes(data.ruleKey)) {
    return { success: false, error: 'Regla o combinación no permitida' }
  }

  if (typeof data.discount !== 'number' || data.discount < 0 || !Number.isFinite(data.discount)) {
    return { success: false, error: 'El descuento debe ser un número positivo' }
  }

  // Convert positive discount to equal negative values
  const delta = -Math.abs(Number(data.discount.toFixed(2)))

  // Find existing rule
  const { data: existing, error: lookupError } = await supabase
    .from('iphone_quote_adjustments')
    .select('id')
    .is('model_id', null)
    .eq('rule_type', data.ruleType)
    .eq('rule_key', data.ruleKey)
    .maybeSingle()

  if (lookupError) {
    console.error('Error looking up global rule:', lookupError)
    return { success: false, error: 'Error interno al consultar el descuento' }
  }

  if (existing) {
    const { error } = await supabase
      .from('iphone_quote_adjustments')
      .update({
        min_delta: delta,
        max_delta: delta,
        active: data.active
      })
      .eq('id', existing.id)

    if (error) {
      console.error('Error updating global rule:', error)
      return { success: false, error: 'Error al actualizar el descuento' }
    }
  } else {
    const { error } = await supabase
      .from('iphone_quote_adjustments')
      .insert({
        model_id: null,
        rule_type: data.ruleType,
        rule_key: data.ruleKey,
        min_delta: delta,
        max_delta: delta,
        active: data.active
      })

    if (error) {
      console.error('Error inserting global rule:', error)
      return { success: false, error: 'Error al guardar el descuento' }
    }
  }

  revalidatePath('/admin/cotizador')
  return { success: true }
}
