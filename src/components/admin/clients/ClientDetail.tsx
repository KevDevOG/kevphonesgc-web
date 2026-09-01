'use client'

import React from 'react'

type Client = {
  id: string
  name: string
  phone: string
  location: string | null
  created_at: string
}

type DeviceModel = {
  category: string
  name: string
}

type Device = {
  id: string
  storage: string | null
  color: string | null
  imei_serial: string
  purchase_price: number
  listing_price: number
  purchased_at?: string
  status?: string
  device_models: DeviceModel
}

type Sale = {
  id: string
  final_sale_price: number
  sold_at: string
  sale_location: string | null
  observations: string | null
  created_at: string
  devices: Device
}

type Props = {
  client: Client
  sales: Sale[] // Devices the client bought FROM us
  devices: Device[] // Devices the client sold TO us
}

function maskImei(imei: string) {
  if (!imei || imei.length <= 4) return imei
  return `•••• ${imei.slice(-4)}`
}

function formatDate(dateStr: string) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function formatCurrency(amount: number) {
  return amount.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + ' €'
}

function getMonthYearString(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
}

export function ClientDetail({ client, sales, devices }: Props) {
  const purchases_count = sales.length
  const purchases_total = sales.reduce((acc, sale) => acc + Number(sale.final_sale_price), 0)
  
  const sales_to_business_count = devices.length
  const paid_to_client_total = devices.reduce((acc, dev) => acc + Number(dev.purchase_price), 0)

  return (
    <div className="space-y-8">
      
      {/* Client Summary */}
      <section className="bg-[#0B0B0D] border border-[#1F1F24] rounded-xl p-6 flex flex-col gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#7a32d4] opacity-10 blur-3xl rounded-full pointer-events-none"></div>
        <div className="z-10">
          <h2 className="text-[32px] font-extrabold text-[#F7F7F7] mb-1 leading-tight tracking-wide" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
            {client.name}
          </h2>
          <div className="flex items-center gap-2 text-[#A8A8B0] text-[16px]">
            <span className="material-symbols-outlined text-[18px]">phone</span>
            <span>{client.phone}</span>
          </div>
          <div className="flex items-center gap-2 text-[#A8A8B0] text-[16px] mt-1">
            <span className="material-symbols-outlined text-[18px]">location_on</span>
            <span>{client.location || 'No especificada'}</span>
          </div>
        </div>
        
        <button 
          type="button" 
          onClick={() => {
            const num = client.phone.replace(/[^0-9]/g, '')
            if (num) window.open(`https://wa.me/34${num}`, '_blank')
          }}
          className="z-10 mt-2 flex items-center justify-center gap-2 w-full bg-transparent border border-[#7a32d4] text-[#B98AFF] text-[14px] font-semibold py-3 rounded-lg hover:bg-[#1c1b1b] transition-colors"
        >
          <svg className="text-[#B98AFF]" fill="currentColor" height="20" viewBox="0 0 24 24" width="20" xmlns="http://www.w3.org/2000/svg">
            <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.811.883 3.145.883 3.182 0 5.768-2.585 5.768-5.766 0-3.181-2.586-5.767-5.764-5.765zM20 12c0 4.418-3.582 8-8 8-.918 0-1.782-.158-2.593-.443l-5.309 1.393 1.41-5.181C4.78 14.39 4 13.253 4 12c0-4.418 3.582-8 8-8s8 3.582 8 8zm-3.586 2.046c-.198-.099-1.17-.578-1.352-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-8.36-.31-1.167-.936-.307-.238-.413-.423-.585-.705-.164-.265-.018-.409.083-.507.09-.089.197-.232.296-.347.1-.116.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z"></path>
          </svg>
          Contactar por WhatsApp
        </button>
      </section>

      {/* Metrics Section */}
      <section className="grid grid-cols-2 gap-4">
        <div className="bg-[#0B0B0D] border border-[#1F1F24] rounded-xl p-4 flex flex-col justify-center items-center text-center">
          <span className="text-[12px] font-semibold text-[#A8A8B0] uppercase tracking-wider mb-2 leading-tight">Compras</span>
          <div className="flex gap-4">
            <div className="flex flex-col items-center">
              <span className="text-[28px] font-extrabold text-[#F7F7F7] leading-none" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>{purchases_count}</span>
              <span className="text-[10px] text-[#A8A8B0] mt-1 uppercase">Cantidad</span>
            </div>
            <div className="w-[1px] bg-[#1F1F24]"></div>
            <div className="flex flex-col items-center">
              <span className="text-[24px] font-extrabold text-[#7a32d4] leading-none mt-1" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>{formatCurrency(purchases_total)}</span>
              <span className="text-[10px] text-[#A8A8B0] mt-1 uppercase">Gastado</span>
            </div>
          </div>
        </div>
        
        <div className="bg-[#0B0B0D] border border-[#1F1F24] rounded-xl p-4 flex flex-col justify-center items-center text-center">
          <span className="text-[12px] font-semibold text-[#A8A8B0] uppercase tracking-wider mb-2 leading-tight">Ventas</span>
          <div className="flex gap-4">
            <div className="flex flex-col items-center">
              <span className="text-[28px] font-extrabold text-[#F7F7F7] leading-none" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>{sales_to_business_count}</span>
              <span className="text-[10px] text-[#A8A8B0] mt-1 uppercase">Cantidad</span>
            </div>
            <div className="w-[1px] bg-[#1F1F24]"></div>
            <div className="flex flex-col items-center">
              <span className="text-[24px] font-extrabold text-[#7247b0] leading-none mt-1" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>{formatCurrency(paid_to_client_total)}</span>
              <span className="text-[10px] text-[#A8A8B0] mt-1 uppercase">Recibido</span>
            </div>
          </div>
        </div>
      </section>

      {/* Compras a KevPhonesGC */}
      <section>
        <h3 className="text-[24px] font-bold text-[#F7F7F7] mb-4 border-b border-[#1F1F24] pb-2" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>Compras a KevPhonesGC</h3>
        <div className="flex flex-col gap-4">
          {sales.length === 0 ? (
            <p className="text-[#A8A8B0] text-[14px]">Este cliente todavía no ha comprado dispositivos.</p>
          ) : (
            sales.map(sale => (
              <a 
                key={sale.id}
                href={`/admin/stock/${sale.devices.id}`}
                className="bg-[#0B0B0D] border border-[#1F1F24] rounded-xl p-4 flex flex-col gap-2 relative overflow-hidden group hover:border-[#7a32d4] transition-colors block"
              >
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#B98AFF]"></div>
                <div className="flex justify-between items-start">
                  <span className="bg-[#431080] text-[#B98AFF] text-[10px] font-semibold px-2 py-1 rounded uppercase tracking-wider">COMPRA</span>
                  <span className="text-[28px] font-extrabold text-[#B98AFF] leading-none" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>{formatCurrency(sale.final_sale_price)}</span>
                </div>
                <div className="mt-1">
                  <h4 className="text-[18px] font-bold text-[#F7F7F7] leading-tight" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>{sale.devices.device_models.name}</h4>
                  <p className="text-[14px] text-[#A8A8B0] mt-1">
                    {[sale.devices.storage, sale.devices.color, maskImei(sale.devices.imei_serial)].filter(Boolean).join(' · ')}
                  </p>
                </div>
                <div className="flex items-center gap-4 mt-2 border-t border-[#1F1F24] pt-3">
                  <div className="flex items-center gap-1 text-[#A8A8B0] text-[12px]">
                    <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                    <span>{formatDate(sale.sold_at)}</span>
                  </div>
                  {sale.sale_location && (
                    <div className="flex items-center gap-1 text-[#A8A8B0] text-[12px]">
                      <span className="material-symbols-outlined text-[14px]">location_on</span>
                      <span>{sale.sale_location}</span>
                    </div>
                  )}
                </div>
              </a>
            ))
          )}
        </div>
      </section>

      {/* Ventas a KevPhonesGC */}
      <section>
        <h3 className="text-[24px] font-bold text-[#F7F7F7] mb-4 border-b border-[#1F1F24] pb-2" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>Ventas a KevPhonesGC</h3>
        <div className="flex flex-col gap-4">
          {devices.length === 0 ? (
            <p className="text-[#A8A8B0] text-[14px]">Este cliente todavía no ha vendido dispositivos.</p>
          ) : (
            devices.map(dev => (
              <a 
                key={dev.id}
                href={`/admin/stock/${dev.id}`}
                className="bg-[#0B0B0D] border border-[#1F1F24] rounded-xl p-4 flex flex-col gap-2 relative overflow-hidden group hover:border-[#7a32d4] transition-colors block"
              >
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#353534]"></div>
                <div className="flex justify-between items-start">
                  <span className="bg-[#353534] text-[#A8A8B0] text-[10px] font-semibold px-2 py-1 rounded uppercase tracking-wider">VENTA</span>
                  <span className="text-[28px] font-extrabold text-[#F7F7F7] leading-none" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>{formatCurrency(dev.purchase_price)}</span>
                </div>
                <div className="mt-1">
                  <h4 className="text-[18px] font-bold text-[#F7F7F7] leading-tight" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>{dev.device_models.name}</h4>
                  <p className="text-[14px] text-[#A8A8B0] mt-1">
                    {[dev.storage, dev.color, maskImei(dev.imei_serial)].filter(Boolean).join(' · ')}
                  </p>
                </div>
                <div className="flex items-center justify-between mt-2 border-t border-[#1F1F24] pt-3">
                  <div className="flex items-center gap-1 text-[#A8A8B0] text-[12px]">
                    <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                    <span>{dev.purchased_at ? formatDate(dev.purchased_at) : 'Sin fecha'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {dev.status === 'available' ? (
                      <span className="bg-[#7a32d4]/20 text-[#d7baff] text-[10px] font-semibold px-2 py-0.5 rounded border border-[#7a32d4]/30 uppercase">Disponible</span>
                    ) : (
                      <span className="bg-[#353534] text-[#A8A8B0] text-[10px] font-semibold px-2 py-0.5 rounded border border-[#1F1F24] uppercase">Vendido</span>
                    )}
                  </div>
                </div>
              </a>
            ))
          )}
        </div>
      </section>

      {/* Footer */}
      <div className="text-center pt-8 border-t border-[#1F1F24]">
        <span className="text-[12px] text-[#A8A8B0]">Cliente desde: {getMonthYearString(client.created_at)}</span>
      </div>

    </div>
  )
}
