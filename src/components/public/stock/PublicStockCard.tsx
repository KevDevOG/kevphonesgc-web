import { PublicStockItem } from './PublicStockSection'

interface PublicStockCardProps {
  device: PublicStockItem
  onSelect: () => void
}

// warranty_until is a SQL date (YYYY-MM-DD), valid through that entire local day.
// Shared with the detail modal so validation and expiry rules cannot diverge.
export function getActiveWarrantyExpiry(warrantyUntil: string | null): Date | null {
  if (!warrantyUntil || !/^\d{4}-\d{2}-\d{2}$/.test(warrantyUntil)) return null

  const [year, month, day] = warrantyUntil.split('-').map(Number)
  const expiry = new Date(`${warrantyUntil}T00:00:00`)
  // Reject invalid dates, including values that JavaScript normalizes (e.g. February 31).
  if (
    expiry.getFullYear() !== year ||
    expiry.getMonth() !== month - 1 ||
    expiry.getDate() !== day
  ) return null

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return expiry >= today ? expiry : null
}

// Same public condition labels used by the existing product detail UI.
const CONDITION_LABELS: Record<string, string> = {
  sealed: 'Precintado',
  like_new: 'Como nuevo',
  good: 'Buen estado',
  marked: 'Con marcas'
}

const otherProductTypeMap: Record<string, string> = {
  android_phone: 'Móvil Android',
  laptop: 'Portátil',
  desktop_pc: 'PC sobremesa',
  tablet: 'Tablet',
  console: 'Consola',
  other: 'Otro'
}

function getOtherProductTypeLabel(type?: string | null): string | null {
  if (!type) return null
  return otherProductTypeMap[type] || type
}

function getDeviceTitle(device: PublicStockItem): string {
  const modelName = device.model_name || ''
  if (device.category !== 'other') {
    return modelName
  }
  const brand = (device.brand || '').trim()
  if (!brand) return modelName
  if (modelName.toLowerCase().startsWith(brand.toLowerCase())) {
    return modelName
  }
  return `${brand} ${modelName}`
}

function parseCustomSpecs(specs: any): Record<string, string> {
  if (!specs) return {}
  if (typeof specs === 'string') {
    try {
      const parsed = JSON.parse(specs)
      return typeof parsed === 'object' && parsed !== null ? parsed : {}
    } catch {
      return {}
    }
  }
  return typeof specs === 'object' ? specs : {}
}

function getOtherDeviceSpecsLine(device: PublicStockItem): string[] {
  const specs = parseCustomSpecs(device.custom_specs)
  const pType = device.custom_product_type || 'other'

  // Deduplication: check if custom_specs has storage or color
  const customStorageKey = Object.keys(specs).find(
    k => k.trim().toLowerCase() === 'almacenamiento' || k.trim().toLowerCase() === 'capacidad'
  )
  const customColorKey = Object.keys(specs).find(
    k => k.trim().toLowerCase() === 'color'
  )

  const storageVal = (customStorageKey ? specs[customStorageKey] : null) || device.storage || null
  const colorVal = (customColorKey ? specs[customColorKey] : null) || device.color || null

  const items: (string | null | undefined)[] = []

  if (pType === 'android_phone') {
    // RAM, storage, color
    if (specs['RAM']) items.push(specs['RAM'].includes('RAM') ? specs['RAM'] : `${specs['RAM']} RAM`)
    if (storageVal) items.push(storageVal)
    if (colorVal) items.push(colorVal)
  } else if (pType === 'laptop') {
    // Procesador, Gráfica, RAM, storage
    if (specs['Procesador']) items.push(specs['Procesador'])
    if (specs['Gráfica']) items.push(specs['Gráfica'])
    if (specs['RAM']) items.push(specs['RAM'].includes('RAM') ? specs['RAM'] : `${specs['RAM']} RAM`)
    if (storageVal) items.push(storageVal)
  } else if (pType === 'desktop_pc') {
    // Procesador, Gráfica, RAM, storage
    if (specs['Procesador']) items.push(specs['Procesador'])
    if (specs['Gráfica']) items.push(specs['Gráfica'])
    if (specs['RAM']) items.push(specs['RAM'].includes('RAM') ? specs['RAM'] : `${specs['RAM']} RAM`)
    if (storageVal) items.push(storageVal)
  } else if (pType === 'tablet') {
    // RAM, storage, color
    if (specs['RAM']) items.push(specs['RAM'].includes('RAM') ? specs['RAM'] : `${specs['RAM']} RAM`)
    if (storageVal) items.push(storageVal)
    if (colorVal) items.push(colorVal)
  } else if (pType === 'console') {
    // storage, color
    if (storageVal) items.push(storageVal)
    if (colorVal) items.push(colorVal)
  } else {
    // Custom / other type: show up to 3 useful values from custom_specs
    // including storage and color if available
    const standardKeysToIgnore = new Set([
      customStorageKey?.toLowerCase(),
      customColorKey?.toLowerCase()
    ].filter(Boolean))

    if (storageVal) items.push(storageVal)
    if (colorVal) items.push(colorVal)

    for (const [key, val] of Object.entries(specs)) {
      if (items.length >= 3) break
      if (standardKeysToIgnore.has(key.trim().toLowerCase())) continue
      const strVal = String(val).trim()
      if (strVal) {
        items.push(strVal)
      }
    }
  }

  return items.filter(Boolean).map(v => String(v).trim()) as string[]
}

export function PublicStockCard({ device, onSelect }: PublicStockCardProps) {
  const effectivePrice = device.discount_price ?? device.listing_price
  const formattedPrice = effectivePrice
    ? new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(effectivePrice)
    : null
    
  const formattedListingPrice = device.listing_price
    ? new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(device.listing_price)
    : null

  const conditionLabel = CONDITION_LABELS[device.condition]
  const isNew = device.condition === 'sealed'
  const hasWarranty = getActiveWarrantyExpiry(device.warranty_until) !== null
  const displayTitle = getDeviceTitle(device)
  const productTypeLabel = device.category === 'other' ? getOtherProductTypeLabel(device.custom_product_type) : null

  return (
    <button
      type="button"
      onClick={onSelect}
      className="kevphones-stock-card"
      aria-label={`Ver detalles de ${displayTitle}`}
    >
      <div className="kevphones-stock-card__image">
        {device.catalog_image_url ? (
          <img
            loading="lazy"
            decoding="async"
            src={device.catalog_image_url}
            alt={`${displayTitle} ${device.color || ''}`}
          />
        ) : device.real_images && device.real_images.length > 0 ? (
          <img
            loading="lazy"
            decoding="async"
            src={device.real_images[0].url}
            alt={`${displayTitle} ${device.color || ''}`}
          />
        ) : (
          <div className="kevphones-stock-card__fallback">
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <span>Sin imagen</span>
          </div>
        )}
      </div>

      <div className="kevphones-stock-card__content">
        <h3>{displayTitle}</h3>
        <p className="kevphones-stock-card__specs">
          {productTypeLabel && (
            <><span className="kevphones-stock-card__type">{productTypeLabel}</span>{' · '}</>
          )}
          {(device.category === 'other'
            ? getOtherDeviceSpecsLine(device)
            : device.category === 'apple_watch'
            ? [device.size, device.connectivity, device.case_material]
            : device.category === 'airpods'
            ? [device.case_type, device.color]
            : device.category === 'ipad'
            ? [device.storage, device.connectivity, device.color]
            : [device.storage, device.color]
          ).filter(Boolean).join(' · ')}
        </p>

        <div className="kevphones-stock-card__facts">
          {device.supports_battery_health && device.battery_health !== null && (
            <span>Batería {device.battery_health}%</span>
          )}
          {conditionLabel && <span>{conditionLabel}</span>}
          {hasWarranty && !isNew && <span>Con garantía</span>}
        </div>

        <div className="kevphones-stock-card__price">
          {device.discount_price ? (
            <>
              <span className="kevphones-stock-card__amount">
                <span className="sr-only">Precio actual: </span>{formattedPrice || '-'}
              </span>
              <del className="kevphones-stock-card__previous">
                <span className="sr-only">Precio anterior: </span>{formattedListingPrice}
              </del>
            </>
          ) : (
            <span className="kevphones-stock-card__amount">{formattedPrice || '-'}</span>
          )}
        </div>
      </div>
    </button>
  )
}
