import { StoryImageOption } from './story-image-resolver'

export type StoryTemplate = 'disponible' | 'oferta'

export interface StoryRenderOptions {
  template: StoryTemplate
  modelName: string
  storage: string | null
  color: string | null
  condition: string // 'sealed' | 'like_new' | 'good' | 'marked'
  batteryHealth: number | null
  batteryCycles: number | null
  hasBox: boolean
  hasCable: boolean
  hasInvoice: boolean
  fullyFunctional?: boolean
  warrantyUntil?: string | null
  listingPrice: number
  discountPrice?: number | null
  customBadgeText?: string
  customPriceOverride?: number | null
  activeImage: StoryImageOption
}

const LILAC = '#c084fc'
const LILAC_SOFT = '#d7baff'
const PURPLE = '#7a32d4'
const LOGO_URL = '/brand/kevphonesgc-logo.PNG'

const TEMPLATE_BADGES: Record<StoryTemplate, string> = {
  disponible: '¡DISPONIBLE AHORA!',
  oferta: '¡OFERTA!'
}

/**
 * Resolves the project's own font (Geist, loaded via next/font) so the canvas
 * uses the same typeface as the rest of the app. Falls back to system fonts.
 */
async function resolveFontFamily(): Promise<string> {
  const fallback = 'system-ui, -apple-system, "Helvetica Neue", Arial, sans-serif'
  if (typeof document === 'undefined') return fallback
  try {
    const raw = getComputedStyle(document.documentElement).getPropertyValue('--font-geist-sans').trim()
    const family = raw ? `${raw}, ${fallback}` : fallback
    if (document.fonts && document.fonts.load) {
      await Promise.all([
        document.fonts.load(`900 64px ${family}`),
        document.fonts.load(`800 24px ${family}`)
      ])
    }
    return family
  } catch {
    return fallback
  }
}

/**
 * Loads an image safely with anonymous CORS and fallback blob fetching
 */
async function loadSafeImage(url: string): Promise<HTMLImageElement | null> {
  try {
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image()
      el.crossOrigin = 'anonymous'
      el.onload = () => resolve(el)
      el.onerror = reject
      el.src = url
    })
  } catch {
    try {
      const res = await fetch(url)
      if (res.ok) {
        const blob = await res.blob()
        const objectUrl = URL.createObjectURL(blob)
        return await new Promise<HTMLImageElement>((resolve, reject) => {
          const el = new Image()
          el.onload = () => {
            URL.revokeObjectURL(objectUrl)
            resolve(el)
          }
          el.onerror = reject
          el.src = objectUrl
        })
      }
    } catch {
      // Image load failed
    }
  }
  return null
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.lineTo(x + width - radius, y)
  ctx.arcTo(x + width, y, x + width, y + radius, radius)
  ctx.lineTo(x + width, y + height - radius)
  ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius)
  ctx.lineTo(x + radius, y + height)
  ctx.arcTo(x, y + height, x, y + height - radius, radius)
  ctx.lineTo(x, y + radius)
  ctx.arcTo(x, y, x + radius, y, radius)
  ctx.closePath()
}

function formatEuro(amount: number): string {
  const isWhole = amount % 1 === 0
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: isWhole ? 0 : 2,
    maximumFractionDigits: 2,
    useGrouping: 'min2'
  } as Intl.NumberFormatOptions).format(amount)
}

/** Tight, poster-like tracking when supported by the browser canvas. */
function setTracking(ctx: CanvasRenderingContext2D, px: number) {
  try {
    ;(ctx as unknown as { letterSpacing: string }).letterSpacing = `${px}px`
  } catch {
    // unsupported: ignore
  }
}

/** Largest font size (<= max) at which the text fits in maxWidth. */
function fitFontSize(
  ctx: CanvasRenderingContext2D,
  text: string,
  weight: number,
  family: string,
  maxSize: number,
  minSize: number,
  maxWidth: number
): number {
  let size = maxSize
  while (size > minSize) {
    ctx.font = `${weight} ${size}px ${family}`
    if (ctx.measureText(text).width <= maxWidth) return size
    size -= 2
  }
  return minSize
}

/** Neutral placeholder when no catalog/real image exists. Never an invented phone. */
function drawNeutralPlaceholder(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  modelName: string,
  color: string,
  family: string
) {
  ctx.save()
  const cx = x + w / 2
  const cy = y + h / 2
  const bw = w * 0.9
  const bh = Math.min(h, 360)
  drawRoundedRect(ctx, cx - bw / 2, cy - bh / 2, bw, bh, 24)
  ctx.fillStyle = 'rgba(18, 16, 26, 0.88)'
  ctx.fill()
  ctx.lineWidth = 2
  ctx.strokeStyle = 'rgba(192, 132, 252, 0.3)'
  ctx.stroke()

  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  setTracking(ctx, 0)
  ctx.fillStyle = '#FFFFFF'
  ctx.font = `900 30px ${family}`
  ctx.fillText(modelName.toUpperCase(), cx, cy - 14, bw - 30)
  if (color) {
    ctx.fillStyle = LILAC
    ctx.font = `800 24px ${family}`
    ctx.fillText(color.toUpperCase(), cx, cy + 28, bw - 30)
  }
  ctx.fillStyle = 'rgba(255, 255, 255, 0.45)'
  ctx.font = `600 16px ${family}`
  ctx.fillText('Fotografía disponible bajo consulta', cx, cy + 70, bw - 30)
  ctx.restore()
}

interface SpecCard {
  icon: string
  label: string
  value: string
  secondary?: string
}

/** Splits text into two balanced lines at a word boundary. */
function splitTwoLines(text: string): [string, string] | null {
  const words = text.split(' ')
  if (words.length < 2) return null
  let best: [string, string] | null = null
  let bestDiff = Infinity
  for (let i = 1; i < words.length; i++) {
    const a = words.slice(0, i).join(' ')
    const b = words.slice(i).join(' ')
    const diff = Math.abs(a.length - b.length)
    if (diff < bestDiff) {
      bestDiff = diff
      best = [a, b]
    }
  }
  return best
}

/**
 * KevPhonesGC Story renderer (1080x1920).
 * Poster layout: logo → badge → huge model → huge color → [product | cards] → price → footer.
 */
export async function renderStoryToCanvas(
  canvas: HTMLCanvasElement,
  options: StoryRenderOptions
): Promise<void> {
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const W = 1080
  const H = 1920
  canvas.width = W
  canvas.height = H

  const family = await resolveFontFamily()
  const isSealed = options.condition === 'sealed'
  const isOffer = options.template === 'oferta'

  const [productImg, logoImg] = await Promise.all([
    options.activeImage.url ? loadSafeImage(options.activeImage.url) : Promise.resolve(null),
    loadSafeImage(LOGO_URL)
  ])

  const MARGIN = 44
  const CONTENT_W = W - MARGIN * 2

  // ---------- BACKGROUND ----------
  ctx.fillStyle = '#030204'
  ctx.fillRect(0, 0, W, H)

  const topGlow = ctx.createRadialGradient(W / 2, 120, 10, W / 2, 120, 520)
  topGlow.addColorStop(0, 'rgba(122, 50, 212, 0.28)')
  topGlow.addColorStop(1, 'rgba(0, 0, 0, 0)')
  ctx.fillStyle = topGlow
  ctx.fillRect(0, 0, W, 640)

  // ---------- HEADER: LOGO LOCKUP ----------
  const logoH = 104
  const logoSrc = { sx: 395, sy: 215, sw: 510, sh: 800 } // crop of the real asset's visible mark
  const logoW = logoImg ? (logoSrc.sw / logoSrc.sh) * logoH : 0
  const logoY = 52

  ctx.save()
  ctx.textBaseline = 'middle'
  ctx.textAlign = 'left'
  setTracking(ctx, -1.5)
  ctx.font = `900 54px ${family}`
  const kevW = ctx.measureText('KEVPHONES').width
  const gcW = ctx.measureText('GC').width
  const textW = kevW + gcW
  const gap = logoImg ? 18 : 0
  const lockupW = logoW + gap + textW
  const lockupX = (W - lockupW) / 2
  const midY = logoY + logoH / 2

  if (logoImg) {
    ctx.save()
    // The asset sits on pure black: 'lighter' blends it seamlessly into the dark background
    ctx.globalCompositeOperation = 'lighter'
    ctx.drawImage(logoImg, logoSrc.sx, logoSrc.sy, logoSrc.sw, logoSrc.sh, lockupX, logoY, logoW, logoH)
    ctx.restore()
  }

  const textX = lockupX + logoW + gap
  ctx.fillStyle = '#FFFFFF'
  ctx.fillText('KEVPHONES', textX, midY + 2)
  ctx.fillStyle = LILAC
  ctx.shadowColor = 'rgba(168, 85, 247, 0.65)'
  ctx.shadowBlur = 18
  ctx.fillText('GC', textX + kevW, midY + 2)
  ctx.restore()

  // ---------- BADGE PILL ----------
  const badgeText = (options.customBadgeText && options.customBadgeText.trim()) || TEMPLATE_BADGES[options.template]
  ctx.save()
  setTracking(ctx, 1)
  ctx.font = `900 24px ${family}`
  const badgeW = Math.max(300, ctx.measureText(badgeText).width + 72)
  const badgeH = 52
  const badgeX = (W - badgeW) / 2
  const badgeY = logoY + logoH + 16

  drawRoundedRect(ctx, badgeX, badgeY, badgeW, badgeH, badgeH / 2)
  ctx.fillStyle = 'rgba(122, 50, 212, 0.18)'
  ctx.fill()
  ctx.shadowColor = LILAC
  ctx.shadowBlur = 18
  ctx.lineWidth = 2.5
  ctx.strokeStyle = LILAC
  ctx.stroke()
  ctx.shadowBlur = 0
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = '#FFFFFF'
  ctx.fillText(badgeText, W / 2, badgeY + badgeH / 2 + 1)
  ctx.restore()

  // ---------- TITLE: MODEL + COLOR ----------
  let cursorY = badgeY + badgeH + 30

  // Model
  const modelText = options.modelName.toUpperCase()
  ctx.save()
  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'
  setTracking(ctx, -3)
  const modelSize = fitFontSize(ctx, modelText, 900, family, 124, 58, CONTENT_W)
  ctx.font = `900 ${modelSize}px ${family}`
  const modelBaseline = cursorY + modelSize * 0.78
  ctx.shadowColor = 'rgba(0, 0, 0, 0.9)'
  ctx.shadowBlur = 22
  ctx.shadowOffsetY = 6
  ctx.fillStyle = '#FFFFFF'
  ctx.fillText(modelText, W / 2, modelBaseline)
  ctx.restore()
  cursorY = modelBaseline

  // Color (huge purple second headline, English, uppercase)
  const colorText = (options.color || '').trim().toUpperCase()
  if (colorText) {
    ctx.save()
    ctx.textAlign = 'center'
    ctx.textBaseline = 'alphabetic'
    setTracking(ctx, -4)
    const colorSize = fitFontSize(ctx, colorText, 900, family, 168, 70, CONTENT_W)
    ctx.font = `900 ${colorSize}px ${family}`
    const colorBaseline = cursorY + 12 + colorSize * 0.74
    const colorGrad = ctx.createLinearGradient(0, colorBaseline - colorSize * 0.74, 0, colorBaseline)
    colorGrad.addColorStop(0, '#d7baff')
    colorGrad.addColorStop(1, '#a855f7')
    ctx.fillStyle = colorGrad
    ctx.shadowColor = 'rgba(168, 85, 247, 0.55)'
    ctx.shadowBlur = 30
    ctx.fillText(colorText, W / 2, colorBaseline)
    ctx.restore()
    cursorY = colorBaseline
  }

  // ---------- VERTICAL BUDGET ----------
  const footerH = 84
  const footerY = 1830 - footerH
  const priceH = 214
  const priceGap = 20
  const priceY = footerY - 16 - priceH
  const centralTop = cursorY + 30
  const centralBottom = priceY - priceGap
  const centralH = centralBottom - centralTop

  // ---------- SPEC CARDS DATA ----------
  const cards: SpecCard[] = []

  if (options.storage && options.storage.trim()) {
    cards.push({ icon: '💾', label: 'ALMACENAMIENTO', value: options.storage.trim().toUpperCase() })
  }

  if (isSealed) {
    cards.push({ icon: '🛡️', label: 'ESTADO', value: 'PRECINTADO' })
  } else if (options.batteryHealth && options.batteryHealth > 0) {
    cards.push({
      icon: '🔋',
      label: 'SALUD DE BATERÍA',
      value: `${options.batteryHealth}%`,
      secondary: options.batteryCycles && options.batteryCycles > 0 ? `${options.batteryCycles} CICLOS` : undefined
    })
  }

  const conditionValue =
    isSealed ? 'PRECINTADO'
    : options.condition === 'like_new' ? 'COMO NUEVO'
    : options.condition === 'good' ? 'BUEN ESTADO'
    : options.condition === 'marked' ? 'CON MARCAS'
    : ''
  if (conditionValue) {
    cards.push({
      icon: '✅',
      label: 'REVISADO',
      value: conditionValue,
      secondary: options.fullyFunctional === true ? 'PERFECTO FUNCIONAMIENTO' : undefined
    })
  }

  const cosmetic =
    isSealed ? { v: 'NUEVO', s: undefined }
    : options.condition === 'like_new' ? { v: 'IMPOLUTO', s: 'SIN MARCAS DE USO' }
    : options.condition === 'good' ? { v: 'BUEN ESTADO', s: 'SIGNOS NORMALES DE USO' }
    : options.condition === 'marked' ? { v: 'CON MARCAS', s: undefined }
    : null
  if (cosmetic) {
    cards.push({ icon: '✨', label: 'DETALLES ESTÉTICOS', value: cosmetic.v, secondary: cosmetic.s })
  }

  const accessories =
    options.hasBox && options.hasCable ? 'CON CAJA Y CABLE'
    : options.hasBox ? 'CON CAJA'
    : options.hasCable ? 'CON CABLE'
    : 'SOLO DISPOSITIVO'
  cards.push({ icon: '📦', label: 'ACCESORIOS', value: accessories })

  // ---------- CENTRAL BLOCK: PRODUCT (LEFT ~53%) | CARDS (RIGHT ~47%) ----------
  const colGap = 18
  const leftW = Math.round((CONTENT_W - colGap) * 0.53)
  const rightW = CONTENT_W - colGap - leftW
  const leftX = MARGIN
  const rightX = MARGIN + leftW + colGap

  // Backlight behind product
  const glowCx = leftX + leftW / 2
  const glowCy = centralTop + centralH / 2
  const stage = ctx.createRadialGradient(glowCx, glowCy, 30, glowCx, glowCy, Math.max(leftW, centralH) * 0.62)
  stage.addColorStop(0, 'rgba(147, 51, 234, 0.42)')
  stage.addColorStop(0.55, 'rgba(122, 50, 212, 0.14)')
  stage.addColorStop(1, 'rgba(0, 0, 0, 0)')
  ctx.fillStyle = stage
  ctx.fillRect(0, centralTop - 60, rightX, centralH + 120)

  if (productImg) {
    ctx.save()
    // Allow the product to bleed slightly into the column gap; aspect ratio always preserved
    const boxW = leftW + colGap - 4
    const boxH = centralH
    const aspect = productImg.naturalWidth / productImg.naturalHeight
    let rw = boxW
    let rh = rw / aspect
    if (rh > boxH) {
      rh = boxH
      rw = rh * aspect
    }
    const ix = leftX + (boxW - rw) / 2
    const iy = centralTop + (boxH - rh) / 2
    ctx.shadowColor = 'rgba(0, 0, 0, 0.75)'
    ctx.shadowBlur = 40
    ctx.shadowOffsetY = 22
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(productImg, ix, iy, rw, rh)
    ctx.restore()
  } else {
    drawNeutralPlaceholder(ctx, leftX, centralTop, leftW, centralH, options.modelName, options.color || '', family)
  }

  // Cards
  const cardGap = 16
  const cardH = Math.min(230, (centralH - cardGap * (cards.length - 1)) / cards.length)
  const stackH = cardH * cards.length + cardGap * (cards.length - 1)
  const stackTop = centralTop + (centralH - stackH) / 2

  const iconD = 72
  const padL = 26
  const textX0 = rightX + padL + iconD + 18
  const textMaxW = rightX + rightW - 18 - textX0

  cards.forEach((card, idx) => {
    const cy0 = stackTop + idx * (cardH + cardGap)

    // Panel
    ctx.save()
    drawRoundedRect(ctx, rightX, cy0, rightW, cardH, 24)
    const panel = ctx.createLinearGradient(rightX, cy0, rightX + rightW, cy0 + cardH)
    panel.addColorStop(0, 'rgba(34, 20, 58, 0.92)')
    panel.addColorStop(1, 'rgba(12, 9, 20, 0.95)')
    ctx.fillStyle = panel
    ctx.fill()
    ctx.shadowColor = 'rgba(168, 85, 247, 0.45)'
    ctx.shadowBlur = 16
    ctx.lineWidth = 2.5
    ctx.strokeStyle = 'rgba(192, 132, 252, 0.55)'
    ctx.stroke()
    ctx.restore()

    // Purple accent line (left edge)
    ctx.save()
    drawRoundedRect(ctx, rightX + 10, cy0 + 22, 6, cardH - 44, 3)
    ctx.fillStyle = LILAC
    ctx.shadowColor = LILAC
    ctx.shadowBlur = 12
    ctx.fill()
    ctx.restore()

    // Icon
    const iconX = rightX + padL
    const iconY = cy0 + (cardH - iconD) / 2
    ctx.save()
    ctx.beginPath()
    ctx.arc(iconX + iconD / 2, iconY + iconD / 2, iconD / 2, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(122, 50, 212, 0.35)'
    ctx.fill()
    ctx.lineWidth = 2
    ctx.strokeStyle = 'rgba(215, 186, 255, 0.55)'
    ctx.stroke()
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    setTracking(ctx, 0)
    ctx.font = `700 36px ${family}`
    ctx.fillStyle = '#FFFFFF'
    ctx.fillText(card.icon, iconX + iconD / 2, iconY + iconD / 2 + 2)
    ctx.restore()

    // Text group, vertically centered in the card
    ctx.save()
    ctx.textAlign = 'left'
    ctx.textBaseline = 'alphabetic'

    const labelSize = 20
    const secSize = 20

    // Choose value layout: single line (large) or two lines
    let lines: string[] = [card.value]
    let valSize = 0
    setTracking(ctx, -1)
    const single = fitFontSize(ctx, card.value, 900, family, 66, 40, textMaxW)
    ctx.font = `900 ${single}px ${family}`
    if (ctx.measureText(card.value).width <= textMaxW) {
      valSize = single
    } else {
      const split = splitTwoLines(card.value)
      if (split) {
        const widest = split[0].length >= split[1].length ? split[0] : split[1]
        const two = fitFontSize(ctx, widest, 900, family, 54, 28, textMaxW)
        lines = split
        valSize = two
      } else {
        valSize = fitFontSize(ctx, card.value, 900, family, 40, 24, textMaxW)
      }
    }

    const lineH = valSize * 1.04
    const valueBlockH = lines.length * lineH
    const secBlockH = card.secondary ? secSize + 8 : 0
    const totalH = labelSize + 10 + valueBlockH + secBlockH
    let ty = cy0 + (cardH - totalH) / 2

    // Label
    setTracking(ctx, 1.2)
    ctx.font = `800 ${labelSize}px ${family}`
    ctx.fillStyle = LILAC
    ctx.fillText(card.label, textX0, ty + labelSize * 0.82, textMaxW + 10)
    ty += labelSize + 10

    // Value
    setTracking(ctx, -1.5)
    ctx.font = `900 ${valSize}px ${family}`
    ctx.fillStyle = '#FFFFFF'
    lines.forEach((ln, i) => {
      ctx.fillText(ln, textX0, ty + valSize * 0.82 + i * lineH, textMaxW + 10)
    })
    ty += valueBlockH

    // Optional secondary (only when supported by data)
    if (card.secondary) {
      setTracking(ctx, 0.8)
      ctx.font = `700 ${secSize}px ${family}`
      ctx.fillStyle = 'rgba(215, 186, 255, 0.78)'
      ctx.fillText(card.secondary, textX0, ty + 8 + secSize * 0.8, textMaxW + 10)
    }
    ctx.restore()
  })

  // ---------- PRICE (FULL WIDTH) ----------
  const currentPrice = options.customPriceOverride ?? (options.discountPrice ?? options.listingPrice)
  const hasRealDiscount = Boolean(options.discountPrice && options.discountPrice < options.listingPrice)

  ctx.save()
  drawRoundedRect(ctx, MARGIN, priceY, CONTENT_W, priceH, 30)
  const priceBg = ctx.createLinearGradient(MARGIN, priceY, MARGIN + CONTENT_W, priceY + priceH)
  priceBg.addColorStop(0, 'rgba(58, 28, 104, 0.95)')
  priceBg.addColorStop(0.55, 'rgba(24, 14, 42, 0.96)')
  priceBg.addColorStop(1, 'rgba(40, 20, 74, 0.95)')
  ctx.fillStyle = priceBg
  ctx.fill()
  ctx.shadowColor = 'rgba(168, 85, 247, ' + (isOffer ? '0.8' : '0.5') + ')'
  ctx.shadowBlur = isOffer ? 34 : 22
  ctx.lineWidth = isOffer ? 4 : 3
  ctx.strokeStyle = isOffer ? LILAC_SOFT : LILAC
  ctx.stroke()
  ctx.restore()

  const priceText = formatEuro(currentPrice)

  if (isOffer && hasRealDiscount) {
    const oldText = `ANTES ${formatEuro(options.listingPrice)}`

    ctx.save()
    ctx.textAlign = 'left'
    ctx.textBaseline = 'alphabetic'
    setTracking(ctx, -1)
    const oldSize = 38
    ctx.font = `800 ${oldSize}px ${family}`
    const oldW = ctx.measureText(oldText).width
    const oldX = MARGIN + 44
    const oldBase = priceY + 98
    ctx.fillStyle = 'rgba(255, 255, 255, 0.62)'
    ctx.fillText(oldText, oldX, oldBase)
    // strike-through
    ctx.lineWidth = 4
    ctx.strokeStyle = '#FFFFFF'
    ctx.beginPath()
    ctx.moveTo(oldX - 6, oldBase - oldSize * 0.32)
    ctx.lineTo(oldX + oldW + 6, oldBase - oldSize * 0.32)
    ctx.stroke()

    setTracking(ctx, 2)
    ctx.font = `900 34px ${family}`
    ctx.fillStyle = LILAC
    ctx.shadowColor = 'rgba(168, 85, 247, 0.7)'
    ctx.shadowBlur = 14
    ctx.fillText('OFERTA', oldX, priceY + 154)
    ctx.restore()

    // Offer price, extremely prominent, right side
    ctx.save()
    ctx.textAlign = 'right'
    ctx.textBaseline = 'alphabetic'
    setTracking(ctx, -5)
    const availW = CONTENT_W - 44 - 44 - oldW - 40
    const pSize = fitFontSize(ctx, priceText, 900, family, 172, 90, availW)
    ctx.font = `900 ${pSize}px ${family}`
    ctx.fillStyle = '#FFFFFF'
    ctx.shadowColor = 'rgba(192, 132, 252, 0.85)'
    ctx.shadowBlur = 34
    ctx.fillText(priceText, MARGIN + CONTENT_W - 44, priceY + priceH / 2 + pSize * 0.36)
    ctx.restore()
  } else {
    const label = isOffer ? 'OFERTA' : 'PRECIO DISPONIBLE'
    ctx.save()
    ctx.textAlign = 'center'
    ctx.textBaseline = 'alphabetic'
    setTracking(ctx, 3)
    ctx.font = `900 30px ${family}`
    ctx.fillStyle = LILAC
    ctx.shadowColor = 'rgba(168, 85, 247, 0.7)'
    ctx.shadowBlur = 14
    ctx.fillText(label, W / 2, priceY + 52)
    ctx.shadowBlur = 0

    setTracking(ctx, -5)
    const pSize = fitFontSize(ctx, priceText, 900, family, 164, 90, CONTENT_W - 100)
    ctx.font = `900 ${pSize}px ${family}`
    ctx.fillStyle = '#FFFFFF'
    ctx.shadowColor = 'rgba(192, 132, 252, 0.8)'
    ctx.shadowBlur = 32
    ctx.fillText(priceText, W / 2, priceY + 52 + 18 + pSize * 0.76)
    ctx.restore()
  }

  // ---------- COMPACT FOOTER ----------
  ctx.save()
  drawRoundedRect(ctx, MARGIN, footerY, CONTENT_W, footerH, 26)
  ctx.fillStyle = 'rgba(14, 10, 24, 0.95)'
  ctx.fill()
  ctx.lineWidth = 2
  ctx.strokeStyle = 'rgba(192, 132, 252, 0.4)'
  ctx.stroke()

  ctx.textBaseline = 'middle'
  setTracking(ctx, -1)
  ctx.font = `900 40px ${family}`
  const preText = 'Disponible en '
  const siteText = 'KevPhones.es'
  const preW = ctx.measureText(preText).width
  const siteW = ctx.measureText(siteText).width
  const startX = (W - (preW + siteW)) / 2
  ctx.textAlign = 'left'
  ctx.fillStyle = '#FFFFFF'
  ctx.fillText(preText, startX, footerY + footerH / 2 + 2)
  ctx.fillStyle = LILAC
  ctx.fillText(siteText, startX + preW, footerY + footerH / 2 + 2)
  ctx.restore()
}
