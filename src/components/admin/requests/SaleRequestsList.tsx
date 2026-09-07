'use client'

import { useState } from 'react'
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
  customer_name: string
  customer_phone: string
  customer_location: string | null
  estimated_min: number | null
  estimated_max: number | null
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

const statusColors: Record<string, string> = {
  new: 'bg-[#d7baff]/10 text-[#d7baff] border-[#d7baff]/20',
  in_progress: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  purchased: 'bg-[#22c55e]/10 text-[#22c55e] border-[#22c55e]/20',
  discarded: 'bg-red-500/10 text-red-500 border-red-500/20'
}

export function SaleRequestsList({ initialRequests }: SaleRequestsListProps) {
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState<'all' | 'new' | 'in_progress' | 'purchased' | 'discarded'>('all')

  const filteredRequests = initialRequests.filter(req => {
    if (activeFilter !== 'all' && req.status !== activeFilter) {
      return false
    }

    if (search) {
      const q = search.toLowerCase()
      const matchName = req.customer_name.toLowerCase().includes(q)
      const matchPhone = req.customer_phone.toLowerCase().includes(q)
      const matchModel = req.device_models?.name?.toLowerCase().includes(q)
      const matchStorage = req.storage?.toLowerCase().includes(q)
      const matchColor = req.color?.toLowerCase().includes(q)
      
      return matchName || matchPhone || matchModel || matchStorage || matchColor
    }

    return true
  })

  const counts = {
    all: initialRequests.length,
    new: initialRequests.filter(r => r.status === 'new').length,
    in_progress: initialRequests.filter(r => r.status === 'in_progress').length,
    purchased: initialRequests.filter(r => r.status === 'purchased').length,
    discarded: initialRequests.filter(r => r.status === 'discarded').length,
  }

  const filters = [
    { id: 'all', label: 'Todas', count: counts.all },
    { id: 'new', label: 'Nuevas', count: counts.new },
    { id: 'in_progress', label: 'En proceso', count: counts.in_progress },
    { id: 'purchased', label: 'Compradas', count: counts.purchased },
    { id: 'discarded', label: 'Descartadas', count: counts.discarded }
  ]

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(value)
  }

  return (
    <AdminPageShell>
      <AdminPageHeader
        title="Solicitudes"
        subtitle="Gestiona las solicitudes de venta recibidas."
      />

      <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full">
        {/* Filters and Search */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex gap-2 overflow-x-auto pb-2 lg:pb-0" style={{ scrollbarWidth: 'none' }}>
            {filters.map(filter => (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id as any)}
                className={`
                  px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors border
                  ${activeFilter === filter.id 
                    ? 'bg-[#7a32d4]/10 text-[#d7baff] border-[#7a32d4]/30' 
                    : 'bg-[#121217] text-zinc-400 border-[#1F1F24] hover:text-white hover:bg-[#1F1F24]'}
                `}
              >
                {filter.label}
                <span className="ml-1.5 opacity-60">({filter.count})</span>
              </button>
            ))}
          </div>

          <div className="relative w-full lg:w-80">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-zinc-500">
              search
            </span>
            <input
              type="text"
              placeholder="Buscar por cliente, teléfono o dispositivo"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#121217] text-white border border-[#1F1F24] rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-[#7a32d4]/50 focus:ring-1 focus:ring-[#7a32d4]/50 transition-all placeholder:text-zinc-500"
            />
          </div>
        </div>

        {/* List */}
        {filteredRequests.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredRequests.map(req => (
              <Link href={`/admin/solicitudes/${req.id}`} key={req.id} className="block group">
                <div className="bg-[#0B0B0E] border border-[#1F1F24] rounded-2xl p-5 flex flex-col gap-4 group-hover:border-[#7a32d4]/50 group-hover:bg-[#121217] transition-all h-full">
                  
                  {/* Header: Model & Status */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex flex-col">
                      <h3 className="text-white font-bold text-[15px] leading-tight">
                        {req.device_models?.name || 'Modelo desconocido'}
                      </h3>
                      <p className="text-sm text-zinc-400 mt-0.5 font-medium">
                        {[req.storage, req.color].filter(Boolean).join(' · ')}
                      </p>
                    </div>
                    <span className={`px-2.5 py-1 text-[11px] font-bold rounded uppercase tracking-wider border shrink-0 ${statusColors[req.status] || 'bg-gray-500/10 text-gray-500 border-gray-500/20'}`}>
                      {statusLabels[req.status] || req.status}
                    </span>
                  </div>

                  {/* Divider */}
                  <div className="h-px bg-[#1F1F24] w-full"></div>

                  {/* Body: Customer & Estimate */}
                  <div className="flex flex-col gap-3">
                    <div className="flex items-start gap-2.5">
                      <span className="material-symbols-outlined text-[18px] text-zinc-500 mt-0.5">person</span>
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-zinc-200">{req.customer_name}</span>
                        {req.customer_location && (
                          <span className="text-xs text-zinc-500">{req.customer_location}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <span className="material-symbols-outlined text-[18px] text-[#7a32d4] shrink-0">payments</span>
                      {req.estimated_min !== null && req.estimated_max !== null ? (
                        <span className="text-sm font-bold text-[#d7baff]">
                          {formatCurrency(req.estimated_min)} – {formatCurrency(req.estimated_max)}
                        </span>
                      ) : (
                        <span className="text-sm font-medium text-zinc-500">Sin estimación</span>
                      )}
                    </div>
                  </div>

                  {/* Footer: Date & Action */}
                  <div className="mt-auto pt-4 flex items-center justify-between">
                    <span className="text-xs font-semibold text-zinc-500 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                      {new Date(req.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                    <span className="text-sm font-bold text-[#d7baff] group-hover:text-white transition-colors flex items-center gap-1">
                      Ver detalle
                      <span className="material-symbols-outlined text-[16px] group-hover:translate-x-0.5 transition-transform">arrow_forward</span>
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-[#0B0B0E] border border-[#1F1F24] rounded-2xl p-12 flex flex-col items-center justify-center text-center gap-3">
            <span className="material-symbols-outlined text-[48px] text-zinc-700">inbox_customize</span>
            <h3 className="text-white text-lg font-bold">
              {search || activeFilter !== 'all' ? 'No hay solicitudes que coincidan con los filtros.' : 'No hay solicitudes todavía.'}
            </h3>
            <p className="text-zinc-500 text-sm max-w-sm">
              {search || activeFilter !== 'all' ? 'Prueba cambiando los términos de búsqueda o filtros seleccionados.' : 'Las solicitudes recibidas desde la web aparecerán aquí.'}
            </p>
          </div>
        )}
      </div>
    </AdminPageShell>
  )
}
