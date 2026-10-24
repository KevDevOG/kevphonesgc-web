'use server'

import { createClient } from '@/lib/supabase/server'
import type { NewDeviceInitialValues } from '@/components/admin/stock/NewDeviceForm'

const ADMIN_ID = '76320352-4c29-42ad-a105-345e0b5928dd'
const MAX_TEXT_LENGTH = 2000
const MAX_BATCH_TEXT_LENGTH = 6000
const MAX_BATCH_DEVICES = 20
const MAX_IMAGE_BYTES = 8 * 1024 * 1024
const DEFAULT_MODEL = 'gpt-6-luna'
const DEFAULT_VISION_MODEL = 'gpt-6-luna'
const CONDITIONS = ['sealed', 'like_new', 'good', 'marked'] as const

export type QuickEntryResult =
  | { error: string }
  | { error?: undefined; values: NewDeviceInitialValues; warnings: string[] }

const nullable = (type: string) => ({ type: [type, 'null'] })

const RESPONSE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: [
    'model', 'storage', 'color', 'imei_serial', 'battery_health', 'battery_cycles',
    'condition', 'has_box', 'has_cable', 'has_invoice', 'warranty', 'original_parts',
    'fully_functional', 'purchase_price', 'listing_price', 'internal_notes',
  ],
  properties: {
    model: nullable('string'),
    storage: nullable('string'),
    color: nullable('string'),
    imei_serial: nullable('string'),
    battery_health: nullable('number'),
    battery_cycles: nullable('number'),
    condition: { type: ['string', 'null'], enum: [...CONDITIONS, null] },
    has_box: nullable('boolean'),
    has_cable: nullable('boolean'),
    has_invoice: nullable('boolean'),
    warranty: nullable('string'),
    original_parts: nullable('boolean'),
    fully_functional: nullable('boolean'),
    purchase_price: nullable('number'),
    listing_price: nullable('number'),
    internal_notes: nullable('string'),
  },
}

const BATCH_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['devices'],
  properties: {
    devices: { type: 'array', items: RESPONSE_SCHEMA },
  },
}

const LABEL_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['model', 'storage', 'color', 'imei', 'serial_number'],
  properties: {
    model: nullable('string'),
    storage: nullable('string'),
    color: nullable('string'),
    imei: nullable('string'),
    serial_number: nullable('string'),
  },
}

// Lowercase, strip accents and every non-alphanumeric char ("Natural Titanium" == "natural-titanium").
function norm(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '')
}

function findMatch<T extends { value?: string; name?: string }>(items: T[], raw: unknown, key: 'value' | 'name'): T | null {
  if (typeof raw !== 'string' || !raw.trim()) return null
  const target = norm(raw)
  if (!target) return null
  return items.find(i => norm(String(i[key] ?? '')) === target) ?? null
}

function asString(v: unknown, max: number): string | null {
  if (typeof v !== 'string') return null
  const t = v.trim().slice(0, max)
  return t || null
}

function asBool(v: unknown): boolean | null {
  return typeof v === 'boolean' ? v : null
}

function asInt(v: unknown, min: number, max: number): number | null {
  if (typeof v !== 'number' || !Number.isFinite(v)) return null
  const n = Math.round(v)
  return n >= min && n <= max ? n : null
}

function asPrice(v: unknown): number | null {
  if (typeof v !== 'number' || !Number.isFinite(v) || v < 0 || v > 100000) return null
  return Math.round(v * 100) / 100
}

function asDate(v: unknown): string | null {
  if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v.trim())) return null
  const d = new Date(`${v.trim()}T00:00:00Z`)
  return Number.isNaN(d.getTime()) ? null : v.trim()
}

type CatalogModel = { id: string; name: string }
type CatalogVariant = { model_id: string; variant_type: string; value: string }
type Catalog = { models: CatalogModel[]; variants: CatalogVariant[] }

async function loadCatalog(supabase: Awaited<ReturnType<typeof createClient>>): Promise<Catalog | { error: string }> {
  const { data: models, error: modelsError } = await supabase
    .from('device_models')
    .select('id, name')
    .eq('category', 'iphone')
    .eq('active', true)
  if (modelsError || !models?.length) return { error: 'No se pudieron cargar los modelos de iPhone.' }

  const { data: variants, error: variantsError } = await supabase
    .from('device_model_variants')
    .select('model_id, variant_type, value')
    .eq('active', true)
    .in('model_id', models.map(m => m.id))
    .in('variant_type', ['storage', 'color'])
  if (variantsError) return { error: 'No se pudieron cargar las variantes de iPhone.' }

  return { models, variants: variants ?? [] }
}

function catalogForPrompt(c: Catalog) {
  return c.models.map(m => ({
    model: m.name,
    storages: c.variants.filter(v => v.model_id === m.id && v.variant_type === 'storage').map(v => v.value),
    colors: c.variants.filter(v => v.model_id === m.id && v.variant_type === 'color').map(v => v.value),
  }))
}

/**
 * Validates model / storage / color against the real active catalog.
 * Never guesses: unmatched values are dropped and a Spanish warning is added.
 * If the source did not mention a model at all, `hintModelId` (e.g. from the label scan) may be used.
 */
function validateCatalogFields(
  catalog: Catalog,
  raw: Record<string, unknown>,
  suffix: string,
  hintModelId?: string | null,
): { values: NewDeviceInitialValues; warnings: string[] } {
  const warnings: string[] = []
  const values: NewDeviceInitialValues = {}

  let matchedModel = findMatch(catalog.models, raw.model, 'name')
  const rawModelMissing = typeof raw.model !== 'string' || !raw.model.trim()
  if (!matchedModel && rawModelMissing && hintModelId) {
    matchedModel = catalog.models.find(m => m.id === hintModelId) ?? null
  }

  if (matchedModel) {
    values.model_id = matchedModel.id
    const modelVariants = catalog.variants.filter(v => v.model_id === matchedModel!.id)

    if (raw.storage != null) {
      const s = findMatch(modelVariants.filter(v => v.variant_type === 'storage'), raw.storage, 'value')
      if (s) values.storage = s.value
      else warnings.push(`No se pudo identificar la capacidad${suffix}.`)
    }
    if (raw.color != null) {
      const c = findMatch(modelVariants.filter(v => v.variant_type === 'color'), raw.color, 'value')
      if (c) values.color = c.value
      else warnings.push(`No se pudo identificar el color${suffix}.`)
    }
  } else {
    warnings.push(`No se pudo identificar el modelo${suffix}.`)
    if (raw.storage != null) warnings.push(`No se pudo identificar la capacidad${suffix}.`)
    if (raw.color != null) warnings.push(`No se pudo identificar el color${suffix}.`)
  }

  return { values, warnings }
}

type OpenAIMessage = { role: 'system' | 'user'; content: unknown }

// Single place that talks to OpenAI Chat Completions (strict JSON schema output, 30s timeout).
async function callOpenAIJson(opts: {
  apiKey: string
  model: string
  messages: OpenAIMessage[]
  schemaName: string
  schema: object
}): Promise<{ error: string } | { data: Record<string, unknown> }> {
  const { apiKey, model, messages, schemaName, schema } = opts
  try {
    const requestBody: Record<string, unknown> = {
      model,
      temperature: 0,
      messages,
      response_format: {
        type: 'json_schema',
        json_schema: { name: schemaName, strict: true, schema },
      },
    }

    // gpt-6-luna and reasoning models require reasoning_effort: "none"
    // to perform simple structured extraction and allow temperature: 0
    const lower = model.toLowerCase()
    if (lower.includes('luna') || lower.includes('gpt-6')) {
      requestBody.reasoning_effort = 'none'
    } else if (lower.startsWith('o1') || lower.startsWith('o3')) {
      delete requestBody.temperature
      requestBody.reasoning_effort = 'low'
    }

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(30000),
      cache: 'no-store',
    })

    if (!res.ok) {
      let errorData: { message?: string; type?: string; code?: string } | null = null
      try {
        const errorJson = await res.json()
        if (errorJson?.error && typeof errorJson.error === 'object') {
          errorData = {
            message: typeof errorJson.error.message === 'string' ? errorJson.error.message : undefined,
            type: typeof errorJson.error.type === 'string' ? errorJson.error.type : undefined,
            code: typeof errorJson.error.code === 'string' ? errorJson.error.code : undefined,
          }
        }
      } catch {
        // Non-JSON error body
      }

      // Safe server logging: only status, type, code, message (no keys, headers, env values or image data)
      console.error('OpenAI quick entry error', {
        status: res.status,
        type: errorData?.type,
        code: errorData?.code,
        message: errorData?.message,
      })

      if (res.status === 401) {
        return { error: 'La clave de OpenAI no es válida o no tiene acceso al proyecto.' }
      }

      const isQuotaOrLimit =
        res.status === 429 ||
        errorData?.code === 'insufficient_quota' ||
        errorData?.type === 'insufficient_quota' ||
        errorData?.message?.toLowerCase().includes('quota') ||
        errorData?.message?.toLowerCase().includes('credit') ||
        errorData?.message?.toLowerCase().includes('billing')

      if (isQuotaOrLimit) {
        return { error: 'La API de OpenAI ha alcanzado un límite de saldo o uso.' }
      }

      if (res.status === 400) {
        const safeMessage = errorData?.message
          ? errorData.message.replace(/sk-[a-zA-Z0-9_-]+/g, '[REDACTED]').slice(0, 200)
          : 'parámetros de solicitud incompatibles.'
        return { error: `OpenAI rechazó la configuración de la solicitud: ${safeMessage}` }
      }

      return { error: `OpenAI ha devuelto un error (${res.status}).` }
    }

    const json = await res.json()
    const content = json?.choices?.[0]?.message?.content
    if (typeof content !== 'string') return { error: 'La IA no devolvió una respuesta válida.' }
    const obj = JSON.parse(content)
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) throw new Error('bad shape')
    return { data: obj }
  } catch (e: any) {
    if (e?.name === 'TimeoutError' || e?.name === 'AbortError') {
      return { error: 'Tiempo de espera agotado al conectar con OpenAI (30s).' }
    }
    console.error('OpenAI quick entry failure', e instanceof Error ? e.message : 'Error desconocido')
    return { error: 'No se pudo interpretar la respuesta de la IA. Inténtalo de nuevo.' }
  }
}

export async function parseIphoneQuickEntryAction(text: string, hintModelId?: string | null): Promise<QuickEntryResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.id !== ADMIN_ID) return { error: 'No autorizado' }

  const input = typeof text === 'string' ? text.trim() : ''
  if (!input) return { error: 'Escribe o dicta la descripción del iPhone.' }
  if (input.length > MAX_TEXT_LENGTH) return { error: `La descripción es demasiado larga (máx. ${MAX_TEXT_LENGTH} caracteres).` }

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return { error: 'La IA no está configurada: falta la variable de entorno OPENAI_API_KEY.' }
  }
  const aiModel = process.env.OPENAI_QUICK_ENTRY_MODEL || DEFAULT_MODEL

  const catalog = await loadCatalog(supabase)
  if ('error' in catalog) return { error: catalog.error }

  const systemPrompt = [
    'Extraes datos de un iPhone a partir de una descripción en español dictada o escrita por un administrador de una tienda.',
    'Devuelve SOLO JSON con el esquema indicado.',
    'REGLA CRÍTICA: nunca inventes información. Si un dato no aparece de forma explícita en el texto, devuelve null.',
    'Para model, storage y color usa exactamente los valores del catálogo; si no encaja con seguridad, null.',
    'condition: sealed (precintado), like_new (como nuevo), good (buen estado), marked (con marcas) o null.',
    'battery_health es un porcentaje (0-100). battery_cycles es un número de ciclos.',
    'has_box, has_cable, has_invoice, original_parts, fully_functional: true/false solo si el texto lo dice; si no, null.',
    'warranty: fecha de fin de garantía en formato YYYY-MM-DD solo si se indica una fecha concreta; si no, null.',
    'purchase_price = precio de compra en euros; listing_price = precio de venta/publicación en euros.',
    'internal_notes: observaciones relevantes del texto que no encajen en otros campos; si no hay, null.',
    `Catálogo disponible: ${JSON.stringify(catalogForPrompt(catalog))}`,
  ].join('\n')

  const result = await callOpenAIJson({
    apiKey,
    model: aiModel,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: input },
    ],
    schemaName: 'iphone_quick_entry',
    schema: RESPONSE_SCHEMA,
  })
  if ('error' in result) return { error: result.error }
  const parsed = result.data

  return buildDeviceValues(catalog, parsed, hintModelId)
}

// Sanitizes one AI-extracted device and validates model/storage/color against the active catalog.
function buildDeviceValues(
  catalog: Catalog,
  parsed: Record<string, unknown>,
  hintModelId?: string | null,
): { values: NewDeviceInitialValues; warnings: string[] } {
  const { values, warnings } = validateCatalogFields(catalog, parsed, ' automáticamente', hintModelId)

  values.imei_serial = asString(parsed.imei_serial, 64)
  values.battery_health = asInt(parsed.battery_health, 0, 100)
  values.battery_cycles = asInt(parsed.battery_cycles, 0, 10000)
  values.condition = typeof parsed.condition === 'string' && (CONDITIONS as readonly string[]).includes(parsed.condition)
    ? parsed.condition
    : null
  values.has_box = asBool(parsed.has_box)
  values.has_cable = asBool(parsed.has_cable)
  values.has_invoice = asBool(parsed.has_invoice)
  values.original_parts = asBool(parsed.original_parts)
  values.fully_functional = asBool(parsed.fully_functional)
  values.warranty_until = asDate(parsed.warranty)
  values.purchase_price = asPrice(parsed.purchase_price)
  values.listing_price = asPrice(parsed.listing_price)
  values.internal_notes = asString(parsed.internal_notes, 1000)

  return { values, warnings }
}

export type BatchQuickEntryResult =
  | { error: string }
  | { error?: undefined; devices: { values: NewDeviceInitialValues; warnings: string[] }[] }

/**
 * Batch extraction: one transcript describing several iPhone -> one validated draft per device
 * (order preserved). Each device is validated independently against the active catalog.
 */
export async function parseIphoneBatchAction(text: string): Promise<BatchQuickEntryResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.id !== ADMIN_ID) return { error: 'No autorizado' }

  const input = typeof text === 'string' ? text.trim() : ''
  if (!input) return { error: 'La transcripción está vacía.' }
  if (input.length > MAX_BATCH_TEXT_LENGTH) {
    return { error: `La transcripción es demasiado larga (máx. ${MAX_BATCH_TEXT_LENGTH} caracteres).` }
  }

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return { error: 'La IA no está configurada: falta la variable de entorno OPENAI_API_KEY.' }
  }
  const aiModel = process.env.OPENAI_QUICK_ENTRY_MODEL || DEFAULT_MODEL

  const catalog = await loadCatalog(supabase)
  if ('error' in catalog) return { error: catalog.error }

  const systemPrompt = [
    'Extraes datos de VARIOS iPhone a partir de una transcripción en español de un audio de un administrador de una tienda.',
    'Devuelve SOLO JSON con la forma {"devices": [...]}, un elemento por iPhone, en el mismo orden en que se describen.',
    'No fusiones dos iPhone distintos en uno. No dividas un iPhone en varios salvo que se describan claramente por separado.',
    'Las frases compartidas como "todos con caja y cable" o "todos como nuevo" se aplican a todos los iPhone cuando no haya ambigüedad; si es ambiguo, null.',
    'REGLA CRÍTICA: nunca inventes información. Si un dato no aparece de forma explícita, devuelve null para ese iPhone.',
    'Para model, storage y color usa exactamente los valores del catálogo; si no encaja con seguridad, null.',
    'condition: sealed (precintado), like_new (como nuevo), good (buen estado), marked (con marcas) o null.',
    'battery_health es un porcentaje (0-100). battery_cycles es un número de ciclos.',
    'has_box, has_cable, has_invoice, original_parts, fully_functional: true/false solo si el texto lo dice; si no, null.',
    'warranty: fecha de fin de garantía en formato YYYY-MM-DD solo si se indica una fecha concreta; si no, null.',
    'purchase_price = precio de compra en euros; listing_price = precio de venta/publicación en euros.',
    'internal_notes: observaciones relevantes que no encajen en otros campos; si no hay, null.',
    `Catálogo disponible: ${JSON.stringify(catalogForPrompt(catalog))}`,
  ].join('\n')

  const result = await callOpenAIJson({
    apiKey,
    model: aiModel,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: input },
    ],
    schemaName: 'iphone_batch_quick_entry',
    schema: BATCH_SCHEMA,
  })
  if ('error' in result) return { error: result.error }

  const rawDevices = result.data.devices
  if (!Array.isArray(rawDevices) || rawDevices.length === 0) {
    return { error: 'No se detectó ningún iPhone en la transcripción.' }
  }

  const devices = rawDevices
    .slice(0, MAX_BATCH_DEVICES)
    .filter((d): d is Record<string, unknown> => !!d && typeof d === 'object' && !Array.isArray(d))
    .map(d => buildDeviceValues(catalog, d))

  if (devices.length === 0) return { error: 'No se detectó ningún iPhone en la transcripción.' }
  return { devices }
}

// Magic-byte sniffing so the declared MIME type can't be spoofed.
function sniffImageType(buf: Buffer): 'image/jpeg' | 'image/png' | 'image/webp' | null {
  if (buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg'
  if (buf.length > 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png'
  if (buf.length > 12 && buf.subarray(0, 4).toString('ascii') === 'RIFF' && buf.subarray(8, 12).toString('ascii') === 'WEBP') return 'image/webp'
  return null
}

/**
 * Reads an iPhone box/device label photo with AI vision. The image is processed in memory only:
 * it is never stored nor logged. Only identification fields are extracted and validated.
 */
export async function scanIphoneLabelAction(formData: FormData): Promise<QuickEntryResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.id !== ADMIN_ID) return { error: 'No autorizado' }

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return { error: 'La IA no está configurada: falta la variable de entorno OPENAI_API_KEY.' }
  }
  const visionModel = process.env.OPENAI_QUICK_ENTRY_VISION_MODEL || DEFAULT_VISION_MODEL

  const file = formData.get('image')
  if (!(file instanceof File) || file.size === 0) return { error: 'Selecciona una imagen de la etiqueta.' }
  if (file.size > MAX_IMAGE_BYTES) return { error: 'La imagen supera el máximo de 8 MB.' }
  if (/hei[cf]/i.test(file.type)) {
    return { error: 'El formato HEIC no es compatible. Haz la foto en formato JPEG o elige otra imagen (JPEG, PNG o WEBP).' }
  }
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    return { error: 'Formato de imagen no admitido. Usa JPEG, PNG o WEBP.' }
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const sniffed = sniffImageType(buffer)
  if (!sniffed) {
    return { error: 'El archivo no es una imagen válida (JPEG, PNG o WEBP).' }
  }

  const catalog = await loadCatalog(supabase)
  if ('error' in catalog) return { error: catalog.error }

  const systemPrompt = [
    'Lees la etiqueta de la caja o del dispositivo de un iPhone a partir de una fotografía.',
    'Devuelve SOLO JSON con el esquema indicado.',
    'REGLA CRÍTICA: extrae únicamente texto que se vea y se lea con total claridad. Nunca adivines ni completes datos.',
    'Si un dato no está visible o no se lee con seguridad, devuelve null.',
    'model: nombre del modelo (p. ej. "iPhone 15 Pro"). storage: capacidad (p. ej. "256GB"). color: color tal como figura en la etiqueta.',
    'Para model, storage y color, si coincide con seguridad usa exactamente el valor del catálogo; si no, null.',
    'imei: número IMEI de 15 dígitos etiquetado como IMEI (no EID ni IMEI2 salvo que sea el único). serial_number: número de serie etiquetado como "Serial No." o "S/N".',
    'No extraigas ni deduzcas nada más (batería, estado, accesorios, precios, garantía, etc.).',
    `Catálogo disponible: ${JSON.stringify(catalogForPrompt(catalog))}`,
  ].join('\n')

  const dataUrl = `data:${sniffed};base64,${buffer.toString('base64')}`

  const result = await callOpenAIJson({
    apiKey,
    model: visionModel,
    messages: [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: [
          { type: 'text', text: 'Extrae los datos visibles de esta etiqueta de iPhone.' },
          { type: 'image_url', image_url: { url: dataUrl, detail: 'high' } },
        ],
      },
    ],
    schemaName: 'iphone_label_scan',
    schema: LABEL_SCHEMA,
  })
  if ('error' in result) return { error: result.error }
  const parsed = result.data

  const { values, warnings } = validateCatalogFields(catalog, parsed, ' en la etiqueta')

  const imeiDigits = typeof parsed.imei === 'string' ? parsed.imei.replace(/[\s-]/g, '') : null
  const imei = imeiDigits && /^\d{15}$/.test(imeiDigits) ? imeiDigits : null
  const serialClean = typeof parsed.serial_number === 'string' ? parsed.serial_number.replace(/[\s-]/g, '').toUpperCase() : null
  const serial = serialClean && /^[A-Z0-9]{8,20}$/.test(serialClean) ? serialClean : null

  if (parsed.imei != null && !imei) warnings.push('No se pudo leer el IMEI con seguridad.')
  if (parsed.serial_number != null && !serial) warnings.push('No se pudo leer el número de serie con seguridad.')

  // The form has a single IMEI / serial field: prefer IMEI, fall back to serial.
  values.imei_serial = imei ?? serial
  if (imei && serial) {
    warnings.push(`También se detectó el número de serie ${serial}; el campo solo admite un valor (se ha usado el IMEI).`)
  }

  if (!values.model_id && !values.imei_serial && !warnings.some(w => w.includes('IMEI'))) {
    warnings.unshift('No se detectó información legible en la etiqueta.')
  }

  return { values, warnings }
}
