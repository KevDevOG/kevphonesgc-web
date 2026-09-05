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

  const inputClass = "w-full bg-[#131313] text-white border border-[#1F1F24] rounded-lg p-3 text-sm focus:outline-none focus:border-[#9867db] transition-colors"
  const labelClass = "block text-xs font-medium text-[#6E6E78] mb-1 uppercase tracking-wider"

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="w-full md:w-auto px-6 py-2.5 text-[#440087] font-bold rounded-lg transition-all hover:opacity-90 active:scale-[0.98] flex items-center justify-center gap-2 shadow-sm"
        style={{ background: 'linear-gradient(135deg, #d7baff 0%, #B98AFF 100%)' }}
      >
        <span className="material-symbols-outlined text-[18px]">sync_alt</span>
        Completar parte de pago
      </button>
    )
  }

  const fSalePrice = Number(finalSalePrice) || 0
  const fPurchasePrice = Number(purchasePrice) || 0
  const settlement = fSalePrice - fPurchasePrice

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pb-28 md:pb-32 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#0B0B0D] border border-[#1F1F24] rounded-xl p-6 w-full max-w-4xl my-auto shadow-2xl relative">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-[#9867db]">sync_alt</span>
            Completar parte de pago (Trade-In)
          </h2>
          <button onClick={() => setIsOpen(false)} className="text-[#A8A8B0] hover:text-white transition-colors" disabled={submitting}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl text-sm border bg-red-500/10 border-red-500/20 text-red-500">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* TWO SIDES PREVIEW */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* INCOMING DEVICE */}
            <div className="bg-[#131313] border border-[#1F1F24] rounded-lg p-5 flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-semibold text-[#A8A8B0] uppercase tracking-wider mb-3">
                  Dispositivo que entrega el cliente
                </h3>
                <div className="text-base font-medium text-white mb-1">
                  {request.device_models?.name || 'Dispositivo'} {request.storage ? `· ${request.storage}` : ''}
                </div>
                <div className="text-sm text-[#A8A8B0] space-y-1">
                  {request.color && <div>{request.color}</div>}
                  {request.battery_health && <div>Batería {request.battery_health} %</div>}
                  {request.device_condition && <div>{conditionLabels[request.device_condition] || request.device_condition}</div>}
                </div>
              </div>
              
              {request.estimated_min !== null && request.estimated_max !== null && (
                <div className="mt-4 pt-4 border-t border-[#1F1F24]">
                  <div className="text-xs text-[#A8A8B0] mb-1">Valoración mostrada:</div>
                  <div className="text-lg font-bold text-[#d7baff]">
                    {formatMoney(request.estimated_min)} – {formatMoney(request.estimated_max)}
                  </div>
                </div>
              )}
            </div>

            {/* TARGET STOCK DEVICE */}
            <div className="bg-[#131313] border border-[#1F1F24] rounded-lg p-5 flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-semibold text-[#A8A8B0] uppercase tracking-wider mb-3">
                  Dispositivo que se lleva
                </h3>
                <div className="text-base font-medium text-white mb-1">
                  {tradeInContext.targetDevice?.modelName || 'Dispositivo'} {tradeInContext.targetDevice?.storage ? `· ${tradeInContext.targetDevice.storage}` : ''}
                </div>
                <div className="text-sm text-[#A8A8B0]">
                  {tradeInContext.targetDevice?.color && <div>{tradeInContext.targetDevice.color}</div>}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-[#1F1F24]">
                <div className="text-xs text-[#A8A8B0] mb-1">Precio mostrado al cotizar:</div>
                <div className="text-lg font-bold text-white">
                  {formatMoney(tradeInContext.targetListingPriceSnapshot)}
                </div>
                {tradeInContext.targetDevice?.listingPrice !== tradeInContext.targetListingPriceSnapshot && (
                  <div className="text-xs text-amber-500 mt-1">
                    Precio actual en stock: {formatMoney(tradeInContext.targetDevice?.listingPrice || 0)}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* FINANCIAL INPUTS */}
          <div className="bg-[#9867db]/10 border border-[#9867db]/30 rounded-xl p-6">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative">
               
               <div>
                  <label className="block text-sm font-semibold text-[#d7baff] mb-2">
                    Precio final de compra (A favor del cliente) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-[14px] text-white/50 font-bold">€</span>
                    <input 
                      type="number" 
                      step="0.01" 
                      min="0" 
                      required 
                      className="w-full bg-[#131313] text-white border border-[#9867db]/40 rounded-lg p-3 pl-9 text-lg font-bold focus:outline-none focus:border-[#d7baff] transition-colors"
                      value={purchasePrice}
                      onChange={(e) => setPurchasePrice(e.target.value)}
                    />
                  </div>
               </div>

               <div>
                  <label className="block text-sm font-semibold text-[#d7baff] mb-2">
                    Precio final de venta (A favor de KevPhonesGC) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-[14px] text-white/50 font-bold">€</span>
                    <input 
                      type="number" 
                      step="0.01" 
                      min="0" 
                      required 
                      className="w-full bg-[#131313] text-white border border-[#9867db]/40 rounded-lg p-3 pl-9 text-lg font-bold focus:outline-none focus:border-[#d7baff] transition-colors"
                      value={finalSalePrice}
                      onChange={(e) => setFinalSalePrice(e.target.value)}
                    />
                  </div>
               </div>

             </div>

             {/* LIVE SETTLEMENT PREVIEW */}
             {(purchasePrice && finalSalePrice) && (
               <div className="mt-6 pt-6 border-t border-[#9867db]/30 flex flex-col items-center">
                 <div className="text-sm font-semibold text-[#A8A8B0] uppercase tracking-widest mb-2">
                   {settlement > 0 ? 'Cliente paga' : settlement < 0 ? 'KevPhonesGC paga al cliente' : 'Sin diferencia'}
                 </div>
                 <div className={`text-4xl font-extrabold ${settlement > 0 ? 'text-white' : settlement < 0 ? 'text-amber-400' : 'text-[#A8A8B0]'}`}>
                   {formatMoney(Math.abs(settlement))}
                 </div>
                 <div className="text-xs text-[#A8A8B0] mt-2">
                   Importe informativo. La contabilidad se deriva de los precios individuales ingresados arriba.
                 </div>
               </div>
             )}
          </div>

          {/* OTHER ADMIN REQUIRED FIELDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Fecha de la transacción *</label>
              <input type="date" name="transaction_date" required defaultValue={new Date().toISOString().split('T')[0]} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Lugar de la transacción (Opcional)</label>
              <input type="text" name="transaction_location" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Precio de venta (Nuevo dispositivo ingresado) *</label>
              <input type="number" step="0.01" min="0" name="incoming_listing_price" required className={inputClass} placeholder="A qué precio lo venderemos..." />
            </div>
            <div>
              <label className={labelClass}>IMEI / Número de serie (Dispositivo entrante)</label>
              <input type="text" name="imei_serial" className={inputClass} />
            </div>
            <div className="md:col-span-2">
              <label className={labelClass}>Notas internas / Observaciones de la venta</label>
              <textarea name="internal_notes" rows={2} defaultValue={request.notes ? `Notas de la solicitud: ${request.notes}` : ''} className={inputClass}></textarea>
            </div>
          </div>

          <div className="pt-4 border-t border-[#1F1F24] flex gap-3">
            <button 
              type="button"
              onClick={() => setIsOpen(false)}
              disabled={submitting}
              className="flex-1 px-4 py-3 bg-[#131313] border border-[#1F1F24] text-white rounded-lg text-sm font-medium hover:bg-[#1F1F24] transition-colors"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={submitting || !purchasePrice || !finalSalePrice}
              className="flex-1 text-[#440087] font-bold py-3 rounded-lg transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #d7baff 0%, #B98AFF 100%)' }}
            >
              {submitting ? 'Guardando...' : 'Completar parte de pago'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
