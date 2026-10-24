import crypto from 'node:crypto'

// ============================================================================
// Types
// ============================================================================

export interface WhatsAppWebhookContact {
  profile?: {
    name?: string
  }
  wa_id?: string
}

export interface WhatsAppWebhookTextMessage {
  body?: string
}

export interface WhatsAppWebhookMessage {
  from?: string
  id?: string
  timestamp?: string
  type?: string
  text?: WhatsAppWebhookTextMessage
  [key: string]: unknown
}

export interface WhatsAppWebhookStatus {
  id?: string
  status?: string
  timestamp?: string
  recipient_id?: string
  [key: string]: unknown
}

export interface WhatsAppWebhookChangeValue {
  messaging_product?: string
  metadata?: {
    display_phone_number?: string
    phone_number_id?: string
  }
  contacts?: WhatsAppWebhookContact[]
  messages?: WhatsAppWebhookMessage[]
  statuses?: WhatsAppWebhookStatus[]
  [key: string]: unknown
}

export interface WhatsAppWebhookChange {
  value?: WhatsAppWebhookChangeValue
  field?: string
}

export interface WhatsAppWebhookEntry {
  id?: string
  changes?: WhatsAppWebhookChange[]
}

export interface WhatsAppWebhookPayload {
  object?: string
  entry?: WhatsAppWebhookEntry[]
}

export interface ParsedWhatsAppTextMessage {
  sender: string // WhatsApp sender ID / phone (e.g. '34600123456')
  messageId: string // Unique WhatsApp message ID ('wamid.HBg...')
  timestamp: string // Unix epoch timestamp string
  textBody: string // Extracted message text body
  senderName?: string // Profile name if provided in webhook contacts
  phoneNumberId?: string // Destination business phone number ID from metadata
}

export interface WhatsAppConfig {
  verifyToken?: string
  appSecret?: string
  accessToken?: string
  phoneNumberId?: string
  businessAccountId?: string
  apiVersion: string
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Loads server-only WhatsApp Business Cloud API configuration from environment.
 * None of these variables are exposed to the client.
 */
export function getWhatsAppConfig(): WhatsAppConfig {
  return {
    verifyToken: process.env.WHATSAPP_VERIFY_TOKEN,
    appSecret: process.env.META_APP_SECRET,
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID,
    apiVersion: 'v21.0',
  }
}

/**
 * Safely masks a phone number for development logging and diagnostics,
 * ensuring only the trailing 4 digits are revealed.
 * Example: "34600123456" -> "***3456"
 */
export function maskPhoneNumber(phone?: string | null): string {
  if (!phone) return '***'
  const digits = phone.replace(/\D/g, '')
  if (digits.length <= 4) return '***'
  return `***${digits.slice(-4)}`
}

/**
 * Verifies the X-Hub-Signature-256 header sent by Meta using META_APP_SECRET.
 * Uses constant-time buffer comparison to prevent timing attacks.
 *
 * If no app secret is configured, returns true (allows local testing without signature).
 * If app secret is configured, strictly validates the sha256 HMAC signature.
 */
export function verifyMetaSignature(
  rawBody: string,
  signatureHeader: string | null | undefined,
  appSecret: string | undefined
): boolean {
  if (!appSecret) {
    return true
  }

  if (!signatureHeader) {
    return false
  }

  const parts = signatureHeader.split('=')
  if (parts.length !== 2 || parts[0] !== 'sha256') {
    return false
  }

  const providedHash = parts[1].trim()
  if (!providedHash) {
    return false
  }

  try {
    const expectedHash = crypto
      .createHmac('sha256', appSecret)
      .update(rawBody, 'utf8')
      .digest('hex')

    const providedBuffer = Buffer.from(providedHash, 'hex')
    const expectedBuffer = Buffer.from(expectedHash, 'hex')

    if (providedBuffer.length !== expectedBuffer.length) {
      return false
    }

    return crypto.timingSafeEqual(providedBuffer, expectedBuffer)
  } catch {
    return false
  }
}

/**
 * Safely parses a WhatsApp Business Cloud API webhook payload.
 *
 * Requirements:
 * - Validate JSON structure safely.
 * - Ignore unsupported webhook event types (e.g. status updates, media, reactions).
 * - Extract user incoming text messages only with:
 *   sender, messageId, timestamp, textBody.
 */
export function parseWhatsAppWebhookPayload(
  payload: unknown
): ParsedWhatsAppTextMessage[] {
  if (!payload || typeof payload !== 'object') {
    return []
  }

  const data = payload as WhatsAppWebhookPayload
  if (data.object !== 'whatsapp_business_account' || !Array.isArray(data.entry)) {
    return []
  }

  const messages: ParsedWhatsAppTextMessage[] = []

  for (const entry of data.entry) {
    if (!Array.isArray(entry.changes)) continue

    for (const change of entry.changes) {
      // We only handle incoming message events
      if (change.field !== 'messages' || !change.value) continue

      const value = change.value
      const phoneNumberId = value.metadata?.phone_number_id

      // Map sender phone -> profile name if contacts array is present
      const contactNames = new Map<string, string>()
      if (Array.isArray(value.contacts)) {
        for (const contact of value.contacts) {
          if (contact.wa_id && contact.profile?.name) {
            contactNames.set(contact.wa_id, contact.profile.name)
          }
        }
      }

      // Safe check: ignore status updates or empty messages array
      if (!Array.isArray(value.messages)) continue

      for (const msg of value.messages) {
        // Phase 1: Only text messages are supported; other media types are safely ignored
        if (msg.type !== 'text' || !msg.text?.body) {
          continue
        }

        const sender = msg.from
        const messageId = msg.id
        const timestamp = msg.timestamp
        const textBody = msg.text.body.trim()

        if (!sender || !messageId || !timestamp || !textBody) {
          continue
        }

        messages.push({
          sender,
          messageId,
          timestamp,
          textBody,
          senderName: contactNames.get(sender),
          phoneNumberId,
        })
      }
    }
  }

  return messages
}

/**
 * Returns the base Meta Graph API messages endpoint for future phases.
 * (Foundation only - no messages are sent in Phase 1).
 */
export function getWhatsAppMessagesEndpoint(phoneNumberId?: string): string {
  const config = getWhatsAppConfig()
  const id = phoneNumberId || config.phoneNumberId
  if (!id) {
    throw new Error('WHATSAPP_PHONE_NUMBER_ID is not configured')
  }
  return `https://graph.facebook.com/${config.apiVersion}/${id}/messages`
}
