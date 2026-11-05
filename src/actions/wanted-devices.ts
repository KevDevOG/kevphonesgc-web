'use server'

import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { verifyAdmin } from '@/lib/auth/admin'
import { revalidatePath } from 'next/cache'

export type WantedDeviceSource = 'home' | 'stock' | 'iphone_stock'
export type WantedDeviceStatus = 'pending' | 'contacted' | 'found' | 'closed'

export type SubmitWantedDeviceInput = {
  customer_name: string
  phone: string
  model: string
  category?: string | null
  brand?: string | null
  storage?: string | null
  color?: string | null
  max_budget?: number | string | null
  notes?: string | null
  source: WantedDeviceSource
  website?: string | null
}

export type SubmitWantedDeviceResult = {
  success: boolean
  error?: string
}

function normalizeText(value: string | null | undefined, maxLength: number): string | null {
  if (value === undefined || value === null) return null
  const trimmed = value.trim()
  if (!trimmed) return null
  const collapsed = trimmed.replace(/[ \t]+/g, ' ')
  return collapsed.slice(0, maxLength)
}

function normalizeNotes(value: string | null | undefined, maxLength: number): string | null {
  if (value === undefined || value === null) return null
  const trimmed = value.trim()
  if (!trimmed) return null
  return trimmed.slice(0, maxLength)
}

export async function submitWantedDeviceAction(
  input: SubmitWantedDeviceInput
): Promise<SubmitWantedDeviceResult> {
  // 1. Input Object validation
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return { success: false, error: 'Datos de solicitud inválidos.' }
  }

  // 2. Anti-bot honeypot check
  if (input.website && typeof input.website === 'string' && input.website.trim() !== '') {
    // Safely reject automated bot submissions without revealing anti-bot details
    return { success: false, error: 'No se pudo procesar la solicitud. Por favor, inténtalo de nuevo.' }
  }

  // 3. Normalization and basic presence checks
  const customerName = normalizeText(input.customer_name, 120)
  const phone = (input.phone || '').trim()
  const model = normalizeText(input.model, 150)
  const source = input.source

  if (!customerName || customerName.length > 120) {
    return { success: false, error: 'El nombre es obligatorio y no puede superar los 120 caracteres.' }
  }

  if (!phone || phone.length > 30) {
    return { success: false, error: 'El teléfono es obligatorio y no puede superar los 30 caracteres.' }
  }

  // 4. Flexible but robust phone validation
  // Allows digits, spaces, +, -, (, ), . commonly present in domestic and international phone numbers
  const validPhoneChars = /^[0-9+\s\-().]+$/
  if (!validPhoneChars.test(phone)) {
    return { success: false, error: 'Por favor, introduce un número de teléfono válido.' }
  }

  const digitsOnly = phone.replace(/\D/g, '')
  if (digitsOnly.length < 6 || digitsOnly.length > 20) {
    return { success: false, error: 'El número de teléfono debe contener al menos 6 dígitos válidos.' }
  }

  if (!model || model.length > 150) {
    return { success: false, error: 'El modelo es obligatorio y no puede superar los 150 caracteres.' }
  }

  // 5. Strictly controlled server values: source must be one of allowed sources
  const allowedSources: WantedDeviceSource[] = ['home', 'stock', 'iphone_stock']
  if (!allowedSources.includes(source as WantedDeviceSource)) {
    return { success: false, error: 'Origen de solicitud no válido.' }
  }

  // 6. Optional fields normalization
  const category = normalizeText(input.category, 50)
  const brand = normalizeText(input.brand, 100)
  const storage = normalizeText(input.storage, 50)
  const color = normalizeText(input.color, 80)
  const notes = normalizeNotes(input.notes, 1000)

  let maxBudget: number | null = null
  if (input.max_budget !== undefined && input.max_budget !== null && input.max_budget !== '') {
    const parsed = Number(input.max_budget)
    if (!Number.isFinite(parsed) || parsed <= 0 || parsed > 50000) {
      return { success: false, error: 'El presupuesto máximo debe ser un valor numérico positivo válido.' }
    }
    maxBudget = Math.round(parsed * 100) / 100
  }

  // 7. Secure insertion via server-only admin client
  try {
    const supabaseAdmin = createSupabaseAdminClient()
    const { error } = await supabaseAdmin
      .from('wanted_devices')
      .insert({
        customer_name: customerName,
        phone,
        model,
        category: category || null,
        brand: brand || null,
        storage: storage || null,
        color: color || null,
        max_budget: maxBudget,
        notes: notes || null,
        source,
        status: 'pending' // Always hardcoded to 'pending' on public creation
      })

    if (error) {
      console.error('[submitWantedDeviceAction] DB Insert Error:', error)
      return { success: false, error: 'No se pudo guardar la solicitud. Por favor, inténtalo de nuevo.' }
    }

    return { success: true }
  } catch (err) {
    console.error('[submitWantedDeviceAction] Exception:', err)
    return { success: false, error: 'Ocurrió un error inesperado al procesar la solicitud.' }
  }
}

export async function updateWantedDeviceStatusAction(
  id: string,
  status: WantedDeviceStatus
): Promise<{ success: boolean; error?: string }> {
  const { isAuthorized } = await verifyAdmin()
  if (!isAuthorized) {
    return { success: false, error: 'No autorizado' }
  }

  const allowedStatuses: WantedDeviceStatus[] = ['pending', 'contacted', 'found', 'closed']
  if (!allowedStatuses.includes(status)) {
    return { success: false, error: 'Estado no válido' }
  }

  try {
    const supabase = await createClient()
    const { error } = await supabase
      .from('wanted_devices')
      .update({ status })
      .eq('id', id)

    if (error) {
      console.error('[updateWantedDeviceStatusAction] DB Error:', error)
      return { success: false, error: 'No se pudo actualizar el estado de la solicitud.' }
    }

    revalidatePath('/admin/busquedas')
    return { success: true }
  } catch (err) {
    console.error('[updateWantedDeviceStatusAction] Exception:', err)
    return { success: false, error: 'Error al actualizar la solicitud.' }
  }
}
