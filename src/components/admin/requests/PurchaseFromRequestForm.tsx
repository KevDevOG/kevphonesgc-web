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

  const inputClass = "w-full bg-[#121217] text-white border border-[#1F1F24] rounded-xl px-4 py-2.5 text-[14px] focus:outline-none focus:border-[#7a32d4]/50 focus:ring-1 focus:ring-[#7a32d4]/50 transition-all placeholder:text-zinc-500"
  const labelClass = "block text-[13px] font-semibold text-zinc-400 mb-1.5"

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="w-full md:w-auto px-6 py-3 bg-[#7a32d4]/10 hover:bg-[#7a32d4]/20 border border-[#7a32d4]/30 text-[#d7baff] font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2"
      >
        <span className="material-symbols-outlined text-[20px]">shopping_cart_checkout</span>
        Comprar dispositivo
      </button>
    )
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#0B0B0E] border border-[#1F1F24] rounded-2xl p-6 md:p-8 w-full max-w-3xl my-auto shadow-2xl relative">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-[#d7baff]">shopping_cart_checkout</span>
            Comprar dispositivo
          </h2>
          <button onClick={() => setIsOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-[#121217] border border-[#1F1F24] text-zinc-400 hover:text-white hover:bg-[#1F1F24] transition-colors" disabled={submitting}>
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

      {error && (
        <div className={`mb-6 p-4 rounded-xl text-[14px] font-bold border ${error.includes('El dispositivo se creó') ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-8">
        
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

        <div className="bg-[#121217] border border-[#1F1F24] p-5 rounded-xl flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-zinc-500">auto_awesome</span>
            <span className="text-[14px] font-bold text-white">Datos vinculados automáticamente</span>
          </div>
          <p className="text-[13px] font-medium text-zinc-400 pl-6">
            La información del modelo, estado físico, batería y del cliente ({request.customer_name}) se vinculará directamente a este nuevo dispositivo.
          </p>
          
          {request.notes && (
            <div className="mt-4 border-t border-[#1F1F24] pt-4">
              <label className={labelClass}>Notas de la solicitud original</label>
              <textarea name="internal_notes" rows={2} defaultValue={`Origen de la solicitud: ${request.notes}`} className={`${inputClass} resize-none bg-[#0B0B0E]`}></textarea>
            </div>
          )}
          {!request.notes && (
            <input type="hidden" name="internal_notes" value="" />
          )}
        </div>

        {/* CAMPOS REQUERIDOS POR EL ADMIN */}
        <div className="flex flex-col gap-6">
          
          {request.estimated_min !== null && request.estimated_max !== null && (
            <div className="bg-[#7a32d4]/5 border border-[#7a32d4]/30 rounded-xl p-5 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-[#7a32d4]"></div>
              <h3 className="text-[11px] font-bold text-[#d7baff] uppercase tracking-wider mb-1">
                Valoración mostrada al cliente
              </h3>
              <div className="text-2xl font-extrabold text-white tracking-tight mb-1">
                {formatMoney(request.estimated_min)} – {formatMoney(request.estimated_max)}
              </div>
              
              {purchasePrice && !isNaN(Number(purchasePrice)) && (
                <div className="mt-4 pt-3 border-t border-[#7a32d4]/20 text-[13px] font-bold">
                  {(() => {
                    const pp = Number(purchasePrice)
                    if (pp >= request.estimated_min! && pp <= request.estimated_max!) {
                      return <span className="text-[#d7baff]">Dentro de la valoración mostrada</span>
                    }
                    if (pp < request.estimated_min!) {
                      return <span className="text-amber-500">{formatMoney(request.estimated_min! - pp)} por debajo de la valoración</span>
                    }
                    return <span className="text-green-500">{formatMoney(pp - request.estimated_max!)} por encima de la valoración</span>
                  })()}
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <label className={labelClass}>Precio de compra *</label>
              <span className="absolute left-4 top-[35px] text-zinc-500">€</span>
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
              <span className="absolute left-4 top-[35px] text-zinc-500">€</span>
              <input type="number" step="0.01" min="0" name="listing_price" required className={`${inputClass} pl-8`} />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Fecha de compra *</label>
              <input type="date" name="purchased_at" required defaultValue={new Date().toISOString().split('T')[0]} className={`${inputClass} [color-scheme:dark]`} />
            </div>
            <div>
              <label className={labelClass}>Lugar de compra (Opcional)</label>
              <input type="text" name="purchase_location" className={inputClass} placeholder="Ej. Las Palmas" />
            </div>
          </div>

          <div>
            <label className={labelClass}>IMEI / Número de serie (Opcional por ahora)</label>
            <input type="text" name="imei_serial" className={inputClass} placeholder="Introduce IMEI o Serie" />
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
            disabled={submitting}
            className="w-full md:w-auto px-6 py-3 bg-[#7a32d4]/10 hover:bg-[#7a32d4]/20 border border-[#7a32d4]/30 text-[#d7baff] font-bold text-[14px] rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting ? 'Guardando...' : 'Confirmar compra'}
          </button>
        </div>
      </form>
      </div>
    </div>
  )
}
