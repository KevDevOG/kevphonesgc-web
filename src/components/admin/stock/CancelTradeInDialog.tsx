'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { cancelTradeInAction } from '@/actions/trade-ins'

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

export function CancelTradeInDialog({ context, onClose }: { context: TradeInContext, onClose: () => void }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  
  const [confirmText, setConfirmText] = useState('')
  const [error, setError] = useState<string | null>(null)


  const isConfirmed = confirmText === 'ANULAR'

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isConfirmed) return
    
    setError(null)
    
    startTransition(async () => {
      const result = await cancelTradeInAction(context.id)
      if (!result.success) {
        setError(result.error || 'Error desconocido')
      } else {
        if (result.warning) {
          console.warn(result.warning)
        }
        
        onClose()
        
        let destination = '/admin/stock'
        if (result.outgoingDeviceId && typeof result.outgoingDeviceId === 'string') {
          destination = `/admin/stock/${result.outgoingDeviceId}`
        }
        
        if (result.warning) {
          destination += '?tradeInCancelled=1&storageWarning=1'
        } else {
          destination += '?tradeInCancelled=1'
        }
        
        router.replace(destination)
      }
    })
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#131313] border border-[#690005] rounded-xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        <div className="p-4 border-b border-[#1F1F24] flex justify-between items-center bg-[#0B0B0D]">
          <h2 className="text-xl font-bold text-[#ffb4ab]" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
            Anular Parte de Pago
          </h2>
          <button 
            onClick={onClose}
            disabled={isPending}
            className="text-[#A8A8B0] hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 pb-32">
          <form id="cancelTradeInForm" onSubmit={handleSubmit} className="flex flex-col gap-6">
            
            <div className="flex flex-col gap-3">
              <p className="text-[#ffdad6] font-bold">Al anular esta operación ocurrirá lo siguiente:</p>
              <ul className="list-disc list-inside text-sm text-[#ffb4ab] space-y-1">
                <li>Se eliminará la venta del dispositivo entregado por KevPhonesGC.</li>
                <li>El dispositivo entregado volverá a estar Disponible.</li>
                <li>El dispositivo recibido será eliminado del stock.</li>
                <li>La solicitud original volverá a "En proceso" (si aplica).</li>
                <li>El efecto financiero se revertirá automáticamente.</li>
              </ul>
            </div>

            <div className="bg-[#93000a]/10 border border-[#93000a]/50 p-3 rounded-lg flex items-start gap-2">
              <span className="material-symbols-outlined text-[#ffb4ab] text-[20px]">warning</span>
              <p className="text-xs text-[#ffb4ab]">
                Esta acción solo puede realizarse si el dispositivo recibido todavía no ha sido vendido.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-white">
                Para confirmar, escribe ANULAR
              </label>
              <input 
                type="text"
                required
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="ANULAR"
                className="bg-[#050505] border border-[#690005] rounded p-2 text-white focus:outline-none focus:border-[#ffb4ab]"
              />
            </div>

            {error && (
              <div className="bg-[#93000a]/20 border border-[#93000a] text-[#ffb4ab] p-3 rounded text-sm">
                {error}
              </div>
            )}
          </form>
        </div>

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
            form="cancelTradeInForm"
            disabled={isPending || !isConfirmed}
            className="flex-1 bg-[#93000a] text-[#ffdad6] py-3 rounded-lg text-sm font-bold disabled:opacity-50 hover:bg-[#690005] transition-colors"
          >
            {isPending ? 'Anulando...' : 'Anular definitivamente'}
          </button>
        </div>
      </div>
    </div>
  )
}
