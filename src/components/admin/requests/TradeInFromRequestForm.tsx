'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { registerTradeInAction, RegisterTradeInInput } from '@/actions/trade-ins'

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
  device_models: DeviceModel | null
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
}

const conditionLabels: Record<string, string> = {
  sealed: 'Precintado',
  like_new: 'Como nuevo',
  good: 'Buen estado',
  marked: 'Con marcas'
}

export function TradeInFromRequestForm({ request, tradeInContext }: { request: SaleRequest, tradeInContext: TradeInContext }) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Initial values
  const defaultSalePrice = tradeInContext.targetListingPriceSnapshot 
    ? tradeInContext.targetListingPriceSnapshot.toString() 
    : tradeInContext.targetDevice?.listingPrice?.toString() || ''
    
  const [finalSalePrice, setFinalSalePrice] = useState(defaultSalePrice)
  const [purchasePrice, setPurchasePrice] = useState('')

  const formatMoney = (amount: number) => 
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    if (!tradeInContext.targetDevice) {
       setError('El dispositivo de destino no es válido.')
       setSubmitting(false)
       return
    }

    const formData = new FormData(e.currentTarget)
    
    try {
      const input: RegisterTradeInInput = {
        targetDeviceId: tradeInContext.targetDevice.id,
        finalSalePrice: Number(finalSalePrice),
        soldAt: formData.get('transaction_date') as string,
        saleLocation: formData.get('transaction_location') as string,
        saleObservations: formData.get('internal_notes') as string,

        modelId: request.model_id,
        storage: request.storage,
        color: request.color,
        imeiSerial: formData.get('imei_serial') as string,
        batteryHealth: request.battery_health,
        batteryCycles: request.battery_cycles,
        condition: request.device_condition,
        hasBox: request.has_box,
        hasCable: request.has_cable,
        hasInvoice: request.has_invoice,
        warrantyUntil: request.official_warranty_until,
        originalParts: request.original_parts,
        fullyFunctional: request.fully_functional,
        purchasePrice: Number(purchasePrice),
        listingPrice: Number(formData.get('incoming_listing_price')),
        purchaseLocation: formData.get('transaction_location') as string,
        internalNotes: formData.get('internal_notes') as string,

        customerName: request.customer_name,
        customerPhone: request.customer_phone,
        customerLocation: request.customer_location,
        
        saleRequestId: request.id
      }

      const res = await registerTradeInAction(input)
      
      if (!res.success) {
        setError(res.error || 'Ocurrió un error inesperado.')
        setSubmitting(false)
      } else {
        router.refresh()
        if (res.receivedDeviceId) {
          router.push(`/admin/stock/${res.receivedDeviceId}`)
        }
      }
    } catch (err) {
      console.error(err)
      setError('Ocurrió un error inesperado.')
      setSubmitting(false)
    }
  }

  if (tradeInContext.targetDevice?.status !== 'available') {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg text-sm font-medium">
        <span className="material-symbols-outlined text-[18px]">warning</span>
        El dispositivo elegido por el cliente ya no está disponible.
      </div>
    )
  }

  const inputClass = "w-full bg-[#121217] text-white border border-[#1F1F24] rounded-xl px-4 py-2.5 text-[14px] focus:outline-none focus:border-[#7a32d4]/50 focus:ring-1 focus:ring-[#7a32d4]/50 transition-all placeholder:text-zinc-500"
  const labelClass = "block text-[13px] font-semibold text-zinc-400 mb-1.5"

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="w-full md:w-auto px-6 py-3 bg-[#7a32d4]/10 hover:bg-[#7a32d4]/20 border border-[#7a32d4]/30 text-[#d7baff] font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2"
      >
        <span className="material-symbols-outlined text-[20px]">sync_alt</span>
        Completar parte de pago
      </button>
    )
  }

  const fSalePrice = Number(finalSalePrice) || 0
  const fPurchasePrice = Number(purchasePrice) || 0
  const settlement = fSalePrice - fPurchasePrice

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pb-28 md:pb-32 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#0B0B0E] border border-[#1F1F24] rounded-2xl p-6 md:p-8 w-full max-w-5xl my-auto shadow-2xl relative">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-[#d7baff]">sync_alt</span>
            Completar parte de pago (Trade-In)
          </h2>
          <button onClick={() => setIsOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-[#121217] border border-[#1F1F24] text-zinc-400 hover:text-white hover:bg-[#1F1F24] transition-colors" disabled={submitting}>
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl text-[14px] font-bold border bg-red-500/10 border-red-500/20 text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-8">
          
          {/* TWO SIDES PREVIEW */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* INCOMING DEVICE */}
            <div className="bg-[#121217] border border-[#1F1F24] rounded-xl p-6 flex flex-col justify-between">
              <div>
                <h3 className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-3">
                  Dispositivo que entrega el cliente
                </h3>
                <div className="text-[18px] font-bold text-white mb-2">
                  {request.device_models?.name || 'Dispositivo'} {request.storage ? `· ${request.storage}` : ''}
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                  {request.color && <span className="px-2 py-0.5 bg-[#1F1F24] text-zinc-300 text-xs rounded font-medium">{request.color}</span>}
                  {request.battery_health && <span className="px-2 py-0.5 bg-[#1F1F24] text-zinc-300 text-xs rounded font-medium">Batería {request.battery_health}%</span>}
                  {request.device_condition && <span className="px-2 py-0.5 bg-[#1F1F24] text-zinc-300 text-xs rounded font-medium">{conditionLabels[request.device_condition] || request.device_condition}</span>}
                </div>
              </div>
              
              {request.estimated_min !== null && request.estimated_max !== null && (
                <div className="mt-2 pt-4 border-t border-[#1F1F24]">
                  <div className="text-xs text-zinc-500 mb-1 font-semibold">Valoración mostrada al cliente:</div>
                  <div className="text-[18px] font-bold text-[#d7baff]">
                    {formatMoney(request.estimated_min)} – {formatMoney(request.estimated_max)}
                  </div>
                </div>
              )}
            </div>

            {/* TARGET STOCK DEVICE */}
            <div className="bg-[#121217] border border-[#1F1F24] rounded-xl p-6 flex flex-col justify-between">
              <div>
                <h3 className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-3">
                  Dispositivo que se lleva
                </h3>
                <div className="text-[18px] font-bold text-white mb-2">
                  {tradeInContext.targetDevice?.modelName || 'Dispositivo'} {tradeInContext.targetDevice?.storage ? `· ${tradeInContext.targetDevice.storage}` : ''}
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                  {tradeInContext.targetDevice?.color && <span className="px-2 py-0.5 bg-[#1F1F24] text-zinc-300 text-xs rounded font-medium">{tradeInContext.targetDevice.color}</span>}
                </div>
              </div>

              <div className="mt-2 pt-4 border-t border-[#1F1F24]">
                <div className="text-xs text-zinc-500 mb-1 font-semibold">Precio mostrado al cotizar:</div>
                <div className="text-[18px] font-bold text-white">
                  {formatMoney(tradeInContext.targetListingPriceSnapshot)}
                </div>
                {tradeInContext.targetDevice?.listingPrice !== tradeInContext.targetListingPriceSnapshot && (
                  <div className="text-xs font-bold text-amber-500 mt-1">
                    Precio actual en stock: {formatMoney(tradeInContext.targetDevice?.listingPrice || 0)}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* FINANCIAL INPUTS */}
          <div className="bg-[#7a32d4]/5 border border-[#7a32d4]/30 rounded-2xl p-6 md:p-8 relative overflow-hidden">
             <div className="absolute top-0 left-0 w-1.5 h-full bg-[#7a32d4]"></div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
               
               <div className="flex flex-col gap-2">
                  <label className="text-[13px] font-bold text-[#d7baff]">
                    Valor final del dispositivo recibido *
                  </label>
                  <p className="text-xs text-[#d7baff]/70 mb-1">El valor en € que pagamos por el móvil del cliente.</p>
                  <div className="relative">
                    <span className="absolute left-4 top-[15px] text-zinc-400 font-bold">€</span>
                    <input 
                      type="number" 
                      step="0.01" 
                      min="0" 
                      required 
                      className="w-full bg-[#121217] text-white border border-[#7a32d4]/30 rounded-xl py-3 pl-10 pr-4 text-xl font-bold focus:outline-none focus:border-[#d7baff] focus:ring-1 focus:ring-[#d7baff] transition-colors"
                      value={purchasePrice}
                      onChange={(e) => setPurchasePrice(e.target.value)}
                    />
                  </div>
               </div>

               <div className="flex flex-col gap-2">
                  <label className="text-[13px] font-bold text-[#d7baff]">
                    Precio final del dispositivo vendido *
                  </label>
                  <p className="text-xs text-[#d7baff]/70 mb-1">El precio en € por el que vendemos nuestro móvil.</p>
                  <div className="relative">
                    <span className="absolute left-4 top-[15px] text-zinc-400 font-bold">€</span>
                    <input 
                      type="number" 
                      step="0.01" 
                      min="0" 
                      required 
                      className="w-full bg-[#121217] text-white border border-[#7a32d4]/30 rounded-xl py-3 pl-10 pr-4 text-xl font-bold focus:outline-none focus:border-[#d7baff] focus:ring-1 focus:ring-[#d7baff] transition-colors"
                      value={finalSalePrice}
                      onChange={(e) => setFinalSalePrice(e.target.value)}
                    />
                  </div>
               </div>

             </div>

             {/* LIVE SETTLEMENT PREVIEW */}
             {(purchasePrice && finalSalePrice) && (
               <div className="mt-8 pt-6 border-t border-[#7a32d4]/20 flex flex-col items-center z-10 relative">
                 <div className="text-[11px] font-bold text-[#d7baff] uppercase tracking-widest mb-2">
                   {settlement > 0 ? 'Cliente paga' : settlement < 0 ? 'KevPhonesGC paga al cliente' : 'Sin diferencia'}
                 </div>
                 <div className={`text-5xl font-extrabold tracking-tight ${settlement > 0 ? 'text-white' : settlement < 0 ? 'text-amber-400' : 'text-zinc-500'}`}>
                   {formatMoney(Math.abs(settlement))}
                 </div>
                 <div className="text-xs text-[#d7baff]/60 mt-3 font-medium text-center">
                   Importe informativo. La contabilidad se deriva de los precios individuales ingresados arriba.
                 </div>
               </div>
             )}
          </div>

          {/* OTHER ADMIN REQUIRED FIELDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Fecha de la transacción *</label>
              <input type="date" name="transaction_date" required defaultValue={new Date().toISOString().split('T')[0]} className={`${inputClass} [color-scheme:dark]`} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Lugar de la transacción (Opcional)</label>
              <input type="text" name="transaction_location" className={inputClass} placeholder="Ej. Las Palmas" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Precio de venta (Nuevo dispositivo ingresado) *</label>
              <input type="number" step="0.01" min="0" name="incoming_listing_price" required className={inputClass} placeholder="A qué precio lo venderemos..." />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>IMEI / Número de serie (Dispositivo entrante)</label>
              <input type="text" name="imei_serial" className={inputClass} placeholder="Introduce IMEI o Serie" />
            </div>
            <div className="md:col-span-2 flex flex-col gap-1.5">
              <label className={labelClass}>Notas internas / Observaciones de la venta</label>
              <textarea name="internal_notes" rows={2} defaultValue={request.notes ? `Notas de la solicitud: ${request.notes}` : ''} className={`${inputClass} resize-none`}></textarea>
            </div>
          </div>

          <div className="pt-2 flex flex-col-reverse md:flex-row gap-3 md:justify-end">
            <button 
              type="button"
              onClick={() => setIsOpen(false)}
              disabled={submitting}
              className="w-full md:w-auto px-6 py-3 bg-[#121217] border border-[#1F1F24] text-white rounded-xl text-[14px] font-bold hover:bg-[#1F1F24] transition-colors"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={submitting || !purchasePrice || !finalSalePrice}
              className="w-full md:w-auto px-6 py-3 bg-[#7a32d4]/10 hover:bg-[#7a32d4]/20 border border-[#7a32d4]/30 text-[#d7baff] font-bold text-[14px] rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? 'Guardando...' : 'Completar parte de pago'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
