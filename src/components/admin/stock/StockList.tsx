'use client'

import React, { useState, useMemo } from 'react'
import { AdminPageHeader } from '@/components/admin/layout/AdminPageHeader'
import { deleteDeviceAction, publishDeviceAction } from '@/actions/devices'
import { updateDeviceSaleAction, cancelDeviceSaleAction } from '@/actions/sales'
import Link from 'next/link'

type Category = string

type Device = {
  id: string
  model_id: string
  storage: string | null
  color: string | null
  size: string | null
  connectivity: string | null
  case_type: string | null
  case_material: string | null
  imei_serial: string
  battery_health: number | null
  battery_cycles: number | null
  condition: string
  purchase_price: number
  discount_price?: number | null
  listing_price: number
  warranty_until: string | null
  purchased_at: string
  status: string
  is_published: boolean
  created_at: string
  custom_product_type?: string | null
  custom_specs?: Record<string, any> | string | null
  device_models: {
    category: string
    brand?: string
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


const otherProductTypeMap: Record<string, string> = {
  android_phone: 'Móvil Android',
  laptop: 'Portátil',
  desktop_pc: 'PC sobremesa',
  tablet: 'Tablet',
  console: 'Consola',
  other: 'Otro'
}

function getOtherProductTypeLabel(type?: string | null): string | null {
  if (!type) return null
  return otherProductTypeMap[type] || type
}

function getDeviceTitle(device: Device): string {
  const modelName = device.device_models?.name || ''
  if (device.device_models?.category !== 'other') {
    return modelName
  }
  const brand = (device.device_models?.brand || '').trim()
  if (!brand) return modelName
  if (modelName.toLowerCase().startsWith(brand.toLowerCase())) {
    return modelName
  }
  return `${brand} ${modelName}`
}

function parseCustomSpecs(specs: any): Record<string, string> {
  if (!specs) return {}
  if (typeof specs === 'string') {
    try {
      const parsed = JSON.parse(specs)
      return typeof parsed === 'object' && parsed !== null ? parsed : {}
    } catch {
      return {}
    }
  }
  return typeof specs === 'object' ? specs : {}
}

function getOtherDeviceSummary(device: Device): string {
  const specs = parseCustomSpecs(device.custom_specs)
  const pType = device.custom_product_type || 'other'

  const storageVal = device.storage || specs['Almacenamiento'] || null
  const colorVal = device.color || specs['Color'] || null

  const items: (string | null | undefined)[] = []

  if (pType === 'android_phone') {
    if (specs['RAM']) items.push(specs['RAM'].includes('RAM') ? specs['RAM'] : `${specs['RAM']} RAM`)
    if (storageVal) items.push(storageVal)
    if (colorVal) items.push(colorVal)
  } else if (pType === 'laptop') {
    if (specs['Procesador']) items.push(specs['Procesador'])
    if (specs['Gráfica']) items.push(specs['Gráfica'])
    if (specs['RAM']) items.push(specs['RAM'].includes('RAM') ? specs['RAM'] : `${specs['RAM']} RAM`)
    if (storageVal) items.push(storageVal)
  } else if (pType === 'desktop_pc') {
    if (specs['Procesador']) items.push(specs['Procesador'])
    if (specs['Gráfica']) items.push(specs['Gráfica'])
    if (specs['RAM']) items.push(specs['RAM'].includes('RAM') ? specs['RAM'] : `${specs['RAM']} RAM`)
    if (storageVal) items.push(storageVal)
  } else if (pType === 'tablet') {
    if (specs['RAM']) items.push(specs['RAM'].includes('RAM') ? specs['RAM'] : `${specs['RAM']} RAM`)
    if (storageVal) items.push(storageVal)
    if (colorVal) items.push(colorVal)
  } else if (pType === 'console') {
    if (storageVal) items.push(storageVal)
    if (colorVal) items.push(colorVal)
  } else {
    // Arbitrary product types: take up to 3 non-empty specs
    const entries = Object.entries(specs).filter(([k, v]) => {
      const valStr = String(v ?? '').trim()
      return valStr !== '' && k !== 'Almacenamiento' && k !== 'Color'
    })
    for (const [k, v] of entries.slice(0, 3)) {
      items.push(`${v}`)
    }
    if (items.length < 3 && storageVal && !items.includes(storageVal)) {
      items.push(storageVal)
    }
    if (items.length < 3 && colorVal && !items.includes(colorVal)) {
      items.push(colorVal)
    }
  }

  if (device.condition && conditionMap[device.condition]) {
    items.push(conditionMap[device.condition])
  }

  return items.filter(Boolean).join(' · ')
}

export function StockList({ availableDevices, soldDevices, availableCount, stockCapital, soldCount }: StockListProps) {
  const [view, setView] = useState<'all' | 'available' | 'sold'>('available')
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [publication, setPublication] = useState('all')
  const [sort, setSort] = useState('recent')
  const [editingSale, setEditingSale] = useState<Device | null>(null)
  const [deletingDevice, setDeletingDevice] = useState<Device | null>(null)
  const [cancellingSale, setCancellingSale] = useState<Device | null>(null)
  
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const allDevices = useMemo(() => [...availableDevices, ...soldDevices], [availableDevices, soldDevices])
  const categoryLabels: Record<string, string> = { iphone: 'iPhone', ipad: 'iPad', macbook: 'MacBook', apple_watch: 'Apple Watch', airpods: 'AirPods', ps5: 'PS5', nintendo_switch: 'Nintendo Switch', other: 'Otros' }
  const categories = Array.from(new Set(allDevices.map(device => device.device_models?.category).filter(Boolean))) as string[]
  const publishedCount = allDevices.filter(device => device.is_published).length
  const hasFilters = !!search || view !== 'available' || category !== 'all' || publication !== 'all' || sort !== 'recent'
  const resetFilters = () => { setSearch(''); setView('available'); setCategory('all'); setPublication('all'); setSort('recent') }
  const effectivePrice = (device: Device) => {
    const listing = Number(device.listing_price)
    const discount = Number(device.discount_price)
    return Number.isFinite(discount) && discount > 0 && discount < listing ? discount : listing
  }
  const salePrice = (device: Device) => device.status === 'sold' && device.sale_data ? Number(device.sale_data.final_sale_price) : effectivePrice(device)
  const margin = (device: Device) => {
    if (device.purchase_price === null || device.purchase_price === undefined) return null
    const result = salePrice(device) - Number(device.purchase_price)
    return Number.isFinite(result) ? result : null
  }
  const summary = (device: Device) => {
    const type = device.device_models?.category
    if (type === 'other') return getOtherDeviceSummary(device)
    const values = type === 'apple_watch' ? [device.size, device.connectivity, device.case_material, device.color]
      : type === 'airpods' ? [device.case_type, device.color]
      : [device.storage, device.color, device.size, device.connectivity]
    return values.filter(Boolean).join(' · ')
  }
  const filteredList = useMemo(() => {
    const query = search.trim().toLowerCase()
    const result = allDevices.filter(device => {
      if (view !== 'all' && device.status !== view) return false
      if (category !== 'all' && device.device_models?.category !== category) return false
      if (publication === 'published' && !device.is_published) return false
      if (publication === 'hidden' && device.is_published) return false
      const values = [getDeviceTitle(device), device.device_models?.brand, device.imei_serial, device.storage, device.color, device.size, device.connectivity, device.case_type, device.case_material, device.custom_product_type, getOtherProductTypeLabel(device.custom_product_type), summary(device)]
      return !query || values.some(value => String(value || '').toLowerCase().includes(query))
    })
    return result.sort((a, b) => {
      if (sort === 'recent') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      const valueA = sort === 'margin' ? margin(a) : sort.startsWith('buy') ? Number(a.purchase_price) : salePrice(a)
      const valueB = sort === 'margin' ? margin(b) : sort.startsWith('buy') ? Number(b.purchase_price) : salePrice(b)
      if (valueA === null || !Number.isFinite(valueA)) return valueB === null || !Number.isFinite(valueB) ? 0 : 1
      if (valueB === null || !Number.isFinite(valueB)) return -1
      return sort.endsWith('desc') || sort === 'margin' ? valueB - valueA : valueA - valueB
    })
  }, [allDevices, view, search, category, publication, sort])

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

  const handlePublish = async (device: Device) => {
    setIsPending(true)
    setError(null)
    try {
      const res = await publishDeviceAction(device.id)
      if (res.error) {
        setError(res.error)
      }
    } catch (err) {
      setError('Error al publicar el dispositivo.')
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

  const actions = (device: Device) => <div className="admin-stock__actions">
    <Link href={`/admin/stock/${device.id}`} title="Ver ficha" aria-label={`Ver ficha de ${getDeviceTitle(device)}`}><span aria-hidden="true" className="material-symbols-outlined">visibility</span></Link>
    {device.status === 'available' && <>
      <Link href={`/admin/stock/${device.id}/editar`} title="Editar" aria-label={`Editar ${getDeviceTitle(device)}`}><span aria-hidden="true" className="material-symbols-outlined">edit</span></Link>
      {!device.is_published && <button type="button" disabled={isPending} onClick={() => handlePublish(device)} title="Publicar" aria-label={`Publicar ${getDeviceTitle(device)}`}><span aria-hidden="true" className="material-symbols-outlined">publish</span></button>}
      <Link href={`/admin/stock/${device.id}/vender`} title="Vender" aria-label={`Vender ${getDeviceTitle(device)}`}><span aria-hidden="true" className="material-symbols-outlined">sell</span></Link>
    </>}
    <details className="admin-stock__more" onKeyDown={event => {
      if (event.key === 'Escape') { event.currentTarget.open = false; event.currentTarget.querySelector('summary')?.focus() }
    }}>
      <summary aria-label={`Más acciones para ${getDeviceTitle(device)}`}><span aria-hidden="true" className="material-symbols-outlined">more_vert</span></summary>
      <div className="admin-stock__menu">
        {device.status === 'available' ? <>
          <Link href={`/admin/stock/nuevo?duplicate=${device.id}`}>Duplicar dispositivo</Link>
          <button type="button" disabled={isPending} onClick={event => { event.currentTarget.closest('details')?.removeAttribute('open'); setDeletingDevice(device) }}>Eliminar dispositivo</button>
        </> : <>
          <button type="button" disabled={isPending || !device.sale_data} onClick={event => { event.currentTarget.closest('details')?.removeAttribute('open'); setEditingSale(device) }}>Editar venta</button>
          <button type="button" disabled={isPending || !device.sale_data} onClick={event => { event.currentTarget.closest('details')?.removeAttribute('open'); setCancellingSale(device) }}>Anular venta</button>
        </>}
      </div>
    </details>
  </div>
  const image = (device: Device) => {
    const imgUrl = device.device_images?.length && supabaseUrl ? `${supabaseUrl}/storage/v1/object/public/device-images/${device.device_images[0].storage_path}` : null
    return imgUrl ? <img src={imgUrl} alt={getDeviceTitle(device)} loading="lazy" decoding="async" /> : <span aria-hidden="true" className="material-symbols-outlined">devices</span>
  }
  const status = (device: Device) => <div className="admin-stock__status"><span>{device.status === 'available' ? 'Disponible' : 'Vendido'}</span><span data-published={device.is_published}>{device.is_published ? 'Publicado' : 'Oculto'}</span></div>
  const details = (device: Device) => <>{conditionMap[device.condition] || device.condition}{['iphone', 'ipad', 'apple_watch', 'macbook'].includes(device.device_models?.category) && device.battery_health !== null && <span className="admin-stock__muted">Batería {device.battery_health}%</span>}</>
  const price = (device: Device) => <><strong>{Number.isFinite(salePrice(device)) ? formatPrice(salePrice(device)) : '—'}</strong>{device.status === 'available' && effectivePrice(device) < Number(device.listing_price) && <del>{formatPrice(device.listing_price)}</del>}</>
  const marginValue = (device: Device) => { const value = margin(device); return <span data-tone={value === null || value === 0 ? 'neutral' : value > 0 ? 'positive' : 'negative'}>{value === null ? '—' : `${value > 0 ? '+' : ''}${formatPrice(value)}`}</span> }

  return (
    <div className="admin-stock">
      <AdminPageHeader title="Stock" subtitle="Gestiona tus dispositivos disponibles y vendidos." action={<div className="admin-stock__header-actions">
        <Link href="/admin/stock/rapido">Entrada rápida</Link><Link href="/admin/stock/nuevo">Nuevo dispositivo</Link>
      </div>} />
      <section aria-label="Resumen del inventario" className="admin-stock__summary">
        <span>Disponibles <strong>{availableCount}</strong></span><span>Vendidos <strong>{soldCount}</strong></span>
        <span>Publicados <strong>{publishedCount}</strong></span><span>Ocultos <strong>{allDevices.length - publishedCount}</strong></span>
        <span>Capital en stock <strong>{formatPrice(stockCapital)}</strong></span>
      </section>
      <section className="admin-stock__toolbar" aria-label="Buscar y filtrar inventario">
        <label className="admin-stock__search">Buscar<input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Modelo, variante, IMEI..." /></label>
        <div className="admin-stock__filters">
          <label>Categoría<select value={category} onChange={event => setCategory(event.target.value)}><option value="all">Todas</option>{categories.map(value => <option key={value} value={value}>{categoryLabels[value] || value}</option>)}</select></label>
          <label>Estado<select value={view} onChange={event => setView(event.target.value as typeof view)}><option value="all">Todos</option><option value="available">Disponibles</option><option value="sold">Vendidos</option></select></label>
          <label>Publicación<select value={publication} onChange={event => setPublication(event.target.value)}><option value="all">Todos</option><option value="published">Publicados</option><option value="hidden">Ocultos</option></select></label>
          <label>Ordenar<select value={sort} onChange={event => setSort(event.target.value)}><option value="recent">Más recientes</option><option value="sale_asc">Precio venta: menor a mayor</option><option value="sale_desc">Precio venta: mayor a menor</option><option value="buy_asc">Precio compra: menor a mayor</option><option value="buy_desc">Precio compra: mayor a menor</option>{allDevices.some(device => margin(device) !== null) && <option value="margin">Mayor margen</option>}</select></label>
        </div>
        <div className="admin-stock__results"><span role="status">{filteredList.length} resultados</span>{hasFilters && <button type="button" onClick={resetFilters}>Limpiar filtros</button>}</div>
      </section>
      {error && !deletingDevice && !editingSale && !cancellingSale && <p role="alert" className="admin-stock__error">{error}</p>}
      {filteredList.length === 0 ? <div className="admin-stock__empty">
        <p>{allDevices.length === 0 ? 'Todavía no hay dispositivos en el inventario.' : 'No hay dispositivos con estos filtros.'}</p>
        {allDevices.length === 0 ? <Link href="/admin/stock/nuevo">Nuevo dispositivo</Link> : <button type="button" onClick={resetFilters}>Limpiar filtros</button>}
      </div> : <>
        <div className="admin-stock__desktop"><table>
          <caption className="sr-only">Inventario de dispositivos y acciones</caption>
          <thead><tr>{['Producto', 'Estado', 'Detalles', 'Compra', 'Venta', 'Margen', 'Acciones'].map(label => <th key={label} scope="col">{label}</th>)}</tr></thead>
          <tbody>{filteredList.map(device => <tr key={device.id}>
            <td><div className="admin-stock__product"><div className="admin-stock__image">{image(device)}</div><div><Link href={`/admin/stock/${device.id}`}>{getDeviceTitle(device)}</Link><p>{summary(device)}</p><small>IMEI {maskImei(device.imei_serial)}</small></div></div></td>
            <td>{status(device)}</td><td>{details(device)}</td><td>{formatPrice(device.purchase_price)}</td><td>{price(device)}</td><td>{marginValue(device)}</td><td>{actions(device)}</td>
          </tr>)}</tbody>
        </table></div>
        <div className="admin-stock__mobile">{filteredList.map(device => <article key={device.id}>
          <div className="admin-stock__mobile-top"><div className="admin-stock__image">{image(device)}</div><div><h3><Link href={`/admin/stock/${device.id}`}>{getDeviceTitle(device)}</Link></h3><p>{summary(device)}</p>{status(device)}</div></div>
          <div className="admin-stock__mobile-info"><p>{details(device)}</p><div>{price(device)}</div></div>
          <div className="admin-stock__mobile-bottom"><span>Compra {formatPrice(device.purchase_price)} · Margen {marginValue(device)}</span>{actions(device)}</div>
        </article>)}</div>
      </>}

      {/* MODALS */}
      {deletingDevice && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0B0B0E] border border-[#1F1F24] rounded-2xl p-6 w-full max-w-md flex flex-col gap-5 shadow-2xl">
            <div>
              <h3 className="text-lg font-bold text-white mb-2">Eliminar dispositivo</h3>
              <p className="text-sm text-zinc-400">Esta acción eliminará permanentemente el dispositivo <span className="font-bold text-zinc-300">{getDeviceTitle(deletingDevice)}</span> y sus fotos del stock. No se puede deshacer.</p>
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
                <span className="font-bold text-white">{getDeviceTitle(editingSale)}</span>
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
