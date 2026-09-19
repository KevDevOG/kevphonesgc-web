'use client'

import React, { useState, useMemo } from 'react'
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
  const [filterType, setFilterType] = useState<string>('Todos')
  const [filterPeriod, setFilterPeriod] = useState<string>('Todo')
  const [search, setSearch] = useState('')
  const [sortField, setSortField] = useState<'date' | 'outflow' | 'inflow' | 'profit'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const filtered = useMemo(() => {
    let result = [...initialActivities]

    // TYPE FILTER
    if (filterType !== 'Todos') {
      result = result.filter(a => a.filterType === filterType)
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
    if (search) {
      const s = search.toLowerCase()
      result = result.filter(a => 
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

  return (
    <div className="flex flex-col gap-6">
      
      {/* SUMMARY */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#0B0B0E] border border-[#1F1F24] rounded-2xl p-4 flex flex-col">
          <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Operaciones</span>
          <span className="text-2xl font-bold text-white">{opCount}</span>
        </div>
        <div className="bg-[#0B0B0E] border border-[#1F1F24] rounded-2xl p-4 flex flex-col">
          <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Entradas</span>
          <span className="text-2xl font-bold text-[#d7baff]">{formatCurrency(totalEntradas)}</span>
        </div>
        <div className="bg-[#0B0B0E] border border-[#1F1F24] rounded-2xl p-4 flex flex-col">
          <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Salidas</span>
          <span className="text-2xl font-bold text-zinc-300">{formatCurrency(totalSalidas)}</span>
        </div>
        <div className="bg-[#0B0B0E] border border-[#1F1F24] rounded-2xl p-4 flex flex-col relative overflow-hidden">
          <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1 relative z-10">Beneficio op.</span>
          <span className={`text-2xl font-bold relative z-10 ${totalBeneficio > 0 ? 'text-[#22c55e]' : totalBeneficio < 0 ? 'text-red-400' : 'text-white'}`}>
            {formatCurrency(totalBeneficio)}
          </span>
          {totalBeneficio > 0 && <div className="absolute inset-0 bg-[#22c55e]/5 pointer-events-none"></div>}
          {totalBeneficio < 0 && <div className="absolute inset-0 bg-red-500/5 pointer-events-none"></div>}
        </div>
      </div>

      {/* FILTERS */}
      <div className="bg-[#0B0B0E] border border-[#1F1F24] rounded-2xl p-4 flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
        <div className="flex flex-wrap gap-2">
          <select 
            value={filterType} 
            onChange={e => setFilterType(e.target.value)}
            className="bg-[#121217] border border-[#1F1F24] rounded-xl px-3 py-2 text-sm text-white font-semibold focus:outline-none"
          >
            {['Todos', 'Ventas', 'En stock', 'Gastos', 'Capital'].map(o => <option key={o} value={o}>{o}</option>)}
          </select>
          <select 
            value={filterPeriod} 
            onChange={e => setFilterPeriod(e.target.value)}
            className="bg-[#121217] border border-[#1F1F24] rounded-xl px-3 py-2 text-sm text-white font-semibold focus:outline-none"
          >
            {['Todo', 'Hoy', 'Últimos 7 días', 'Este mes', 'Mes anterior', 'Este año'].map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
        
        <div className="relative w-full lg:w-72">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-zinc-500 text-[18px]">search</span>
          <input 
            type="text" 
            placeholder="Buscar modelo, cliente, teléfono..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-[#121217] border border-[#1F1F24] rounded-xl pl-9 pr-3 py-2 text-sm text-white w-full focus:outline-none focus:border-[#7a32d4]/50"
          />
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-[#0B0B0E] border border-[#1F1F24] rounded-2xl overflow-hidden overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#121217] text-zinc-400 text-xs uppercase tracking-wider font-bold border-b border-[#1F1F24]">
              <th className="px-4 py-3 whitespace-nowrap cursor-pointer hover:text-white" onClick={() => { setSortField('date'); setSortOrder(o => o === 'asc' ? 'desc' : 'asc') }}>
                Fecha / Tipo {sortField==='date' && (sortOrder==='asc' ? '↑' : '↓')}
              </th>
              <th className="px-4 py-3 min-w-[180px]">Dispositivo / Concepto</th>
              <th className="px-4 py-3 min-w-[150px]">Cliente / Teléfono</th>
              <th className="px-4 py-3 whitespace-nowrap cursor-pointer hover:text-white" onClick={() => { setSortField('outflow'); setSortOrder(o => o === 'asc' ? 'desc' : 'asc') }}>
                Compra / Salida {sortField==='outflow' && (sortOrder==='asc' ? '↑' : '↓')}
              </th>
              <th className="px-4 py-3 whitespace-nowrap">Publicación</th>
              <th className="px-4 py-3 whitespace-nowrap cursor-pointer hover:text-white" onClick={() => { setSortField('inflow'); setSortOrder(o => o === 'asc' ? 'desc' : 'asc') }}>
                Venta / Entrada {sortField==='inflow' && (sortOrder==='asc' ? '↑' : '↓')}
              </th>
              <th className="px-4 py-3 whitespace-nowrap cursor-pointer hover:text-white" onClick={() => { setSortField('profit'); setSortOrder(o => o === 'asc' ? 'desc' : 'asc') }}>
                Beneficio {sortField==='profit' && (sortOrder==='asc' ? '↑' : '↓')}
              </th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3 min-w-[120px]">Ubicación / Nota</th>
              <th className="px-4 py-3">Acción</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-4 py-8 text-center text-zinc-500">
                  No se encontraron movimientos.
                </td>
              </tr>
            ) : (
              filtered.map(act => {
                let rowBg = 'bg-[#121217] hover:bg-[#1F1F24]'
                let profitColor = 'text-zinc-400 font-semibold'
                
                if (act.type === 'Venta') {
                  if (act.profit && act.profit > 0) {
                    rowBg = 'bg-[#22c55e]/5 border-y border-[#22c55e]/10 hover:bg-[#22c55e]/10'
                    profitColor = 'text-[#22c55e] font-bold'
                  } else if (act.profit && act.profit < 0) {
                    rowBg = 'bg-red-500/5 border-y border-red-500/10 hover:bg-red-500/10'
                    profitColor = 'text-red-400 font-bold'
                  } else {
                    profitColor = 'text-zinc-300 font-bold'
                  }
                } else if (act.type === 'Compra') {
                  rowBg = 'bg-amber-500/5 border-y border-amber-500/10 hover:bg-amber-500/10'
                } else if (act.type === 'Gasto') {
                  rowBg = 'bg-red-500/5 border-y border-red-500/10 hover:bg-red-500/10'
                } else if (act.filterType === 'Capital') {
                  rowBg = 'bg-[#7a32d4]/5 border-y border-[#7a32d4]/10 hover:bg-[#7a32d4]/10'
                }

                return (
                  <tr key={act.id} className={`${rowBg} transition-colors border-b border-[#1F1F24] last:border-b-0`}>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="font-semibold text-white">{formatDateActivity(act.date)}</span>
                        <span className="text-[11px] text-zinc-400 uppercase tracking-wider">{act.type}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="font-semibold text-zinc-200">{act.concept}</span>
                        {(act.storage || act.color) && (
                          <span className="text-xs text-zinc-500">
                            {[act.storage, act.color].filter(Boolean).join(' · ')}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {act.clientName ? (
                        <div className="flex flex-col">
                          <span className="font-semibold text-zinc-300">{act.clientName}</span>
                          <span className="text-xs text-zinc-500">{act.clientPhone}</span>
                        </div>
                      ) : (
                        <span className="text-zinc-600">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-semibold text-zinc-300 whitespace-nowrap">
                      {formatCurrency(act.outflow)}
                    </td>
                    <td className="px-4 py-3 text-zinc-400 whitespace-nowrap">
                      {formatCurrency(act.listingPrice)}
                    </td>
                    <td className="px-4 py-3 font-semibold text-[#d7baff] whitespace-nowrap">
                      {formatCurrency(act.inflow)}
                    </td>
                    <td className={`px-4 py-3 whitespace-nowrap ${profitColor}`}>
                      {act.profit !== null ? formatCurrency(act.profit) : '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="px-2 py-1 bg-[#1F1F24] border border-[#2a2a30] rounded text-[10px] font-bold uppercase tracking-wider text-zinc-300">
                        {act.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-zinc-400 max-w-[200px] truncate" title={act.locationOrNote}>
                      {act.locationOrNote || '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Link href={act.actionUrl} target="_blank" className="text-[18px] text-zinc-400 hover:text-white transition-colors flex items-center justify-center p-1 rounded hover:bg-[#1F1F24]">
                        <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                      </Link>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

    </div>
  )
}
