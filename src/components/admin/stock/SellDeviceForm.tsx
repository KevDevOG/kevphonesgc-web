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
    return new Intl.NumberFormat('es-ES').format(val) + ' €'
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
    <>
      <section className="bg-[#0B0B0D] border border-[#1F1F24] rounded-lg p-4 flex flex-col gap-2 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#7a32d4]/10 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2"></div>
        <div className="flex justify-between items-start z-10">
          <div>
            <h3 className="text-[24px] font-bold text-[#F7F7F7] uppercase" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>{device.device_models?.name}</h3>
            <p className="text-[16px] text-[#A8A8B0] mt-1">{[device.storage, device.color].filter(Boolean).join(' · ')}</p>
            <p className="text-[14px] text-[#A8A8B0]/70 font-mono mt-1">IMEI {maskImei(device.imei_serial)}</p>
          </div>
          <div className="bg-[#101014] border border-[#1F1F24] rounded px-2 py-1 flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px] text-[#A8A8B0]">inventory_2</span>
            <span className="text-[12px] font-semibold text-[#A8A8B0] uppercase">Stock</span>
          </div>
        </div>
        <div className="h-px bg-[#1F1F24] w-full my-2 z-10"></div>
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 z-10">
          <div className="flex flex-col">
            <span className="text-[12px] font-semibold text-[#A8A8B0] uppercase tracking-widest">Precio de compra</span>
            <span className="text-[18px] text-[#F7F7F7]">{formatPrice(device.purchase_price)}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[12px] font-semibold text-[#A8A8B0] uppercase tracking-widest">Precio de publicación</span>
            <span className="text-[18px] text-[#F7F7F7]">{formatPrice(device.listing_price)}</span>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-[24px] font-bold text-[#F7F7F7] uppercase border-l-4 border-[#7a32d4] pl-3" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>Datos de la venta</h3>
        
        {error && (
          <div className="bg-[#93000a] text-[#ffdad6] p-3 rounded-lg border border-[#690005]">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} id="sellForm" className="space-y-4 bg-[#0B0B0D] border border-[#1F1F24] p-4 rounded-lg">
          <div className="flex flex-col gap-1">
            <label className="text-[14px] font-semibold text-[#A8A8B0]" htmlFor="buyerName">Nombre del comprador</label>
            <input className="bg-[#101014] border border-[#1F1F24] rounded p-3 text-[16px] text-[#F7F7F7] placeholder:text-[#A8A8B0] focus:outline-none focus:border-[#7a32d4] transition-all" id="buyerName" name="buyerName" placeholder="Ej. Juan Pérez" type="text" required />
          </div>
          
          <div className="flex flex-col gap-1">
            <label className="text-[14px] font-semibold text-[#A8A8B0]" htmlFor="buyerPhone">Teléfono</label>
            <input className="bg-[#101014] border border-[#1F1F24] rounded p-3 text-[16px] text-[#F7F7F7] placeholder:text-[#A8A8B0] focus:outline-none focus:border-[#7a32d4] transition-all" id="buyerPhone" name="buyerPhone" placeholder="Ej. 600 000 000" type="tel" required />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[14px] font-semibold text-[#A8A8B0]" htmlFor="buyerLocation">Ubicación del comprador (opcional)</label>
            <input className="bg-[#101014] border border-[#1F1F24] rounded p-3 text-[16px] text-[#F7F7F7] placeholder:text-[#A8A8B0] focus:outline-none focus:border-[#7a32d4] transition-all" id="buyerLocation" name="buyerLocation" placeholder="Ej. Telde" type="text" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-[14px] font-semibold text-[#A8A8B0]" htmlFor="finalPrice">Precio final de venta (€)</label>
              <div className="relative">
                <input 
                  className="w-full bg-[#101014] border border-[#1F1F24] rounded py-3 pl-3 pr-8 text-[16px] text-[#B98AFF] focus:outline-none focus:border-[#7a32d4] transition-all" 
                  id="finalPrice" 
                  name="finalPrice" 
                  step="0.01" 
                  type="number" 
                  value={finalPrice} 
                  onChange={(e) => setFinalPrice(e.target.value)}
                  required 
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A8A8B0] text-[16px]">€</span>
              </div>
            </div>
            
            <div className="flex flex-col gap-1">
              <label className="text-[14px] font-semibold text-[#A8A8B0]" htmlFor="saleDate">Fecha de venta</label>
              <input className="bg-[#101014] border border-[#1F1F24] rounded p-3 text-[16px] text-[#F7F7F7] placeholder:text-[#A8A8B0] focus:outline-none focus:border-[#7a32d4] transition-all" id="saleDate" name="saleDate" type="date" defaultValue={todayStr} required />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[14px] font-semibold text-[#A8A8B0]" htmlFor="saleLocation">Lugar de venta (opcional)</label>
            <input className="bg-[#101014] border border-[#1F1F24] rounded p-3 text-[16px] text-[#F7F7F7] placeholder:text-[#A8A8B0] focus:outline-none focus:border-[#7a32d4] transition-all" id="saleLocation" name="saleLocation" placeholder="Ej. Las Palmas" type="text" />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[14px] font-semibold text-[#A8A8B0]" htmlFor="observations">Observaciones (opcional)</label>
            <textarea className="bg-[#101014] border border-[#1F1F24] rounded p-3 text-[16px] text-[#F7F7F7] placeholder:text-[#A8A8B0] focus:outline-none focus:border-[#7a32d4] transition-all resize-none" id="observations" name="observations" placeholder="Añade algún detalle adicional sobre la venta." rows={3}></textarea>
          </div>
        </form>
      </section>

      <section className="bg-[#101014] border border-[#1F1F24] rounded-lg p-4 flex flex-col gap-2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#101014] to-[#0B0B0D] opacity-50 z-0 pointer-events-none"></div>
        <h4 className="text-[14px] font-semibold text-[#A8A8B0] uppercase tracking-widest z-10 border-b border-[#1F1F24] pb-2 mb-2">Resumen Financiero</h4>
        <div className="flex justify-between items-center z-10">
          <span className="text-[16px] text-[#A8A8B0]">Precio de compra</span>
          <span className="text-[16px] text-[#F7F7F7] font-mono">{formatPrice(device.purchase_price)}</span>
        </div>
        <div className="flex justify-between items-center z-10">
          <span className="text-[16px] text-[#A8A8B0]">Precio de publicación</span>
          <span className="text-[16px] text-[#F7F7F7] font-mono">{formatPrice(device.listing_price)}</span>
        </div>
        <div className="flex justify-between items-center z-10">
          <span className="text-[16px] text-[#A8A8B0]">Precio final de venta</span>
          <span className="text-[16px] text-[#F7F7F7] font-mono">{formatPrice(Number(finalPrice) || 0)}</span>
        </div>
        <div className="h-px w-full bg-[#1F1F24] my-1 z-10"></div>
        <div className="flex justify-between items-center z-10 mt-1">
          <span className="text-[24px] font-bold text-[#F7F7F7] uppercase" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>Beneficio real</span>
          <span className={`text-[28px] font-extrabold ${operationProfit >= 0 ? 'text-[#B98AFF]' : 'text-[#ffb4ab]'}`} style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
            {formatPrice(operationProfit)}
          </span>
        </div>
      </section>

      <section className="flex flex-col gap-4 pt-2 border-t border-[#1F1F24]">
        <p className="text-[14px] text-[#A8A8B0] leading-relaxed text-center flex items-center justify-center gap-2">
          <span className="material-symbols-outlined text-[18px]">info</span>
          Al confirmar, el dispositivo se marcará como vendido y dejará de mostrarse en el stock público.
        </p>
        <div className="flex flex-col sm:flex-row-reverse gap-2 w-full mt-2">
          <button 
            type="submit" 
            form="sellForm"
            disabled={isSubmitting}
            className="w-full sm:w-auto flex-1 bg-gradient-to-r from-[#7a32d4] to-[#6e02d2] hover:brightness-110 disabled:opacity-50 text-white text-[14px] font-bold uppercase tracking-wider py-4 px-6 rounded shadow-lg transition-all active:scale-[0.98] flex justify-center items-center gap-2 border border-[#d7baff]/20"
          >
            {isSubmitting ? 'Registrando venta...' : (
              <>
                <span className="material-symbols-outlined text-[20px]">check_circle</span>
                Confirmar venta
              </>
            )}
          </button>
          <button 
            type="button" 
            disabled={isSubmitting}
            onClick={() => router.push(`/admin/stock/${device.id}`)}
            className="w-full sm:w-auto flex-1 bg-transparent border border-[#4b4454] hover:border-[#7a32d4] hover:text-[#eddcff] disabled:opacity-50 text-[#A8A8B0] text-[14px] font-bold uppercase tracking-wider py-4 px-6 rounded transition-all active:scale-[0.98]"
          >
            Cancelar
          </button>
        </div>
      </section>
    </>
  )
}
