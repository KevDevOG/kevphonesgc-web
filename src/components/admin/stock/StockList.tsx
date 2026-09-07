'use client'

import React, { useState, useMemo } from 'react'
import { AdminPageShell } from '@/components/admin/layout/AdminPageShell'
import { AdminPageHeader } from '@/components/admin/layout/AdminPageHeader'
import { deleteDeviceAction } from '@/actions/devices'
import { updateDeviceSaleAction, cancelDeviceSaleAction } from '@/actions/sales'
import Link from 'next/link'

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
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR"
    }).format(val)
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
        setView('available')
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
    <div className="flex flex-col gap-6">
      <AdminPageHeader 
        title="Stock" 
        subtitle="Gestiona tus dispositivos disponibles y vendidos." 
        action={
          <Link href="/admin/stock/nuevo" className="inline-flex justify-center items-center gap-2 bg-[#7a32d4]/10 hover:bg-[#7a32d4]/20 border border-[#7a32d4]/30 text-[#d7baff] font-bold text-sm py-2.5 px-4 rounded-xl transition-colors w-full lg:w-auto">
            <span className="material-symbols-outlined text-[20px]">add</span> Añadir dispositivo
          </Link>
        }
      />

      {/* KPI Section */}
      <section className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="col-span-1 bg-[#0B0B0E] border border-[#1F1F24] rounded-2xl p-5 flex flex-col justify-center">
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Disponibles</p>
          <p className="text-3xl font-semibold text-white leading-none">
            {availableCount}
          </p>
        </div>

        <div className="col-span-1 bg-[#0B0B0E] border border-[#1F1F24] rounded-2xl p-5 flex flex-col justify-center">
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Vendidos</p>
          <p className="text-3xl font-semibold text-white leading-none">
            {soldCount}
          </p>
        </div>

        <div className="col-span-2 lg:col-span-1 bg-[#0B0B0E] border border-[#1F1F24] rounded-2xl p-5 flex flex-col justify-center">
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Capital en stock</p>
          <p className="text-3xl font-semibold text-[#d7baff] leading-none">
            {formatPrice(stockCapital)}
          </p>
        </div>
      </section>

      {/* Filters & Search Toolbar */}
      <section className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        
        {/* Tabs */}
        <div className="flex bg-[#0B0B0E] border border-[#1F1F24] rounded-xl p-1 w-full lg:w-auto overflow-hidden">
          <button 
            onClick={() => { setView('available'); setSearch(''); setOpenMenuId(null); }}
            className={`flex-1 lg:flex-none px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap ${view === 'available' ? 'bg-[#7a32d4]/15 text-[#d7baff] shadow-sm' : 'text-zinc-400 hover:text-white'}`}
          >
            Disponibles ({availableCount})
          </button>
          <button 
            onClick={() => { setView('sold'); setSearch(''); setOpenMenuId(null); }}
            className={`flex-1 lg:flex-none px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap ${view === 'sold' ? 'bg-[#7a32d4]/15 text-[#d7baff] shadow-sm' : 'text-zinc-400 hover:text-white'}`}
          >
            Vendidos ({soldCount})
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full lg:w-[320px]">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-[20px]">search</span>
          <input 
            className="w-full bg-[#0B0B0E] border border-[#1F1F24] rounded-xl py-2.5 pl-10 pr-4 text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-[#7a32d4]/50 focus:ring-1 focus:ring-[#7a32d4]/50 transition-all" 
            placeholder="Buscar por modelo, IMEI..." 
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </section>

      {/* Device List */}
      <section className="flex flex-col gap-3 pb-8">
        {filteredList.length === 0 ? (
          <div className="text-center py-16 border border-[#1F1F24] rounded-2xl bg-[#0B0B0E]">
            <p className="text-zinc-500 text-sm font-medium">
              {view === 'available' ? 'Ahora mismo no hay dispositivos disponibles.' : 'Todavía no hay dispositivos vendidos.'}
            </p>
            {view === 'available' && (
              <Link href="/admin/stock/nuevo" className="inline-block mt-4 text-[#d7baff] font-semibold text-sm hover:underline">
                + Añadir dispositivo
              </Link>
            )}
          </div>
        ) : (
          filteredList.map(device => {
            const hasImage = device.device_images && device.device_images.length > 0
            const imgUrl = hasImage && supabaseUrl ? `${supabaseUrl}/storage/v1/object/public/device-images/${device.device_images[0].storage_path}` : null

            return (
              <div key={device.id} className="bg-[#0B0B0E] border border-[#1F1F24] rounded-2xl p-4 lg:p-5 flex flex-col lg:flex-row gap-4 lg:items-center relative group hover:border-[#2a2a30] transition-colors">
                
                {/* Mobile: Image + Details Top Row */}
                <div className="flex gap-4 items-start lg:flex-1 lg:items-center">
                  <div className="w-16 h-20 lg:w-14 lg:h-16 bg-[#1F1F24] rounded-xl border border-[#2a2a30] overflow-hidden flex-shrink-0 relative">
                    {imgUrl ? (
                      <img className="w-full h-full object-cover" src={imgUrl} alt={device.device_models?.name} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-600">
                        <span className="material-symbols-outlined text-[20px]">smartphone</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="text-base lg:text-[17px] leading-tight text-white font-bold truncate">
                        {device.device_models?.name}
                      </h3>
                      <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${view === 'available' ? 'bg-[#22c55e]/10 text-[#22c55e]' : 'bg-[#1F1F24] text-zinc-400'}`}>
                        {view === 'available' ? 'Disponible' : 'Vendido'}
                      </div>
                    </div>
                    
                    <p className="text-xs lg:text-[13px] text-zinc-400 truncate mb-1">
                      {[
                        device.storage, 
                        device.color, 
                        device.battery_health ? `${device.battery_health}%` : null,
                        conditionMap[device.condition] || null
                      ].filter(Boolean).join(' · ')}
                    </p>
                    
                    <p className="text-[11px] text-zinc-500 font-mono truncate">
                      IMEI {maskImei(device.imei_serial)}
                    </p>
                  </div>
                  
                  {/* Mobile Menu Button */}
                  <div className="lg:hidden absolute top-4 right-4">
                    <button 
                      aria-label="Opciones" 
                      className="text-zinc-500 hover:text-white transition-colors"
                      onClick={() => setOpenMenuId(openMenuId === device.id ? null : device.id)}
                    >
                      <span className="material-symbols-outlined text-[20px]">more_vert</span>
                    </button>
                    {openMenuId === device.id && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setOpenMenuId(null)}></div>
                        <div className="absolute right-0 top-6 w-48 bg-[#121217] border border-[#1F1F24] rounded-xl shadow-2xl z-50 py-1 overflow-hidden">
                          <Link href={`/admin/stock/${device.id}`} className="block px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-[#1F1F24]">Ver detalle</Link>
                          {view === 'available' ? (
                            <>
                              <Link href={`/admin/stock/${device.id}/editar`} className="block px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-[#1F1F24]">Editar dispositivo</Link>
                              <Link href={`/admin/stock/${device.id}/vender`} className="block px-4 py-2.5 text-[13px] font-semibold text-[#d7baff] hover:bg-[#1F1F24]">Vender</Link>
                              <button onClick={() => { setOpenMenuId(null); setDeletingDevice(device); }} className="block w-full text-left px-4 py-2.5 text-[13px] font-semibold text-red-400 hover:bg-[#1F1F24]">Eliminar</button>
                            </>
                          ) : (
                            <>
                              <button onClick={() => { setOpenMenuId(null); setEditingSale(device); }} className="block w-full text-left px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-[#1F1F24]">Editar venta</button>
                              <button onClick={() => { setOpenMenuId(null); setCancellingSale(device); }} className="block w-full text-left px-4 py-2.5 text-[13px] font-semibold text-red-400 hover:bg-[#1F1F24]">Anular venta</button>
                            </>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Financials & Actions (Desktop Inline / Mobile Stacked) */}
                <div className="flex items-center justify-between lg:justify-end gap-6 pt-3 lg:pt-0 border-t border-[#1F1F24] lg:border-t-0 mt-2 lg:mt-0">
                  <div className="flex gap-6">
                    <div className="flex flex-col lg:items-end">
                      <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-0.5">Compra</span>
                      <span className="text-sm font-semibold text-zinc-300">{formatPrice(device.purchase_price)}</span>
                    </div>
                    {view === 'available' ? (
                      <div className="flex flex-col lg:items-end">
                        <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-0.5">Precio / Venta</span>
                        <span className="text-base font-bold text-white">{formatPrice(device.listing_price)}</span>
                      </div>
                    ) : device.sale_data && (
                      <div className="flex flex-col lg:items-end">
                        <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-0.5">Vendido en</span>
                        <span className="text-base font-bold text-[#d7baff]">{formatPrice(device.sale_data.final_sale_price)}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Desktop Actions */}
                  <div className="hidden lg:flex items-center gap-2 relative">
                    <Link href={`/admin/stock/${device.id}`} className="p-2 text-zinc-500 hover:text-white hover:bg-[#1F1F24] rounded-lg transition-colors" title="Ver detalle">
                      <span className="material-symbols-outlined text-[20px]">visibility</span>
                    </Link>
                    {view === 'available' && (
                      <Link href={`/admin/stock/${device.id}/vender`} className="p-2 text-[#d7baff] hover:bg-[#7a32d4]/15 hover:text-[#e5d0ff] rounded-lg transition-colors" title="Vender">
                        <span className="material-symbols-outlined text-[20px]">sell</span>
                      </Link>
                    )}
                    <button 
                      aria-label="Más opciones" 
                      className="p-2 text-zinc-500 hover:text-white hover:bg-[#1F1F24] rounded-lg transition-colors"
                      onClick={() => setOpenMenuId(openMenuId === device.id ? null : device.id)}
                    >
                      <span className="material-symbols-outlined text-[20px]">more_vert</span>
                    </button>

                    {openMenuId === device.id && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setOpenMenuId(null)}></div>
                        <div className="absolute right-0 top-10 w-48 bg-[#121217] border border-[#1F1F24] rounded-xl shadow-2xl z-50 py-1 overflow-hidden">
                          {view === 'available' ? (
                            <>
                              <Link href={`/admin/stock/${device.id}/editar`} className="block px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-[#1F1F24]">Editar dispositivo</Link>
                              <button onClick={() => { setOpenMenuId(null); setDeletingDevice(device); }} className="block w-full text-left px-4 py-2.5 text-[13px] font-semibold text-red-400 hover:bg-[#1F1F24]">Eliminar</button>
                            </>
                          ) : (
                            <>
                              <button onClick={() => { setOpenMenuId(null); setEditingSale(device); }} className="block w-full text-left px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-[#1F1F24]">Editar venta</button>
                              <button onClick={() => { setOpenMenuId(null); setCancellingSale(device); }} className="block w-full text-left px-4 py-2.5 text-[13px] font-semibold text-red-400 hover:bg-[#1F1F24]">Anular venta</button>
                            </>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>

              </div>
            )
          })
        )}
      </section>

      {/* MODALS */}
      {deletingDevice && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0B0B0E] border border-[#1F1F24] rounded-2xl p-6 w-full max-w-md flex flex-col gap-5 shadow-2xl">
            <div>
              <h3 className="text-lg font-bold text-white mb-2">Eliminar dispositivo</h3>
              <p className="text-sm text-zinc-400">Esta acción eliminará permanentemente el dispositivo <span className="font-bold text-zinc-300">{deletingDevice.device_models?.name}</span> y sus fotos del stock. No se puede deshacer.</p>
            </div>
            
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-lg font-medium">
                {error}
              </div>
            )}
            
            <form onSubmit={handleDeleteDevice} className="flex justify-end gap-3 mt-2">
              <button 
                type="button" 
                onClick={() => { setDeletingDevice(null); setError(null); }}
                disabled={isPending}
                className="bg-transparent hover:bg-[#1F1F24] text-white font-semibold text-sm px-4 py-2.5 rounded-xl transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                disabled={isPending}
                className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 font-bold text-sm px-4 py-2.5 rounded-xl transition-colors disabled:opacity-50"
              >
                {isPending ? 'Eliminando...' : 'Eliminar'}
              </button>
            </form>
          </div>
        </div>
      )}

      {cancellingSale && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0B0B0E] border border-[#1F1F24] rounded-2xl p-6 w-full max-w-md flex flex-col gap-5 shadow-2xl">
            <div>
              <h3 className="text-lg font-bold text-white mb-2">Anular venta</h3>
              <p className="text-sm text-zinc-400 mb-2">El dispositivo volverá a estar disponible en stock y la venta se eliminará del historial.</p>
              <p className="text-sm font-semibold text-zinc-300">El cliente no se eliminará.</p>
            </div>
            
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-lg font-medium">
                {error}
              </div>
            )}
            
            <form onSubmit={handleCancelSale} className="flex justify-end gap-3 mt-2">
              <button 
                type="button" 
                onClick={() => { setCancellingSale(null); setError(null); }}
                disabled={isPending}
                className="bg-transparent hover:bg-[#1F1F24] text-white font-semibold text-sm px-4 py-2.5 rounded-xl transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                disabled={isPending}
                className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 font-bold text-sm px-4 py-2.5 rounded-xl transition-colors disabled:opacity-50"
              >
                {isPending ? 'Anulando...' : 'Anular venta'}
              </button>
            </form>
          </div>
        </div>
      )}

      {editingSale && editingSale.sale_data && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0B0B0E] border border-[#1F1F24] rounded-2xl p-6 w-full max-w-lg flex flex-col gap-6 shadow-2xl my-auto">
            <h3 className="text-lg font-bold text-white">Editar venta</h3>
            
            {/* Device summary context */}
            <div className="bg-[#121217] border border-[#1F1F24] rounded-xl p-4 flex flex-col gap-1.5">
              <div className="flex justify-between items-start">
                <span className="font-bold text-white">{editingSale.device_models?.name}</span>
                <span className="text-xs text-zinc-500 font-mono mt-0.5">IMEI {maskImei(editingSale.imei_serial)}</span>
              </div>
              <span className="text-[13px] text-zinc-400">
                {[editingSale.storage, editingSale.color].filter(Boolean).join(' · ')}
              </span>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-lg font-medium">
                {error}
              </div>
            )}
            
            <form onSubmit={handleEditSale} className="flex flex-col gap-5">
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Comprador</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[13px] font-semibold text-zinc-400">Nombre</label>
                    <input required name="buyerName" defaultValue={editingSale.sale_data.clients.name} className="bg-[#121217] border border-[#1F1F24] text-white text-[14px] rounded-xl px-4 py-2.5 outline-none focus:border-[#7a32d4]/50 focus:ring-1 focus:ring-[#7a32d4]/50 transition-all" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[13px] font-semibold text-zinc-400">Teléfono</label>
                    <input required name="buyerPhone" defaultValue={editingSale.sale_data.clients.phone} className="bg-[#121217] border border-[#1F1F24] text-white text-[14px] rounded-xl px-4 py-2.5 outline-none focus:border-[#7a32d4]/50 focus:ring-1 focus:ring-[#7a32d4]/50 transition-all" />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-semibold text-zinc-400">Ubicación (opcional)</label>
                  <input name="buyerLocation" defaultValue={editingSale.sale_data.clients.location || ''} className="bg-[#121217] border border-[#1F1F24] text-white text-[14px] rounded-xl px-4 py-2.5 outline-none focus:border-[#7a32d4]/50 focus:ring-1 focus:ring-[#7a32d4]/50 transition-all" />
                </div>
              </div>

              <div className="space-y-4 pt-1 border-t border-[#1F1F24]/50">
                <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Venta</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[13px] font-semibold text-zinc-400">Precio final (€)</label>
                    <input type="number" step="0.01" min="0" required name="finalPrice" defaultValue={editingSale.sale_data.final_sale_price} className="bg-[#121217] border border-[#1F1F24] text-white text-[14px] rounded-xl px-4 py-2.5 outline-none focus:border-[#7a32d4]/50 focus:ring-1 focus:ring-[#7a32d4]/50 transition-all" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[13px] font-semibold text-zinc-400">Fecha</label>
                    <input type="date" required name="saleDate" defaultValue={editingSale.sale_data.sold_at} className="bg-[#121217] border border-[#1F1F24] text-white text-[14px] rounded-xl px-4 py-2.5 outline-none focus:border-[#7a32d4]/50 focus:ring-1 focus:ring-[#7a32d4]/50 transition-all [color-scheme:dark]" />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-semibold text-zinc-400">Lugar de venta (opcional)</label>
                  <input name="saleLocation" defaultValue={editingSale.sale_data.sale_location || ''} className="bg-[#121217] border border-[#1F1F24] text-white text-[14px] rounded-xl px-4 py-2.5 outline-none focus:border-[#7a32d4]/50 focus:ring-1 focus:ring-[#7a32d4]/50 transition-all" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-semibold text-zinc-400">Observaciones</label>
                  <input name="observations" defaultValue={editingSale.sale_data.observations || ''} className="bg-[#121217] border border-[#1F1F24] text-white text-[14px] rounded-xl px-4 py-2.5 outline-none focus:border-[#7a32d4]/50 focus:ring-1 focus:ring-[#7a32d4]/50 transition-all" />
                </div>
              </div>

              <div className="flex justify-between items-center mt-2 pt-4 border-t border-[#1F1F24]/50">
                <div className="flex flex-col">
                  <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-0.5">Beneficio</span>
                  <span className="text-lg font-bold text-[#d7baff]">
                    {formatPrice(editingSale.sale_data.final_sale_price - editingSale.purchase_price)}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button 
                    type="button" 
                    onClick={() => { setEditingSale(null); setError(null); }}
                    disabled={isPending}
                    className="bg-transparent hover:bg-[#1F1F24] text-white font-semibold text-sm px-4 py-2.5 rounded-xl transition-colors disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    disabled={isPending}
                    className="bg-[#7a32d4]/10 hover:bg-[#7a32d4]/20 border border-[#7a32d4]/30 text-[#d7baff] font-bold text-sm px-4 py-2.5 rounded-xl transition-colors disabled:opacity-50"
                  >
                    {isPending ? 'Guardando...' : 'Guardar'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
