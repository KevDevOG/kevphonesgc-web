import { NextResponse } from 'next/server'
import {
  getWhatsAppConfig,
  maskPhoneNumber,
  parseWhatsAppWebhookPayload,
  verifyMetaSignature,
} from '@/lib/whatsapp/cloud-api'

/**
 * GET /api/webhooks/whatsapp
 *
 * Implements Meta Webhook Verification for WhatsApp Business Cloud API.
 * Query Parameters:
 * - hub.mode: 'subscribe'
 * - hub.verify_token: Token configured in Meta App dashboard
 * - hub.challenge: Challenge string to echo back
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const mode = searchParams.get('hub.mode')
  const verifyToken = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  const { verifyToken: expectedToken } = getWhatsAppConfig()

  if (
    mode === 'subscribe' &&
    verifyToken &&
    expectedToken &&
    verifyToken === expectedToken
  ) {
    // Return the hub.challenge string verbatim with HTTP 200
    return new Response(challenge ?? '', {
      status: 200,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  }

  // Never expose the verify token or internal error details
  return new Response('Forbidden', { status: 403 })
}

/**
 * POST /api/webhooks/whatsapp
 *
 * Receives incoming WhatsApp Business Cloud API webhook events.
 *
 * Phase 1:
 * - Verifies Meta signature (X-Hub-Signature-256) when META_APP_SECRET is configured.
 * - Safely parses JSON payloads.
 * - Acknowledges receipt quickly with HTTP 200.
 * - Ignores unsupported webhook event types (status updates, media, reactions).
 * - Extracts incoming user text messages (sender, messageId, timestamp, textBody).
 * - Masks sensitive phone numbers in development logs.
 * - Does NOT send automatic replies or persist conversations.
 */
export async function POST(request: Request) {
  let rawBody: string
  try {
    rawBody = await request.text()
  } catch {
    return NextResponse.json({ error: 'Unable to read request body' }, { status: 400 })
  }

  // 1. Verify Meta webhook signature if META_APP_SECRET is configured
  const { appSecret } = getWhatsAppConfig()
  const signatureHeader = request.headers.get('x-hub-signature-256')

  if (appSecret) {
    const isAuthentic = verifyMetaSignature(rawBody, signatureHeader, appSecret)
    if (!isAuthentic) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[WhatsApp Webhook] Signature verification failed')
      }
      return new Response('Unauthorized', { status: 401 })
    }
  }

  // 2. Parse JSON safely
  let payload: unknown
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 })
  }

  // 3. Extract incoming text messages (safely ignoring unsupported events)
  const incomingMessages = parseWhatsAppWebhookPayload(payload)

  // 4. Safe development logging (only masked sender, message ID, event type)
  if (process.env.NODE_ENV !== 'production') {
    for (const msg of incomingMessages) {
      console.log('[WhatsApp Webhook] Incoming message parsed', {
        eventType: 'text_message',
        maskedSender: maskPhoneNumber(msg.sender),
        messageId: msg.messageId,
      })
    }
  }

  // 5. Acknowledge receipt quickly to Meta with HTTP 200
  // (Do NOT send automatic replies or persist conversations in Phase 1)
  return NextResponse.json({ received: true }, { status: 200 })
}
