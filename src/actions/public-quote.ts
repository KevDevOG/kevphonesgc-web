'use server'

import { calculateIphoneQuote, QuoteInput } from '@/lib/quotes/iphone-quote-engine'

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const dateRegex = /^\d{4}-\d{2}-\d{2}$/

export async function submitPublicIphoneQuote(input: any) {
  try {
    if (!input || typeof input !== 'object') {
      return { ok: false, code: 'invalid_input' }
    }

    // Validate quoteMode
    if (input.quoteMode !== 'sell' && input.quoteMode !== 'trade_in') {
      return { ok: false, code: 'invalid_input' }
    }

    // Validate modelId
    if (typeof input.modelId !== 'string' || !uuidRegex.test(input.modelId)) {
      return { ok: false, code: 'invalid_input' }
    }

    // Validate storage
    if (typeof input.storage !== 'string' || input.storage.trim() === '') {
      return { ok: false, code: 'invalid_input' }
    }

    // Validate color
    if (input.color !== undefined && input.color !== null && typeof input.color !== 'string') {
      return { ok: false, code: 'invalid_input' }
    }

    // Validate batteryHealth
    if (input.batteryHealth !== undefined && input.batteryHealth !== null) {
      if (typeof input.batteryHealth !== 'number' || !Number.isInteger(input.batteryHealth) || input.batteryHealth < 0 || input.batteryHealth > 100) {
        return { ok: false, code: 'invalid_input' }
      }
    }

    // Validate batteryCycles
    if (input.batteryCycles !== undefined && input.batteryCycles !== null) {
      if (typeof input.batteryCycles !== 'number' || !Number.isInteger(input.batteryCycles) || input.batteryCycles < 0) {
        return { ok: false, code: 'invalid_input' }
      }
    }

    // Validate deviceCondition
    const validConditions = ['sealed', 'like_new', 'good', 'marked']
    if (!validConditions.includes(input.deviceCondition)) {
      return { ok: false, code: 'invalid_input' }
    }

    // Validate booleans
    const boolFields = ['hasBox', 'hasCable', 'hasInvoice', 'originalParts', 'fullyFunctional', 'blocked']
    for (const field of boolFields) {
      if (typeof input[field] !== 'boolean') {
        return { ok: false, code: 'invalid_input' }
      }
    }

    // Validate officialWarrantyUntil
    if (input.officialWarrantyUntil !== undefined && input.officialWarrantyUntil !== null) {
      if (typeof input.officialWarrantyUntil !== 'string' || !dateRegex.test(input.officialWarrantyUntil)) {
        return { ok: false, code: 'invalid_input' }
      }
      const d = new Date(input.officialWarrantyUntil)
      if (isNaN(d.getTime()) || d.toISOString().split('T')[0] !== input.officialWarrantyUntil) {
        return { ok: false, code: 'invalid_input' }
      }
    }

    // Validate source
    if (input.source !== undefined && input.source !== null) {
      const validSources = ['instagram', 'tiktok', 'google', 'direct', 'other']
      if (!validSources.includes(input.source)) {
        return { ok: false, code: 'invalid_input' }
      }
    }

    // Validate targetDeviceId
    if (input.quoteMode === 'trade_in') {
      if (typeof input.targetDeviceId !== 'string' || !uuidRegex.test(input.targetDeviceId)) {
        return { ok: false, code: 'invalid_input' }
      }
    } else {
      if (input.targetDeviceId !== undefined && input.targetDeviceId !== null) {
        return { ok: false, code: 'invalid_input' }
      }
    }

    const validatedInput: QuoteInput = {
      quoteMode: input.quoteMode,
      modelId: input.modelId,
      storage: input.storage.trim(),
      color: input.color || null,
      batteryHealth: input.batteryHealth ?? null,
      batteryCycles: input.batteryCycles ?? null,
      deviceCondition: input.deviceCondition,
      hasBox: input.hasBox,
      hasCable: input.hasCable,
      hasInvoice: input.hasInvoice,
      originalParts: input.originalParts,
      fullyFunctional: input.fullyFunctional,
      blocked: input.blocked,
      officialWarrantyUntil: input.officialWarrantyUntil || null,
      source: input.source || null,
      targetDeviceId: input.targetDeviceId || null
    }

    const result = await calculateIphoneQuote(validatedInput)
    return result

  } catch (e: unknown) {
    console.error('Submit quote error:', e)
    return { ok: false, code: 'internal_error' }
  }
}
