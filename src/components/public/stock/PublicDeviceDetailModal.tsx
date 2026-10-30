'use client'

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { PublicStockItem } from './PublicStockSection'
import { getActiveWarrantyExpiry } from './PublicStockCard'

interface PublicDeviceDetailModalProps {
  device: PublicStockItem
  onClose: () => void
  whatsappPhone: string | null
  contactEnabled: boolean
}

const CONDITION_LABELS: Record<string, string> = {
  sealed: 'Precintado',
  like_new: 'Como nuevo',
  good: 'Buen estado',
  marked: 'Con marcas'
}

const OTHER_PRODUCT_TYPE_MAP: Record<string, string> = {
  android_phone: 'Móvil Android',
  laptop: 'Portátil',
  desktop_pc: 'PC sobremesa',
  tablet: 'Tablet',
  console: 'Consola',
  other: 'Otro'
}

function getOtherProductTypeLabel(type?: string | null): string | null {
  if (!type) return null
  return OTHER_PRODUCT_TYPE_MAP[type] || type
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

function getTechnicalSpecsRows(device: PublicStockItem): { label: string; value: string }[] {
  const specs = parseCustomSpecs(device.custom_specs)
  const rows: { label: string; value: string }[] = []

  // Check if custom_specs has storage or color (case-insensitive check)
  const hasStorageInCustom = Object.keys(specs).some(
    k => k.trim().toLowerCase() === 'almacenamiento' || k.trim().toLowerCase() === 'capacidad'
  )
  const hasColorInCustom = Object.keys(specs).some(
    k => k.trim().toLowerCase() === 'color'
  )

  // Standard storage if available and not present in custom_specs
  if (device.storage && device.storage.trim() && !hasStorageInCustom) {
    rows.push({ label: 'Almacenamiento', value: device.storage.trim() })
  }

  // Standard color if available and not present in custom_specs
  if (device.color && device.color.trim() && !hasColorInCustom) {
    rows.push({ label: 'Color', value: device.color.trim() })
  }

  // All custom_specs key/values that are non-empty
  Object.entries(specs).forEach(([key, val]) => {
    if (val !== null && val !== undefined) {
      const valStr = String(val).trim()
      const keyStr = String(key).trim()
      if (keyStr && valStr) {
        rows.push({ label: keyStr, value: valStr })
      }
    }
  })

  return rows
}

export function PublicDeviceDetailModal({ device, onClose, whatsappPhone, contactEnabled }: PublicDeviceDetailModalProps) {
  const [mounted, setMounted] = useState(false)
  const isSealed = device.condition === 'sealed'
  const warrantyExpiry = getActiveWarrantyExpiry(device.warranty_until)
  const hasWarranty = warrantyExpiry !== null
  const displayTitle = getDeviceTitle(device)
  const productTypeLabel = device.category === 'other' ? getOtherProductTypeLabel(device.custom_product_type) : null
  const technicalSpecs = device.category === 'other' ? getTechnicalSpecsRows(device) : []
  
  // Show the actual unit first, then the resolved catalogue image as a reference.
  const allPhotos: { id: string; url: string; position: number }[] = []
  const seenUrls = new Set<string>()

  if (device.real_images && device.real_images.length > 0) {
    for (const img of device.real_images) {
      if (!seenUrls.has(img.url)) {
        allPhotos.push(img)
        seenUrls.add(img.url)
      }
    }
  }

  if (device.catalog_image_url && !seenUrls.has(device.catalog_image_url)) {
    allPhotos.push({ id: 'catalog', url: device.catalog_image_url, position: 0 })
    seenUrls.add(device.catalog_image_url)
  }

  const [mainPhotoIndex, setMainPhotoIndex] = useState(0)

  // Safe History & Mount Logic
  const modalOpenRef = useRef(false)
  const previousOverflowRef = useRef<string>('')
  const previousFocusRef = useRef<HTMLElement | null>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    setMounted(true)
    
    if (!modalOpenRef.current) {
      window.history.pushState({ deviceModal: true }, '')
      modalOpenRef.current = true
    }
    
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    previousOverflowRef.current = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    
    return () => {
      document.body.style.overflow = previousOverflowRef.current
      if (previousFocusRef.current?.isConnected) {
        previousFocusRef.current.focus({ preventScroll: true })
      }
    }
  }, [])

  useEffect(() => {
    if (mounted) closeButtonRef.current?.focus({ preventScroll: true })
  }, [mounted])

  const safeClose = () => {
    if (modalOpenRef.current) {
      modalOpenRef.current = false
      if (window.history.state?.deviceModal) {
        window.history.back()
      }
    }
    onClose()
  }

  useEffect(() => {
    const handlePopState = () => {
      if (modalOpenRef.current) {
        modalOpenRef.current = false
        onClose()
      }
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && modalOpenRef.current) {
        safeClose()
      }
      if (e.key === 'Tab' && modalOpenRef.current && panelRef.current) {
        const controls = Array.from(panelRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href], summary, [tabindex="0"]'
        )).filter(element => element.getClientRects().length > 0)
        const first = controls[0]
        const last = controls[controls.length - 1]
        if (first && (e.shiftKey && document.activeElement === first)) {
          e.preventDefault()
          last.focus()
        } else if (first && ((!e.shiftKey && document.activeElement === last) || !panelRef.current.contains(document.activeElement))) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    
    window.addEventListener('popstate', handlePopState)
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('popstate', handlePopState)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose])

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

  const identitySpecs = (device.category === 'other'
    ? [device.storage, device.color]
    : device.category === 'apple_watch'
    ? [device.size, device.connectivity, device.case_material]
    : device.category === 'airpods'
    ? [device.case_type, device.color]
    : device.category === 'ipad'
    ? [device.storage, device.connectivity, device.color]
    : [device.storage, device.color]
  ).filter(Boolean).join(' · ')

  const secondarySpecs: { label: string; value: string }[] = []
  if (device.category === 'other' && device.brand) secondarySpecs.push({ label: 'Marca', value: device.brand })
  if (device.category !== 'other' && device.storage) secondarySpecs.push({ label: 'Almacenamiento', value: device.storage })
  if (device.category !== 'other' && device.color) secondarySpecs.push({ label: 'Color', value: device.color })
  if (device.size) secondarySpecs.push({ label: 'Tamaño', value: device.size })
  if (device.connectivity) secondarySpecs.push({ label: 'Conectividad', value: device.connectivity })
  if (device.case_material) secondarySpecs.push({ label: 'Material de caja', value: device.case_material })
  if (device.case_type) secondarySpecs.push({ label: 'Tipo de estuche', value: device.case_type })
  if (device.chip) secondarySpecs.push({ label: 'Chip', value: device.chip })
  if (device.memory) secondarySpecs.push({ label: 'Memoria', value: device.memory })
  if (device.supports_cycles && device.battery_cycles !== null) secondarySpecs.push({ label: 'Ciclos', value: String(device.battery_cycles) })
  secondarySpecs.push(...technicalSpecs)

  const accessories = [
    { label: 'Caja', included: device.has_box },
    { label: 'Cable', included: device.has_cable },
    { label: 'Factura', included: device.has_invoice }
  ]
  const included = accessories.filter(item => item.included).map(item => item.label)
  const notIncluded = accessories.filter(item => !item.included).map(item => item.label)

  if (!mounted) return null

  return createPortal(
    <div className="kevphones-device-detail" onClick={safeClose}>
      <div
        ref={panelRef}
        className="kevphones-device-detail__panel"
        onClick={event => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <header className="kevphones-device-detail__header">
          <button ref={closeButtonRef} type="button" onClick={safeClose} aria-label="Cerrar ficha y volver al catálogo">
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
              <path strokeLinecap="round" strokeLinejoin="round" d="m14 6-6 6 6 6M8 12h12" />
            </svg>
            Volver
          </button>
          <span>KevPhonesGC</span>
        </header>

        <div className="kevphones-device-detail__body">
          <div className="kevphones-device-detail__layout">
            <section className="kevphones-device-detail__gallery" aria-label={`Fotos de ${displayTitle}`}>
              <div className="kevphones-device-detail__stage">
                {allPhotos.length > 0 ? (
                  <img decoding="async" src={allPhotos[mainPhotoIndex].url} alt={`${displayTitle} foto`} />
                ) : (
                  <div className="kevphones-device-detail__fallback">
                    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <rect x="6" y="2" width="12" height="20" rx="2" />
                      <path strokeLinecap="round" d="M11 18h2" />
                    </svg>
                    <span>Sin imagen</span>
                  </div>
                )}
              </div>
              {allPhotos.length > 1 && (
                <div className="kevphones-device-detail__thumbnails" role="group" aria-label="Seleccionar foto">
                  {allPhotos.map((photo, idx) => (
                    <button
                      key={photo.id}
                      type="button"
                      onClick={() => setMainPhotoIndex(idx)}
                      aria-label={`Ver foto ${idx + 1} de ${allPhotos.length}`}
                      aria-pressed={idx === mainPhotoIndex}
                    >
                      <img loading="lazy" decoding="async" src={photo.url} alt="" />
                    </button>
                  ))}
                </div>
              )}
            </section>

            <div className="kevphones-device-detail__info">
              {productTypeLabel && <p className="kevphones-device-detail__type">{productTypeLabel}</p>}
              <h2 id="modal-title">{displayTitle}</h2>
              {identitySpecs && <p className="kevphones-device-detail__identity">{identitySpecs}</p>}

              <div className="kevphones-device-detail__price">
                <span><span className="sr-only">Precio actual: </span>{formattedPrice || '-'}</span>
                {device.discount_price ? <del><span className="sr-only">Precio habitual: </span>{formattedListingPrice}</del> : null}
              </div>

              <dl className="kevphones-device-detail__key-info">
                <div>
                  <dt>Estado</dt>
                  <dd>{CONDITION_LABELS[device.condition] || device.condition}</dd>
                </div>
                {device.supports_battery_health && device.battery_health !== null && (
                  <div><dt>Salud de batería</dt><dd>{device.battery_health}%</dd></div>
                )}
                {!isSealed && hasWarranty && <div><dt>Garantía</dt><dd>Con garantía</dd></div>}
                {device.warranty_until && hasWarranty && (
                  <div><dt>Garantía oficial hasta</dt><dd>{warrantyExpiry?.toLocaleDateString('es-ES')}</dd></div>
                )}
              </dl>

              <Link
                href={`/cotizar?mode=trade_in&target=${device.id}`}
                className="kevphones-device-detail__trade-in"
                onClick={() => {
                  document.body.style.overflow = previousOverflowRef.current
                }}
              >
                Entregar mi móvil como parte de pago
              </Link>

              {secondarySpecs.length > 0 && (
                <details className="kevphones-device-detail__disclosure">
                  <summary>Especificaciones técnicas</summary>
                  <dl className="kevphones-device-detail__rows">
                    {secondarySpecs.map((spec, idx) => (
                      <div key={idx}><dt>{spec.label}</dt><dd>{spec.value}</dd></div>
                    ))}
                  </dl>
                </details>
              )}

              <details className="kevphones-device-detail__disclosure" open>
                <summary>Accesorios y comprobaciones</summary>
                <dl className="kevphones-device-detail__rows">
                  {included.length > 0 && <div><dt>Incluye</dt><dd>{included.join(', ')}</dd></div>}
                  {notIncluded.length > 0 && <div><dt>No incluye</dt><dd>{notIncluded.join(', ')}</dd></div>}
                  <div><dt>Piezas originales</dt><dd>{device.original_parts ? 'Sí' : 'No'}</dd></div>
                  <div><dt>Funcionamiento completo</dt><dd>{device.fully_functional ? 'Sí' : 'No'}</dd></div>
                </dl>
              </details>
            </div>
          </div>
        </div>

        <footer className="kevphones-device-detail__actions">
          <div className="kevphones-device-detail__action-price">
            <span>Precio</span>
            <strong>{formattedPrice || '-'}</strong>
          </div>
          {contactEnabled && whatsappPhone ? (
            <a
              href={`https://wa.me/${whatsappPhone}?text=${encodeURIComponent(
                  `Hola, estoy interesado en este dispositivo de KevPhonesGC:\n\n${displayTitle}\n${(device.category === 'other' ? technicalSpecs.slice(0, 4).map(s => `${s.label}: ${s.value}`) : device.category === 'apple_watch' ? [device.size, device.connectivity, device.case_material] : device.category === 'airpods' ? [device.case_type, device.color] : device.category === 'ipad' ? [device.storage, device.connectivity, device.color] : [device.storage, device.color]).filter(Boolean).map(v => `${v}\n`).join('')}Precio: ${effectivePrice ? `${effectivePrice} €` : 'No disponible'}\n\n¿Sigue disponible?`
                )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="kevphones-device-detail__contact"
            >
              Preguntar por WhatsApp
            </a>
          ) : (
            <button type="button" disabled className="kevphones-device-detail__contact">
              Contacto temporalmente no disponible
            </button>
          )}
        </footer>
      </div>
    </div>,
    document.body
  )
}
