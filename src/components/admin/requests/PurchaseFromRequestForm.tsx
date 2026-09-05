'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { convertRequestToDeviceAction } from '@/actions/sale-requests'

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

export function PurchaseFromRequestForm({ request }: { request: SaleRequest }) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [purchasePrice, setPurchasePrice] = useState('')

  const formatMoney = (amount: number) => 
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    
    try {
      const res = await convertRequestToDeviceAction(request.id, formData)
      
      if (res.error) {
        setError(res.error)
        
        // Handle partial success (device created, but request status failed to update)
        if (res.partialSuccess && res.deviceId) {
          setTimeout(() => {
            router.push(`/admin/stock/${res.deviceId}`)
          }, 4000)
        } else {
          setSubmitting(false)
        }
      } else if (res.success && res.deviceId) {
        router.push(`/admin/stock/${res.deviceId}`)
      }
    } catch (err) {
      console.error(err)
      setError('Ocurrió un error inesperado.')
      setSubmitting(false)
    }
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
        <span className="material-symbols-outlined text-[18px]">shopping_cart_checkout</span>
        Comprar dispositivo
      </button>
    )
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#0B0B0D] border border-[#1F1F24] rounded-xl p-6 w-full max-w-3xl my-auto shadow-2xl relative">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-[#9867db]">shopping_cart_checkout</span>
            Comprar dispositivo
          </h2>
          <button onClick={() => setIsOpen(false)} className="text-[#A8A8B0] hover:text-white transition-colors" disabled={submitting}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

      {error && (
        <div className={`mb-6 p-4 rounded-xl text-sm border ${error.includes('El dispositivo se creó') ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* CAMPOS OCULTOS / AUTO-COMPLETADOS */}
        <input type="hidden" name="model_id" value={request.model_id} />
        <input type="hidden" name="storage" value={request.storage || ''} />
        <input type="hidden" name="color" value={request.color || ''} />
        <input type="hidden" name="condition" value={request.device_condition} />
        <input type="hidden" name="battery_health" value={request.battery_health?.toString() || ''} />
        <input type="hidden" name="battery_cycles" value={request.battery_cycles?.toString() || ''} />
        <input type="hidden" name="has_box" value={request.has_box ? 'on' : ''} />
        <input type="hidden" name="has_cable" value={request.has_cable ? 'on' : ''} />
        <input type="hidden" name="has_invoice" value={request.has_invoice ? 'on' : ''} />
        <input type="hidden" name="original_parts" value={request.original_parts ? 'on' : ''} />
        <input type="hidden" name="fully_functional" value={request.fully_functional ? 'on' : ''} />
        <input type="hidden" name="warranty_until" value={request.official_warranty_until || ''} />
        <input type="hidden" name="seller_name" value={request.customer_name} />
        <input type="hidden" name="seller_phone" value={request.customer_phone} />
        <input type="hidden" name="seller_location" value={request.customer_location || ''} />

        <div className="bg-[#131313] border border-[#1F1F24] p-4 rounded-lg">
          <p className="text-sm text-[#A8A8B0] mb-2">
            La información del modelo, estado físico, batería y del cliente ({request.customer_name}) se vinculará automáticamente.
          </p>
          {request.notes && (
            <div className="mt-4">
              <label className={labelClass}>Notas de la solicitud original</label>
              <textarea name="internal_notes" rows={2} defaultValue={`Origen de la solicitud: ${request.notes}`} className={inputClass}></textarea>
            </div>
          )}
          {!request.notes && (
            <input type="hidden" name="internal_notes" value="" />
          )}
        </div>

        {/* CAMPOS REQUERIDOS POR EL ADMIN */}
        <div className="space-y-6">
          
          {request.estimated_min !== null && request.estimated_max !== null && (
            <div className="bg-[#9867db]/10 border border-[#9867db]/20 rounded-lg p-5">
              <h3 className="text-xs font-semibold text-[#d7baff] uppercase tracking-wider mb-1">
                Valoración mostrada al cliente
              </h3>
              <div className="text-xl font-bold text-white mb-2">
                {formatMoney(request.estimated_min)} – {formatMoney(request.estimated_max)}
              </div>
              <p className="text-sm text-[#A8A8B0]">
                Úsala como referencia. El precio de compra real puede ser diferente tras revisar el dispositivo.
              </p>
              
              {purchasePrice && !isNaN(Number(purchasePrice)) && (
                <div className="mt-3 pt-3 border-t border-[#9867db]/20 text-sm font-medium">
                  {(() => {
                    const pp = Number(purchasePrice)
                    if (pp >= request.estimated_min! && pp <= request.estimated_max!) {
                      return <span className="text-[#d7baff]">Dentro de la valoración mostrada</span>
                    }
                    if (pp < request.estimated_min!) {
                      return <span className="text-amber-400">{formatMoney(request.estimated_min! - pp)} por debajo de la valoración</span>
                    }
                    return <span className="text-green-400">{formatMoney(pp - request.estimated_max!)} por encima de la valoración</span>
                  })()}
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <label className={labelClass}>Precio de compra *</label>
              <span className="absolute left-3 top-[34px] text-[#A8A8B0]">€</span>
              <input 
                type="number" 
                step="0.01" 
                min="0" 
                name="purchase_price" 
                required 
                className={`${inputClass} pl-8`}
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(e.target.value)}
              />
            </div>
            <div className="relative">
              <label className={labelClass}>Precio de venta *</label>
              <span className="absolute left-3 top-[34px] text-[#A8A8B0]">€</span>
              <input type="number" step="0.01" min="0" name="listing_price" required className={`${inputClass} pl-8`} />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Fecha de compra *</label>
              <input type="date" name="purchased_at" required defaultValue={new Date().toISOString().split('T')[0]} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Lugar de compra (Opcional)</label>
              <input type="text" name="purchase_location" className={inputClass} />
            </div>
          </div>

          <div>
            <label className={labelClass}>IMEI / Número de serie (Opcional por ahora)</label>
            <input type="text" name="imei_serial" className={inputClass} />
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
            disabled={submitting}
            className="flex-1 text-[#440087] font-bold py-3 rounded-lg transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #d7baff 0%, #B98AFF 100%)' }}
          >
            {submitting ? 'Guardando...' : 'Confirmar compra'}
          </button>
        </div>
      </form>
      </div>
    </div>
  )
}
