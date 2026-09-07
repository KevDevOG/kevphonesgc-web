'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { deleteDeviceAction } from '@/actions/devices'
import { EditTradeInForm } from '@/components/admin/stock/EditTradeInForm'
import { CancelTradeInDialog } from '@/components/admin/stock/CancelTradeInDialog'

type Device = {
  id: string
  storage: string | null
  color: string | null
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
  purchase_location: string | null
  purchased_at: string
  status: string
  internal_notes: string | null
  created_at: string
  device_models: {
    category: string
    brand: string
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
  'ps5': 'PS5',
  'nintendo_switch': 'Nintendo Switch'
}

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

export function DeviceDetail({ device, tradeInContext }: { device: Device, tradeInContext?: TradeInContext }) {
  const router = useRouter()
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  
  const [isEditingTradeIn, setIsEditingTradeIn] = useState(false)
  const [isCancelingTradeIn, setIsCancelingTradeIn] = useState(false)

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

  const model = device.device_models
  const images = device.device_images || []
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  
  const formatPrice = (val: number) => {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(val)
  }

  const potentialProfit = Number(device.listing_price) - Number(device.purchase_price)
  
  const formatDate = (dateString: string) => {
    const d = new Date(dateString)
    return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  const activeImageUrl = images.length > 0 && supabaseUrl 
    ? `${supabaseUrl}/storage/v1/object/public/device-images/${images[activeImageIndex]?.storage_path}` 
    : null

  return (
    <div className="flex flex-col gap-6 lg:gap-8 w-full max-w-6xl mx-auto text-white">
      
      {/* 1. Header & Back Link */}
      <header className="flex flex-col gap-4">
        <Link href="/admin/stock" className="inline-flex items-center gap-1.5 text-sm font-semibold text-zinc-400 hover:text-white transition-colors w-fit">
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Volver a Stock
        </Link>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-none mb-1.5">
              {model?.name}
            </h1>
            <p className="text-sm font-semibold text-zinc-400">
              {[device.storage, device.color].filter(Boolean).join(' · ')}
            </p>
          </div>
          <div className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider ${device.status === 'available' ? 'bg-[#22c55e]/10 text-[#22c55e]' : 'bg-[#1F1F24] text-zinc-400'}`}>
            {device.status === 'available' ? 'Disponible' : 'Vendido'}
          </div>
        </div>
      </header>

      {/* Main Desktop Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.1fr)_minmax(340px,0.9fr)] gap-6 lg:gap-8 items-start">
        
        {/* LEFT / TOP: Gallery */}
        <section className="flex flex-col gap-3">
          <div className="w-full aspect-square bg-[#0B0B0E] border border-[#1F1F24] rounded-2xl overflow-hidden flex items-center justify-center p-6 relative">
            {activeImageUrl ? (
              <img 
                className="w-full h-full object-contain" 
                src={activeImageUrl} 
                alt={model?.name}
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-zinc-600 gap-2">
                <span className="material-symbols-outlined text-4xl">no_photography</span>
                <span className="text-sm font-semibold">Sin fotos</span>
              </div>
            )}
          </div>
          
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 snap-x">
              {images.map((img, idx) => (
                <button
                  key={img.id}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`snap-start flex-shrink-0 w-16 h-16 rounded-xl border overflow-hidden transition-all ${activeImageIndex === idx ? 'border-[#7a32d4] ring-2 ring-[#7a32d4]/30' : 'border-[#1F1F24] hover:border-zinc-600'} bg-[#0B0B0E] p-1`}
                >
                  <img 
                    className="w-full h-full object-cover rounded-lg" 
                    src={`${supabaseUrl}/storage/v1/object/public/device-images/${img.storage_path}`} 
                    alt="Thumbnail" 
                  />
                </button>
              ))}
            </div>
          )}
        </section>

        {/* RIGHT / MIDDLE: Price Summary & Main Actions */}
        <section className="flex flex-col gap-6">
          
          {/* Financials Box */}
          <div className="bg-[#0B0B0E] border border-[#1F1F24] rounded-2xl p-6 flex flex-col gap-4">
            {device.status === 'available' ? (
              <>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Precio de venta</span>
                  <span className="text-4xl font-semibold text-white">{formatPrice(device.listing_price)}</span>
                </div>
                <div className="h-px bg-[#1F1F24] w-full my-2"></div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-zinc-400">Precio de compra</span>
                  <span className="text-base font-medium text-zinc-300">{formatPrice(device.purchase_price)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-zinc-400">Margen potencial</span>
                  <span className={`text-base font-bold ${potentialProfit >= 0 ? 'text-[#d7baff]' : 'text-red-400'}`}>
                    {potentialProfit > 0 ? '+' : ''}{formatPrice(potentialProfit)}
                  </span>
                </div>
              </>
            ) : (
              <>
                {/* Sold Context - since we don't fetch sale_data directly in page.tsx unless it's a trade-in */}
                {tradeInContext ? (
                  <>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Vendido por (Parte de pago)</span>
                      <span className="text-4xl font-semibold text-[#d7baff]">{formatPrice(tradeInContext.finalSalePrice)}</span>
                    </div>
                    <div className="h-px bg-[#1F1F24] w-full my-2"></div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold text-zinc-400">Precio de compra</span>
                      <span className="text-base font-medium text-zinc-300">{formatPrice(device.purchase_price)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold text-zinc-400">Margen final</span>
                      <span className="text-base font-bold text-[#d7baff]">
                        {formatPrice(tradeInContext.finalSalePrice - device.purchase_price)}
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Precio de venta registrado</span>
                      <span className="text-4xl font-semibold text-zinc-300">{formatPrice(device.listing_price)}</span>
                    </div>
                    <div className="h-px bg-[#1F1F24] w-full my-2"></div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold text-zinc-400">Precio de compra</span>
                      <span className="text-base font-medium text-zinc-300">{formatPrice(device.purchase_price)}</span>
                    </div>
                  </>
                )}
              </>
            )}
          </div>

          {/* Main Actions */}
          <div className="flex flex-col gap-3">
            {device.status === 'available' && (
              <>
                <Link href={`/admin/stock/${device.id}/vender`} className="w-full bg-[#7a32d4]/10 hover:bg-[#7a32d4]/20 border border-[#7a32d4]/30 text-[#d7baff] font-bold text-sm py-3.5 px-4 rounded-xl transition-colors flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-[20px]">sell</span>
                  Vender dispositivo
                </Link>
                <Link href={`/admin/stock/${device.id}/editar`} className="w-full bg-[#121217] hover:bg-[#1F1F24] border border-[#1F1F24] text-white font-semibold text-sm py-3.5 px-4 rounded-xl transition-colors flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-[20px]">edit</span>
                  Editar
                </Link>
                {!showConfirmDelete && (
                  <button onClick={() => setShowConfirmDelete(true)} className="w-full bg-transparent hover:bg-red-500/10 text-red-400 font-semibold text-sm py-3.5 px-4 rounded-xl transition-colors mt-2 flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-[20px]">delete</span>
                    Eliminar
                  </button>
                )}
              </>
            )}

            {/* Confirm Delete Modals/Inline */}
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
          </div>
        </section>
      </div>

      {/* LOWER CONTENT: Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 border-t border-[#1F1F24] pt-8">
        
        {/* Left Column: Tech Specs */}
        <div className="flex flex-col gap-6">
          
          <div className="bg-[#0B0B0E] border border-[#1F1F24] rounded-2xl p-6">
            <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-5">Dispositivo</h3>
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-zinc-500">Categoría</span>
                <span className="text-sm font-semibold text-white">{model?.category ? (categoryMap[model.category] || model.category) : ''}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-zinc-500">Modelo</span>
                <span className="text-sm font-semibold text-white">{model?.name}</span>
              </div>
              {device.storage && (
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-zinc-500">Capacidad</span>
                  <span className="text-sm font-semibold text-white">{device.storage}</span>
                </div>
              )}
              {device.color && (
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-zinc-500">Color</span>
                  <span className="text-sm font-semibold text-white">{device.color}</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-zinc-500">IMEI / Serie</span>
                <span className="text-sm font-mono text-zinc-300">{device.imei_serial}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-zinc-500">Estado Físico</span>
                <span className="text-sm font-semibold text-white">{conditionMap[device.condition] || device.condition}</span>
              </div>
            </div>
          </div>

          {(device.battery_health !== null || device.battery_cycles !== null) && (
            <div className="bg-[#0B0B0E] border border-[#1F1F24] rounded-2xl p-6">
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

          <div className="bg-[#0B0B0E] border border-[#1F1F24] rounded-2xl p-6">
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

          <div className="bg-[#0B0B0E] border border-[#1F1F24] rounded-2xl p-6">
            <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-5">Funcionamiento</h3>
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
          </div>
        </div>

        {/* Right Column: Business Specs */}
        <div className="flex flex-col gap-6">
          
          <div className="bg-[#0B0B0E] border border-[#1F1F24] rounded-2xl p-6">
            <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-5">Compra</h3>
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
          </div>

          {tradeInContext && (
            <div className="bg-[#0B0B0E] border border-[#1F1F24] rounded-2xl p-6 border-t-2 border-t-[#d7baff]">
              <div className="flex justify-between items-start mb-5">
                <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Parte de pago</h3>
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

          {device.internal_notes && (
            <div className="bg-[#121217] border border-[#2a2a30] rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-amber-500/50"></div>
              <h3 className="text-sm font-bold text-amber-500/80 uppercase tracking-wider mb-3">Notas internas</h3>
              <p className="text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed">{device.internal_notes}</p>
            </div>
          )}

        </div>
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
    </div>
  )
}
