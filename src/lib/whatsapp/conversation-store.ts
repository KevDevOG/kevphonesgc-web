import 'server-only'

import crypto from 'node:crypto'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import type { WhatsAppConversationState } from './assistant'

// 24 hours in milliseconds
const CONVERSATION_EXPIRATION_MS = 24 * 60 * 60 * 1000

const ALLOWED_AWAITING_FIELDS = [
  'model',
  'storage',
  'battery_health',
  'condition',
  'accessories',
  'maxBudget',
] as const

/**
 * Derives a deterministic, non-reversible HMAC-SHA256 sender key from a WhatsApp sender ID.
 * Uses the server-only WHATSAPP_STATE_SECRET environment variable.
 *
 * Never stores or logs the raw phone number or secret.
 * Returns null if sender ID is empty or secret is not configured.
 */
export function deriveWhatsAppSenderKey(whatsappSenderId: string): string | null {
  const secret = process.env.WHATSAPP_STATE_SECRET?.trim()
  if (!secret) {
    return null
  }

  const normalizedSender = (whatsappSenderId || '').replace(/\D/g, '').trim()
  if (!normalizedSender) {
    return null
  }

  return crypto
    .createHmac('sha256', secret)
    .update(normalizedSender, 'utf8')
    .digest('hex')
}

/**
 * Strictly validates and sanitizes conversation state from database or caller.
 * Never trusts arbitrary JSON.
 * Persists only fields supported by the existing WhatsApp assistant.
 */
export function sanitizeConversationState(state: unknown): WhatsAppConversationState {
  if (!state || typeof state !== 'object') {
    return { flow: 'none' }
  }

  const s = state as Record<string, unknown>
  const flow = s.flow === 'selling' || s.flow === 'buying' ? s.flow : 'none'

  const awaitingField =
    typeof s.awaitingField === 'string' &&
    (ALLOWED_AWAITING_FIELDS as readonly string[]).includes(s.awaitingField)
      ? (s.awaitingField as WhatsAppConversationState['awaitingField'])
      : null

  const sanitized: WhatsAppConversationState = {
    flow,
    awaitingField,
  }

  if (s.selling && typeof s.selling === 'object') {
    const sel = s.selling as Record<string, unknown>
    sanitized.selling = {
      model: typeof sel.model === 'string' && sel.model.length <= 60 ? sel.model.trim() : null,
      storage: typeof sel.storage === 'string' && sel.storage.length <= 20 ? sel.storage.trim() : null,
      batteryHealth:
        typeof sel.batteryHealth === 'number' && sel.batteryHealth >= 0 && sel.batteryHealth <= 100
          ? Math.round(sel.batteryHealth)
          : null,
      condition: typeof sel.condition === 'string' && sel.condition.length <= 50 ? sel.condition.trim() : null,
      accessories:
        typeof sel.accessories === 'string' && sel.accessories.length <= 50 ? sel.accessories.trim() : null,
    }
  }

  if (s.buying && typeof s.buying === 'object') {
    const buy = s.buying as Record<string, unknown>
    sanitized.buying = {
      model: typeof buy.model === 'string' && buy.model.length <= 60 ? buy.model.trim() : null,
      maxBudget:
        typeof buy.maxBudget === 'number' && buy.maxBudget >= 50 && buy.maxBudget <= 5000
          ? Math.round(buy.maxBudget)
          : null,
      minBudget:
        typeof buy.minBudget === 'number' && buy.minBudget >= 50 && buy.minBudget <= 5000
          ? Math.round(buy.minBudget)
          : null,
      storage: typeof buy.storage === 'string' && buy.storage.length <= 20 ? buy.storage.trim() : null,
      modelFamily:
        typeof buy.modelFamily === 'string' && buy.modelFamily.length <= 30 ? buy.modelFamily.trim() : null,
      minBatteryHealth:
        typeof buy.minBatteryHealth === 'number' &&
        buy.minBatteryHealth >= 0 &&
        buy.minBatteryHealth <= 100
          ? Math.round(buy.minBatteryHealth)
          : null,
      bestBattery: buy.bestBattery === true ? true : null,
    }
  }

  return sanitized
}

/**
 * Loads persisted WhatsApp conversation state for a given senderKey.
 *
 * - Returns { flow: 'none' } if not found, expired (> 24 hours of inactivity), or on error.
 * - Never exposes Supabase errors, senderKey, or state in logs.
 */
export async function getConversationState(
  senderKey: string
): Promise<WhatsAppConversationState> {
  if (!senderKey || typeof senderKey !== 'string' || !senderKey.trim()) {
    return { flow: 'none' }
  }

  try {
    const supabase = createSupabaseAdminClient()
    const { data, error } = await supabase
      .from('whatsapp_conversation_states')
      .select('conversation_state, last_activity_at')
      .eq('sender_key', senderKey.trim())
      .maybeSingle()

    if (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('[WhatsApp Conversation Store] Failed to read conversation state')
      }
      return { flow: 'none' }
    }

    if (!data) {
      return { flow: 'none' }
    }

    // Check 24-hour inactivity expiration
    const lastActivityMs = data.last_activity_at ? Date.parse(data.last_activity_at) : NaN
    if (!Number.isFinite(lastActivityMs) || Date.now() - lastActivityMs > CONVERSATION_EXPIRATION_MS) {
      return { flow: 'none' }
    }

    return sanitizeConversationState(data.conversation_state)
  } catch {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[WhatsApp Conversation Store] Failed to read conversation state')
    }
    return { flow: 'none' }
  }
}

/**
 * Validates/sanitizes and persists WhatsApp conversation state for a given senderKey.
 * Overwrites existing state and updates last_activity_at and updated_at.
 */
export async function saveConversationState(
  senderKey: string,
  state: WhatsAppConversationState | unknown
): Promise<void> {
  if (!senderKey || typeof senderKey !== 'string' || !senderKey.trim()) {
    return
  }

  const sanitized = sanitizeConversationState(state)
  const nowIso = new Date().toISOString()

  try {
    const supabase = createSupabaseAdminClient()
    const { error } = await supabase
      .from('whatsapp_conversation_states')
      .upsert(
        {
          sender_key: senderKey.trim(),
          conversation_state: sanitized,
          last_activity_at: nowIso,
          updated_at: nowIso,
        },
        { onConflict: 'sender_key' }
      )

    if (error && process.env.NODE_ENV !== 'production') {
      console.error('[WhatsApp Conversation Store] Failed to save conversation state')
    }
  } catch {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[WhatsApp Conversation Store] Failed to save conversation state')
    }
  }
}

/**
 * Resets/clears persisted WhatsApp conversation state for a given senderKey to { flow: 'none' }.
 */
export async function clearConversationState(senderKey: string): Promise<void> {
  await saveConversationState(senderKey, { flow: 'none' })
}

