'use client'

import { useState, useMemo } from 'react'
import { deleteDeviceAction } from '@/actions/devices'
import { updateDeviceSaleAction, cancelDeviceSaleAction } from '@/actions/sales'

type Category = string

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
  sale_data?: {
    id: string
    device_id: string
    buyer_client_id: string
    final_sale_price: number
    sold_at: string
    sale_location: string | null
    observations: string | null
    clients: {
      id: string
      name: string
      phone: string
      location: string | null
    }
  } | null
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
  
  const [editingSale, setEditingSale] = useState<Device | null>(null)
  const [deletingDevice, setDeletingDevice] = useState<Device | null>(null)
  const [cancellingSale, setCancellingSale] = useState<Device | null>(null)
  
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

  const handleDeleteDevice = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!deletingDevice) return
    setIsPending(true)
    setError(null)
    
    try {
      const res = await deleteDeviceAction(deletingDevice.id)
      if (res.error) {
        setError(res.error)
      } else {
        setDeletingDevice(null)
      }
    } catch (err) {
      setError('No se pudo eliminar el dispositivo. Inténtalo de nuevo.')
    } finally {
      setIsPending(false)
    }
  }

  const handleCancelSale = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!cancellingSale || !cancellingSale.sale_data) return
    setIsPending(true)
    setError(null)
    
    try {
      const res = await cancelDeviceSaleAction(cancellingSale.sale_data.id)
      if (!res.success) {
        setError(res.error || 'No se pudo anular la venta. Inténtalo de nuevo.')
      } else {
        setCancellingSale(null)
        setView('available') // Optional UX touch, switch view or keep
      }
    } catch (err) {
      setError('No se pudo anular la venta. Inténtalo de nuevo.')
    } finally {
      setIsPending(false)
    }
  }

  const handleEditSale = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!editingSale || !editingSale.sale_data) return
    setIsPending(true)
    setError(null)
    
    const formData = new FormData(e.currentTarget)
    
    try {
      const res = await updateDeviceSaleAction(editingSale.sale_data.id, formData)
      if (!res.success) {
        setError(res.error || 'No se pudo actualizar la venta. Inténtalo de nuevo.')
      } else {
        setEditingSale(null)
      }
    } catch (err) {
      setError('No se pudo actualizar la venta. Inténtalo de nuevo.')
    } finally {
      setIsPending(false)
    }
  }

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

      {/* Modals */}
      {deletingDevice && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-[#0B0B0D] border border-[#1F1F24] rounded-xl p-6 w-full max-w-md flex flex-col gap-4">
            <h3 className="text-[20px] font-bold text-[#ffb4ab] uppercase tracking-wider border-b border-[#93000a]/30 pb-2">¿Eliminar este dispositivo?</h3>
            <p className="text-[14px] text-[#A8A8B0]">Esta acción eliminará permanentemente el dispositivo y sus fotos del stock.</p>
            {error && (
              <div className="bg-[#93000a]/20 border border-[#93000a] text-[#ffb4ab] text-[14px] p-3 rounded-lg">
                {error}
              </div>
            )}
            <form onSubmit={handleDeleteDevice} className="flex justify-end gap-3 mt-4">
              <button 
                type="button" 
                onClick={() => { setDeletingDevice(null); setError(null); }}
                disabled={isPending}
                className="bg-[#353534] hover:bg-[#4b4454] text-[#F7F7F7] font-semibold text-[14px] px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                disabled={isPending}
                className="bg-[#93000a] hover:bg-[#690005] text-[#ffb4ab] font-bold text-[14px] px-4 py-2 rounded-lg transition-colors disabled:opacity-50 border border-[#ffb4ab]/30"
              >
                {isPending ? 'Eliminando...' : 'Eliminar definitivamente'}
              </button>
            </form>
          </div>
        </div>
      )}

      {cancellingSale && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-[#0B0B0D] border border-[#1F1F24] rounded-xl p-6 w-full max-w-md flex flex-col gap-4">
            <h3 className="text-[20px] font-bold text-[#ffb4ab] uppercase tracking-wider border-b border-[#93000a]/30 pb-2">¿Anular esta venta?</h3>
            <p className="text-[14px] text-[#A8A8B0]">El dispositivo volverá a estar disponible en stock y la venta se eliminará del historial.</p>
            <p className="text-[14px] font-semibold text-[#F7F7F7]">El cliente no se eliminará.</p>
            {error && (
              <div className="bg-[#93000a]/20 border border-[#93000a] text-[#ffb4ab] text-[14px] p-3 rounded-lg">
                {error}
              </div>
            )}
            <form onSubmit={handleCancelSale} className="flex justify-end gap-3 mt-4">
              <button 
                type="button" 
                onClick={() => { setCancellingSale(null); setError(null); }}
                disabled={isPending}
                className="bg-[#353534] hover:bg-[#4b4454] text-[#F7F7F7] font-semibold text-[14px] px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                disabled={isPending}
                className="bg-[#93000a] hover:bg-[#690005] text-[#ffb4ab] font-bold text-[14px] px-4 py-2 rounded-lg transition-colors disabled:opacity-50 border border-[#ffb4ab]/30"
              >
                {isPending ? 'Anulando...' : 'Anular venta'}
              </button>
            </form>
          </div>
        </div>
      )}

      {editingSale && editingSale.sale_data && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0B0B0D] border border-[#1F1F24] rounded-xl p-6 w-full max-w-lg flex flex-col gap-4 my-auto">
            <h3 className="text-[20px] font-bold text-[#F7F7F7] uppercase tracking-wider border-b border-[#1F1F24] pb-2">Editar venta</h3>
            
            {/* Device summary context */}
            <div className="bg-[#101014] border border-[#1F1F24] rounded-lg p-3 flex flex-col gap-1">
              <div className="flex justify-between items-center">
                <span className="font-bold text-[#F7F7F7]">{editingSale.device_models?.name}</span>
                <span className="text-[12px] text-[#A8A8B0]">IMEI {maskImei(editingSale.imei_serial)}</span>
              </div>
              <span className="text-[13px] text-[#A8A8B0]">
                {[editingSale.storage, editingSale.color].filter(Boolean).join(' · ')}
              </span>
            </div>

            {error && (
              <div className="bg-[#93000a]/20 border border-[#93000a] text-[#ffb4ab] text-[14px] p-3 rounded-lg">
                {error}
              </div>
            )}
            <form onSubmit={handleEditSale} className="flex flex-col gap-4">
              <div className="space-y-3">
                <h4 className="text-[14px] font-semibold text-[#A8A8B0] uppercase">Comprador</h4>
                <div className="flex flex-col gap-1">
                  <label className="text-[12px] font-semibold text-[#A8A8B0]">Nombre</label>
                  <input required name="buyerName" defaultValue={editingSale.sale_data.clients.name} className="bg-[#1c1b1b] border border-[#1F1F24] text-[#F7F7F7] text-[16px] rounded-lg px-3 py-2 outline-none focus:border-[#7a32d4] focus:ring-1 focus:ring-[#7a32d4]" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[12px] font-semibold text-[#A8A8B0]">Teléfono</label>
                  <input required name="buyerPhone" defaultValue={editingSale.sale_data.clients.phone} className="bg-[#1c1b1b] border border-[#1F1F24] text-[#F7F7F7] text-[16px] rounded-lg px-3 py-2 outline-none focus:border-[#7a32d4] focus:ring-1 focus:ring-[#7a32d4]" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[12px] font-semibold text-[#A8A8B0]">Ubicación (opcional)</label>
                  <input name="buyerLocation" defaultValue={editingSale.sale_data.clients.location || ''} className="bg-[#1c1b1b] border border-[#1F1F24] text-[#F7F7F7] text-[16px] rounded-lg px-3 py-2 outline-none focus:border-[#7a32d4] focus:ring-1 focus:ring-[#7a32d4]" />
                </div>
              </div>

              <div className="space-y-3 mt-2">
                <h4 className="text-[14px] font-semibold text-[#A8A8B0] uppercase">Venta</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[12px] font-semibold text-[#A8A8B0]">Precio final (€)</label>
                    <input type="number" step="0.01" min="0" required name="finalPrice" defaultValue={editingSale.sale_data.final_sale_price} className="bg-[#1c1b1b] border border-[#1F1F24] text-[#F7F7F7] text-[16px] rounded-lg px-3 py-2 outline-none focus:border-[#7a32d4] focus:ring-1 focus:ring-[#7a32d4]" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[12px] font-semibold text-[#A8A8B0]">Fecha de venta</label>
                    <input type="date" required name="saleDate" defaultValue={editingSale.sale_data.sold_at} className="bg-[#1c1b1b] border border-[#1F1F24] text-[#A8A8B0] text-[16px] rounded-lg px-3 py-2 outline-none focus:border-[#7a32d4] focus:ring-1 focus:ring-[#7a32d4]" />
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[12px] font-semibold text-[#A8A8B0]">Lugar de venta (opcional)</label>
                  <input name="saleLocation" defaultValue={editingSale.sale_data.sale_location || ''} className="bg-[#1c1b1b] border border-[#1F1F24] text-[#F7F7F7] text-[16px] rounded-lg px-3 py-2 outline-none focus:border-[#7a32d4] focus:ring-1 focus:ring-[#7a32d4]" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[12px] font-semibold text-[#A8A8B0]">Observaciones</label>
                  <input name="observations" defaultValue={editingSale.sale_data.observations || ''} className="bg-[#1c1b1b] border border-[#1F1F24] text-[#F7F7F7] text-[16px] rounded-lg px-3 py-2 outline-none focus:border-[#7a32d4] focus:ring-1 focus:ring-[#7a32d4]" />
                </div>
              </div>

              <div className="flex justify-between items-center mt-2 border-t border-[#1F1F24] pt-4">
                <div className="flex flex-col">
                  <span className="text-[12px] text-[#A8A8B0]">Beneficio real</span>
                  <span className="text-[16px] font-bold text-[#d7baff]">
                    {formatPrice(editingSale.sale_data.final_sale_price - editingSale.purchase_price)}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button 
                    type="button" 
                    onClick={() => { setEditingSale(null); setError(null); }}
                    disabled={isPending}
                    className="bg-[#353534] hover:bg-[#4b4454] text-[#F7F7F7] font-semibold text-[14px] px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    disabled={isPending}
                    className="bg-[#7a32d4] hover:bg-[#6e02d2] text-[#F7F7F7] font-semibold text-[14px] px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {isPending ? 'Guardando...' : 'Guardar cambios'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

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
                            {view === 'available' ? (
                              <>
                                <a href={`/admin/stock/${device.id}/editar`} className="block px-4 py-2 text-sm text-[#F7F7F7] hover:bg-[#353534]">Editar dispositivo</a>
                                <a href={`/admin/stock/${device.id}/vender`} className="block px-4 py-2 text-sm text-[#F7F7F7] hover:bg-[#353534]">Marcar como vendido</a>
                                <button 
                                  onClick={() => { setOpenMenuId(null); setDeletingDevice(device); }}
                                  className="block w-full text-left px-4 py-2 text-sm text-[#ffb4ab] hover:bg-[#353534]"
                                >
                                  Eliminar dispositivo
                                </button>
                              </>
                            ) : (
                              <>
                                <button 
                                  onClick={() => { setOpenMenuId(null); setEditingSale(device); }}
                                  className="block w-full text-left px-4 py-2 text-sm text-[#F7F7F7] hover:bg-[#353534]"
                                >
                                  Editar venta
                                </button>
                                <button 
                                  onClick={() => { setOpenMenuId(null); setCancellingSale(device); }}
                                  className="block w-full text-left px-4 py-2 text-sm text-[#ffb4ab] hover:bg-[#353534]"
                                >
                                  Anular venta
                                </button>
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
                    {view === 'available' ? (
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] text-[#A8A8B0] uppercase font-semibold">Publicación</span>
                        <span className="text-[18px] text-[#B98AFF] font-bold" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
                          {formatPrice(device.listing_price)}
                        </span>
                      </div>
                    ) : device.sale_data && (
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] text-[#A8A8B0] uppercase font-semibold">Venta</span>
                        <span className="text-[18px] text-[#d7baff] font-bold" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
                          {formatPrice(device.sale_data.final_sale_price)}
                        </span>
                      </div>
                    )}
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
