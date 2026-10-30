'use client'

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { updateSaleRequestStatusAction, deleteSaleRequestAction } from '@/actions/sale-requests'
import { PurchaseFromRequestForm } from '@/components/admin/requests/PurchaseFromRequestForm'
import { TradeInFromRequestForm } from '@/components/admin/requests/TradeInFromRequestForm'

type DeviceModel = {
  id: string
  name: string
  brand: string
  category: string
}

type SaleRequest = {
  id: string
  category: string
  model_id: string
  storage: string | null
  color: string | null
  battery_health: number | null
  battery_cycles: number | null
  device_condition: string
  has_box: boolean
  has_cable: boolean
  has_invoice: boolean
  original_parts: boolean
  fully_functional: boolean
  blocked: boolean
  official_warranty_until: string | null
  estimated_min: number | null
  estimated_max: number | null
  customer_name: string
  customer_phone: string
  customer_location: string | null
  notes: string | null
  status: string
  source: string | null
  created_at: string
  updated_at: string
  device_models: DeviceModel | null
}

type SaleRequestImage = {
  id: string
  storage_path: string
  photo_type: string
  position: number
  created_at: string
  signedUrl: string | null
}

type TradeInContext = {
  targetDeviceId: string
  targetListingPriceSnapshot: number
  targetDevice: {
    id: string
    modelId: string
    modelName: string
    storage: string | null
    color: string | null
    listingPrice: number
    status: string
  } | null
} | null

type SaleRequestDetailProps = {
  request: SaleRequest
  images: SaleRequestImage[]
  tradeInContext?: TradeInContext
}

const conditionLabels: Record<string, string> = {
  sealed: 'Precintado',
  like_new: 'Como nuevo',
  good: 'Buen estado',
  marked: 'Con marcas'
}

const categoryLabels: Record<string, string> = {
  iphone: 'iPhone', apple_watch: 'Apple Watch', airpods: 'AirPods', ipad: 'iPad',
  macbook: 'MacBook', ps5: 'PlayStation', nintendo_switch: 'Nintendo Switch', other: 'Otros'
}

const sourceLabels: Record<string, string> = {
  instagram: 'Instagram',
  tiktok: 'TikTok',
  google: 'Google',
  direct: 'Directo',
  other: 'Otro'
}

const photoTypeLabels: Record<string, string> = {
  front_off: 'Frontal apagada',
  front_on: 'Frontal encendida',
  back: 'Trasera',
  right_side: 'Lado derecho',
  left_side: 'Lado izquierdo',
  top: 'Parte superior',
  bottom: 'Parte inferior',
  extra: 'Foto extra'
}

const statusLabels: Record<string, string> = {
  new: 'Nueva',
  in_progress: 'En proceso',
  purchased: 'Comprado',
  discarded: 'Descartada'
}


export function SaleRequestDetail({ request, images, tradeInContext }: SaleRequestDetailProps) {
  const router = useRouter()
  
  const formatMoney = (amount: number) => 
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount)
    
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [selectedPhoto, setSelectedPhoto] = useState<SaleRequestImage | null>(null)
  const lightboxOpenRef = useRef(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  useEffect(() => {
    if (mounted && selectedPhoto) {
      const originalOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = originalOverflow
      }
    }
  }, [mounted, selectedPhoto])

  const openLightbox = (img: SaleRequestImage) => {
    if (!lightboxOpenRef.current) {
      window.history.pushState({ lightbox: true }, '')
      lightboxOpenRef.current = true
    }
    setSelectedPhoto(img)
  }

  const closeLightbox = () => {
    if (lightboxOpenRef.current) {
      lightboxOpenRef.current = false
      setSelectedPhoto(null)
      if (window.history.state?.lightbox) {
        window.history.back()
      }
    }
  }

  useEffect(() => {
    const handlePopState = () => {
      if (lightboxOpenRef.current) {
        lightboxOpenRef.current = false
        setSelectedPhoto(null)
      }
    }
    window.addEventListener('popstate', handlePopState)

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && lightboxOpenRef.current) {
        closeLightbox()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    
    return () => {
      window.removeEventListener('popstate', handlePopState)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === 'discarded') {
      setShowDiscardConfirm(true)
      return
    }
    await updateStatus(newStatus)
  }

  const updateStatus = async (newStatus: string) => {
    setIsUpdating(true)
    setError(null)
    try {
      const res = await updateSaleRequestStatusAction(request.id, newStatus)
      if (res.error) {
        setError(res.error)
      } else {
        setShowDiscardConfirm(false)
        if (newStatus === 'discarded') {
          router.push('/admin/solicitudes')
          router.refresh()
        }
      }
    } catch (err) {
      setError('Ocurrió un error al actualizar el estado.')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    setError(null)
    try {
      const res = await deleteSaleRequestAction(request.id)
      if (res.error) {
        setError(res.error)
        setShowDeleteConfirm(false)
      } else {
        router.push('/admin/solicitudes')
        router.refresh()
      }
    } catch (err) {
      setError('Ocurrió un error al eliminar la solicitud.')
      setShowDeleteConfirm(false)
    } finally {
      setIsDeleting(false)
    }
  }

  const getWhatsAppLink = (phone: string) => {
    let cleanPhone = phone.replace(/[\s\-()]/g, '')
    if (!cleanPhone) return null
    return `https://wa.me/${cleanPhone.startsWith('+') ? cleanPhone.slice(1) : cleanPhone}`
  }

  const whatsappLink = getWhatsAppLink(request.customer_phone || '')

  const sectionTitleClass = "admin-request-detail__section-title"
  const rowClass = "admin-request-detail__row"
  const labelClass = "admin-request-detail__label"
  const valueClass = "admin-request-detail__value"

  return (
    <div className="admin-request-detail">
      <header className="admin-request-detail__header">
        <div className="admin-request-detail__topline">
          <Link href="/admin/solicitudes" className="admin-request-detail__back">
            <span aria-hidden="true" className="material-symbols-outlined">arrow_back</span> Volver a solicitudes
          </Link>
          <span className="admin-request-detail__status" data-status={request.status}>{statusLabels[request.status] || request.status}</span>
        </div>
        <p className="admin-request-detail__date">Recibida el {new Date(request.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        <h1>{request.customer_name || 'Solicitud de venta'}</h1>
        <p className="admin-request-detail__identity">{request.device_models?.name || 'Modelo desconocido'}{[request.storage, request.color].filter(Boolean).length > 0 && ` · ${[request.storage, request.color].filter(Boolean).join(' · ')}`}</p>
      </header>

      {error && <p role="alert" className="admin-request-detail__error">{error}</p>}

      <div className="admin-request-detail__layout">
        <section className="admin-request-detail__valuation">
          <h2>Valoración estimada</h2>
          {request.estimated_min !== null && request.estimated_max !== null ? (
            <p className="admin-request-detail__amount">{formatMoney(request.estimated_min)} – {formatMoney(request.estimated_max)}</p>
          ) : <p className="admin-request-detail__amount">Sin estimación</p>}
          <p>Importe orientativo calculado antes de enviar la solicitud.</p>
        </section>

        <section className="admin-request-detail__actions" aria-label="Acciones de la solicitud">
          {tradeInContext && <p className="admin-request-detail__trade-in">Parte de pago{tradeInContext.targetDevice && ` · ${[tradeInContext.targetDevice.modelName, tradeInContext.targetDevice.storage, tradeInContext.targetDevice.color].filter(Boolean).join(' · ')}`}</p>}
          {(request.status === 'new' || request.status === 'in_progress') && (
            <div className="admin-request-detail__conversion">
              {tradeInContext ? (
                tradeInContext.targetDevice?.status === 'available' ? (
                  <TradeInFromRequestForm request={request} tradeInContext={tradeInContext} />
                ) : (
                  <div className="flex items-center gap-2.5 px-4 py-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm font-bold">
                    <span aria-hidden="true" className="material-symbols-outlined text-[18px]">warning</span>
                    El dispositivo elegido por el cliente ya no está disponible.
                  </div>
                )
              ) : (
                <PurchaseFromRequestForm request={request} />
              )}
            </div>
          )}

          {request.status === 'purchased' ? (
            <div className="flex flex-col gap-2">
              <span className="inline-flex w-fit px-3 py-1 rounded border bg-green-500/10 text-green-500 border-green-500/20 text-xs font-bold uppercase tracking-wider">
                Comprado
              </span>
              <p className="text-[13px] font-medium text-zinc-400 mt-1">
                Esta solicitud ya fue procesada y convertida en una compra de stock.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <label htmlFor={`request-status-${request.id}`} className="admin-request-detail__label">Actualizar estado</label>
              <select
                id={`request-status-${request.id}`}
                className="admin-request-detail__status-select"
                value={request.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                disabled={isUpdating}
              >
                <option value="new">Nueva</option>
                <option value="in_progress">En proceso</option>
                <option value="discarded">Descartada</option>
              </select>
            </div>
          )}

        </section>

        <section className="admin-request-detail__section admin-request-detail__photos">
          <div className="admin-request-detail__section-header">
            <h2 className={sectionTitleClass}>Fotos adjuntas</h2>
            <span>{images.length} fotos</span>
          </div>
          {images.length > 0 ? <div className="admin-request-detail__gallery">
            {images.map(img => {
              const label = photoTypeLabels[img.photo_type] || 'Foto'
              return img.signedUrl ? (
                <button key={img.id} type="button" className="admin-request-detail__photo" onClick={() => openLightbox(img)} aria-label={`Ampliar foto: ${label}`}>
                  <span className="admin-request-detail__photo-stage"><img src={img.signedUrl} alt={label} /></span>
                  <span className="admin-request-detail__photo-caption">{label}<span aria-hidden="true" className="material-symbols-outlined">zoom_in</span></span>
                </button>
              ) : <div key={img.id} className="admin-request-detail__photo">
                <span className="admin-request-detail__photo-stage">No disponible</span>
                <span className="admin-request-detail__photo-caption">{label}</span>
              </div>
            })}
          </div> : <p className="admin-request-detail__muted">Sin fotos adjuntas</p>}
        </section>

        {/* DISPOSITIVO */}
        <section className="admin-request-detail__section admin-request-detail__device">
          <h2 className={sectionTitleClass}>
            <span aria-hidden="true" className="material-symbols-outlined text-[16px]">smartphone</span> Dispositivo y estado declarado
          </h2>

          <div className="flex flex-col gap-6">
            <div className="admin-request-detail__rows">
              <div className={rowClass}>
                <span className={labelClass}>Categoría</span>
                <span className={`${valueClass} capitalize`}>{categoryLabels[request.category] || request.category.replace('_', ' ')}</span>
              </div>
              <div className={rowClass}>
                <span className={labelClass}>Modelo</span>
                <span className={valueClass}>{request.device_models?.name || 'N/A'}</span>
              </div>
              <div className={rowClass}>
                <span className={labelClass}>Almacenamiento</span>
                <span className={valueClass}>{request.storage || '-'}</span>
              </div>
              <div className={rowClass}>
                <span className={labelClass}>Color</span>
                <span className={valueClass}>{request.color || '-'}</span>
              </div>
              <div className={rowClass}>
                <span className={labelClass}>Estado físico</span>
                <span className={valueClass}>{conditionLabels[request.device_condition] || request.device_condition}</span>
              </div>
            </div>

            <div className="h-px bg-[#1F1F24] w-full"></div>

            <div className="admin-request-detail__rows">
              <div className={rowClass}>
                <span className={labelClass}>Salud de batería</span>
                <span className={valueClass}>{request.battery_health ? `${request.battery_health}%` : '-'}</span>
              </div>
              <div className={rowClass}>
                <span className={labelClass}>Ciclos de carga</span>
                <span className={valueClass}>{request.battery_cycles ?? '-'}</span>
              </div>
            </div>

            <div className="h-px bg-[#1F1F24] w-full"></div>

            <div className="admin-request-detail__rows">
              <div className={rowClass}>
                <span className={labelClass}>Caja original</span>
                <span className={valueClass}>{request.has_box ? 'Sí' : 'No'}</span>
              </div>
              <div className={rowClass}>
                <span className={labelClass}>Cable original</span>
                <span className={valueClass}>{request.has_cable ? 'Sí' : 'No'}</span>
              </div>
              <div className={rowClass}>
                <span className={labelClass}>Factura</span>
                <span className={valueClass}>{request.has_invoice ? 'Sí' : 'No'}</span>
              </div>
              <div className={rowClass}>
                <span className={labelClass}>Piezas originales</span>
                <span className={valueClass}>{request.original_parts ? 'Sí' : 'No'}</span>
              </div>
              <div className={rowClass}>
                <span className={labelClass}>Funcionamiento completo</span>
                <span className={valueClass}>{request.fully_functional ? 'Sí' : 'No'}</span>
              </div>
              <div className={rowClass}>
                <span className={labelClass}>Bloqueado</span>
                <span className={valueClass}>{request.blocked ? 'Sí' : 'No'}</span>
              </div>
              <div className={rowClass}>
                <span className={labelClass}>Garantía oficial hasta</span>
                <span className={valueClass}>
                  {request.official_warranty_until 
                    ? new Date(request.official_warranty_until).toLocaleDateString('es-ES') 
                    : '-'}
                </span>
              </div>
            </div>
          </div>
        </section>


        {/* CLIENTE */}
        <section className="admin-request-detail__section admin-request-detail__client">
          <h2 className={sectionTitleClass}>
            <span aria-hidden="true" className="material-symbols-outlined text-[16px]">person</span> Cliente
          </h2>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3">
              <div className={rowClass}>
                <span className={labelClass}>Nombre</span>
                <span className={valueClass}>{request.customer_name || '-'}</span>
              </div>
              <div className={rowClass}>
                <span className={labelClass}>Teléfono</span>
                <span className={valueClass}>{request.customer_phone || '-'}</span>
              </div>
              {request.customer_location && (
                <div className={rowClass}>
                  <span className={labelClass}>Ubicación</span>
                  <span className={valueClass}>{request.customer_location}</span>
                </div>
              )}
            </div>

            {whatsappLink && (
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="admin-request-detail__contact-action"
              >
                <span aria-hidden="true" className="material-symbols-outlined text-[18px]">chat</span>
                WhatsApp
              </a>
            )}
          </div>
        </section>


        {/* ORIGEN / NOTES */}
        <section className="admin-request-detail__section admin-request-detail__notes">
          <h2 className={sectionTitleClass}>
            <span aria-hidden="true" className="material-symbols-outlined text-[16px]">info</span> Notas del cliente
          </h2>

          <div className="flex flex-col gap-4">
            <div className={rowClass}>
              <span className={labelClass}>Origen de la solicitud</span>
              <span className={valueClass}>{request.source ? (sourceLabels[request.source] || request.source) : '-'}</span>
            </div>
            <div className={rowClass}>
              <span className={labelClass}>Notas adicionales</span>
              <span className={`${valueClass} font-normal whitespace-pre-wrap`}>{request.notes || '-'}</span>
            </div>
          </div>
        </section>

        <section className="admin-request-detail__section admin-request-detail__history">
          <h2 className={sectionTitleClass}>Datos de la solicitud</h2>
          <div className={rowClass}><span className={labelClass}>Identificador</span><span className={valueClass}>{request.id}</span></div>
          <div className={rowClass}><span className={labelClass}>Recibida</span><span className={valueClass}>{new Date(request.created_at).toLocaleString('es-ES')}</span></div>
          {request.updated_at && <div className={rowClass}><span className={labelClass}>Actualizada</span><span className={valueClass}>{new Date(request.updated_at).toLocaleString('es-ES')}</span></div>}
        </section>
        <div className="admin-request-detail__terminal">
          {/* Acciones Destructivas */}
          {request.status !== 'purchased' && (
            <>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="admin-request-detail__delete"
              >
                <span aria-hidden="true" className="material-symbols-outlined text-[18px]">delete</span>
                Eliminar solicitud
              </button>
            </>
          )}

        </div>
      </div>

      {/* Modal Confirmación Descarte */}
      {showDiscardConfirm && (
        <div role="dialog" aria-modal="true" aria-label="Descartar solicitud" className="admin-request-detail-confirm fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0B0B0E] border border-[#1F1F24] rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-[17px] font-bold text-white mb-2">¿Descartar esta solicitud?</h3>
            <p className="text-[14px] font-medium text-zinc-400 mb-6 leading-relaxed">
              La solicitud quedará archivada como descartada de forma permanente.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setShowDiscardConfirm(false)}
                className="flex-1 px-4 py-2.5 bg-[#121217] border border-[#1F1F24] text-white rounded-xl text-[14px] font-bold hover:bg-[#1F1F24] transition-colors"
                disabled={isUpdating}
              >
                Cancelar
              </button>
              <button
                onClick={() => updateStatus('discarded')}
                className="flex-1 px-4 py-2.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-[14px] font-bold hover:bg-red-500/20 transition-colors"
                disabled={isUpdating}
              >
                {isUpdating ? 'Guardando...' : 'Sí, descartar'}
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Modal Confirmación Eliminación */}
      {showDeleteConfirm && (
        <div role="dialog" aria-modal="true" aria-label="Eliminar solicitud" className="admin-request-detail-confirm fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0B0B0E] border border-[#1F1F24] rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-[17px] font-bold text-white mb-2">¿Eliminar esta solicitud?</h3>
            <p className="text-[14px] font-medium text-zinc-400 mb-6 leading-relaxed">
              Esta acción eliminará permanentemente la solicitud y sus fotos. No se puede deshacer.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2.5 bg-[#121217] border border-[#1F1F24] text-white rounded-xl text-[14px] font-bold hover:bg-[#1F1F24] transition-colors"
                disabled={isDeleting}
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-[14px] font-bold hover:bg-red-500/20 transition-colors"
                disabled={isDeleting}
              >
                {isDeleting ? 'Eliminando...' : 'Eliminar definitivamente'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LIGHTBOX */}
      {mounted && selectedPhoto && selectedPhoto.signedUrl && createPortal(
        <div 
          role="dialog" aria-modal="true" aria-label="Foto de la solicitud" className="admin-request-detail-lightbox fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/95 backdrop-blur-sm"
          onClick={closeLightbox}
        >
          <button 
            type="button"
            aria-label="Cerrar foto"
            className="absolute top-4 right-4 w-12 h-12 flex items-center justify-center text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors backdrop-blur-md"
            onClick={(e) => {
              e.stopPropagation()
              closeLightbox()
            }}
          >
            <span aria-hidden="true" className="material-symbols-outlined">close</span>
          </button>
          
          <div className="w-full max-w-6xl h-full max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex-1 min-h-0 relative flex items-center justify-center">
              <img 
                src={selectedPhoto.signedUrl} 
                alt={photoTypeLabels[selectedPhoto.photo_type] || 'Foto'} 
                className="max-w-full max-h-full object-contain rounded-lg"
              />
            </div>
            <div className="shrink-0 pt-6 text-center">
              <p className="text-xl font-bold text-white">{photoTypeLabels[selectedPhoto.photo_type] || 'Foto'}</p>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
