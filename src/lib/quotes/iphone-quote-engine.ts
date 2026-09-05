import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export type QuoteInput = {
  quoteMode: 'sell' | 'trade_in'
  modelId: string
  storage: string
  color?: string | null
  batteryHealth?: number | null
  batteryCycles?: number | null
  deviceCondition: 'sealed' | 'like_new' | 'good' | 'marked'
  hasBox: boolean
  hasCable: boolean
  hasInvoice: boolean
  originalParts: boolean
  fullyFunctional: boolean
  blocked: boolean
  officialWarrantyUntil?: string | null
  source?: 'instagram' | 'tiktok' | 'google' | 'direct' | 'other' | null
  targetDeviceId?: string | null
}

export type QuoteResult = 
  | { ok: false; code: string }
  | { 
      ok: true
      quoteId: string
      estimatedMin: number
      estimatedMax: number
      targetListingPrice?: number
      differenceMin?: number
      differenceMax?: number
      direction?: 'customer_pays' | 'kevphones_pays' | 'mixed' | 'equal'
    }

export async function calculateIphoneQuote(input: QuoteInput): Promise<QuoteResult> {
  // 1. ELIGIBILITY CHECKS
  if (input.blocked || !input.originalParts || !input.fullyFunctional) {
    return { ok: false, code: 'manual_review_required' }
  }

  const adminSupabase = createSupabaseAdminClient()
  const publicSupabase = await createClient()

  // 2. MODEL VALIDATION
  const { data: model, error: modelError } = await publicSupabase
    .from('device_models')
    .select('id, category, supports_battery_health, supports_cycles')
    .eq('id', input.modelId)
    .eq('active', true)
    .single()

  if (modelError) {
    console.error('Quote engine model query failed', {
      code: modelError.code,
      message: modelError.message,
      details: modelError.details,
      hint: modelError.hint
    })
    return { ok: false, code: 'configuration_error' }
  }

  if (!model || model.category !== 'iphone') {
    return { ok: false, code: 'configuration_error' }
  }

  const { data: storageVariant, error: storageError } = await publicSupabase
    .from('device_model_variants')
    .select('id')
    .eq('model_id', input.modelId)
    .eq('variant_type', 'storage')
    .eq('value', input.storage)
    .single()

  if (storageError) {
    console.error('Quote engine storage variant query failed', {
      code: storageError.code,
      message: storageError.message,
      details: storageError.details,
      hint: storageError.hint
    })
    return { ok: false, code: 'configuration_error' }
  }

  if (!storageVariant) {
    return { ok: false, code: 'configuration_error' }
  }

  // 2.5 COLOR VALIDATION
  let validatedColor: string | null = null
  const { data: colorVariants, error: colorError } = await publicSupabase
    .from('device_model_variants')
    .select('value')
    .eq('model_id', input.modelId)
    .eq('variant_type', 'color')

  if (colorError) {
    console.error('Quote engine color variant query failed', {
      code: colorError.code,
      message: colorError.message,
      details: colorError.details,
      hint: colorError.hint
    })
    return { ok: false, code: 'configuration_error' }
  }

  if (colorVariants && colorVariants.length > 0) {
    if (!input.color || !colorVariants.some(v => v.value === input.color)) {
      return { ok: false, code: 'configuration_error' }
    }
    validatedColor = input.color
  } else {
    // If no color variants configured, color is ignored/null
    validatedColor = null
  }


  // 3. TARGET VALIDATION (TRADE-IN)
  let targetListingPrice: number | undefined
  if (input.quoteMode === 'trade_in') {
    if (!input.targetDeviceId) {
      return { ok: false, code: 'configuration_error' }
    }
    const { data: targetDevice, error: targetError } = await publicSupabase
      .from('devices')
      .select('id, status, listing_price')
      .eq('id', input.targetDeviceId)
      .single()

    if (targetError) {
      console.error('Quote engine target device query failed', {
        code: targetError.code,
        message: targetError.message,
        details: targetError.details,
        hint: targetError.hint
      })
      return { ok: false, code: 'configuration_error' }
    }

    if (!targetDevice || targetDevice.status !== 'available' || typeof targetDevice.listing_price !== 'number' || targetDevice.listing_price < 0) {
      return { ok: false, code: 'configuration_error' }
    }
    targetListingPrice = targetDevice.listing_price
  } else {
    if (input.targetDeviceId) {
      return { ok: false, code: 'configuration_error' }
    }
  }

  // 4. BASE PRICE
  const { data: basePriceConfig, error: basePriceError } = await adminSupabase
    .from('iphone_quote_base_prices')
    .select('min_price, max_price')
    .eq('model_id', input.modelId)
    .eq('storage', input.storage)
    .eq('active', true)
    .single()

  if (basePriceError) {
    console.error('Quote engine base price query failed', {
      code: basePriceError.code,
      message: basePriceError.message,
      details: basePriceError.details,
      hint: basePriceError.hint
    })
    return { ok: false, code: 'configuration_error' }
  }

  if (!basePriceConfig) {
    return { ok: false, code: 'not_configured' }
  }

  const baseMin = Number(basePriceConfig.min_price)
  const baseMax = Number(basePriceConfig.max_price)

  if (Math.abs((baseMax - baseMin) - 30) > 0.01) {
    return { ok: false, code: 'configuration_error' }
  }

  // 5. DISCOUNTS
  const { data: adjustments, error: adjustmentsError } = await adminSupabase
    .from('iphone_quote_adjustments')
    .select('model_id, rule_type, rule_key, min_delta, max_delta')
    .eq('active', true)
    .or(`model_id.eq.${input.modelId},model_id.is.null`)

  if (adjustmentsError) {
    console.error('Quote engine adjustments query failed', {
      code: adjustmentsError.code,
      message: adjustmentsError.message,
      details: adjustmentsError.details,
      hint: adjustmentsError.hint
    })
    return { ok: false, code: 'configuration_error' }
  }

  if (!adjustments) {
    return { ok: false, code: 'configuration_error' }
  }

  // Helper to find discount
  const getDiscount = (type: string, key: string) => {
    // Prefer model specific
    let match = adjustments.find(a => a.model_id === input.modelId && a.rule_type === type && a.rule_key === key)
    if (!match) {
      match = adjustments.find(a => a.model_id === null && a.rule_type === type && a.rule_key === key)
    }
    
    if (!match) return 0

    const minD = Number(match.min_delta)
    const maxD = Number(match.max_delta)

    if (minD !== maxD || minD > 0 || maxD > 0) {
      throw new Error('invariant_violation')
    }

    return minD // Negative value
  }

  try {
    let totalDiscount = 0

    // Condition
    totalDiscount += getDiscount('condition', input.deviceCondition)

    // Battery
    if (model.supports_battery_health) {
      if (typeof input.batteryHealth !== 'number' || !Number.isInteger(input.batteryHealth) || input.batteryHealth < 0 || input.batteryHealth > 100) {
        return { ok: false, code: 'configuration_error' }
      }
      const bh = input.batteryHealth
      let bKey = ''
      if (bh === 100) bKey = '100'
      else if (bh >= 95) bKey = '95_99'
      else if (bh >= 90) bKey = '90_94'
      else if (bh >= 85) bKey = '85_89'
      else if (bh >= 80) bKey = '80_84'
      else bKey = 'under_80'
      totalDiscount += getDiscount('battery', bKey)
    }

    // Cycles
    if (input.batteryCycles !== undefined && input.batteryCycles !== null) {
      if (typeof input.batteryCycles !== 'number' || !Number.isInteger(input.batteryCycles) || input.batteryCycles < 0) {
        return { ok: false, code: 'configuration_error' }
      }
      if (model.supports_cycles) {
        const cy = input.batteryCycles
        let cKey = ''
        if (cy <= 50) cKey = '0_50'
        else if (cy <= 150) cKey = '51_150'
        else if (cy <= 300) cKey = '151_300'
        else cKey = '301_plus'
        totalDiscount += getDiscount('cycles', cKey)
      }
    }

    // Accessories
    if (!input.hasBox) totalDiscount += getDiscount('box', 'no')
    if (!input.hasCable) totalDiscount += getDiscount('cable', 'no')
    if (!input.hasInvoice) totalDiscount += getDiscount('invoice', 'no')

    // Warranty
    let hasWarranty = false
    if (input.officialWarrantyUntil) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(input.officialWarrantyUntil)) {
        return { ok: false, code: 'configuration_error' }
      }
      const d = new Date(input.officialWarrantyUntil)
      if (isNaN(d.getTime()) || d.toISOString().split('T')[0] !== input.officialWarrantyUntil) {
        return { ok: false, code: 'configuration_error' }
      }
      // Use Atlantic/Canary to check today
      const nowCanaryStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Atlantic/Canary' }).format(new Date()) // YYYY-MM-DD
      if (input.officialWarrantyUntil >= nowCanaryStr) {
        hasWarranty = true
      }
    }
    if (!hasWarranty) {
      totalDiscount += getDiscount('warranty', 'no')
    }

    // Color
    if (validatedColor) {
      totalDiscount += getDiscount('color', validatedColor)
    }

    // 6. FINAL CALCULATION
    const estimatedMax = Number((baseMax + totalDiscount).toFixed(2))
    const estimatedMin = Number((estimatedMax - 30).toFixed(2))

    if (estimatedMax < 30 || estimatedMin < 0) {
      return { ok: false, code: 'manual_review_required' }
    }

    // 7. PERSISTENCE
    const { data: quote, error: quoteError } = await adminSupabase
      .from('iphone_quotes')
      .insert({
        quote_mode: input.quoteMode,
        model_id: input.modelId,
        storage: input.storage,
        color: validatedColor,
        battery_health: input.batteryHealth ?? null,
        battery_cycles: input.batteryCycles ?? null,
        device_condition: input.deviceCondition,
        has_box: input.hasBox,
        has_cable: input.hasCable,
        has_invoice: input.hasInvoice,
        original_parts: input.originalParts,
        fully_functional: input.fullyFunctional,
        blocked: input.blocked,
        official_warranty_until: input.officialWarrantyUntil || null,
        estimated_min: estimatedMin,
        estimated_max: estimatedMax,
        target_device_id: input.quoteMode === 'trade_in' ? input.targetDeviceId : null,
        target_listing_price_snapshot: input.quoteMode === 'trade_in' ? targetListingPrice : null,
        source: input.source || null
      })
      .select('id')
      .single()

    if (quoteError || !quote) {
      console.error('Quote engine insert query failed', quoteError ? {
        code: quoteError.code,
        message: quoteError.message,
        details: quoteError.details,
        hint: quoteError.hint
      } : 'No quote returned')
      return { ok: false, code: 'configuration_error' }
    }

    // 8. RESULT
    if (input.quoteMode === 'sell') {
      return {
        ok: true,
        quoteId: quote.id,
        estimatedMin,
        estimatedMax
      }
    } else {
      // trade_in
      const tPrice = targetListingPrice!
      
      const differenceMin = Number((tPrice - estimatedMax).toFixed(2))
      const differenceMax = Number((tPrice - estimatedMin).toFixed(2))
      
      let direction: 'customer_pays' | 'kevphones_pays' | 'mixed' | 'equal' = 'equal'
      
      if (differenceMin > 0 && differenceMax > 0) {
        direction = 'customer_pays'
      } else if (differenceMin < 0 && differenceMax < 0) {
        direction = 'kevphones_pays'
      } else if (differenceMin === 0 && differenceMax === 0) {
        direction = 'equal'
      } else {
        direction = 'mixed'
      }

      return {
        ok: true,
        quoteId: quote.id,
        estimatedMin,
        estimatedMax,
        targetListingPrice: tPrice,
        differenceMin,
        differenceMax,
        direction
      }
    }

  } catch (e: unknown) {
    if (e instanceof Error && e.message === 'invariant_violation') {
      return { ok: false, code: 'configuration_error' }
    }
    console.error('Quote calculation error:', e)
    return { ok: false, code: 'configuration_error' }
  }
}
