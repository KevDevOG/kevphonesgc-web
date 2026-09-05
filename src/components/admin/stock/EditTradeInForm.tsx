'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateTradeInAction, UpdateTradeInInput } from '@/actions/trade-ins'

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
}

export function EditTradeInForm({ context, onClose }: { context: TradeInContext, onClose: () => void }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  
  const [finalSalePrice, setFinalSalePrice] = useState(context.finalSalePrice.toString())
  const [receivedPurchasePrice, setReceivedPurchasePrice] = useState(context.incomingDevice.purchasePrice.toString())
  const [receivedListingPrice, setReceivedListingPrice] = useState(context.receivedListingPrice.toString())
  const [operationDate, setOperationDate] = useState(context.soldAt)
  const [saleLocation, setSaleLocation] = useState(context.saleLocation || '')
  const [purchaseLocation, setPurchaseLocation] = useState(context.purchaseLocation || '')
  const [saleObservations, setSaleObservations] = useState(context.saleObservations || '')

  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    startTransition(async () => {
      const input: UpdateTradeInInput = {
        tradeInId: context.id,
        finalSalePrice: Number(finalSalePrice),
        receivedPurchasePrice: Number(receivedPurchasePrice),
        receivedListingPrice: Number(receivedListingPrice),
        operationDate: operationDate,
        saleLocation: saleLocation,
        purchaseLocation: purchaseLocation,
        saleObservations: saleObservations
      }

      const result = await updateTradeInAction(input)
      if (!result.success) {
        setError(result.error || 'Error desconocido')
      } else {
        setSuccess(true)
        setTimeout(() => {
          onClose()
          router.refresh()
        }, 1500)
      }
    })
  }

  const formatPrice = (val: number) => {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(val)
  }

  const diff = Number(finalSalePrice || 0) - Number(receivedPurchasePrice || 0)

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#131313] border border-[#1F1F24] rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        <div className="p-4 border-b border-[#1F1F24] flex justify-between items-center bg-[#0B0B0D]">
          <h2 className="text-xl font-bold text-[#d7baff]" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
            Editar Parte de Pago
          </h2>
          <button 
            onClick={onClose}
            disabled={isPending || success}
            className="text-[#A8A8B0] hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 pb-32">
          {success ? (
            <div className="flex flex-col items-center justify-center py-12 text-center gap-4">
              <span className="material-symbols-outlined text-[64px] text-[#B98AFF]">check_circle</span>
              <p className="text-xl text-white font-bold">Operación actualizada con éxito</p>
            </div>
          ) : (
            <form id="editTradeInForm" onSubmit={handleSubmit} className="flex flex-col gap-6">
              
              {/* Resumen Dispositivos Bloqueados */}
              <div className="bg-[#0B0B0D] p-3 border border-[#1F1F24] rounded-lg opacity-70">
                <p className="text-xs text-[#A8A8B0] uppercase tracking-wider mb-2">Dispositivos (Solo Lectura)</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="block text-[#A8A8B0]">Entregado</span>
                    <span className="text-white">{context.outgoingDevice.modelName} {context.outgoingDevice.storage}</span>
                  </div>
                  <div>
                    <span className="block text-[#A8A8B0]">Recibido</span>
                    <span className="text-white">{context.incomingDevice.modelName} {context.incomingDevice.storage}</span>
                  </div>
                </div>
              </div>

              {/* Live Difference */}
              <div className="bg-[#1c1b1b] p-4 rounded-lg flex flex-col items-center text-center">
                {diff > 0 ? (
                  <>
                    <span className="text-xs uppercase tracking-widest text-[#A8A8B0] mb-1">Cliente pagó</span>
                    <span className="text-2xl font-extrabold text-white">{formatPrice(diff)}</span>
                  </>
                ) : diff < 0 ? (
                  <>
                    <span className="text-xs uppercase tracking-widest text-[#A8A8B0] mb-1">KevPhonesGC pagó al cliente</span>
                    <span className="text-2xl font-extrabold text-amber-400">{formatPrice(Math.abs(diff))}</span>
                  </>
                ) : (
                  <>
                    <span className="text-xs uppercase tracking-widest text-[#A8A8B0] mb-1">Sin diferencia</span>
                    <span className="text-2xl font-extrabold text-[#A8A8B0]">{formatPrice(0)}</span>
                  </>
                )}
              </div>

              {/* Precios */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-[#F7F7F7]">Precio final de venta (€) *</label>
                  <input 
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={finalSalePrice}
                    onChange={(e) => setFinalSalePrice(e.target.value)}
                    className="bg-[#050505] border border-[#1F1F24] rounded p-2 text-white focus:outline-none focus:border-[#B98AFF]"
                  />
                  <span className="text-xs text-[#A8A8B0]">Del dispositivo entregado por nosotros</span>
                </div>
                
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-[#F7F7F7]">Precio de compra (€) *</label>
                  <input 
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={receivedPurchasePrice}
                    onChange={(e) => setReceivedPurchasePrice(e.target.value)}
                    className="bg-[#050505] border border-[#1F1F24] rounded p-2 text-white focus:outline-none focus:border-[#B98AFF]"
                  />
                  <span className="text-xs text-[#A8A8B0]">Del dispositivo que recibimos</span>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-[#F7F7F7]">Precio de publicación (€) *</label>
                  <input 
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={receivedListingPrice}
                    onChange={(e) => setReceivedListingPrice(e.target.value)}
                    className="bg-[#050505] border border-[#1F1F24] rounded p-2 text-white focus:outline-none focus:border-[#B98AFF]"
                  />
                  <span className="text-xs text-[#A8A8B0]">Valor estimado para el dispositivo recibido</span>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-[#F7F7F7]">Fecha de la operación *</label>
                  <input 
                    type="date"
                    required
                    value={operationDate}
                    onChange={(e) => setOperationDate(e.target.value)}
                    className="bg-[#050505] border border-[#1F1F24] rounded p-2 text-white focus:outline-none focus:border-[#B98AFF]"
                  />
                </div>
              </div>

              {/* Locaciones y Obs */}
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-[#F7F7F7]">Lugar de venta (Opcional)</label>
                  <input 
                    type="text"
                    value={saleLocation}
                    onChange={(e) => setSaleLocation(e.target.value)}
                    className="bg-[#050505] border border-[#1F1F24] rounded p-2 text-white focus:outline-none focus:border-[#B98AFF]"
                  />
                </div>
                
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-[#F7F7F7]">Lugar de compra (Opcional)</label>
                  <input 
                    type="text"
                    value={purchaseLocation}
                    onChange={(e) => setPurchaseLocation(e.target.value)}
                    className="bg-[#050505] border border-[#1F1F24] rounded p-2 text-white focus:outline-none focus:border-[#B98AFF]"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-[#F7F7F7]">Observaciones de venta (Opcional)</label>
                  <textarea 
                    value={saleObservations}
                    onChange={(e) => setSaleObservations(e.target.value)}
                    className="bg-[#050505] border border-[#1F1F24] rounded p-2 text-white focus:outline-none focus:border-[#B98AFF] min-h-[80px]"
                  />
                </div>
              </div>

              {error && (
                <div className="bg-[#93000a]/20 border border-[#93000a] text-[#ffb4ab] p-3 rounded text-sm">
                  {error}
                </div>
              )}
            </form>
          )}
        </div>

        {!success && (
          <div className="p-4 border-t border-[#1F1F24] bg-[#0B0B0D] flex gap-3">
            <button 
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="flex-1 bg-transparent border border-[#A8A8B0]/30 text-[#A8A8B0] py-3 rounded-lg text-sm font-bold disabled:opacity-50 hover:bg-[#A8A8B0]/10 transition-colors"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              form="editTradeInForm"
              disabled={isPending}
              className="flex-1 bg-gradient-to-r from-[#7a32d4] to-[#B98AFF] text-[#440087] py-3 rounded-lg text-sm font-bold disabled:opacity-50 hover:brightness-110 transition-all flex items-center justify-center gap-2"
            >
              {isPending ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
