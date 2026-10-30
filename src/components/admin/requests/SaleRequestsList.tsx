'use client'

import { useId, useState } from 'react'
import { AdminPageShell } from '@/components/admin/layout/AdminPageShell'
import { AdminPageHeader } from '@/components/admin/layout/AdminPageHeader'
import Link from 'next/link'

type DeviceModel = {
  id: string
  name: string
  brand: string
  category: string
}

type SaleRequest = {
  id: string
  model_id: string
  storage: string | null
  color: string | null
  customer_name: string | null
  customer_phone: string | null
  customer_location: string | null
  estimated_min: number | null
  estimated_max: number | null
  battery_health?: number | null
  device_condition?: string | null
  status: string
  created_at: string
  device_models: DeviceModel | null
}

type SaleRequestsListProps = {
  initialRequests: SaleRequest[]
}

const statusLabels: Record<string, string> = {
  new: 'Nueva',
  in_progress: 'En proceso',
  purchased: 'Comprado',
  discarded: 'Descartada'
}

const conditionLabels: Record<string, string> = {
  sealed: 'Precintado',
  like_new: 'Como nuevo',
  good: 'Buen estado',
  marked: 'Con marcas'
}

const currency = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' })

function estimate(request: SaleRequest) {
  return request.estimated_min !== null && request.estimated_max !== null
    ? `${currency.format(request.estimated_min)} – ${currency.format(request.estimated_max)}`
    : 'Sin estimación'
}

function status(request: SaleRequest) {
  return <span className="admin-requests__status" data-status={request.status}>{statusLabels[request.status] || request.status}</span>
}

function date(request: SaleRequest) {
  return <time dateTime={request.created_at}>{new Date(request.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}</time>
}

function variant(request: SaleRequest) {
  return [request.storage, request.color].filter(Boolean).join(' · ')
}

function details(request: SaleRequest) {
  return [
    request.battery_health != null ? `Batería ${request.battery_health}%` : null,
    request.device_condition ? conditionLabels[request.device_condition] : null
  ].filter(Boolean).join(' · ')
}

export function SaleRequestsList({ initialRequests }: SaleRequestsListProps) {
  const searchId = useId()
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState('new')
  const [sortOrder, setSortOrder] = useState('recent')
  const query = search.trim().toLocaleLowerCase('es')

  const filteredRequests = initialRequests.filter(request => {
    if (activeFilter !== 'all' && request.status !== activeFilter) return false
    if (!query) return true
    return [request.customer_name, request.customer_phone, request.customer_location, request.device_models?.name, request.storage, request.color]
      .filter(Boolean).join(' ').toLocaleLowerCase('es').includes(query)
  })
  // The default preserves the server's existing newest-first order.
  const visibleRequests = sortOrder === 'oldest'
    ? [...filteredRequests].sort((a, b) => Date.parse(a.created_at) - Date.parse(b.created_at))
    : filteredRequests

  const counts = initialRequests.reduce<Record<string, number>>((result, request) => {
    result[request.status] = (result[request.status] || 0) + 1
    return result
  }, {})
  const filters = [
    { id: 'new', label: 'Nuevas' },
    { id: 'in_progress', label: 'En proceso' },
    { id: 'purchased', label: 'Compradas' },
    // Retain any additional real status present in the loaded data.
    ...Object.keys(counts).filter(key => !['new', 'in_progress', 'purchased'].includes(key))
      .map(id => ({ id, label: statusLabels[id] || id })),
    { id: 'all', label: 'Todas' }
  ]
  const hasFilters = Boolean(query) || activeFilter !== 'all' || sortOrder !== 'recent'
  const resetFilters = () => {
    setSearch('')
    setActiveFilter('all')
    setSortOrder('recent')
  }

  return (
    <AdminPageShell>
      <div className="admin-requests">
        <AdminPageHeader
          title="Solicitudes"
          subtitle="Gestiona las solicitudes de venta recibidas."
          action={<p className="admin-requests__summary"><strong>{counts.new || 0}</strong> nuevas <span>· {initialRequests.length} en total</span></p>}
        />

        <div className="admin-requests__controls">
          <div className="admin-requests__search">
            <label htmlFor={searchId} className="sr-only">Buscar solicitud por cliente, teléfono o dispositivo</label>
            <span aria-hidden="true" className="material-symbols-outlined">search</span>
            <input id={searchId} type="search" placeholder="Buscar solicitud..." value={search} onChange={event => setSearch(event.target.value)} />
          </div>
          <div className="admin-requests__tabs" role="group" aria-label="Filtrar solicitudes por estado">
            {filters.map(filter => (
              <button key={filter.id} type="button" aria-pressed={activeFilter === filter.id} onClick={() => setActiveFilter(filter.id)}>
                {filter.label} <span>{filter.id === 'all' ? initialRequests.length : counts[filter.id] || 0}</span>
              </button>
            ))}
          </div>
          <div className="admin-requests__filter-footer">
            <p role="status" aria-live="polite">{visibleRequests.length} {visibleRequests.length === 1 ? 'solicitud' : 'solicitudes'}</p>
            <label className="admin-requests__sort">Ordenar
              <select value={sortOrder} onChange={event => setSortOrder(event.target.value)}>
                <option value="recent">Más recientes</option>
                <option value="oldest">Más antiguas</option>
              </select>
            </label>
            {hasFilters && <button className="admin-requests__reset" type="button" onClick={resetFilters}>Limpiar filtros</button>}
          </div>
        </div>

        {visibleRequests.length > 0 ? <>
          <ul className="admin-requests__mobile" aria-label="Solicitudes de venta">
            {visibleRequests.map(request => (
              <li key={request.id}>
                <Link href={`/admin/solicitudes/${request.id}`} className="admin-requests__card" data-status={request.status}>
                  <div className="admin-requests__card-meta">{status(request)}{date(request)}</div>
                  <h3>{request.customer_name || 'Sin nombre'}</h3>
                  {(request.customer_phone || request.customer_location) && <p className="admin-requests__contact">{[request.customer_phone, request.customer_location].filter(Boolean).join(' · ')}</p>}
                  <p className="admin-requests__model">{request.device_models?.name || 'Modelo desconocido'}</p>
                  {variant(request) && <p className="admin-requests__muted">{variant(request)}</p>}
                  {details(request) && <p className="admin-requests__muted">{details(request)}</p>}
                  <div className="admin-requests__card-bottom">
                    <div><span>Valoración</span><strong>{estimate(request)}</strong></div>
                    <span className="admin-requests__view">Ver <span className="sr-only">solicitud de {request.customer_name || 'cliente sin nombre'}</span><span aria-hidden="true" className="material-symbols-outlined">arrow_forward</span></span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
          <div className="admin-requests__desktop">
            <table>
              <caption className="sr-only">Solicitudes de venta recibidas</caption>
              <thead><tr>
                <th scope="col">Cliente</th><th scope="col">Dispositivo</th><th scope="col">Valoración</th><th scope="col">Estado</th><th scope="col">Fecha</th><th scope="col"><span className="sr-only">Acciones</span></th>
              </tr></thead>
              <tbody>
                {visibleRequests.map(request => (
                  <tr key={request.id} data-status={request.status}>
                    <td><strong>{request.customer_name || 'Sin nombre'}</strong>{request.customer_phone && <span>{request.customer_phone}</span>}{request.customer_location && <span>{request.customer_location}</span>}</td>
                    <td><strong>{request.device_models?.name || 'Modelo desconocido'}</strong>{variant(request) && <span>{variant(request)}</span>}{details(request) && <span>{details(request)}</span>}</td>
                    <td className="admin-requests__estimate">{estimate(request)}</td>
                    <td>{status(request)}</td>
                    <td>{date(request)}</td>
                    <td><Link href={`/admin/solicitudes/${request.id}`}>Ver solicitud<span className="sr-only"> de {request.customer_name || 'cliente sin nombre'}</span></Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </> : <div className="admin-requests__empty">
          <h3>{initialRequests.length === 0 ? 'No hay solicitudes todavía.' : 'No hay solicitudes que coincidan con los filtros.'}</h3>
          <p>{initialRequests.length === 0 ? 'Las solicitudes recibidas desde la web aparecerán aquí.' : 'Prueba con otra búsqueda o limpia los filtros.'}</p>
          {initialRequests.length > 0 && hasFilters && <button type="button" onClick={resetFilters}>Limpiar filtros</button>}
        </div>}
      </div>
    </AdminPageShell>
  )
}
