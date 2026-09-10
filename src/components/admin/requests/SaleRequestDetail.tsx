'use client'

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { AdminPageShell } from '@/components/admin/layout/AdminPageShell'
import { AdminPageHeader } from '@/components/admin/layout/AdminPageHeader'
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

const statusColors: Record<string, string> = {
  new: 'bg-[#d7baff]/10 text-[#d7baff] border-[#d7baff]/20',
  in_progress: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  purchased: 'bg-[#22c55e]/10 text-[#22c55e] border-[#22c55e]/20',
  discarded: 'bg-red-500/10 text-red-500 border-red-500/20'
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

  const whatsappLink = getWhatsAppLink(request.customer_phone)

  const sectionClass = "bg-[#0B0B0E] border border-[#1F1F24] rounded-2xl p-6 flex flex-col gap-6"
  const sectionTitleClass = "text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2"
  const rowClass = "flex flex-col gap-1"
  const labelClass = "text-xs font-medium text-zinc-500"
  const valueClass = "text-[14px] font-semibold text-white"

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <Link href="/admin/solicitudes" className="text-[13px] font-semibold text-zinc-400 hover:text-white flex items-center gap-1.5 transition-colors">
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          Volver a solicitudes
        </Link>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight leading-none mb-2">
            {request.device_models?.name || 'Solicitud de venta'}
          </h1>
          <p className="text-[14px] font-medium text-zinc-400">
            Recibida el {new Date(request.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 rounded border text-[13px] font-bold uppercase tracking-wider ${statusColors[request.status] || 'bg-gray-500/10 text-gray-500 border-gray-500/20'}`}>
            {statusLabels[request.status] || request.status}
          </span>
        </div>
      </div>

      {(request.status === 'new' || request.status === 'in_progress') && (
        <div className="flex justify-start md:justify-end">
          {tradeInContext ? (
            tradeInContext.targetDevice?.status === 'available' ? (
              <TradeInFromRequestForm request={request} tradeInContext={tradeInContext} />
            ) : (
              <div className="flex items-center gap-2.5 px-4 py-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm font-bold">
                <span className="material-symbols-outlined text-[18px]">warning</span>
                El dispositivo elegido por el cliente ya no está disponible.
              </div>
            )
          ) : (
            <PurchaseFromRequestForm request={request} />
          )}
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm font-semibold">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.7fr)] gap-6 lg:gap-8 items-start">
        
        {/* COLUMNA PRINCIPAL (LEFT) */}
        <div className="flex flex-col gap-6 lg:gap-8">
          
          {/* VALORACIÓN */}
          <section className="bg-[#7a32d4]/5 border border-[#7a32d4]/30 rounded-2xl p-6 flex flex-col gap-2 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-[#7a32d4]"></div>
            <h3 className="text-[11px] font-bold text-[#d7baff] uppercase tracking-wider">
              Valoración mostrada al cliente
            </h3>
            {request.estimated_min !== null && request.estimated_max !== null ? (
              <div className="text-3xl font-extrabold text-white tracking-tight">
                {formatMoney(request.estimated_min)} – {formatMoney(request.estimated_max)}
              </div>
            ) : (
              <div className="text-xl font-bold text-white">Sin estimación</div>
            )}
            <p className="text-[13px] font-medium text-zinc-400">
              Importe orientativo calculado antes de enviar la solicitud.
            </p>
          </section>

          {/* DISPOSITIVO */}
          <section className={sectionClass}>
            <h3 className={sectionTitleClass}>
              <span className="material-symbols-outlined text-[16px]">smartphone</span> Detalles del Dispositivo
            </h3>
            
            <div className="flex flex-col gap-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                <div className={rowClass}>
                  <span className={labelClass}>Categoría</span>
                  <span className={`${valueClass} capitalize`}>{request.category.replace('_', ' ')}</span>
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
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
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
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
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

          {/* FOTOS */}
          <section className={sectionClass}>
            <div className="flex items-center justify-between">
              <h3 className={sectionTitleClass}>
                <span className="material-symbols-outlined text-[16px]">photo_library</span> Fotos adjuntas
              </h3>
              <span className="text-xs font-semibold text-zinc-500">{images.length} fotos</span>
            </div>
            
            {images.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {images.map(img => {
                  const label = photoTypeLabels[img.photo_type] || 'Foto'
                  
                  if (!img.signedUrl) {
                    return (
                      <div key={img.id} className="border border-[#1F1F24] bg-[#121217] rounded-xl overflow-hidden flex flex-col">
                        <div className="aspect-[4/3] bg-black flex items-center justify-center border-b border-[#1F1F24]">
                          <span className="text-xs text-zinc-500 font-medium px-2 text-center">No disponible</span>
                        </div>
                        <div className="p-2.5">
                          <p className="text-xs font-bold text-white truncate">{label}</p>
                        </div>
                      </div>
                    )
                  }
                  
                  return (
                    <div 
                      key={img.id} 
                      className="border border-[#1F1F24] bg-[#121217] rounded-xl overflow-hidden flex flex-col cursor-pointer group hover:border-[#7a32d4]/50 transition-colors"
                      onClick={() => openLightbox(img)}
                    >
                      <div className="aspect-[4/3] bg-black border-b border-[#1F1F24] relative overflow-hidden">
                        <img 
                          src={img.signedUrl} 
                          alt={label} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <span className="material-symbols-outlined text-white text-3xl drop-shadow-lg">zoom_in</span>
                        </div>
                      </div>
                      <div className="p-2.5">
                        <p className="text-xs font-bold text-white truncate">{label}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="bg-[#121217] border border-[#1F1F24] rounded-xl p-8 flex items-center justify-center">
                <p className="text-[13px] font-medium text-zinc-500">Sin fotos adjuntas</p>
              </div>
            )}
          </section>
        </div>

        {/* COLUMNA SECUNDARIA (RIGHT) */}
        <div className="flex flex-col gap-6 lg:gap-8 sticky top-20">
          
          {/* ESTADO Y ACCIONES */}
          <section className={sectionClass}>
            <h3 className={sectionTitleClass}>
              <span className="material-symbols-outlined text-[16px]">update</span> Estado de la Solicitud
            </h3>
            
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
                <label className="text-[13px] font-semibold text-zinc-400">Actualizar estado</label>
                <select
                  value={request.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  disabled={isUpdating}
                  className="w-full bg-[#121217] text-white border border-[#1F1F24] rounded-xl px-4 py-2.5 text-[14px] font-medium focus:outline-none focus:border-[#7a32d4]/50 focus:ring-1 focus:ring-[#7a32d4]/50 transition-all disabled:opacity-50"
                >
                  <option value="new">Nueva</option>
                  <option value="in_progress">En proceso</option>
                  <option value="discarded">Descartada</option>
                </select>
              </div>
            )}
            
            {/* Modal Confirmación Descarte */}
            {showDiscardConfirm && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
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

            {/* Acciones Destructivas */}
            {request.status !== 'purchased' && (
              <>
                <div className="h-px bg-[#1F1F24] w-full my-2"></div>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full bg-red-500/5 hover:bg-red-500/10 text-red-500 border border-red-500/20 hover:border-red-500/30 rounded-xl px-4 py-2.5 text-[14px] font-bold transition-colors flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                  Eliminar solicitud
                </button>
              </>
            )}

            {/* Modal Confirmación Eliminación */}
            {showDeleteConfirm && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
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
          </section>

          {/* CLIENTE */}
          <section className={sectionClass}>
            <h3 className={sectionTitleClass}>
              <span className="material-symbols-outlined text-[16px]">person</span> Cliente
            </h3>
            
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-3">
                <div className={rowClass}>
                  <span className={labelClass}>Nombre</span>
                  <span className={valueClass}>{request.customer_name}</span>
                </div>
                <div className={rowClass}>
                  <span className={labelClass}>Teléfono</span>
                  <span className={valueClass}>{request.customer_phone}</span>
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
                  className="mt-2 w-full py-2.5 bg-[#25D366]/10 border border-[#25D366]/30 hover:bg-[#25D366]/20 text-[#25D366] text-[14px] font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">chat</span>
                  WhatsApp
                </a>
              )}
            </div>
          </section>

          {/* ORIGEN / NOTES */}
          <section className={sectionClass}>
            <h3 className={sectionTitleClass}>
              <span className="material-symbols-outlined text-[16px]">info</span> Notas del cliente
            </h3>
            
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

        </div>
      </div>

      {/* LIGHTBOX */}
      {mounted && selectedPhoto && selectedPhoto.signedUrl && createPortal(
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/95 backdrop-blur-sm"
          onClick={closeLightbox}
        >
          <button 
            className="absolute top-4 right-4 w-12 h-12 flex items-center justify-center text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors backdrop-blur-md"
            onClick={(e) => {
              e.stopPropagation()
              closeLightbox()
            }}
          >
            <span className="material-symbols-outlined">close</span>
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
