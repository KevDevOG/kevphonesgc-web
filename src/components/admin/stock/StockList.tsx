'use client'

import { useState, useMemo } from 'react'

type Device = {
  id: string
  model_id: string
  storage: string | null
  color: string | null
  imei_serial: string
  battery_health: number | null
  battery_cycles: number | null
  condition: string
  purchase_price: number
  listing_price: number
  warranty_until: string | null
  purchased_at: string
  status: string
  created_at: string
  device_models: {
    category: string
    name: string
  } | any
  device_images?: { storage_path: string }[] | any
}

type StockListProps = {
  availableDevices: Device[]
  soldDevices: Device[]
  availableCount: number
  stockCapital: number
  soldCount: number
}

const conditionMap: Record<string, string> = {
  'sealed': 'Precintado',
  'like_new': 'Como nuevo',
  'good': 'Buen estado',
  'marked': 'Con marcas'
}

export function StockList({ availableDevices, soldDevices, availableCount, stockCapital, soldCount }: StockListProps) {
  const [view, setView] = useState<'available' | 'sold'>('available')
  const [search, setSearch] = useState('')
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  const activeList = view === 'available' ? availableDevices : soldDevices

  const filteredList = useMemo(() => {
    if (!search.trim()) return activeList
    const q = search.toLowerCase()
    return activeList.filter(d => {
      const modelName = d.device_models?.name?.toLowerCase() || ''
      const imei = d.imei_serial.toLowerCase()
      const storage = (d.storage || '').toLowerCase()
      const color = (d.color || '').toLowerCase()
      return modelName.includes(q) || imei.includes(q) || storage.includes(q) || color.includes(q)
    })
  }, [activeList, search])

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

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''

  return (
    <div className="flex flex-col gap-4">
      {/* Search */}
      <div className="relative w-full">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#A8A8B0]">search</span>
        <input 
          className="w-full bg-[#101014] border border-[#1F1F24] rounded-lg py-3 pl-10 pr-4 text-[#F7F7F7] placeholder-[#A8A8B0] focus:outline-none focus:border-[#d7baff] focus:ring-1 focus:ring-[#d7baff] transition-all" 
          placeholder="Buscar por modelo o IMEI" 
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Summary Chips */}
      <div className="flex flex-row gap-3 overflow-x-auto pb-2 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        <div className="flex flex-wrap items-center gap-4 py-2 w-full">
          <div className="flex items-center gap-2">
            <span className="text-[#A8A8B0] text-[14px] font-semibold">Disponibles:</span>
            <span className="text-[#F7F7F7] font-bold">{availableCount}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[#A8A8B0] text-[14px] font-semibold">Capital en stock:</span>
            <span className="text-[#B98AFF] font-bold">{formatPrice(stockCapital)}</span>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            {view === 'available' ? (
              <button onClick={() => { setView('sold'); setSearch(''); setOpenMenuId(null); }} className="text-[#d7baff] text-[14px] font-bold hover:underline">
                Ver vendidos ({soldCount})
              </button>
            ) : (
              <button onClick={() => { setView('available'); setSearch(''); setOpenMenuId(null); }} className="text-[#d7baff] text-[14px] font-bold hover:underline">
                Ver disponibles
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Device List */}
      <div className="flex flex-col gap-4 pb-8">
        {filteredList.length === 0 ? (
          <div className="text-center py-12 border border-[#1F1F24] rounded-xl bg-[#0B0B0D]">
            <p className="text-[#A8A8B0] mb-4">
              {view === 'available' ? 'No hay dispositivos disponibles.' : 'No hay dispositivos vendidos.'}
            </p>
            {view === 'available' && (
               <a href="/admin/stock/nuevo" className="inline-block bg-[#1F1F24] text-[#F7F7F7] py-2 px-4 rounded hover:bg-[#353534]">Añadir dispositivo</a>
            )}
          </div>
        ) : (
          filteredList.map(device => {
            const hasImage = device.device_images && device.device_images.length > 0
            const imgUrl = hasImage && supabaseUrl ? `${supabaseUrl}/storage/v1/object/public/device-images/${device.device_images[0].storage_path}` : null

            return (
              <div key={device.id} className="bg-[#0B0B0D] border border-[#1F1F24] rounded-xl p-4 flex flex-row gap-4 relative group hover:border-[#d7baff]/50 transition-colors">
                <div className="w-20 h-24 bg-[#101014] rounded-lg border border-[#1F1F24] overflow-hidden flex-shrink-0 relative">
                  {imgUrl ? (
                    <img className="w-full h-full object-cover" src={imgUrl} alt={device.device_models?.name} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#4b4454]">
                      <span className="material-symbols-outlined">smartphone</span>
                    </div>
                  )}
                  <div className="absolute top-1 left-1 bg-[#431080] text-[#B98AFF] text-[10px] px-1.5 py-0.5 rounded leading-none uppercase font-semibold">
                    {view === 'available' ? 'Disponible' : 'Vendido'}
                  </div>
                </div>

                <div className="flex-col flex-1 min-w-0 flex gap-1 justify-center relative">
                  <div className="flex justify-between items-start">
                    <h3 className="text-[20px] leading-tight text-[#F7F7F7] truncate pr-6 font-bold" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
                      {device.device_models?.name}
                    </h3>
                    <div className="absolute top-[-4px] right-[-4px]">
                      <button 
                        aria-label="Opciones" 
                        className="text-[#A8A8B0] hover:text-[#d7baff] transition-colors p-1"
                        onClick={() => setOpenMenuId(openMenuId === device.id ? null : device.id)}
                      >
                        <span className="material-symbols-outlined">more_vert</span>
                      </button>
                      
                      {openMenuId === device.id && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setOpenMenuId(null)}></div>
                          <div className="absolute right-0 top-8 w-48 bg-[#1c1b1b] border border-[#1F1F24] rounded-lg shadow-xl z-50 py-1 overflow-hidden">
                            <a href={`/admin/stock/${device.id}`} className="block px-4 py-2 text-sm text-[#F7F7F7] hover:bg-[#353534]">Ver detalle</a>
                            {view === 'available' && (
                              <>
                                <a href={`/admin/stock/nuevo?duplicate=${device.id}`} className="block px-4 py-2 text-sm text-[#F7F7F7] hover:bg-[#353534]">Duplicar</a>
                                <a href={`/admin/stock/${device.id}/vender`} className="block px-4 py-2 text-sm text-[#F7F7F7] hover:bg-[#353534]">Marcar como vendido</a>
                              </>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <p className="text-[14px] leading-tight text-[#A8A8B0] truncate">
                    {[
                      device.storage, 
                      device.color, 
                      device.battery_health ? `${device.battery_health}%` : null,
                      device.battery_cycles ? `${device.battery_cycles} ciclos` : null
                    ].filter(Boolean).join(' · ')}
                  </p>
                  
                  <p className="text-[12px] leading-tight text-[#A8A8B0]/70 font-mono truncate mt-1">
                    IMEI {maskImei(device.imei_serial)}
                  </p>
                  
                  <div className="flex justify-between items-end mt-2 pt-2 border-t border-[#201f1f]">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-[#A8A8B0] uppercase font-semibold">Compra</span>
                      <span className="text-[14px] text-[#F7F7F7]">{formatPrice(device.purchase_price)}</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] text-[#A8A8B0] uppercase font-semibold">Publicación</span>
                      <span className="text-[18px] text-[#B98AFF] font-bold" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
                        {formatPrice(device.listing_price)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
