import { NextResponse } from 'next/server'
import {
  getWhatsAppConfig,
  maskPhoneNumber,
  parseWhatsAppWebhookPayload,
  verifyMetaSignature,
} from '@/lib/whatsapp/cloud-api'
import {
  detectWhatsAppIntent,
  generateWhatsAppResponse,
  isInterpretationUncertain,
  parseBatteryPreferences,
  parseBudgetValue,
  parseModelFamily,
  parseStorageValue,
  type WhatsAppConversationState,
} from '@/lib/whatsapp/assistant'
import { understandWhatsAppMessageWithAi } from '@/lib/whatsapp/ai-understanding'
import {
  clearConversationState,
  deriveWhatsAppSenderKey,
  getConversationState,
  saveConversationState,
} from '@/lib/whatsapp/conversation-store'
import {
  getActiveIphoneModels,
  resolveWhatsAppStock,
  type BuyingPreferences,
  type WhatsAppStockContext,
} from '@/lib/whatsapp/stock'

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
 * Processing flow:
 * - Verifies Meta signature (X-Hub-Signature-256) when META_APP_SECRET is configured.
 * - Safely parses JSON payloads.
 * - Ignores unsupported webhook event types (status updates, media, reactions).
 * - Extracts incoming user text messages (sender, messageId, timestamp, textBody).
 * - Derives deterministic, non-reversible HMAC-SHA256 sender_key.
 * - Loads persisted structured conversation state (with 24h inactivity expiration).
 * - Runs deterministic parser first; falls back to AI understanding only when needed.
 * - Resolves real public stock when required.
 * - Generates deterministic final assistant response and persists updated conversationState.
 * - Acknowledges receipt quickly with HTTP 200.
 * - Does NOT send automatic replies via Meta transport (outbound Meta sending remains disabled).
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
  if (incomingMessages.length === 0) {
    return NextResponse.json({ received: true }, { status: 200 })
  }

  // Pre-fetch active models once for the incoming batch
  const activeModels = await getActiveIphoneModels()

  // 4. Process each incoming message through the multi-turn assistant pipeline
  for (const msg of incomingMessages) {
    const cleanText = msg.textBody.trim()
    if (!cleanText) continue

    // 4.1 Derive privacy-safe sender key & load persisted conversation state
    const senderKey = deriveWhatsAppSenderKey(msg.sender)
    const currentState: WhatsAppConversationState = senderKey
      ? await getConversationState(senderKey)
      : { flow: 'none' }

    // 4.2 Deterministic intent & buying preference checks
    const intent = detectWhatsAppIntent(cleanText)
    const isAwaitingBudget =
      currentState.flow === 'buying' && currentState.awaitingField === 'maxBudget'
    const isAwaitingModel =
      currentState.flow === 'buying' && currentState.awaitingField === 'model'

    const budget = parseBudgetValue(cleanText, isAwaitingBudget)
    const family = parseModelFamily(cleanText)
    const storage = parseStorageValue(cleanText)
    const battery = parseBatteryPreferences(cleanText)

    const currentBuyingPrefs: BuyingPreferences = {
      ...(currentState.buying || {}),
    }
    if (budget.maxBudget != null) currentBuyingPrefs.maxBudget = budget.maxBudget
    if (budget.minBudget != null) currentBuyingPrefs.minBudget = budget.minBudget
    if (family) currentBuyingPrefs.modelFamily = family
    if (storage) currentBuyingPrefs.storage = storage
    if (battery.minBatteryHealth != null) {
      currentBuyingPrefs.minBatteryHealth = battery.minBatteryHealth
    }
    if (battery.bestBattery) currentBuyingPrefs.bestBattery = battery.bestBattery

    const hasPreferences =
      currentBuyingPrefs.maxBudget != null ||
      currentBuyingPrefs.minBudget != null ||
      currentBuyingPrefs.storage != null ||
      currentBuyingPrefs.modelFamily != null ||
      currentBuyingPrefs.minBatteryHealth != null ||
      currentBuyingPrefs.bestBattery != null ||
      currentBuyingPrefs.model != null

    // 4.3 Resolve real stock when required by deterministic intent or active flow
    let stockContext: WhatsAppStockContext | undefined
    if (
      intent === 'available_stock' ||
      intent === 'buying_iphone' ||
      isAwaitingBudget ||
      isAwaitingModel ||
      hasPreferences
    ) {
      try {
        stockContext = await resolveWhatsAppStock(
          cleanText,
          hasPreferences ? currentBuyingPrefs : undefined
        )
      } catch {
        if (process.env.NODE_ENV !== 'production') {
          console.error('[WhatsApp Webhook] Error resolving stock for message')
        }
      }
    }

    // 4.4 Run deterministic assistant engine first
    let assistantResult = generateWhatsAppResponse({
      text: cleanText,
      senderName: msg.senderName,
      stockContext,
      conversationState: currentState,
      activeModels,
    })

    // 4.5 AI Understanding Fallback only when deterministic interpretation is uncertain
    if (isInterpretationUncertain(assistantResult.reason)) {
      try {
        const aiResult = await understandWhatsAppMessageWithAi({
          text: cleanText,
          currentFlow: currentState.flow,
          awaitingField: currentState.awaitingField,
          activeModels,
        })

        if (aiResult.used && aiResult.validated) {
          const aiPrefs: BuyingPreferences = {
            ...currentBuyingPrefs,
            model: aiResult.validated.model ?? currentBuyingPrefs.model ?? null,
            maxBudget: aiResult.validated.maxBudget ?? currentBuyingPrefs.maxBudget ?? null,
            minBudget: aiResult.validated.minBudget ?? currentBuyingPrefs.minBudget ?? null,
            modelFamily: aiResult.validated.modelFamily ?? currentBuyingPrefs.modelFamily ?? null,
            storage: aiResult.validated.storage ?? currentBuyingPrefs.storage ?? null,
            minBatteryHealth:
              aiResult.validated.minBatteryHealth ?? currentBuyingPrefs.minBatteryHealth ?? null,
            bestBattery: aiResult.validated.bestBattery ?? currentBuyingPrefs.bestBattery ?? null,
          }

          const hasAiPrefs =
            aiPrefs.maxBudget != null ||
            aiPrefs.minBudget != null ||
            aiPrefs.storage != null ||
            aiPrefs.modelFamily != null ||
            aiPrefs.minBatteryHealth != null ||
            aiPrefs.bestBattery != null ||
            aiPrefs.model != null

          if (
            hasAiPrefs ||
            aiResult.validated.intent === 'buying' ||
            aiResult.validated.intent === 'stock' ||
            currentState.flow === 'buying'
          ) {
            try {
              stockContext = await resolveWhatsAppStock(
                cleanText,
                hasAiPrefs ? aiPrefs : undefined
              )
            } catch {
              if (process.env.NODE_ENV !== 'production') {
                console.error('[WhatsApp Webhook] Error resolving stock for AI extraction')
              }
            }
          }

          // Re-run deterministic response generator with validated AI extraction
          assistantResult = generateWhatsAppResponse({
            text: cleanText,
            senderName: msg.senderName,
            stockContext,
            conversationState: currentState,
            activeModels,
            aiExtraction: aiResult.validated,
          })
        }
      } catch {
        if (process.env.NODE_ENV !== 'production') {
          console.error('[WhatsApp Webhook] Error in AI understanding fallback')
        }
      }
    }

    // 4.6 Persist returned conversationState (or reset state when conversation_reset)
    if (senderKey) {
      if (assistantResult.reason === 'conversation_reset') {
        await clearConversationState(senderKey)
      } else {
        await saveConversationState(
          senderKey,
          assistantResult.conversationState ?? currentState
        )
      }
    }

    // Safe development logging: never logs raw sender, sender_key, conversation_state, secrets, or message text
    if (process.env.NODE_ENV !== 'production') {
      console.log('[WhatsApp Webhook] Assistant processed incoming message', {
        action: assistantResult.action,
        reason: assistantResult.reason,
        maskedSender: maskPhoneNumber(msg.sender),
        messageId: msg.messageId,
        stockCount: stockContext?.devices?.length,
      })
    }

    // IMPORTANT: Automatic outbound replies via Meta remain disabled.
  }

  // 5. Acknowledge receipt quickly to Meta with HTTP 200
  return NextResponse.json({ received: true }, { status: 200 })
}
