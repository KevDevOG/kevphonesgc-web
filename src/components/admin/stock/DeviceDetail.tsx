'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { deleteDeviceAction, publishDeviceAction } from '@/actions/devices'
import { EditTradeInForm } from '@/components/admin/stock/EditTradeInForm'
import { CancelTradeInDialog } from '@/components/admin/stock/CancelTradeInDialog'
import { StoryGeneratorModal } from '@/components/admin/stock/StoryGeneratorModal'

type Device = {
  id: string
  model_id?: string
  storage: string | null
  color: string | null
  size: string | null
  connectivity: string | null
  chip: string | null
  memory: string | null
  case_type: string | null
  case_material: string | null
  imei_serial: string | null
  battery_health: number | null
  battery_cycles: number | null
  condition: string
  has_box: boolean
  has_cable: boolean
  has_invoice: boolean
  warranty_until: string | null
  original_parts: boolean
  fully_functional: boolean
  purchase_price: number
  listing_price: number
  discount_price?: number | null
  purchase_location: string | null
  purchased_at: string
  status: string
  is_published: boolean
  internal_notes: string | null
  custom_product_type?: string | null
  custom_specs?: Record<string, any> | string | null
  device_models: {
    category: string
    brand?: string
    name: string
    supports_battery_health: boolean
    supports_cycles: boolean
  } | any
  device_images: {
    id: string
    storage_path: string
    position: number
  }[]
  clients: {
    name: string
    phone: string
    location: string | null
  } | null
}

const conditionMap: Record<string, string> = {
  'sealed': 'Precintado',
  'like_new': 'Como nuevo',
  'good': 'Buen estado',
  'marked': 'Con marcas'
}

const categoryMap: Record<string, string> = {
  'iphone': 'iPhone',
  'apple_watch': 'Apple Watch',
  'airpods': 'AirPods',
  'ipad': 'iPad',
  'ps5': 'PlayStation',
  'nintendo_switch': 'Nintendo Switch',
  'other': 'Otro'
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

function getDeviceTitle(device: Device): string {
  const modelName = device.device_models?.name || ''
  if (device.device_models?.category !== 'other') {
    return modelName
  }
  const brand = (device.device_models?.brand || '').trim()
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

function getTechnicalSpecsRows(device: Device): { label: string; value: string }[] {
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

type SaleData = {
  final_sale_price: number | string | null
  sold_at: string | null
  sale_location: string | null
  observations: string | null
  clients: { name: string; phone: string; location: string | null } | null
} | null

type TradeInContext = {
  direction: 'outgoing' | 'incoming'
  id: string
  saleId: string
  receivedDeviceId: string
  saleRequestId: string | null
  finalSalePrice: number
  soldAt: string
  saleLocation: string | null
  saleObservations: string | null
  purchaseLocation: string | null
  receivedListingPrice: number
  outgoingDevice: {
    id: string
    storage: string | null
    color: string | null
    modelName: string
  }
  incomingDevice: {
    id: string
    storage: string | null
    color: string | null
    purchasePrice: number
    modelName: string
  }
} | null

export function DeviceDetail({ 
  device, 
  tradeInContext,
  saleData,
  catalogImages
}: { 
  device: Device
  saleData?: SaleData
  tradeInContext?: TradeInContext
  catalogImages?: { model_id: string; color: string; storage_path: string }[]
}) {
  const router = useRouter()
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  
  const [isPublishing, setIsPublishing] = useState(false)
  const [publishError, setPublishError] = useState<string | null>(null)

  const [isEditingTradeIn, setIsEditingTradeIn] = useState(false)
  const [isCancelingTradeIn, setIsCancelingTradeIn] = useState(false)

  const [showStoryGenerator, setShowStoryGenerator] = useState(false)

  const [activeImageIndex, setActiveImageIndex] = useState(0)

  const handleDelete = async () => {
    setIsDeleting(true)
    setDeleteError(null)
    const result = await deleteDeviceAction(device.id)
    if (result.error) {
      setDeleteError(result.error)
      setIsDeleting(false)
      setShowConfirmDelete(false)
    } else {
      router.push('/admin/stock')
    }
  }

  const handlePublish = async () => {
    setIsPublishing(true)
    setPublishError(null)
    const result = await publishDeviceAction(device.id)
    if (result.error) {
      setPublishError(result.error)
      setIsPublishing(false)
    }
  }

  const model = device.device_models
  const images = device.device_images || []
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  
  const formatPrice = (val: number) => {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(val)
  }

  const effectivePrice = device.discount_price ?? device.listing_price
  const potentialProfit = Number(effectivePrice) - Number(device.purchase_price)
  const recordedSalePrice = saleData?.final_sale_price !== null && saleData?.final_sale_price !== undefined
    ? Number(saleData.final_sale_price)
    : tradeInContext ? tradeInContext.finalSalePrice : null
  const displayedSalePrice = device.status === 'available' ? Number(effectivePrice) : recordedSalePrice ?? Number(device.listing_price)
  const displayedProfit = device.status === 'available' ? potentialProfit : recordedSalePrice !== null ? recordedSalePrice - Number(device.purchase_price) : null

  
  const formatDate = (dateString: string) => {
    const d = new Date(dateString)
    return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  const activeImageUrl = images.length > 0 && supabaseUrl 
    ? `${supabaseUrl}/storage/v1/object/public/device-images/${images[activeImageIndex]?.storage_path}` 
    : null

  return (
    <div className="admin-device">
      
      {/* 1. Header & Back Link */}
      <header className="admin-device__header">
        <Link href="/admin/stock" className="inline-flex items-center gap-1.5 text-sm font-semibold text-zinc-400 hover:text-white transition-colors w-fit">
          <span aria-hidden="true" className="material-symbols-outlined text-[18px]">arrow_back</span>
          Volver a Stock
        </Link>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="admin-device__title">
              {getDeviceTitle(device)}
            </h1>
            <p className="text-sm font-semibold text-zinc-400">
              {model?.category === 'other'
                ? [getOtherProductTypeLabel(device.custom_product_type), device.storage, device.color].filter(Boolean).join(' · ')
                : (model?.category === 'apple_watch' ? [device.size, device.connectivity, device.case_material, device.color] : model?.category === 'airpods' ? [device.case_type, device.color] : [device.storage, device.color]).filter(Boolean).join(' · ')}
            </p>
          </div>
          <div data-status={device.status} data-published={device.is_published} className={`admin-device__status px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider ${device.status === 'available' ? (device.is_published ? 'bg-[#22c55e]/10 text-[#22c55e]' : 'bg-orange-500/10 text-orange-400') : 'bg-[#1F1F24] text-zinc-400'}`}>
            {device.status === 'available' ? (device.is_published ? 'Disponible · Publicado' : 'Disponible · Oculto') : 'Vendido'}
          </div>
        </div>
        <div className="admin-device__actions">
          {device.status === 'available' && (
            <div className="admin-device__action-group" role="group" aria-label="Venta y publicación">
              <Link className="admin-device__primary" href={`/admin/stock/${device.id}/vender`}>Vender dispositivo</Link>
              {!device.is_published && <button type="button" disabled={isPublishing} onClick={handlePublish}>{isPublishing ? 'Publicando...' : 'Publicar'}</button>}
            </div>
          )}
          {(device.status === 'available' || model?.category === 'iphone') && (
            <div className="admin-device__action-group admin-device__action-group--secondary" role="group" aria-label="Herramientas del dispositivo">
              {device.status === 'available' && <>
                <Link href={`/admin/stock/${device.id}/editar`}>Editar</Link>
                <Link href={`/admin/stock/nuevo?duplicate=${device.id}`}>Duplicar</Link>
              </>}
              {model?.category === 'iphone' && <button type="button" onClick={() => setShowStoryGenerator(true)}>
                <span aria-hidden="true" className="material-symbols-outlined text-[20px] text-yellow-300">auto_awesome</span>
                Generar contenido
              </button>}
            </div>
          )}
          {device.status === 'available' && !showConfirmDelete && <div className="admin-device__action-group admin-device__action-group--destructive">
            <button type="button" className="admin-device__destructive" onClick={() => setShowConfirmDelete(true)}>Eliminar</button>
          </div>}
        </div>
        {publishError && <p role="alert" className="admin-device__error">{publishError}</p>}
            {showConfirmDelete && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-5 flex flex-col gap-4 mt-2">
                <h4 className="text-red-400 font-bold text-sm">¿Eliminar este dispositivo?</h4>
                <p className="text-red-400/80 text-xs leading-relaxed">
                  Esta acción eliminará permanentemente el dispositivo y sus fotos del stock.
                </p>
                {deleteError && (
                  <p className="text-red-400 text-xs font-semibold">{deleteError}</p>
                )}
                <div className="flex gap-3 mt-1">
                  <button 
                    type="button"
                    disabled={isDeleting}
                    onClick={() => setShowConfirmDelete(false)}
                    className="flex-1 bg-transparent hover:bg-red-500/10 border border-red-500/30 text-red-400 py-2.5 rounded-lg text-sm font-bold disabled:opacity-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="button"
                    disabled={isDeleting}
                    onClick={handleDelete}
                    className="flex-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 py-2.5 rounded-lg text-sm font-bold disabled:opacity-50 flex items-center justify-center transition-colors"
                  >
                    {isDeleting ? '...' : 'Eliminar'}
                  </button>
                </div>
              </div>
            )}
      </header>

      {/* Main Desktop Grid */}
      <div className="admin-device__overview">
        
        {/* Financial summary */}
        <section className="admin-device__financial-record">
          
          <dl className="admin-device__finance">
            <div><dt>Compra</dt><dd>{formatPrice(device.purchase_price)}</dd></div>
            <div><dt>{device.status === 'available' ? 'Venta anunciada' : recordedSalePrice !== null ? 'Venta final' : 'Precio anunciado'}</dt><dd>{formatPrice(displayedSalePrice)}</dd>
              {device.status === 'available' && device.discount_price ? <>
                <del>{formatPrice(device.listing_price)}</del>
                <small>Descuento: {Math.round(((device.listing_price - device.discount_price) / device.listing_price) * 100)}%</small>
              </> : null}
            </div>
            <div><dt>{device.status === 'available' ? 'Margen potencial' : 'Beneficio registrado'}</dt><dd data-tone={displayedProfit === null || displayedProfit === 0 ? 'neutral' : displayedProfit > 0 ? 'positive' : 'negative'}>{displayedProfit === null ? '—' : `${displayedProfit > 0 ? '+' : ''}${formatPrice(displayedProfit)}`}</dd></div>
          </dl>
          {device.status === 'sold' && !saleData && !tradeInContext && <p className="admin-device__muted">Sin importe de venta registrado.</p>}

        </section>

        {/* LEFT / TOP: Gallery */}
        <section className="admin-device__gallery">
          <div className="admin-device__stage">
            {activeImageUrl ? (
              <img 
                className="w-full h-full object-contain" 
                src={activeImageUrl} 
                alt={getDeviceTitle(device)}
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-zinc-600 gap-2">
                <span aria-hidden="true" className="material-symbols-outlined text-4xl">no_photography</span>
                <span className="text-sm font-semibold">Sin fotos</span>
              </div>
            )}
          </div>
          
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 snap-x">
              {images.map((img, idx) => (
                <button
                  key={img.id}
                  aria-label={`Ver foto ${idx + 1}`}
                  aria-pressed={activeImageIndex === idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`snap-start flex-shrink-0 w-16 h-16 rounded-xl border overflow-hidden transition-all ${activeImageIndex === idx ? 'border-[#7a32d4] ring-2 ring-[#7a32d4]/30' : 'border-[#1F1F24] hover:border-zinc-600'} bg-[#0B0B0E] p-1`}
                >
                  <img 
                    className="w-full h-full object-cover rounded-lg" 
                    src={`${supabaseUrl}/storage/v1/object/public/device-images/${img.storage_path}`} 
                    alt="" 
                  />
                </button>
              ))}
            </div>
          )}
        </section>

      </div>

      {/* Device, functionality, purchase/seller, sale and internal record. */}
      <div className="admin-device__record">
          <section className="admin-device__section">
            <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-5">Dispositivo</h2>
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-zinc-500">Categoría</span>
                <span className="text-sm font-semibold text-white">{model?.category ? (categoryMap[model.category] || model.category) : ''}</span>
              </div>
              {model?.category === 'other' && device.custom_product_type && (
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-zinc-500">Tipo de producto</span>
                  <span className="text-sm font-semibold text-white">{getOtherProductTypeLabel(device.custom_product_type)}</span>
                </div>
              )}
              {model?.brand && (
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-zinc-500">Marca</span>
                  <span className="text-sm font-semibold text-white">{model.brand}</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-zinc-500">Modelo</span>
                <span className="text-sm font-semibold text-white">{model?.name}</span>
              </div>
              {model?.category !== 'other' && device.storage && (
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-zinc-500">Capacidad</span>
                  <span className="text-sm font-semibold text-white">{device.storage}</span>
                </div>
              )}
              {model?.category !== 'other' && device.color && (
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-zinc-500">Color</span>
                  <span className="text-sm font-semibold text-white">{device.color}</span>
                </div>
              )}
              {device.size && (
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-zinc-500">Tamaño</span>
                  <span className="text-sm font-semibold text-white">{device.size}</span>
                </div>
              )}
              {device.connectivity && (
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-zinc-500">Conectividad</span>
                  <span className="text-sm font-semibold text-white">{device.connectivity}</span>
                </div>
              )}
              {device.case_material && (
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-zinc-500">Material de caja</span>
                  <span className="text-sm font-semibold text-white">{device.case_material}</span>
                </div>
              )}
              {device.case_type && (
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-zinc-500">Tipo de estuche</span>
                  <span className="text-sm font-semibold text-white">{device.case_type}</span>
                </div>
              )}
              {device.chip && (
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-zinc-500">Chip</span>
                  <span className="text-sm font-semibold text-white">{device.chip}</span>
                </div>
              )}
              {device.memory && (
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-zinc-500">Memoria</span>
                  <span className="text-sm font-semibold text-white">{device.memory}</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-zinc-500">Estado Físico</span>
                <span className="text-sm font-semibold text-white">{conditionMap[device.condition] || device.condition}</span>
              </div>
            </div>
            {model?.category === 'other' && (() => {
              const techSpecs = getTechnicalSpecsRows(device)
              if (techSpecs.length === 0) return null
              return (
                <div className="admin-device__subsection">
                  <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-5">Especificaciones técnicas</h3>
                  <div className="flex flex-col gap-4">
                    {techSpecs.map((row, idx) => (
                      <div key={idx} className="flex justify-between items-center gap-4">
                        <span className="text-sm font-medium text-zinc-500 flex-shrink-0">{row.label}</span>
                        <span className="text-sm font-semibold text-white text-right break-words">{row.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })()}
            {(device.battery_health !== null || device.battery_cycles !== null) && (
              <div className="admin-device__subsection">
                <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-5">Batería</h3>
                <div className="flex flex-col gap-4">
                  {device.battery_health !== null && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-zinc-500">Salud</span>
                      <span className="text-sm font-semibold text-white">{device.battery_health}%</span>
                    </div>
                  )}
                  {device.battery_cycles !== null && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-zinc-500">Ciclos</span>
                      <span className="text-sm font-semibold text-white">{device.battery_cycles}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>

          <section className="admin-device__section">
            <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-5">Funcionamiento</h2>
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-zinc-500">Garantía oficial</span>
                <span className="text-sm font-semibold text-white">
                  {device.warranty_until ? `Hasta ${formatDate(device.warranty_until)}` : 'No'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-zinc-500">Piezas originales</span>
                <span className={`text-sm font-bold ${device.original_parts ? 'text-white' : 'text-red-400'}`}>{device.original_parts ? 'Sí' : 'No'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-zinc-500">Funciona correctamente</span>
                <span className={`text-sm font-bold ${device.fully_functional ? 'text-white' : 'text-red-400'}`}>{device.fully_functional ? 'Sí' : 'No'}</span>
              </div>
            </div>
            <div className="admin-device__subsection">
              <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-5">Accesorios</h3>
              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-zinc-500">Caja</span>
                  <span className={`text-sm font-bold ${device.has_box ? 'text-white' : 'text-zinc-500'}`}>{device.has_box ? 'Sí' : 'No'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-zinc-500">Cable</span>
                  <span className={`text-sm font-bold ${device.has_cable ? 'text-white' : 'text-zinc-500'}`}>{device.has_cable ? 'Sí' : 'No'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-zinc-500">Factura</span>
                  <span className={`text-sm font-bold ${device.has_invoice ? 'text-white' : 'text-zinc-500'}`}>{device.has_invoice ? 'Sí' : 'No'}</span>
                </div>
              </div>
            </div>
          </section>

          <section className="admin-device__section">
            <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-5">Compra</h2>
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-zinc-500">Precio</span>
                <span className="text-sm font-semibold text-white">{formatPrice(device.purchase_price)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-zinc-500">Fecha</span>
                <span className="text-sm font-semibold text-white">{formatDate(device.purchased_at)}</span>
              </div>
              {device.purchase_location && (
                <div className="flex flex-col gap-1.5 mt-2 pt-4 border-t border-[#1F1F24]/50">
                  <span className="text-xs font-bold text-zinc-500 uppercase">Lugar de compra</span>
                  <span className="text-sm font-medium text-white">{device.purchase_location}</span>
                </div>
              )}
              {device.clients && (
                <div className="flex flex-col gap-1.5 mt-2 pt-4 border-t border-[#1F1F24]/50">
                  <span className="text-xs font-bold text-zinc-500 uppercase">Vendedor</span>
                  <span className="text-sm font-medium text-white">{device.clients.name}</span>
                  <span className="text-xs font-mono text-zinc-400">{device.clients.phone}</span>
                  {device.clients.location && (
                    <span className="text-xs text-zinc-400">{device.clients.location}</span>
                  )}
                </div>
              )}
            </div>
          </section>

          {device.status === 'sold' && saleData && <section className="admin-device__section admin-device__sale">
            <h2>Venta registrada</h2>
            <dl>
              {saleData.sold_at && <div><dt>Fecha de venta</dt><dd>{formatDate(saleData.sold_at)}</dd></div>}
              {saleData.clients?.name && <div><dt>Comprador</dt><dd>{saleData.clients.name}</dd></div>}
              {saleData.clients?.phone && <div><dt>Teléfono</dt><dd>{saleData.clients.phone}</dd></div>}
              {saleData.clients?.location && <div><dt>Ubicación del comprador</dt><dd>{saleData.clients.location}</dd></div>}
              {saleData.sale_location && <div><dt>Lugar de venta</dt><dd>{saleData.sale_location}</dd></div>}
              {saleData.observations && <div><dt>Observaciones de venta</dt><dd className="whitespace-pre-wrap">{saleData.observations}</dd></div>}
            </dl>
          </section>}

          {tradeInContext && (
            <div className="admin-device__section admin-device__trade-in">
              <div className="flex justify-between items-start mb-5">
                <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Parte de pago</h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#d7baff]/10 text-[#d7baff]">
                  {tradeInContext.direction === 'outgoing' ? 'Entregado' : 'Recibido'}
                </span>
              </div>
              
              <div className="flex flex-col gap-5">
                {/* Outgoing */}
                <div className="flex justify-between items-center p-3 bg-[#121217] rounded-xl border border-[#1F1F24]">
                  <div className="flex flex-col gap-0.5 min-w-0 pr-4">
                    <span className="text-[10px] uppercase font-bold text-zinc-500">Entregado al cliente</span>
                    <Link href={`/admin/stock/${tradeInContext.outgoingDevice.id}`} className="text-sm font-semibold text-white hover:text-[#d7baff] transition-colors truncate">
                      {tradeInContext.outgoingDevice.modelName}
                    </Link>
                  </div>
                  <span className="text-sm font-bold text-white whitespace-nowrap">{formatPrice(tradeInContext.finalSalePrice)}</span>
                </div>
                
                {/* Incoming */}
                <div className="flex justify-between items-center p-3 bg-[#121217] rounded-xl border border-[#1F1F24]">
                  <div className="flex flex-col gap-0.5 min-w-0 pr-4">
                    <span className="text-[10px] uppercase font-bold text-zinc-500">Recibido del cliente</span>
                    <Link href={`/admin/stock/${tradeInContext.incomingDevice.id}`} className="text-sm font-semibold text-white hover:text-[#d7baff] transition-colors truncate">
                      {tradeInContext.incomingDevice.modelName}
                    </Link>
                  </div>
                  <span className="text-sm font-bold text-white whitespace-nowrap">{formatPrice(tradeInContext.incomingDevice.purchasePrice)}</span>
                </div>

                <div className="flex justify-between items-center pt-2">
                  {(() => {
                    const diff = tradeInContext.finalSalePrice - tradeInContext.incomingDevice.purchasePrice
                    if (diff > 0) {
                      return (
                        <>
                          <span className="text-xs font-semibold text-zinc-400">Diferencia cobrada</span>
                          <span className="text-lg font-bold text-white">{formatPrice(diff)}</span>
                        </>
                      )
                    } else if (diff < 0) {
                      return (
                        <>
                          <span className="text-xs font-semibold text-zinc-400">Diferencia pagada</span>
                          <span className="text-lg font-bold text-amber-400">{formatPrice(Math.abs(diff))}</span>
                        </>
                      )
                    } else {
                      return (
                        <>
                          <span className="text-xs font-semibold text-zinc-400">Sin diferencia</span>
                          <span className="text-lg font-bold text-zinc-500">{formatPrice(0)}</span>
                        </>
                      )
                    }
                  })()}
                </div>

                {tradeInContext.saleLocation && (
                  <div className="flex flex-col gap-1.5 mt-2 pt-4 border-t border-[#1F1F24]/50">
                    <span className="text-xs font-bold text-zinc-500 uppercase">Lugar de operación</span>
                    <span className="text-sm font-medium text-white">{tradeInContext.saleLocation}</span>
                  </div>
                )}
                
                {tradeInContext.saleObservations && (
                  <div className="flex flex-col gap-1.5 mt-2 pt-4 border-t border-[#1F1F24]/50">
                    <span className="text-xs font-bold text-zinc-500 uppercase">Observaciones</span>
                    <span className="text-sm font-medium text-zinc-300 italic">{tradeInContext.saleObservations}</span>
                  </div>
                )}

                {tradeInContext.saleRequestId && (
                  <div className="mt-2 text-center">
                    <Link href={`/admin/solicitudes/${tradeInContext.saleRequestId}`} className="text-xs font-medium text-zinc-400 hover:text-white underline underline-offset-4 transition-colors">
                      Ver solicitud original
                    </Link>
                  </div>
                )}
                
                <div className="flex gap-2 mt-2 pt-4 border-t border-[#1F1F24]/50">
                  <button 
                    onClick={() => setIsCancelingTradeIn(true)}
                    className="flex-1 bg-transparent hover:bg-red-500/10 text-red-400 border border-red-500/20 py-2 rounded-xl text-xs font-bold transition-colors"
                  >
                    Anular
                  </button>
                  <button 
                    onClick={() => setIsEditingTradeIn(true)}
                    className="flex-1 bg-[#121217] hover:bg-[#1F1F24] border border-[#1F1F24] text-white py-2 rounded-xl text-xs font-bold transition-colors"
                  >
                    Editar operación
                  </button>
                </div>
              </div>
            </div>
          )}

        <section className="admin-device__section admin-device__internal">
          <h2>Datos internos</h2>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-zinc-500">IMEI / Serie</span>
            <span className="text-sm font-mono text-zinc-300">{device.imei_serial || 'No registrado'}</span>
          </div>
          {device.internal_notes && (
            <div className="admin-device__subsection">
              <h3 className="text-sm font-bold text-amber-500/80 uppercase tracking-wider mb-3">Notas internas</h3>
              <p className="text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed">{device.internal_notes}</p>
            </div>
          )}
        </section>
      </div>

      {/* Trade-In Modals */}
      {isEditingTradeIn && tradeInContext && (
        <EditTradeInForm 
          context={tradeInContext} 
          onClose={() => setIsEditingTradeIn(false)} 
        />
      )}

      {isCancelingTradeIn && tradeInContext && (
        <CancelTradeInDialog 
          context={tradeInContext} 
          onClose={() => setIsCancelingTradeIn(false)} 
        />
      )}

      {/* Social Story Generator Modal */}
      {showStoryGenerator && (
        <StoryGeneratorModal
          device={device as any}
          catalogImages={catalogImages}
          isOpen={showStoryGenerator}
          onClose={() => setShowStoryGenerator(false)}
        />
      )}
    </div>
  )
}
