'use client'

import { useState, useId, useTransition } from 'react'
import { AdminPageShell } from '@/components/admin/layout/AdminPageShell'
import { AdminPageHeader } from '@/components/admin/layout/AdminPageHeader'
import { updateWantedDeviceStatusAction, WantedDeviceStatus, WantedDeviceSource } from '@/actions/wanted-devices'

export type WantedDeviceRecord = {
  id: string
  customer_name: string
  phone: string
  category: string | null
  brand: string | null
  model: string
  storage: string | null
  color: string | null
  max_budget: number | null
  notes: string | null
  status: WantedDeviceStatus
  source: WantedDeviceSource
  created_at: string
  updated_at: string
}

interface WantedDevicesListProps {
  initialRequests: WantedDeviceRecord[]
}

const statusLabels: Record<WantedDeviceStatus, string> = {
  pending: 'Pendiente',
  contacted: 'Contactado',
  found: 'Encontrado',
  closed: 'Cerrado'
}

const statusColors: Record<WantedDeviceStatus, { text: string; bg: string; border: string }> = {
  pending: { text: 'text-amber-400', bg: 'bg-amber-950/40', border: 'border-amber-800/50' },
  contacted: { text: 'text-blue-400', bg: 'bg-blue-950/40', border: 'border-blue-800/50' },
  found: { text: 'text-emerald-400', bg: 'bg-emerald-950/40', border: 'border-emerald-800/50' },
  closed: { text: 'text-zinc-400', bg: 'bg-zinc-900/60', border: 'border-zinc-800' }
}

const sourceLabels: Record<WantedDeviceSource, string> = {
  home: 'Inicio',
  stock: 'Stock',
  iphone_stock: 'Stock iPhone'
}

const currencyFormatter = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' })

export function WantedDevicesList({ initialRequests }: WantedDevicesListProps) {
  const searchId = useId()
  const [requests, setRequests] = useState<WantedDeviceRecord[]>(initialRequests)
  const [search, setSearch] = useState('')
  const [activeStatus, setActiveStatus] = useState<string>('all')
  const [activeSource, setActiveSource] = useState<string>('all')
  const [isPending, startTransition] = useTransition()

  const query = search.trim().toLocaleLowerCase('es')

  const filteredRequests = requests.filter(item => {
    if (activeStatus !== 'all' && item.status !== activeStatus) return false
    if (activeSource !== 'all' && item.source !== activeSource) return false
    if (!query) return true

    const haystack = [
      item.customer_name,
      item.phone,
      item.model,
      item.brand,
      item.category,
      item.storage,
      item.color,
      item.notes
    ].filter(Boolean).join(' ').toLocaleLowerCase('es')

    return haystack.includes(query)
  })

  const counts = requests.reduce<Record<string, number>>((acc, item) => {
    acc[item.status] = (acc[item.status] || 0) + 1
    return acc
  }, {})

  const statusFilters = [
    { id: 'all', label: 'Todas' },
    { id: 'pending', label: 'Pendientes' },
    { id: 'contacted', label: 'Contactadas' },
    { id: 'found', label: 'Encontradas' },
    { id: 'closed', label: 'Cerradas' }
  ]

  const resetFilters = () => {
    setSearch('')
    setActiveStatus('all')
    setActiveSource('all')
  }

  const handleStatusChange = (id: string, newStatus: WantedDeviceStatus) => {
    // Optimistic state update
    setRequests(prev => prev.map(item => item.id === id ? { ...item, status: newStatus } : item))

    startTransition(async () => {
      const res = await updateWantedDeviceStatusAction(id, newStatus)
      if (!res.success) {
        // Revert on failure
        setRequests(initialRequests)
      }
    })
  }

  const cleanPhoneForWa = (phone: string) => {
    const digits = phone.replace(/\D/g, '')
    if (digits.startsWith('34') && digits.length > 9) return digits
    return `34${digits}`
  }

  return (
    <AdminPageShell>
      <div className="space-y-6">
        <AdminPageHeader
          title="Búsquedas"
          subtitle="Peticiones de clientes que buscan dispositivos no encontrados en stock."
          action={
            <div className="text-right text-sm text-zinc-400">
              <span className="font-semibold text-amber-400 font-mono">{counts.pending || 0}</span> pendientes · {requests.length} en total
            </div>
          }
        />

        {/* Filter and Search Bar */}
        <div className="space-y-4 rounded-xl border border-[#23232a] bg-[#0c0c10] p-4 sm:p-5">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            {/* Search */}
            <div className="relative md:col-span-8">
              <span aria-hidden="true" className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-lg pointer-events-none">
                search
              </span>
              <input
                id={searchId}
                type="search"
                placeholder="Buscar por cliente, teléfono, modelo o notas..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full rounded-lg border border-[#2b2b36] bg-[#16161d] pl-9 pr-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>

            {/* Source Dropdown */}
            <div className="md:col-span-4">
              <label htmlFor="source-filter" className="sr-only">Filtrar por origen</label>
              <select
                id="source-filter"
                value={activeSource}
                onChange={e => setActiveSource(e.target.value)}
                className="w-full rounded-lg border border-[#2b2b36] bg-[#16161d] px-3.5 py-2.5 text-sm text-zinc-300 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              >
                <option value="all">Todos los orígenes</option>
                <option value="home">Origen: Inicio</option>
                <option value="stock">Origen: Stock</option>
                <option value="iphone_stock">Origen: Stock iPhone</option>
              </select>
            </div>
          </div>

          {/* Status Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#1f1f26]">
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filtrar por estado">
              {statusFilters.map(filter => {
                const count = filter.id === 'all' ? requests.length : (counts[filter.id] || 0)
                const isSelected = activeStatus === filter.id
                return (
                  <button
                    key={filter.id}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => setActiveStatus(filter.id)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                      isSelected 
                        ? 'bg-purple-900/50 text-purple-200 border border-purple-500/40' 
                        : 'bg-[#16161d] text-zinc-400 hover:text-zinc-200 hover:bg-[#1d1d26]'
                    }`}
                  >
                    <span>{filter.label}</span>
                    <span className="text-xs px-1.5 py-0.2 rounded bg-black/40 text-zinc-300 font-mono">{count}</span>
                  </button>
                )
              })}
            </div>

            {(search || activeStatus !== 'all' || activeSource !== 'all') && (
              <button
                type="button"
                onClick={resetFilters}
                className="text-xs text-purple-400 hover:text-purple-300 hover:underline"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        </div>

        {/* Requests List */}
        {filteredRequests.length > 0 ? (
          <div className="space-y-4">
            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto rounded-xl border border-[#23232a] bg-[#0c0c10]">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#121217] text-xs uppercase tracking-wider text-zinc-400 border-b border-[#23232a]">
                  <tr>
                    <th scope="col" className="px-4 py-3.5 font-semibold">Dispositivo / Modelo</th>
                    <th scope="col" className="px-4 py-3.5 font-semibold">Cliente</th>
                    <th scope="col" className="px-4 py-3.5 font-semibold">Presupuesto</th>
                    <th scope="col" className="px-4 py-3.5 font-semibold">Origen</th>
                    <th scope="col" className="px-4 py-3.5 font-semibold">Fecha</th>
                    <th scope="col" className="px-4 py-3.5 font-semibold">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e1e26] text-zinc-300">
                  {filteredRequests.map(item => {
                    const statusConfig = statusColors[item.status]
                    const specs = [item.storage, item.color].filter(Boolean).join(' · ')
                    return (
                      <tr key={item.id} className="hover:bg-[#13131a] transition-colors">
                        <td className="px-4 py-3.5">
                          <div className="font-semibold text-white">{item.model}</div>
                          {specs && <div className="text-xs text-zinc-400 mt-0.5">{specs}</div>}
                          {item.notes && (
                            <div className="text-xs text-zinc-500 mt-1 max-w-xs truncate" title={item.notes}>
                              <span className="font-medium text-zinc-400">Nota:</span> {item.notes}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="font-medium text-white">{item.customer_name}</div>
                          <div className="flex items-center gap-2 mt-1">
                            <a
                              href={`https://wa.me/${cleanPhoneForWa(item.phone)}?text=${encodeURIComponent(`Hola ${item.customer_name}, te escribo de KevPhonesGC sobre tu búsqueda de ${item.model}.`)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 hover:underline"
                            >
                              <span className="material-symbols-outlined text-sm">chat</span>
                              <span>WhatsApp</span>
                            </a>
                            <span className="text-zinc-600">·</span>
                            <a href={`tel:${item.phone}`} className="text-xs text-zinc-400 hover:text-white">
                              {item.phone}
                            </a>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          {item.max_budget !== null ? (
                            <span className="font-medium text-white font-mono">{currencyFormatter.format(item.max_budget)}</span>
                          ) : (
                            <span className="text-zinc-500 text-xs">Sin límite</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-zinc-800 text-zinc-300 border border-zinc-700/50">
                            {sourceLabels[item.source] || item.source}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-xs text-zinc-400">
                          {new Date(item.created_at).toLocaleDateString('es-ES', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </td>
                        <td className="px-4 py-3.5">
                          <select
                            value={item.status}
                            disabled={isPending}
                            onChange={e => handleStatusChange(item.id, e.target.value as WantedDeviceStatus)}
                            className={`rounded-lg px-2.5 py-1 text-xs font-semibold border focus:outline-none focus:ring-1 focus:ring-purple-500 cursor-pointer ${statusConfig.text} ${statusConfig.bg} ${statusConfig.border}`}
                          >
                            <option value="pending" className="bg-[#121217] text-amber-400">Pendiente</option>
                            <option value="contacted" className="bg-[#121217] text-blue-400">Contactado</option>
                            <option value="found" className="bg-[#121217] text-emerald-400">Encontrado</option>
                            <option value="closed" className="bg-[#121217] text-zinc-400">Cerrado</option>
                          </select>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden space-y-3">
              {filteredRequests.map(item => {
                const statusConfig = statusColors[item.status]
                const specs = [item.storage, item.color].filter(Boolean).join(' · ')
                return (
                  <div key={item.id} className="rounded-xl border border-[#23232a] bg-[#0c0c10] p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-semibold text-white text-base">{item.model}</div>
                        {specs && <div className="text-xs text-zinc-400 mt-0.5">{specs}</div>}
                      </div>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-zinc-800 text-zinc-300 border border-zinc-700/50">
                        {sourceLabels[item.source] || item.source}
                      </span>
                    </div>

                    <div className="text-sm bg-[#14141b] rounded-lg p-2.5 space-y-1">
                      <div className="text-white font-medium">{item.customer_name}</div>
                      <div className="flex items-center gap-2">
                        <a
                          href={`https://wa.me/${cleanPhoneForWa(item.phone)}?text=${encodeURIComponent(`Hola ${item.customer_name}, te escribo de KevPhonesGC sobre tu búsqueda de ${item.model}.`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-emerald-400 font-medium"
                        >
                          <span className="material-symbols-outlined text-sm">chat</span>
                          <span>WhatsApp</span>
                        </a>
                        <span className="text-zinc-600">·</span>
                        <a href={`tel:${item.phone}`} className="text-xs text-zinc-300">
                          {item.phone}
                        </a>
                      </div>
                    </div>

                    {item.max_budget !== null && (
                      <div className="flex items-center justify-between text-xs text-zinc-400">
                        <span>Presupuesto máximo:</span>
                        <span className="font-semibold text-white font-mono">{currencyFormatter.format(item.max_budget)}</span>
                      </div>
                    )}

                    {item.notes && (
                      <div className="text-xs text-zinc-400 bg-black/30 rounded p-2 border border-zinc-800/50">
                        <span className="font-semibold text-zinc-300">Nota:</span> {item.notes}
                      </div>
                    )}

                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#1e1e26]">
                      <span className="text-xs text-zinc-500">
                        {new Date(item.created_at).toLocaleDateString('es-ES', {
                          day: '2-digit',
                          month: 'short'
                        })}
                      </span>

                      <select
                        value={item.status}
                        disabled={isPending}
                        onChange={e => handleStatusChange(item.id, e.target.value as WantedDeviceStatus)}
                        className={`rounded-lg px-2.5 py-1 text-xs font-semibold border focus:outline-none focus:ring-1 focus:ring-purple-500 cursor-pointer ${statusConfig.text} ${statusConfig.bg} ${statusConfig.border}`}
                      >
                        <option value="pending" className="bg-[#121217] text-amber-400">Pendiente</option>
                        <option value="contacted" className="bg-[#121217] text-blue-400">Contactado</option>
                        <option value="found" className="bg-[#121217] text-emerald-400">Encontrado</option>
                        <option value="closed" className="bg-[#121217] text-zinc-400">Cerrado</option>
                      </select>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-[#23232a] bg-[#0c0c10] p-10 text-center space-y-2">
            <span className="material-symbols-outlined text-4xl text-zinc-600 mb-2">notifications_off</span>
            <h3 className="text-base font-semibold text-white">
              {requests.length === 0 ? 'No hay peticiones de búsqueda todavía' : 'No hay peticiones que coincidan con los filtros'}
            </h3>
            <p className="text-sm text-zinc-400 max-w-sm mx-auto">
              {requests.length === 0 
                ? 'Las solicitudes que los usuarios envíen desde la web aparecerán aquí para gestionarlas.'
                : 'Prueba a cambiar el estado, origen o término de búsqueda.'}
            </p>
            {requests.length > 0 && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={resetFilters}
                  className="inline-flex items-center px-3.5 py-1.5 rounded-lg text-xs font-medium text-purple-300 bg-purple-950/50 border border-purple-800/50 hover:bg-purple-900/50"
                >
                  Limpiar filtros
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </AdminPageShell>
  )
}

