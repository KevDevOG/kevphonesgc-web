'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { registerDeviceSaleAction } from '@/actions/sales'

type Device = {
  id: string
  storage: string | null
  color: string | null
  imei_serial: string
  purchase_price: number
  listing_price: number
  status: string
  device_models: {
    category: string
    name: string
  } | any
}

export function SellDeviceForm({ device }: { device: Device }) {
  const router = useRouter()
  const [finalPrice, setFinalPrice] = useState<string>(device.listing_price.toString())
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const maskImei = (imei: string) => {
    if (!imei) return ''
    if (imei.length > 4) {
      return `•••• ${imei.slice(-4)}`
    }
    return `••${imei.slice(-2)}`
  }

  const formatPrice = (val: number) => {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR"
    }).format(val)
  }

  const operationProfit = (Number(finalPrice) || 0) - Number(device.purchase_price)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (isSubmitting) return

    setIsSubmitting(true)
    setError(null)
    
    const formData = new FormData(e.currentTarget)
    
    const res = await registerDeviceSaleAction(device.id, formData)
    
    if (res.error) {
      setError(res.error)
      setIsSubmitting(false)
    } else if (res.success) {
      router.push(`/admin/stock/${device.id}`)
    }
  }

  const todayStr = new Date().toISOString().split('T')[0]

  return (
    <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
      
      {/* LEFT: FORM */}
      <div className="w-full lg:flex-[1.2] flex flex-col gap-6">
        <h2 className="text-xl font-bold text-white mb-2">Datos de la venta</h2>
        
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-4 rounded-xl font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} id="sellForm" className="flex flex-col gap-6 bg-[#0B0B0E] border border-[#1F1F24] p-6 rounded-2xl">
          
          <div className="flex flex-col gap-4">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Comprador</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-semibold text-zinc-400" htmlFor="buyerName">Nombre</label>
                <input className="bg-[#121217] border border-[#1F1F24] rounded-xl px-4 py-3 text-[14px] text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#7a32d4]/50 focus:ring-1 focus:ring-[#7a32d4]/50 transition-all" id="buyerName" name="buyerName" placeholder="Ej. Juan Pérez" type="text" required />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-semibold text-zinc-400" htmlFor="buyerPhone">Teléfono</label>
                <input className="bg-[#121217] border border-[#1F1F24] rounded-xl px-4 py-3 text-[14px] text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#7a32d4]/50 focus:ring-1 focus:ring-[#7a32d4]/50 transition-all" id="buyerPhone" name="buyerPhone" placeholder="Ej. 600 000 000" type="tel" required />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold text-zinc-400" htmlFor="buyerLocation">Ubicación (opcional)</label>
              <input className="bg-[#121217] border border-[#1F1F24] rounded-xl px-4 py-3 text-[14px] text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#7a32d4]/50 focus:ring-1 focus:ring-[#7a32d4]/50 transition-all" id="buyerLocation" name="buyerLocation" placeholder="Ej. Telde" type="text" />
            </div>
          </div>

          <div className="h-px bg-[#1F1F24] w-full"></div>

          <div className="flex flex-col gap-4">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Venta</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-semibold text-zinc-400" htmlFor="finalPrice">Precio final (€)</label>
                <input 
                  className="bg-[#121217] border border-[#1F1F24] rounded-xl px-4 py-3 text-[14px] font-bold text-[#d7baff] focus:outline-none focus:border-[#7a32d4]/50 focus:ring-1 focus:ring-[#7a32d4]/50 transition-all" 
                  id="finalPrice" 
                  name="finalPrice" 
                  step="0.01" 
                  type="number" 
                  value={finalPrice} 
                  onChange={(e) => setFinalPrice(e.target.value)}
                  required 
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-semibold text-zinc-400" htmlFor="saleDate">Fecha</label>
                <input className="bg-[#121217] border border-[#1F1F24] rounded-xl px-4 py-3 text-[14px] text-white focus:outline-none focus:border-[#7a32d4]/50 focus:ring-1 focus:ring-[#7a32d4]/50 transition-all [color-scheme:dark]" id="saleDate" name="saleDate" type="date" defaultValue={todayStr} required />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold text-zinc-400" htmlFor="saleLocation">Lugar de venta (opcional)</label>
              <input className="bg-[#121217] border border-[#1F1F24] rounded-xl px-4 py-3 text-[14px] text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#7a32d4]/50 focus:ring-1 focus:ring-[#7a32d4]/50 transition-all" id="saleLocation" name="saleLocation" placeholder="Ej. Las Palmas" type="text" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold text-zinc-400" htmlFor="observations">Observaciones (opcional)</label>
              <textarea className="bg-[#121217] border border-[#1F1F24] rounded-xl px-4 py-3 text-[14px] text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#7a32d4]/50 focus:ring-1 focus:ring-[#7a32d4]/50 transition-all resize-none" id="observations" name="observations" placeholder="Añade algún detalle adicional sobre la venta." rows={3}></textarea>
            </div>
          </div>
        </form>
      </div>

      {/* RIGHT: SUMMARY & ACTIONS */}
      <div className="w-full lg:flex-[0.8] flex flex-col gap-6 sticky top-20">
        
        <div className="bg-[#0B0B0E] border border-[#1F1F24] rounded-2xl p-6 flex flex-col gap-6">
          
          {/* Device Context */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-start">
              <h3 className="text-lg font-bold text-white">{device.device_models?.name}</h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#22c55e]/10 text-[#22c55e]">
                En stock
              </span>
            </div>
            <p className="text-sm text-zinc-400 font-medium">
              {[device.storage, device.color].filter(Boolean).join(' · ')}
            </p>
            <p className="text-[11px] font-mono text-zinc-500">IMEI {maskImei(device.imei_serial)}</p>
          </div>

          <div className="h-px bg-[#1F1F24] w-full"></div>

          {/* Financial Summary */}
          <div className="flex flex-col gap-4">
            <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Resumen financiero</h4>
            
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-zinc-400">Precio de compra</span>
              <span className="text-sm font-semibold text-zinc-300">{formatPrice(device.purchase_price)}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-zinc-400">Precio de publicación</span>
              <span className="text-sm font-semibold text-zinc-300">{formatPrice(device.listing_price)}</span>
            </div>
            
            <div className="flex justify-between items-center pt-2 border-t border-[#1F1F24]/50">
              <span className="text-sm font-medium text-zinc-300">Precio final</span>
              <span className="text-base font-bold text-white">{formatPrice(Number(finalPrice) || 0)}</span>
            </div>
            
            <div className="flex flex-col gap-1 pt-2">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Beneficio real</span>
              <span className={`text-3xl font-extrabold ${operationProfit >= 0 ? 'text-[#d7baff]' : 'text-red-400'}`}>
                {operationProfit > 0 ? '+' : ''}{formatPrice(operationProfit)}
              </span>
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex flex-col gap-3">
          <p className="text-[11px] text-zinc-500 leading-relaxed text-center px-4">
            Al confirmar, el dispositivo se marcará como vendido y dejará de mostrarse en el stock público.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button 
              type="button" 
              disabled={isSubmitting}
              onClick={() => router.push(`/admin/stock/${device.id}`)}
              className="flex-1 bg-transparent hover:bg-[#1F1F24] border border-[#1F1F24] text-white text-sm font-semibold py-3.5 px-4 rounded-xl transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              form="sellForm"
              disabled={isSubmitting}
              className="flex-1 bg-[#7a32d4]/10 hover:bg-[#7a32d4]/20 border border-[#7a32d4]/30 text-[#d7baff] text-sm font-bold py-3.5 px-4 rounded-xl transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
            >
              {isSubmitting ? 'Registrando...' : 'Confirmar venta'}
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
