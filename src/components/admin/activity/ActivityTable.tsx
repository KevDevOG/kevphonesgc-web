'use client'

import { useId, useState, useMemo } from 'react'
import Link from 'next/link'
import type { UnifiedActivity } from '@/app/admin/actividad/page'

type Props = {
  initialActivities: UnifiedActivity[]
}

function formatCurrency(amount: number | null | undefined) {
  if (amount === null || amount === undefined) return '-'
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR"
  }).format(amount)
}

function formatDateActivity(dateStr: string) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function ActivityTable({ initialActivities }: Props) {
  const searchId = useId()
  const [filterType, setFilterType] = useState<string>('Todos')
  const [filterPeriod, setFilterPeriod] = useState<string>('Todo')
  const [search, setSearch] = useState('')
  const [sortField, setSortField] = useState<'date' | 'outflow' | 'inflow' | 'profit'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const filtered = useMemo(() => {
    let result = [...initialActivities]

    // TYPE FILTER
    if (filterType !== 'Todos') {
      result = result.filter(a => filterType.startsWith('type:') ? a.type === filterType.slice(5) : a.filterType === filterType)
    }

    // PERIOD FILTER
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime()
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime()
    const currentYearStart = new Date(now.getFullYear(), 0, 1).getTime()
    const last7Days = now.getTime() - (7 * 24 * 60 * 60 * 1000)

    if (filterPeriod === 'Hoy') {
      result = result.filter(a => a.timestamp >= todayStart)
    } else if (filterPeriod === 'Últimos 7 días') {
      result = result.filter(a => a.timestamp >= last7Days)
    } else if (filterPeriod === 'Este mes') {
      result = result.filter(a => a.timestamp >= currentMonthStart)
    } else if (filterPeriod === 'Mes anterior') {
      result = result.filter(a => a.timestamp >= previousMonthStart && a.timestamp < currentMonthStart)
    } else if (filterPeriod === 'Este año') {
      result = result.filter(a => a.timestamp >= currentYearStart)
    }

    // SEARCH
    if (search.trim()) {
      const s = search.trim().toLowerCase()
      result = result.filter(a => 
        a.type.toLowerCase().includes(s) ||
        a.filterType.toLowerCase().includes(s) ||
        (a.model && a.model.toLowerCase().includes(s)) ||
        (a.concept && a.concept.toLowerCase().includes(s)) ||
        (a.storage && a.storage.toLowerCase().includes(s)) ||
        (a.color && a.color.toLowerCase().includes(s)) ||
        (a.clientName && a.clientName.toLowerCase().includes(s)) ||
        (a.clientPhone && a.clientPhone.toLowerCase().includes(s)) ||
        (a.locationOrNote && a.locationOrNote.toLowerCase().includes(s))
      )
    }

    // SORT
    result.sort((a, b) => {
      let valA = 0
      let valB = 0
      if (sortField === 'date') {
        valA = a.timestamp
        valB = b.timestamp
      } else if (sortField === 'outflow') {
        valA = a.outflow || 0
        valB = b.outflow || 0
      } else if (sortField === 'inflow') {
        valA = a.inflow || 0
        valB = b.inflow || 0
      } else if (sortField === 'profit') {
        valA = a.profit || 0
        valB = b.profit || 0
      }
      return sortOrder === 'asc' ? valA - valB : valB - valA
    })

    return result
  }, [initialActivities, filterType, filterPeriod, search, sortField, sortOrder])

  // SUMMARY CALC
  let totalEntradas = 0
  let totalSalidas = 0
  let totalBeneficio = 0
  let opCount = filtered.length

  filtered.forEach(act => {
    if (act.inflow) totalEntradas += act.inflow
    if (act.outflow) totalSalidas += act.outflow
    
    // Beneficio: realized device operation profit minus expenses.
    // realized profit is only on Venta, expenses are Gastos.
    if (act.filterType === 'Ventas' && act.profit) totalBeneficio += act.profit
    if (act.filterType === 'Gastos' && act.outflow) totalBeneficio -= act.outflow
  })

  const groups = [...new Set(initialActivities.map(activity => activity.filterType))]
  const types = [...new Set(initialActivities.map(activity => activity.type))]
  const hasFilters = Boolean(search.trim()) || filterType !== 'Todos' || filterPeriod !== 'Todo' || sortField !== 'date' || sortOrder !== 'desc'
  const resetFilters = () => {
    setSearch('')
    setFilterType('Todos')
    setFilterPeriod('Todo')
    setSortField('date')
    setSortOrder('desc')
  }

  return (
    <div className="admin-activity">
      <dl className="admin-activity__summary" aria-label="Resumen de los movimientos mostrados">
        <div><dt>Operaciones</dt><dd>{opCount}</dd></div>
        <div><dt>Entradas</dt><dd data-tone={tone(totalEntradas)}>{formatCurrency(totalEntradas)}</dd></div>
        <div><dt>Salidas</dt><dd>{formatCurrency(totalSalidas)}</dd></div>
        <div><dt>Beneficio op.</dt><dd data-tone={tone(totalBeneficio)}>{formatCurrency(totalBeneficio)}</dd></div>
      </dl>

      <div className="admin-activity__toolbar">
        <div className="admin-activity__search">
          <label htmlFor={searchId} className="sr-only">Buscar movimiento por tipo, dispositivo, cliente o detalle</label>
          <span aria-hidden="true" className="material-symbols-outlined">search</span>
          <input id={searchId} type="search" placeholder="Buscar movimiento..." value={search} onChange={event => setSearch(event.target.value)} />
        </div>
        <label><span className="sr-only">Tipo de movimiento</span>
          <select value={filterType} onChange={event => setFilterType(event.target.value)}>
            <option value="Todos">Todos</option>
            <optgroup label="Grupos">{groups.map(group => <option key={group} value={group}>{group}</option>)}</optgroup>
            <optgroup label="Tipos de movimiento">{types.map(type => <option key={type} value={`type:${type}`}>{type}</option>)}</optgroup>
          </select>
        </label>
        <label><span className="sr-only">Periodo</span>
          <select value={filterPeriod} onChange={event => setFilterPeriod(event.target.value)}>
            {['Todo', 'Hoy', 'Últimos 7 días', 'Este mes', 'Mes anterior', 'Este año'].map(period => <option key={period} value={period}>{period}</option>)}
          </select>
        </label>
        <label className="admin-activity__sort"><span className="sr-only">Ordenar movimientos</span>
          <select value={`${sortField}:${sortOrder}`} onChange={event => {
            const [field, order] = event.target.value.split(':') as [typeof sortField, typeof sortOrder]
            setSortField(field)
            setSortOrder(order)
          }}>
            <option value="date:desc">Más recientes</option><option value="date:asc">Más antiguos</option>
            <option value="outflow:asc">Salidas: menor a mayor</option><option value="outflow:desc">Salidas: mayor a menor</option>
            <option value="inflow:asc">Entradas: menor a mayor</option><option value="inflow:desc">Entradas: mayor a menor</option>
            <option value="profit:asc">Beneficio: menor a mayor</option><option value="profit:desc">Beneficio: mayor a menor</option>
          </select>
        </label>
        {hasFilters && <button type="button" className="admin-activity__reset" onClick={resetFilters}>Limpiar filtros</button>}
      </div>

      {filtered.length === 0 ? <div className="admin-activity__empty">
        <h3>{initialActivities.length === 0 ? 'No hay movimientos registrados.' : 'No hay movimientos que coincidan con los filtros.'}</h3>
        {initialActivities.length > 0 && <button type="button" onClick={resetFilters}>Limpiar filtros</button>}
      </div> : <>
        <ul className="admin-activity__mobile" aria-label="Historial de movimientos">
          {filtered.map(activity => <li key={activity.id}>
            <article className="admin-activity__card">
              <div className="admin-activity__card-top"><MovementType activity={activity} /><time dateTime={activity.date}>{formatDateActivity(activity.date)}</time></div>
              <h3>{activity.concept}</h3>
              {(activity.storage || activity.color) && <p className="admin-activity__muted">{[activity.storage, activity.color].filter(Boolean).join(' · ')}</p>}
              {activity.clientName && <p className="admin-activity__client">{activity.clientName}</p>}
              <div className="admin-activity__card-bottom"><MovementAmount activity={activity} /><Link href={activity.actionUrl}>Ver registro<span className="sr-only">: {activity.type}, {activity.concept}</span></Link></div>
              <p className="admin-activity__status">{activity.status}</p>
              <MovementDetails activity={activity} />
            </article>
          </li>)}
        </ul>
        <div className="admin-activity__desktop">
          <table>
            <caption className="sr-only">Historial de movimientos del negocio</caption>
            <thead><tr><th scope="col">Movimiento</th><th scope="col">Detalle</th><th scope="col">Fecha</th><th scope="col">Importe</th><th scope="col"><span className="sr-only">Acciones</span></th></tr></thead>
            <tbody>{filtered.map(activity => <tr key={activity.id}>
              <td><div className="admin-activity__movement-meta"><MovementType activity={activity} /><span className="admin-activity__status">{activity.status}</span></div><strong>{activity.concept}</strong>{(activity.storage || activity.color) && <span className="admin-activity__muted">{[activity.storage, activity.color].filter(Boolean).join(' · ')}</span>}</td>
              <td>{activity.clientName && <strong>{activity.clientName}</strong>}<MovementDetails activity={activity} /></td>
              <td><time dateTime={activity.date}>{formatDateActivity(activity.date)}</time></td>
              <td><MovementAmount activity={activity} /></td>
              <td><Link href={activity.actionUrl}>Ver registro<span className="sr-only">: {activity.type}, {activity.concept}</span></Link></td>
            </tr>)}</tbody>
          </table>
        </div>
      </>}
    </div>
  )
}

function tone(value: number) {
  return value > 0 ? 'positive' : value < 0 ? 'negative' : 'neutral'
}

function MovementType({ activity }: { activity: UnifiedActivity }) {
  return <span className="admin-activity__type" data-type={activity.type} data-group={activity.filterType}>{activity.type}</span>
}

function MovementAmount({ activity }: { activity: UnifiedActivity }) {
  // Inflow/outflow are separate source values, not a signed net cash movement.
  const value = activity.inflow !== null ? activity.inflow : activity.outflow
  const valueTone = value === null || value === 0 ? 'neutral' : value < 0 ? 'negative' : activity.inflow !== null ? 'positive' : 'neutral'
  return <div className="admin-activity__amount">
    <span>{activity.inflow !== null ? 'Entrada' : activity.outflow !== null ? 'Salida' : 'Importe'}</span>
    <strong data-tone={valueTone}>{formatCurrency(value)}</strong>
    {activity.profit !== null && <span className="admin-activity__profit" data-tone={tone(activity.profit)}>Beneficio: {formatCurrency(activity.profit)}</span>}
  </div>
}

function MovementDetails({ activity }: { activity: UnifiedActivity }) {
  return <details className="admin-activity__details">
    <summary>Más detalles</summary>
    {activity.locationOrNote && <p>{activity.locationOrNote}</p>}
    <dl>
      {activity.clientPhone && <div><dt>Teléfono</dt><dd>{activity.clientPhone}</dd></div>}
      {activity.outflow !== null && <div><dt>Compra / Salida</dt><dd>{formatCurrency(activity.outflow)}</dd></div>}
      {activity.listingPrice !== null && <div><dt>Publicación</dt><dd>{formatCurrency(activity.listingPrice)}</dd></div>}
      {activity.inflow !== null && <div><dt>Venta / Entrada</dt><dd>{formatCurrency(activity.inflow)}</dd></div>}
      {activity.profit !== null && <div><dt>Beneficio</dt><dd data-tone={tone(activity.profit)}>{formatCurrency(activity.profit)}</dd></div>}
    </dl>
  </details>
}
