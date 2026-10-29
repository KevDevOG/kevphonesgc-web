/**
 * src/lib/whatsapp/ai-understanding.ts
 *
 * AI Understanding Fallback for the KevPhonesGC WhatsApp simulator.
 *
 * GOAL:
 * Understand natural Spanish messages that the deterministic parser cannot confidently interpret.
 * The AI extracts structured fields only.
 * The AI NEVER decides stock, prices, valuations, warranties, business rules, or final customer replies.
 */

import { findMatchingModel, type ActiveModelItem } from './stock'
import { parseStorageValue } from './assistant'

export interface AiUnderstandingOutput {
  intent: 'selling' | 'buying' | 'stock' | 'human' | 'greeting' | 'unknown'
  model: string | null
  storage: string | null
  battery_health: number | null
  condition: 'sealed' | 'like_new' | 'good' | 'marked' | null
  accessories: {
    box: boolean | null
    cable: boolean | null
  } | null
  // Buying preferences
  max_budget: number | null
  min_budget: number | null
  model_family: string | null
  min_battery_health: number | null
  best_battery: boolean | null
  confidence: number
}

export interface ValidatedAiExtraction {
  intent?: 'selling' | 'buying' | 'stock' | 'human' | 'greeting' | 'unknown'
  model?: string | null
  storage?: string | null
  batteryHealth?: number | null
  condition?: string | null
  accessories?: string | null
  // Buying preferences
  maxBudget?: number | null
  minBudget?: number | null
  modelFamily?: string | null
  minBatteryHealth?: number | null
  bestBattery?: boolean | null
  confidence: number
}

export interface AiUnderstandingResult {
  used: boolean
  confidence?: number | null
  rawOutput?: AiUnderstandingOutput | null
  validated?: ValidatedAiExtraction | null
  error?: string
}

const AI_UNDERSTANDING_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: [
    'intent',
    'model',
    'storage',
    'battery_health',
    'condition',
    'accessories',
    'max_budget',
    'min_budget',
    'model_family',
    'min_battery_health',
    'best_battery',
    'confidence',
  ],
  properties: {
    intent: {
      type: 'string',
      enum: ['selling', 'buying', 'stock', 'human', 'greeting', 'unknown'],
    },
    model: {
      type: ['string', 'null'],
    },
    storage: {
      type: ['string', 'null'],
    },
    battery_health: {
      type: ['number', 'null'],
    },
    condition: {
      type: ['string', 'null'],
      enum: ['sealed', 'like_new', 'good', 'marked', null],
    },
    accessories: {
      anyOf: [
        {
          type: 'object',
          additionalProperties: false,
          required: ['box', 'cable'],
          properties: {
            box: { type: ['boolean', 'null'] },
            cable: { type: ['boolean', 'null'] },
          },
        },
        { type: 'null' },
      ],
    },
    max_budget: {
      type: ['number', 'null'],
    },
    min_budget: {
      type: ['number', 'null'],
    },
    model_family: {
      type: ['string', 'null'],
      enum: ['Pro', 'Pro Max', 'standard', 'mini', 'Plus', 'Air', null],
    },
    min_battery_health: {
      type: ['number', 'null'],
    },
    best_battery: {
      type: ['boolean', 'null'],
    },
    confidence: {
      type: 'number',
    },
  },
}

/**
 * Sanitizes input text for privacy before sending to OpenAI:
 * - Never includes phone numbers, customer IDs, IMEIs, serials, notes, or prices.
 * - Masks any explicit phone numbers or 15-digit sequences.
 * - Truncates to 500 characters.
 */
function sanitizeInputForPrivacy(text: string): string {
  return text
    .replace(/\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}\b/g, '[TEL]')
    .replace(/\b\d{14,16}\b/g, '[IMEI]')
    .trim()
    .slice(0, 500)
}

/**
 * Calls OpenAI to extract structured meaning from natural Spanish messages.
 * Uses strict JSON schema output and fails gracefully if OpenAI errors or times out.
 */
export async function understandWhatsAppMessageWithAi(opts: {
  text: string
  currentFlow?: 'none' | 'selling' | 'buying'
  awaitingField?:
    | 'model'
    | 'storage'
    | 'battery_health'
    | 'condition'
    | 'accessories'
    | 'maxBudget'
    | null
  activeModels?: ActiveModelItem[]
}): Promise<AiUnderstandingResult> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return { used: false, error: 'OPENAI_API_KEY no configurada' }
  }

  const model = process.env.OPENAI_QUICK_ENTRY_MODEL || 'gpt-6-luna'
  const sanitizedText = sanitizeInputForPrivacy(opts.text)

  if (!sanitizedText) {
    return { used: false, error: 'Texto vacío' }
  }

  let contextHint = ''
  if (opts.currentFlow === 'selling' && opts.awaitingField) {
    contextHint = `\nContexto: el usuario está en un flujo de tasación/venta de iPhone respondiendo a la pregunta sobre el campo: "${opts.awaitingField}".`
  } else if (opts.currentFlow === 'buying' && opts.awaitingField === 'model') {
    contextHint = '\nContexto: el usuario está en un flujo de compra de iPhone respondiendo sobre el modelo que busca.'
  }

  const systemPrompt = [
    'Eres un analizador semántico de mensajes de WhatsApp para KevPhonesGC, una tienda especializada en iPhones.',
    'Tu ÚNICA función es extraer información estructurada en JSON estricto a partir del mensaje del usuario en español.',
    'REGLAS CRÍTICAS:',
    '1. NUNCA inventes información. Si un dato no se menciona de forma explícita o deducible, devuelve null.',
    '2. "intent": selling (quiere vender/tasar un iPhone o entrega datos de su móvil), buying (quiere comprar), stock (pregunta por catálogo/disponibilidad general), human (quiere hablar con Kevin o un humano), greeting (saludo general), unknown (no identificable).',
    '3. "model": normaliza modelos de iPhone a su nombre canónico completo (ej: "iPhone 15 Pro", "iPhone 16 Pro Max", "iPhone 13 mini", "iPhone 14 Plus"). Si el usuario dice "quince pro", "15 pro", "un 14", conviértelo a "iPhone 15 Pro", etc. Si el usuario no menciona modelo o es ambiguo (ej: "uno de los pro nuevos"), devuelve null.',
    '4. "storage": normaliza a capacidades estándar: "64 GB", "128 GB", "256 GB", "512 GB", "1 TB". Si no se menciona o no coincide, null.',
    '5. "battery_health": porcentaje entero de 0 a 100 si menciona salud de batería (ej: "87 de batería", "al 89%"). NUNCA interpretes el modelo (ej: 15 de "iPhone 15"), el almacenamiento o un precio como batería.',
    '6. "condition": sealed (precintado, nuevo a estrenar), like_new (como nuevo, casi nuevo, impecable), good (buen estado, bien cuidado), marked (con marcas, rayones, desgaste), o null.',
    '7. "accessories": objeto con box (boolean o null) y cable (boolean o null). Ej: "tengo caja pero el cable no" => { "box": true, "cable": false }.',
    '8. PREFERENCIAS DE COMPRA (si el usuario busca comprar un iPhone):',
    '   - "max_budget": número en euros si el usuario indica un presupuesto máximo o una cantidad que tiene (ej: "tengo 600 euros" => 600, "por menos de 700" => 700, "hasta 800" => 800, "unos 600" => 600).',
    '   - "min_budget": número en euros si indica un presupuesto mínimo o rango (ej: "entre 500 y 650 euros" => min_budget: 500, max_budget: 650).',
    '   - "model_family": si busca una familia/gama en vez de un modelo exacto: "Pro", "Pro Max", "standard" (o base/normal), "mini", "Plus", "Air". Si dice "un pro" => "Pro", "un pro max" => "Pro Max". Si menciona un modelo exacto como "15 Pro", pon model = "iPhone 15 Pro" y model_family = null.',
    '   - "min_battery_health": porcentaje entero de 0 a 100 si pide un mínimo de salud de batería (ej: "mínimo 90% de batería" => 90).',
    '   - "best_battery": true si pide explícitamente el que tenga mejor batería o máxima batería (ej: "quiero el que tenga mejor batería").',
    '9. "confidence": número entre 0.0 y 1.0 que indica tu nivel de seguridad en la interpretación.',
    contextHint,
  ].filter(Boolean).join('\n')

  try {
    const requestBody: Record<string, unknown> = {
      model,
      temperature: 0,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: sanitizedText },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: { name: 'whatsapp_ai_understanding', strict: true, schema: AI_UNDERSTANDING_SCHEMA },
      },
    }

    const lower = model.toLowerCase()
    if (lower.includes('luna') || lower.includes('gpt-6')) {
      requestBody.reasoning_effort = 'none'
    } else if (lower.startsWith('o1') || lower.startsWith('o3')) {
      delete requestBody.temperature
      requestBody.reasoning_effort = 'low'
    }

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(15000), // 15s timeout
      cache: 'no-store',
    })

    if (!res.ok) {
      console.error('[WhatsApp AI Understanding] OpenAI HTTP error:', res.status)
      return { used: false, error: `OpenAI error ${res.status}` }
    }

    const json = await res.json()
    const content = json?.choices?.[0]?.message?.content
    if (typeof content !== 'string') {
      return { used: false, error: 'Respuesta vacía de IA' }
    }

    const parsed = JSON.parse(content) as AiUnderstandingOutput
    if (!parsed || typeof parsed !== 'object') {
      return { used: false, error: 'Formato inválido de IA' }
    }

    // Validate and normalize against real project data
    const activeModels = opts.activeModels || []
    const validated = validateAndNormalizeAiOutput(parsed, activeModels)

    if (!validated) {
      // Confidence below threshold or invalid data
      return {
        used: false,
        confidence: parsed.confidence,
        rawOutput: parsed,
        validated: null,
      }
    }

    return {
      used: true,
      confidence: validated.confidence,
      rawOutput: parsed,
      validated,
    }
  } catch (err) {
    console.error('[WhatsApp AI Understanding] Error calling OpenAI:', err instanceof Error ? err.message : err)
    return { used: false, error: 'Fallo de conexión o timeout con OpenAI' }
  }
}

/**
 * Validates and normalizes AI output against real project models, storages, conditions, and accessories.
 * Rejects interpretations where confidence < 0.80.
 * Never allows AI to invent models, prices, or invalid values.
 */
export function validateAndNormalizeAiOutput(
  ai: AiUnderstandingOutput,
  activeModels: ActiveModelItem[]
): ValidatedAiExtraction | null {
  // Confidence threshold check (Section 9: confidence >= 0.80)
  if (typeof ai.confidence !== 'number' || ai.confidence < 0.80) {
    return null
  }

  // Model validation (Section 5: must exist in real active models)
  let validatedModel: string | null = null
  if (ai.model && typeof ai.model === 'string') {
    const matched = findMatchingModel(ai.model, activeModels)
    if (matched) {
      validatedModel = matched.name
    }
  }

  // Storage validation (Section 6: only supported storage values)
  let validatedStorage: string | null = null
  if (ai.storage && typeof ai.storage === 'string') {
    validatedStorage = parseStorageValue(ai.storage)
  }

  // Battery health validation (Section 7: integer 0-100 only)
  let validatedBattery: number | null = null
  if (typeof ai.battery_health === 'number' && Number.isFinite(ai.battery_health)) {
    const rounded = Math.round(ai.battery_health)
    if (rounded >= 0 && rounded <= 100) {
      validatedBattery = rounded
    }
  }

  // Condition validation (Section 8: map to supported project values)
  let validatedCondition: string | null = null
  if (ai.condition === 'sealed') validatedCondition = 'Precintado'
  else if (ai.condition === 'like_new') validatedCondition = 'Como nuevo'
  else if (ai.condition === 'good') validatedCondition = 'Buen estado'
  else if (ai.condition === 'marked') validatedCondition = 'Con marcas'

  // Accessories validation (Section 8: map to supported project values)
  let validatedAccessories: string | null = null
  if (ai.accessories && typeof ai.accessories === 'object') {
    const { box, cable } = ai.accessories
    if (box === true && cable === true) {
      validatedAccessories = 'Caja y cable'
    } else if (box === true && cable !== true) {
      validatedAccessories = 'Solo caja'
    } else if (box !== true && cable === true) {
      validatedAccessories = 'Solo cable'
    } else if (box === false && cable === false) {
      validatedAccessories = 'Sin accesorios'
    }
  }

  // Buying preferences validation (Sections 1, 4, 5, 8)
  let validatedMaxBudget: number | null = null
  if (typeof ai.max_budget === 'number' && Number.isFinite(ai.max_budget) && ai.max_budget >= 50 && ai.max_budget <= 5000) {
    validatedMaxBudget = Math.round(ai.max_budget)
  }

  let validatedMinBudget: number | null = null
  if (typeof ai.min_budget === 'number' && Number.isFinite(ai.min_budget) && ai.min_budget >= 50 && ai.min_budget <= 5000) {
    validatedMinBudget = Math.round(ai.min_budget)
  }

  if (validatedMinBudget != null && validatedMaxBudget != null && validatedMinBudget > validatedMaxBudget) {
    const temp = validatedMinBudget
    validatedMinBudget = validatedMaxBudget
    validatedMaxBudget = temp
  }

  let validatedModelFamily: string | null = null
  const allowedFamilies = ['Pro', 'Pro Max', 'standard', 'mini', 'Plus', 'Air']
  if (typeof ai.model_family === 'string' && allowedFamilies.includes(ai.model_family)) {
    validatedModelFamily = ai.model_family
  }

  let validatedMinBattery: number | null = null
  if (typeof ai.min_battery_health === 'number' && Number.isFinite(ai.min_battery_health) && ai.min_battery_health >= 0 && ai.min_battery_health <= 100) {
    validatedMinBattery = Math.round(ai.min_battery_health)
  }

  const validatedBestBattery = typeof ai.best_battery === 'boolean' ? ai.best_battery : null

  return {
    intent: ai.intent,
    model: validatedModel,
    storage: validatedStorage,
    batteryHealth: validatedBattery,
    condition: validatedCondition,
    accessories: validatedAccessories,
    maxBudget: validatedMaxBudget,
    minBudget: validatedMinBudget,
    modelFamily: validatedModelFamily,
    minBatteryHealth: validatedMinBattery,
    bestBattery: validatedBestBattery,
    confidence: ai.confidence,
  }
}
