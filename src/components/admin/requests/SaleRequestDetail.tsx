'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { AdminPageShell } from '@/components/admin/layout/AdminPageShell'
import { AdminPageHeader } from '@/components/admin/layout/AdminPageHeader'
import { updateSaleRequestStatusAction } from '@/actions/sale-requests'

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
  position: number
  created_at: string
}

type SaleRequestDetailProps = {
  request: SaleRequest
  images: SaleRequestImage[]
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

export function SaleRequestDetail({ request, images }: SaleRequestDetailProps) {
  const router = useRouter()
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false)

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

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* COLUMNA PRINCIPAL */}
        <div className="lg:col-span-2 space-y-6">
          
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
              <div className="text-sm text-[#F7F7F7]">
                Se han adjuntado {images.length} foto{images.length !== 1 ? 's' : ''} a esta solicitud.
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
    </AdminPageShell>
  )
}
