'use client'

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { AdminPageShell } from '@/components/admin/layout/AdminPageShell'
import { AdminPageHeader } from '@/components/admin/layout/AdminPageHeader'
import { updateSaleRequestStatusAction } from '@/actions/sale-requests'
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
  new: 'bg-[#9867db]/10 text-[#d7baff] border-[#9867db]/20',
  in_progress: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  purchased: 'bg-green-500/10 text-green-500 border-green-500/20',
  discarded: 'bg-red-500/10 text-red-500 border-red-500/20'
}

export function SaleRequestDetail({ request, images, tradeInContext }: SaleRequestDetailProps) {
  const router = useRouter()
  
  const formatMoney = (amount: number) => 
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount)
    
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false)
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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(value)
  }

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
      }
    } catch (err) {
      setError('Ocurrió un error al actualizar el estado.')
    } finally {
      setIsUpdating(false)
    }
  }

  const getWhatsAppLink = (phone: string) => {
    let cleanPhone = phone.replace(/[\s\-()]/g, '')
    if (!cleanPhone) return null
    return `https://wa.me/${cleanPhone.startsWith('+') ? cleanPhone.slice(1) : cleanPhone}`
  }

  const whatsappLink = getWhatsAppLink(request.customer_phone)

  return (
    <AdminPageShell>
      <div className="mb-4">
        <Link href="/admin/solicitudes" className="text-sm text-[#A8A8B0] hover:text-white flex items-center gap-1 transition-colors">
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          Volver a solicitudes
        </Link>
      </div>

      <AdminPageHeader
        title={request.device_models?.name || 'Solicitud de venta'}
        subtitle={`Recibida el ${new Date(request.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}`}
        action={
          <span className={`px-3 py-1 rounded-full border text-sm font-medium ${statusColors[request.status] || 'bg-gray-500/10 text-gray-500 border-gray-500/20'}`}>
            {statusLabels[request.status] || request.status}
          </span>
        }
      />

      {(request.status === 'new' || request.status === 'in_progress') && (
        <div className="mb-6 flex justify-end">
          {tradeInContext ? (
            tradeInContext.targetDevice?.status === 'available' ? (
              <TradeInFromRequestForm request={request} tradeInContext={tradeInContext} />
            ) : (
              <div className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg text-sm font-medium">
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
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* COLUMNA PRINCIPAL */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* VALORACIÓN (Si existe) */}
          {request.estimated_min !== null && request.estimated_max !== null && (
            <section className="bg-[#9867db]/10 border border-[#9867db]/20 rounded-xl p-6">
              <h3 className="text-xs font-semibold text-[#d7baff] uppercase tracking-wider mb-1">
                Valoración mostrada al cliente
              </h3>
              <div className="text-2xl font-semibold text-white mb-1">
                {formatMoney(request.estimated_min)} – {formatMoney(request.estimated_max)}
              </div>
              <p className="text-sm text-[#A8A8B0]">
                Importe orientativo calculado antes de enviar la solicitud.
              </p>
            </section>
          )}

          {/* DISPOSITIVO */}
          <section className="bg-[#0B0B0D] border border-[#1F1F24] rounded-xl p-6">
            <h3 className="text-sm font-semibold text-[#A8A8B0] uppercase tracking-wider mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">smartphone</span> Dispositivo
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
              <div className="flex flex-col">
                <span className="text-xs text-[#6E6E78] mb-1">Categoría</span>
                <span className="text-sm text-[#F7F7F7] capitalize">{request.category.replace('_', ' ')}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-[#6E6E78] mb-1">Modelo</span>
                <span className="text-sm text-[#F7F7F7]">{request.device_models?.name || 'N/A'}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-[#6E6E78] mb-1">Almacenamiento</span>
                <span className="text-sm text-[#F7F7F7]">{request.storage || '-'}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-[#6E6E78] mb-1">Color</span>
                <span className="text-sm text-[#F7F7F7]">{request.color || '-'}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-[#6E6E78] mb-1">Estado físico</span>
                <span className="text-sm text-[#F7F7F7]">{conditionLabels[request.device_condition] || request.device_condition}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-[#6E6E78] mb-1">Salud de batería</span>
                <span className="text-sm text-[#F7F7F7]">{request.battery_health ? `${request.battery_health}%` : '-'}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-[#6E6E78] mb-1">Ciclos de carga</span>
                <span className="text-sm text-[#F7F7F7]">{request.battery_cycles ?? '-'}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-[#6E6E78] mb-1">Caja original</span>
                <span className="text-sm text-[#F7F7F7]">{request.has_box ? 'Sí' : 'No'}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-[#6E6E78] mb-1">Cable original</span>
                <span className="text-sm text-[#F7F7F7]">{request.has_cable ? 'Sí' : 'No'}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-[#6E6E78] mb-1">Factura</span>
                <span className="text-sm text-[#F7F7F7]">{request.has_invoice ? 'Sí' : 'No'}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-[#6E6E78] mb-1">Piezas originales</span>
                <span className="text-sm text-[#F7F7F7]">{request.original_parts ? 'Sí' : 'No'}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-[#6E6E78] mb-1">Funcionamiento completo</span>
                <span className="text-sm text-[#F7F7F7]">{request.fully_functional ? 'Sí' : 'No'}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-[#6E6E78] mb-1">Bloqueado</span>
                <span className="text-sm text-[#F7F7F7]">{request.blocked ? 'Sí' : 'No'}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-[#6E6E78] mb-1">Garantía oficial hasta</span>
                <span className="text-sm text-[#F7F7F7]">
                  {request.official_warranty_until 
                    ? new Date(request.official_warranty_until).toLocaleDateString('es-ES') 
                    : '-'}
                </span>
              </div>
            </div>
          </section>

          {/* ESTIMACIÓN */}
          <section className="bg-[#0B0B0D] border border-[#1F1F24] rounded-xl p-6">
            <h3 className="text-sm font-semibold text-[#A8A8B0] uppercase tracking-wider mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">payments</span> Estimación orientativa
            </h3>
            {request.estimated_min !== null && request.estimated_max !== null ? (
              <div className="flex items-center gap-2 text-2xl font-semibold text-[#d7baff]">
                {formatCurrency(request.estimated_min)} – {formatCurrency(request.estimated_max)}
              </div>
            ) : (
              <p className="text-sm text-[#A8A8B0]">Sin estimación</p>
            )}
          </section>

          {/* FOTOS */}
          <section className="bg-[#0B0B0D] border border-[#1F1F24] rounded-xl p-6">
            <h3 className="text-sm font-semibold text-[#A8A8B0] uppercase tracking-wider mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">photo_library</span> Fotos
            </h3>
            {images.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {images.map(img => {
                  const label = photoTypeLabels[img.photo_type] || 'Foto'
                  
                  if (!img.signedUrl) {
                    return (
                      <div key={img.id} className="border border-[#1F1F24] bg-[#131313] rounded-xl overflow-hidden flex flex-col">
                        <div className="aspect-[4/3] bg-black flex items-center justify-center border-b border-[#1F1F24]">
                          <span className="text-sm text-[#A8A8B0]">No se pudo cargar esta foto.</span>
                        </div>
                        <div className="p-3">
                          <p className="text-sm font-medium text-[#F7F7F7]">{label}</p>
                          <p className="text-xs text-[#6E6E78]">Posición: {img.position + 1}</p>
                        </div>
                      </div>
                    )
                  }
                  
                  return (
                    <div 
                      key={img.id} 
                      className="border border-[#1F1F24] bg-[#131313] rounded-xl overflow-hidden flex flex-col cursor-pointer hover:border-[#9867db]/50 transition-colors"
                      onClick={() => openLightbox(img)}
                    >
                      <div className="aspect-[4/3] bg-black border-b border-[#1F1F24]">
                        <img 
                          src={img.signedUrl} 
                          alt={label} 
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="p-3">
                        <p className="text-sm font-medium text-[#F7F7F7]">{label}</p>
                        <p className="text-xs text-[#6E6E78]">Posición: {img.position + 1}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-sm text-[#A8A8B0]">Sin fotos adjuntas</p>
            )}
          </section>
        </div>

        {/* COLUMNA SECUNDARIA */}
        <div className="space-y-6">
          
          {/* ACCIONES DE ESTADO */}
          <section className="bg-[#0B0B0D] border border-[#1F1F24] rounded-xl p-6">
            <h3 className="text-sm font-semibold text-[#A8A8B0] uppercase tracking-wider mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">update</span> Estado
            </h3>
            
            {request.status === 'purchased' ? (
              <div className="flex flex-col gap-2">
                <span className="inline-flex w-fit px-3 py-1 rounded-full border bg-green-500/10 text-green-500 border-green-500/20 text-sm font-medium">
                  Comprado
                </span>
                <p className="text-xs text-[#A8A8B0]">
                  Esta solicitud ya fue convertida en una compra.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <label className="text-xs text-[#6E6E78]">Cambiar estado</label>
                <select
                  value={request.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  disabled={isUpdating}
                  className="w-full bg-[#131313] text-white border border-[#1F1F24] rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#9867db] transition-colors disabled:opacity-50"
                >
                  <option value="new">Nueva</option>
                  <option value="in_progress">En proceso</option>
                  <option value="discarded">Descartada</option>
                </select>
              </div>
            )}
            
            {/* Modal de confirmación de descarte */}
            {showDiscardConfirm && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                <div className="bg-[#0B0B0D] border border-[#1F1F24] rounded-2xl p-6 w-full max-w-sm">
                  <h3 className="text-lg font-semibold text-white mb-2">¿Descartar esta solicitud?</h3>
                  <p className="text-sm text-[#A8A8B0] mb-6">
                    La solicitud quedará archivada como descartada, pero no se eliminará.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowDiscardConfirm(false)}
                      className="flex-1 px-4 py-2 bg-[#131313] border border-[#1F1F24] text-white rounded-lg text-sm font-medium hover:bg-[#1F1F24] transition-colors"
                      disabled={isUpdating}
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => updateStatus('discarded')}
                      className="flex-1 px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg text-sm font-medium hover:bg-red-500/20 transition-colors"
                      disabled={isUpdating}
                    >
                      {isUpdating ? 'Guardando...' : 'Descartar'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* CLIENTE */}
          <section className="bg-[#0B0B0D] border border-[#1F1F24] rounded-xl p-6">
            <h3 className="text-sm font-semibold text-[#A8A8B0] uppercase tracking-wider mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">person</span> Cliente
            </h3>
            
            <div className="flex flex-col gap-4">
              <div className="flex flex-col">
                <span className="text-xs text-[#6E6E78] mb-1">Nombre</span>
                <span className="text-sm text-[#F7F7F7]">{request.customer_name}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-[#6E6E78] mb-1">Teléfono</span>
                <span className="text-sm text-[#F7F7F7]">{request.customer_phone}</span>
              </div>
              {request.customer_location && (
                <div className="flex flex-col">
                  <span className="text-xs text-[#6E6E78] mb-1">Ubicación</span>
                  <span className="text-sm text-[#F7F7F7]">{request.customer_location}</span>
                </div>
              )}
              
              {whatsappLink && (
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 w-full py-2 bg-[#131313] border border-[#1F1F24] hover:bg-[#1F1F24] text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">chat</span>
                  Contactar por WhatsApp
                </a>
              )}
            </div>
          </section>

          {/* ORIGEN / NOTES */}
          <section className="bg-[#0B0B0D] border border-[#1F1F24] rounded-xl p-6">
            <h3 className="text-sm font-semibold text-[#A8A8B0] uppercase tracking-wider mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">info</span> Información adicional
            </h3>
            
            <div className="flex flex-col gap-4">
              <div className="flex flex-col">
                <span className="text-xs text-[#6E6E78] mb-1">Origen</span>
                <span className="text-sm text-[#F7F7F7]">{request.source ? (sourceLabels[request.source] || request.source) : '-'}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-[#6E6E78] mb-1">Notas</span>
                <span className="text-sm text-[#F7F7F7] whitespace-pre-wrap">{request.notes || '-'}</span>
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
            className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors"
            onClick={(e) => {
              e.stopPropagation()
              closeLightbox()
            }}
          >
            <span className="material-symbols-outlined">close</span>
          </button>
          
          <div className="w-full max-w-5xl h-full max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex-1 min-h-0 relative">
              <img 
                src={selectedPhoto.signedUrl} 
                alt={photoTypeLabels[selectedPhoto.photo_type] || 'Foto'} 
                className="w-full h-full object-contain"
              />
            </div>
            <div className="shrink-0 pt-4 text-center">
              <p className="text-lg font-medium text-white">{photoTypeLabels[selectedPhoto.photo_type] || 'Foto'}</p>
            </div>
          </div>
        </div>,
        document.body
      )}
    </AdminPageShell>
  )
}
