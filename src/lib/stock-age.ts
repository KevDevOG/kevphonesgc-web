export type StockAgeLevel = 'normal' | 'attention' | 'slow' | 'stale'

export interface StockAge {
  days: number
  level: StockAgeLevel
  label: string // e.g. "Hoy", "1 día", "8 días"
  levelLabel: string | null // null for normal, "Atención", "Stock lento", "Stock estancado"
  combinedLabel: string // e.g. "Hoy", "8 días · Atención", "17 días · Stock lento", "35 días · Stock estancado"
  formattedEntryDate?: string // e.g. "19 oct 2026"
}

/**
 * Calculates stock age for an available device given its entry/purchase date.
 * Uses Atlantic/Canary timezone convention for calendar day comparisons.
 */
export function getStockAge(
  dateStr: string | null | undefined,
  referenceDate?: Date | string
): StockAge | null {
  if (!dateStr || typeof dateStr !== 'string' || !dateStr.trim()) {
    return null
  }

  const trimmed = dateStr.trim()
  let year: number
  let month: number
  let day: number

  const datePart = trimmed.slice(0, 10)
  if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
    const parts = datePart.split('-').map(Number)
    year = parts[0]
    month = parts[1]
    day = parts[2]
  } else {
    const parsed = new Date(trimmed)
    if (Number.isNaN(parsed.getTime())) {
      return null
    }
    year = parsed.getUTCFullYear()
    month = parsed.getUTCMonth() + 1
    day = parsed.getUTCDate()
  }

  // Reference date in Atlantic/Canary timezone
  const ref = referenceDate
    ? typeof referenceDate === 'string'
      ? new Date(referenceDate)
      : referenceDate
    : new Date()

  if (Number.isNaN(ref.getTime())) {
    return null
  }

  const canaryFormatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Atlantic/Canary',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  const [refY, refM, refD] = canaryFormatter.format(ref).split('-').map(Number)

  const entryUtc = Date.UTC(year, month - 1, day)
  const refUtc = Date.UTC(refY, refM - 1, refD)

  const diffMs = refUtc - entryUtc
  const days = Math.max(0, Math.floor(diffMs / 86400000))

  let level: StockAgeLevel = 'normal'
  let levelLabel: string | null = null

  if (days >= 30) {
    level = 'stale'
    levelLabel = 'Stock estancado'
  } else if (days >= 14) {
    level = 'slow'
    levelLabel = 'Stock lento'
  } else if (days >= 7) {
    level = 'attention'
    levelLabel = 'Atención'
  } else {
    level = 'normal'
    levelLabel = null
  }

  let label: string
  if (days === 0) {
    label = 'Hoy'
  } else if (days === 1) {
    label = '1 día'
  } else {
    label = `${days} días`
  }

  const combinedLabel = levelLabel ? `${label} · ${levelLabel}` : label

  const entryDateObj = new Date(Date.UTC(year, month - 1, day))
  const formattedEntryDate = entryDateObj
    .toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC',
    })
    .replace('.', '')

  return {
    days,
    level,
    label,
    levelLabel,
    combinedLabel,
    formattedEntryDate,
  }
}

