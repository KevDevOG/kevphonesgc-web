import { track } from '@vercel/analytics'

/**
 * Safe analytics helper wrapping @vercel/analytics track().
 * Ensures tracking never throws or interferes with user interactions.
 */
function safeTrack(name: string, properties?: Record<string, string | number | boolean | null>) {
  try {
    track(name, properties)
  } catch {
    // Analytics failures must fail silently without blocking UX
  }
}

/**
 * 1. product_view: Fires when a visitor intentionally opens/views product detail.
 * Max 2 safe properties: model, category.
 */
export function trackProductView(properties: { model: string; category?: string }) {
  safeTrack('product_view', {
    model: properties.model.slice(0, 60),
    ...(properties.category ? { category: properties.category.slice(0, 30) } : {})
  })
}

/**
 * 2. whatsapp_click: Fires on public WhatsApp CTA clicks.
 * Safe property: source ('product' | 'footer' | etc.)
 */
export function trackWhatsappClick(source: string) {
  safeTrack('whatsapp_click', {
    source: source.slice(0, 30)
  })
}

/**
 * 3. quote_started: Fires once when the user begins interacting with the quote flow.
 */
export function trackQuoteStarted() {
  safeTrack('quote_started')
}

/**
 * 4. quote_completed: Fires only after a quote calculation succeeds.
 * Safe property: model
 */
export function trackQuoteCompleted(properties?: { model?: string }) {
  safeTrack('quote_completed', {
    ...(properties?.model ? { model: properties.model.slice(0, 60) } : {})
  })
}

/**
 * 5. sale_request_started: Fires when the visitor meaningfully advances the /vender flow.
 */
export function trackSaleRequestStarted() {
  safeTrack('sale_request_started')
}

/**
 * 6. sale_request_submitted: Fires only after the sale request is successfully created and finalized.
 */
export function trackSaleRequestSubmitted() {
  safeTrack('sale_request_submitted')
}

/**
 * 7. wanted_request_submitted: Fires when a public wanted-device request is submitted.
 * Safe property: source ('home' | 'stock' | 'iphone_stock')
 */
export function trackWantedRequestSubmitted(source: 'home' | 'stock' | 'iphone_stock') {
  safeTrack('wanted_request_submitted', { source })
}

