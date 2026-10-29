'use server'

import { verifyAdmin } from '@/lib/auth/admin'
import {
  detectWhatsAppIntent,
  generateWhatsAppResponse,
  isInterpretationUncertain,
  parseBudgetValue,
  parseModelFamily,
  parseBatteryPreferences,
  parseStorageValue,
  type WhatsAppAssistantAction,
  type WhatsAppConversationState,
} from '@/lib/whatsapp/assistant'
import { understandWhatsAppMessageWithAi } from '@/lib/whatsapp/ai-understanding'
import { sanitizeConversationState } from '@/lib/whatsapp/conversation-store'
import {
  getActiveIphoneModels,
  resolveWhatsAppStock,
  type BuyingPreferences,
  type WhatsAppStockContext,
} from '@/lib/whatsapp/stock'

export interface WhatsAppSimulatorResult {
  success: boolean
  error?: string
  action?: WhatsAppAssistantAction
  reason?: string
  text?: string | null
  stockCount?: number
  matchedModel?: string | null
  conversationState?: WhatsAppConversationState
  appliedPreferences?: BuyingPreferences | null
  aiUsed?: boolean
  aiConfidence?: number | null
}

/**
 * Admin-only server action to simulate the KevPhonesGC WhatsApp assistant.
 * Accepts temporary multi-turn conversation state, sanitizes it, queries real stock,
 * and returns the updated state and response.
 *
 * Architecture:
 * 1. Deterministic reset / handoff / explicit flow commands run first.
 * 2. Deterministic contextual parser runs.
 * 3. If deterministic parsing succeeds, use it directly (AI not used).
 * 4. Only if interpretation is uncertain: calls AI understanding fallback.
 * 5. Validates AI output against real project data (active models, valid storages, conditions, etc.).
 * 6. Passes structured result back into deterministic conversation logic.
 * 7. Deterministic code generates the final response (AI NEVER writes customer reply).
 */
export async function simulateWhatsAppResponseAction(
  text: string,
  senderName?: string,
  conversationState?: WhatsAppConversationState
): Promise<WhatsAppSimulatorResult> {
  // 1. Verify admin using shared authorization helper
  const { isAuthorized } = await verifyAdmin()
  if (!isAuthorized) {
    return { success: false, error: 'No autorizado' }
  }

  const cleanText = (text || '').trim()
  if (!cleanText) {
    return { success: false, error: 'El mensaje no puede estar vacío' }
  }

  // 2. Sanitize incoming conversation state
  const sanitizedState = sanitizeConversationState(conversationState)

  // 3. Fetch real active models from database for strict validation
  const activeModels = await getActiveIphoneModels()

  // 4. Resolve real public stock if intent, follow-up, or preferences expect stock data
  const intent = detectWhatsAppIntent(cleanText)
  const isAwaitingBudget = sanitizedState.flow === 'buying' && sanitizedState.awaitingField === 'maxBudget'
  const isAwaitingModel = sanitizedState.flow === 'buying' && sanitizedState.awaitingField === 'model'

  // Extract deterministic buying preferences from current text and prior conversation state
  const budget = parseBudgetValue(cleanText, isAwaitingBudget)
  const family = parseModelFamily(cleanText)
  const storage = parseStorageValue(cleanText)
  const battery = parseBatteryPreferences(cleanText)

  const currentBuyingPrefs: BuyingPreferences = {
    ...(sanitizedState.buying || {}),
  }
  if (budget.maxBudget != null) currentBuyingPrefs.maxBudget = budget.maxBudget
  if (budget.minBudget != null) currentBuyingPrefs.minBudget = budget.minBudget
  if (family) currentBuyingPrefs.modelFamily = family
  if (storage) currentBuyingPrefs.storage = storage
  if (battery.minBatteryHealth != null) currentBuyingPrefs.minBatteryHealth = battery.minBatteryHealth
  if (battery.bestBattery) currentBuyingPrefs.bestBattery = battery.bestBattery

  const hasPreferences =
    currentBuyingPrefs.maxBudget != null ||
    currentBuyingPrefs.minBudget != null ||
    currentBuyingPrefs.storage != null ||
    currentBuyingPrefs.modelFamily != null ||
    currentBuyingPrefs.minBatteryHealth != null ||
    currentBuyingPrefs.bestBattery != null ||
    currentBuyingPrefs.model != null

  let stockContext: WhatsAppStockContext | undefined
  if (intent === 'available_stock' || intent === 'buying_iphone' || isAwaitingBudget || isAwaitingModel || hasPreferences) {
    try {
      stockContext = await resolveWhatsAppStock(
        cleanText,
        hasPreferences ? currentBuyingPrefs : undefined
      )
    } catch (err) {
      console.error('[WhatsApp Simulator] Error resolving stock:', err)
    }
  }

  // 5. Generate assistant response with contextual memory (Deterministic primary engine)
  let assistantResult = generateWhatsAppResponse({
    text: cleanText,
    senderName: senderName?.trim() || null,
    stockContext,
    conversationState: sanitizedState,
    activeModels,
  })

  let aiUsed = false
  let aiConfidence: number | null = null

  // 6. AI Understanding Fallback: only if deterministic interpretation is uncertain
  if (isInterpretationUncertain(assistantResult.reason)) {
    try {
      const aiResult = await understandWhatsAppMessageWithAi({
        text: cleanText,
        currentFlow: sanitizedState.flow,
        awaitingField: sanitizedState.awaitingField,
        activeModels,
      })

      if (aiResult.used && aiResult.validated) {
        aiUsed = true
        aiConfidence = aiResult.confidence ?? null

        // Merge AI-validated preferences with current state
        const aiPrefs: BuyingPreferences = {
          ...currentBuyingPrefs,
          model: aiResult.validated.model ?? currentBuyingPrefs.model ?? null,
          maxBudget: aiResult.validated.maxBudget ?? currentBuyingPrefs.maxBudget ?? null,
          minBudget: aiResult.validated.minBudget ?? currentBuyingPrefs.minBudget ?? null,
          modelFamily: aiResult.validated.modelFamily ?? currentBuyingPrefs.modelFamily ?? null,
          storage: aiResult.validated.storage ?? currentBuyingPrefs.storage ?? null,
          minBatteryHealth: aiResult.validated.minBatteryHealth ?? currentBuyingPrefs.minBatteryHealth ?? null,
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
          sanitizedState.flow === 'buying'
        ) {
          try {
            stockContext = await resolveWhatsAppStock(
              cleanText,
              hasAiPrefs ? aiPrefs : undefined
            )
          } catch (err) {
            console.error('[WhatsApp Simulator] Error resolving stock for AI extraction:', err)
          }
        }

        // Re-run deterministic response generator with validated AI extraction and updated stock
        assistantResult = generateWhatsAppResponse({
          text: cleanText,
          senderName: senderName?.trim() || null,
          stockContext,
          conversationState: sanitizedState,
          activeModels,
          aiExtraction: aiResult.validated,
        })
      }
    } catch (err) {
      // Failure mode: if AI fails, assistant continues working deterministically without crashing
      console.error('[WhatsApp Simulator] Error in AI understanding fallback:', err)
    }
  }

  // 7. Return response and updated conversation state
  return {
    success: true,
    action: assistantResult.action,
    reason: assistantResult.reason,
    text: assistantResult.text,
    stockCount: stockContext?.devices?.length ?? 0,
    matchedModel: stockContext?.matchedModel?.name ?? null,
    conversationState: assistantResult.conversationState,
    appliedPreferences:
      stockContext?.appliedPreferences ||
      (assistantResult.conversationState?.buying ? assistantResult.conversationState.buying : null),
    aiUsed: assistantResult.aiUsed ?? aiUsed,
    aiConfidence: assistantResult.aiConfidence ?? aiConfidence,
  }
}
