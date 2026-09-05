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

  return (
    <>
      {/* Header & Main Info */}
      <section className="flex flex-col gap-2">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-[32px] leading-[36px] font-extrabold text-[#F7F7F7]" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
              {model?.name}
            </h2>
            <p className="text-[16px] text-[#A8A8B0] mt-1">
              {[device.storage, device.color].filter(Boolean).join(' · ')}
            </p>
          </div>
          <div className="bg-[#431080] px-3 py-1 rounded text-[#d4b5ff] text-[14px] font-semibold uppercase tracking-wide">
            {device.status === 'available' ? 'Disponible' : 'Vendido'}
          </div>
        </div>
        
        <div className="flex items-end gap-3 mt-2">
          <span className="text-[28px] font-extrabold text-[#B98AFF]" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
            {formatPrice(device.listing_price)}
          </span>
          <span className="text-[16px] text-[#A8A8B0] mb-1">
            Compra: {formatPrice(device.purchase_price)}
          </span>
        </div>
      </section>

      {tradeInContext && (
        <section className="bg-[#0B0B0D] border border-[#1F1F24] rounded-lg p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[24px] font-bold text-[#d7baff] flex items-center gap-2" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
              <span className="material-symbols-outlined text-[20px]">sync_alt</span> Parte de pago
            </h3>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsCancelingTradeIn(true)}
                className="text-xs bg-[#93000a]/10 text-[#ffb4ab] border border-[#93000a]/30 px-3 py-1 rounded-full font-semibold hover:bg-[#93000a]/20 transition-colors flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[14px]">cancel</span>
                Anular parte de pago
              </button>
              <button 
                onClick={() => setIsEditingTradeIn(true)}
                className="text-xs bg-[#B98AFF]/10 text-[#B98AFF] border border-[#B98AFF]/30 px-3 py-1 rounded-full font-semibold hover:bg-[#B98AFF]/20 transition-colors flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[14px]">edit</span>
                Editar operación
              </button>
              <span className="bg-[#d7baff]/10 text-[#d7baff] border border-[#d7baff]/20 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide hidden md:inline-block">
                {tradeInContext.direction === 'outgoing' ? 'Entregado por KevPhonesGC' : 'Recibido del cliente'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Outgoing Device */}
            <div className="bg-[#131313] border border-[#1F1F24] p-4 rounded-lg flex flex-col justify-between">
              <div>
                <span className="block text-xs uppercase tracking-wider text-[#A8A8B0] mb-2">Dispositivo entregado por KevPhonesGC</span>
                <Link href={`/admin/stock/${tradeInContext.outgoingDevice.id}`} className="text-white font-medium hover:text-[#B98AFF] transition-colors block">
                  {tradeInContext.outgoingDevice.modelName} {tradeInContext.outgoingDevice.storage ? `· ${tradeInContext.outgoingDevice.storage}` : ''}
                </Link>
                {tradeInContext.outgoingDevice.color && (
                  <span className="text-sm text-[#A8A8B0] block">{tradeInContext.outgoingDevice.color}</span>
                )}
              </div>
              <div className="mt-4 pt-3 border-t border-[#1F1F24]">
                <span className="block text-xs text-[#A8A8B0] mb-1">Precio de venta</span>
                <span className="text-lg font-bold text-white">{formatPrice(tradeInContext.finalSalePrice)}</span>
              </div>
            </div>

            {/* Incoming Device */}
            <div className="bg-[#131313] border border-[#1F1F24] p-4 rounded-lg flex flex-col justify-between">
              <div>
                <span className="block text-xs uppercase tracking-wider text-[#A8A8B0] mb-2">Dispositivo recibido</span>
                <Link href={`/admin/stock/${tradeInContext.incomingDevice.id}`} className="text-white font-medium hover:text-[#B98AFF] transition-colors block">
                  {tradeInContext.incomingDevice.modelName} {tradeInContext.incomingDevice.storage ? `· ${tradeInContext.incomingDevice.storage}` : ''}
                </Link>
                {tradeInContext.incomingDevice.color && (
                  <span className="text-sm text-[#A8A8B0] block">{tradeInContext.incomingDevice.color}</span>
                )}
              </div>
              <div className="mt-4 pt-3 border-t border-[#1F1F24]">
                <span className="block text-xs text-[#A8A8B0] mb-1">Precio de compra</span>
                <span className="text-lg font-bold text-white">{formatPrice(tradeInContext.incomingDevice.purchasePrice)}</span>
              </div>
            </div>
          </div>

          {/* Settlement */}
          <div className="bg-[#131313] border border-[#1F1F24] rounded-lg p-4 flex flex-col items-center justify-center text-center">
            {(() => {
              const diff = tradeInContext.finalSalePrice - tradeInContext.incomingDevice.purchasePrice
              if (diff > 0) {
                return (
                  <>
                    <span className="text-xs uppercase tracking-widest text-[#A8A8B0] mb-1">Cliente pagó</span>
                    <span className="text-2xl font-extrabold text-white">{formatPrice(diff)}</span>
                  </>
                )
              } else if (diff < 0) {
                return (
                  <>
                    <span className="text-xs uppercase tracking-widest text-[#A8A8B0] mb-1">KevPhonesGC pagó al cliente</span>
                    <span className="text-2xl font-extrabold text-amber-400">{formatPrice(Math.abs(diff))}</span>
                  </>
                )
              } else {
                return (
                  <>
                    <span className="text-xs uppercase tracking-widest text-[#A8A8B0] mb-1">Sin diferencia</span>
                    <span className="text-2xl font-extrabold text-[#A8A8B0]">{formatPrice(0)}</span>
                  </>
                )
              }
            })()}
          </div>

          {tradeInContext.saleRequestId && (
            <div className="mt-2 text-center">
              <Link href={`/admin/solicitudes/${tradeInContext.saleRequestId}`} className="text-sm text-[#A8A8B0] hover:text-[#d7baff] underline underline-offset-4 transition-colors">
                Ver solicitud original
              </Link>
            </div>
          )}
        </section>
      )}

      {/* Image & Key Specs Grid */}
      <section className="grid grid-cols-2 gap-3">
        <div className="bg-[#0B0B0D] border border-[#1F1F24] rounded-lg overflow-hidden flex items-center justify-center p-4 aspect-square">
          {images.length > 0 && supabaseUrl ? (
            <img 
              className="w-full h-full object-contain drop-shadow-2xl" 
              src={`${supabaseUrl}/storage/v1/object/public/device-images/${images[0].storage_path}`} 
              alt={model?.name}
            />
          ) : (
            <span className="material-symbols-outlined text-4xl text-[#4b4454]">smartphone</span>
          )}
        </div>
        <div className="bg-[#0B0B0D] border border-[#1F1F24] rounded-lg p-3 flex flex-col gap-2 justify-center">
          {device.battery_health !== null && (
            <>
              <div className="flex flex-col">
                <span className="text-[#A8A8B0] text-xs uppercase tracking-wider">Batería</span>
                <span className="text-[#F7F7F7] font-bold text-sm">
                  {device.battery_health} % {device.battery_cycles !== null ? `(${device.battery_cycles} ciclos)` : ''}
                </span>
              </div>
              <div className="h-[1px] bg-[#1F1F24] w-full my-1"></div>
            </>
          )}
          <div className="flex flex-col">
            <span className="text-[#A8A8B0] text-xs uppercase tracking-wider">Garantía oficial</span>
            <span className="text-[#F7F7F7] font-bold text-sm">
              {device.warranty_until ? `Hasta ${formatDate(device.warranty_until)}` : 'Sin garantía registrada'}
            </span>
          </div>
        </div>
      </section>

      {/* Detailed Specs */}
      <section className="bg-[#0B0B0D] border border-[#1F1F24] rounded-lg p-4 flex flex-col">
        <h3 className="text-[24px] font-bold text-[#B98AFF] mb-4" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>Especificaciones</h3>
        <ul className="flex flex-col">
          <li className="flex justify-between py-3 border-b border-[#1F1F24]">
            <span className="text-[#A8A8B0]">Categoría</span>
            <span className="text-[#F7F7F7]">{model?.category ? (categoryMap[model.category] || model.category) : ''}</span>
          </li>
          <li className="flex justify-between py-3 border-b border-[#1F1F24]">
            <span className="text-[#A8A8B0]">Modelo</span>
            <span className="text-[#F7F7F7]">{model?.name}</span>
          </li>
          {device.storage && (
            <li className="flex justify-between py-3 border-b border-[#1F1F24]">
              <span className="text-[#A8A8B0]">Capacidad</span>
              <span className="text-[#F7F7F7]">{device.storage}</span>
            </li>
          )}
          {device.color && (
            <li className="flex justify-between py-3 border-b border-[#1F1F24]">
              <span className="text-[#A8A8B0]">Color</span>
              <span className="text-[#F7F7F7]">{device.color}</span>
            </li>
          )}
          <li className="flex justify-between py-3 border-b border-[#1F1F24]">
            <span className="text-[#A8A8B0]">IMEI / Número de serie</span>
            <span className="text-[#F7F7F7] font-mono text-sm">{device.imei_serial}</span>
          </li>
          <li className="flex justify-between py-3 border-b border-[#1F1F24]">
            <span className="text-[#A8A8B0]">Estado</span>
            <span className="text-[#F7F7F7]">{conditionMap[device.condition] || device.condition}</span>
          </li>
          <li className="flex justify-between py-3 border-b border-[#1F1F24]">
            <span className="text-[#A8A8B0]">Caja</span>
            <span className={`font-bold ${device.has_box ? 'text-[#B98AFF]' : 'text-[#F7F7F7]'}`}>{device.has_box ? 'Sí' : 'No'}</span>
          </li>
          <li className="flex justify-between py-3 border-b border-[#1F1F24]">
            <span className="text-[#A8A8B0]">Cable</span>
            <span className={`font-bold ${device.has_cable ? 'text-[#B98AFF]' : 'text-[#F7F7F7]'}`}>{device.has_cable ? 'Sí' : 'No'}</span>
          </li>
          <li className="flex justify-between py-3 border-b border-[#1F1F24]">
            <span className="text-[#A8A8B0]">Factura</span>
            <span className={`font-bold ${device.has_invoice ? 'text-[#B98AFF]' : 'text-[#F7F7F7]'}`}>{device.has_invoice ? 'Sí' : 'No'}</span>
          </li>
          <li className="flex justify-between py-3 border-b border-[#1F1F24]">
            <span className="text-[#A8A8B0]">Piezas originales</span>
            <span className={`font-bold ${device.original_parts ? 'text-[#B98AFF]' : 'text-[#ffb4ab]'}`}>{device.original_parts ? 'Sí' : 'No'}</span>
          </li>
          <li className="flex justify-between py-3">
            <span className="text-[#A8A8B0]">Funcionamiento completo</span>
            <span className={`font-bold ${device.fully_functional ? 'text-[#B98AFF]' : 'text-[#ffb4ab]'}`}>{device.fully_functional ? 'Sí' : 'No'}</span>
          </li>
        </ul>
      </section>

      {/* Seller Info */}
      {device.clients && (
        <section className="bg-[#0B0B0D] border border-[#1F1F24] rounded-lg p-4 flex flex-col mb-4">
          <h3 className="text-[24px] font-bold text-[#B98AFF] mb-4 flex items-center gap-2" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
            <span className="material-symbols-outlined text-[20px]">person</span> Vendedor
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="block text-[#A8A8B0] text-xs uppercase tracking-wider mb-1">Nombre</span>
              <span className="text-[#F7F7F7] text-[16px]">{device.clients.name}</span>
            </div>
            <div>
              <span className="block text-[#A8A8B0] text-xs uppercase tracking-wider mb-1">Teléfono</span>
              <span className="text-[#F7F7F7] text-[16px]">{device.clients.phone}</span>
            </div>
            {device.clients.location && (
              <div className="col-span-2">
                <span className="block text-[#A8A8B0] text-xs uppercase tracking-wider mb-1">Ubicación</span>
                <span className="text-[#F7F7F7] text-[16px]">{device.clients.location}</span>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Purchase Info */}
      <section className="bg-[#0B0B0D] border border-[#1F1F24] rounded-lg p-4 flex flex-col">
        <h3 className="text-[24px] font-bold text-[#B98AFF] mb-4 flex items-center gap-2" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
          <span className="material-symbols-outlined text-[20px]">payments</span> Compra
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="block text-[#A8A8B0] text-xs uppercase tracking-wider mb-1">Fecha de compra</span>
            <span className="text-[#F7F7F7] text-[16px]">{formatDate(device.purchased_at)}</span>
          </div>
          <div>
            <span className="block text-[#A8A8B0] text-xs uppercase tracking-wider mb-1">Lugar de compra</span>
            <span className="text-[#F7F7F7] text-[16px]">{device.purchase_location || 'No especificado'}</span>
          </div>
        </div>
      </section>

      {/* Photos */}
      <section>
        <h3 className="text-[24px] font-bold text-[#B98AFF] mb-4" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>Fotos del dispositivo</h3>
        <div className="grid grid-cols-2 gap-3">
          {images.length > 0 && supabaseUrl ? (
            images.map((img) => (
              <div key={img.id} className="aspect-square bg-[#0B0B0D] border border-[#1F1F24] rounded-lg overflow-hidden">
                <img 
                  className="w-full h-full object-cover" 
                  src={`${supabaseUrl}/storage/v1/object/public/device-images/${img.storage_path}`} 
                  alt={model?.name} 
                />
              </div>
            ))
          ) : (
            <div className="col-span-2 p-6 bg-[#0B0B0D] border border-[#1F1F24] rounded-lg text-center text-[#A8A8B0]">
              No hay fotos disponibles.
            </div>
          )}
        </div>
      </section>

      {/* Financial Summary */}
      <section className="bg-[#0B0B0D] border border-[#1F1F24] rounded-lg p-4 border-l-4 border-l-[#B98AFF] flex flex-col gap-2">
        <div className="flex justify-between items-center">
          <span className="text-[#A8A8B0] text-[16px]">Precio de compra</span>
          <span className="text-[#F7F7F7] font-mono text-[16px]">{formatPrice(device.purchase_price)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[#A8A8B0] text-[16px]">Precio de publicación</span>
          <span className="text-[#F7F7F7] font-mono text-[16px]">{formatPrice(device.listing_price)}</span>
        </div>
        <div className="h-[1px] bg-[#1F1F24] w-full my-1"></div>
        <div className="flex justify-between items-center mt-1">
          <span className="text-[#F7F7F7] font-bold text-[18px]">Beneficio potencial</span>
          <span className={`font-extrabold text-[28px] ${potentialProfit >= 0 ? 'text-[#B98AFF]' : 'text-[#ffb4ab]'}`} style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
            {formatPrice(potentialProfit)}
          </span>
        </div>
      </section>

      {/* Internal Notes */}
      {device.internal_notes && (
        <section className="bg-[#0B0B0D] border border-[#1F1F24] rounded-lg p-4 flex flex-col">
          <h3 className="text-[20px] font-bold text-[#B98AFF] mb-2" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>Notas internas</h3>
          <p className="text-[#A8A8B0] whitespace-pre-wrap">{device.internal_notes}</p>
        </section>
      )}

      {/* Actions */}
      <section className="flex flex-col gap-3 mt-4">
        {device.status === 'available' && (
          <a href={`/admin/stock/${device.id}/editar`} className="w-full bg-[#1c1b1b] border border-[#1F1F24] text-[#F7F7F7] font-semibold py-3 px-4 rounded-lg hover:bg-[#353534] active:scale-[0.98] transition-all flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-[20px]">edit</span>
            Editar dispositivo
          </a>
        )}
        {device.status === 'available' && (
          <a href={`/admin/stock/${device.id}/vender`} className="w-full bg-gradient-to-r from-[#7a32d4] to-[#B98AFF] text-[#440087] font-semibold py-3 px-4 rounded-lg hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
            Marcar como vendido
          </a>
        )}
        <a href="/admin/stock" className="w-full bg-[#1c1b1b] border border-[#1F1F24] text-[#F7F7F7] font-semibold py-3 px-4 rounded-lg hover:bg-[#353534] active:scale-[0.98] transition-all flex items-center justify-center">
          Volver al stock
        </a>

        {device.status === 'available' && !showConfirmDelete && (
          <button 
            type="button"
            onClick={() => setShowConfirmDelete(true)}
            className="w-full bg-transparent border border-[#690005] text-[#ffb4ab] font-semibold py-3 px-4 rounded-lg hover:bg-[#93000a]/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-4"
          >
            <span className="material-symbols-outlined text-[20px]">delete</span>
            Eliminar dispositivo
          </button>
        )}

        {showConfirmDelete && (
          <div className="bg-[#93000a]/20 border border-[#93000a] rounded-lg p-4 flex flex-col gap-3 mt-4">
            <h4 className="text-[#ffdad6] font-bold">¿Eliminar este dispositivo?</h4>
            <p className="text-[#ffb4ab] text-sm leading-relaxed">
              Esta acción eliminará permanentemente el dispositivo y sus fotos del stock.
            </p>
            {deleteError && (
              <p className="text-[#ffb4ab] text-sm font-semibold">{deleteError}</p>
            )}
            <div className="flex gap-2 mt-2">
              <button 
                type="button"
                disabled={isDeleting}
                onClick={() => setShowConfirmDelete(false)}
                className="flex-1 bg-transparent border border-[#ffb4ab]/30 text-[#ffb4ab] py-2 rounded-lg text-sm font-bold disabled:opacity-50 transition-colors hover:bg-[#ffb4ab]/10"
              >
                Cancelar
              </button>
              <button 
                type="button"
                disabled={isDeleting}
                onClick={handleDelete}
                className="flex-1 bg-[#93000a] hover:bg-[#690005] text-[#ffdad6] py-2 rounded-lg text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
              >
                {isDeleting ? 'Eliminando...' : 'Eliminar definitivamente'}
              </button>
            </div>
          </div>
        )}
      </section>
      
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
    </>
  )
}
