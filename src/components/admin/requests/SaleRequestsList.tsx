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
  purchased: 'Comprada', // The user requested "Comprado" but the filter text in requirements is "Compradas", badge is "Comprado". Let's use "Comprado".
  discarded: 'Descartada'
}

const statusColors: Record<string, string> = {
  new: 'bg-[#9867db]/10 text-[#d7baff] border-[#9867db]/20', // purple/lilac
  in_progress: 'bg-amber-500/10 text-amber-500 border-amber-500/20', // amber
  purchased: 'bg-green-500/10 text-green-500 border-green-500/20', // green
  discarded: 'bg-red-500/10 text-red-500 border-red-500/20' // red
}

export function SaleRequestsList({ initialRequests }: SaleRequestsListProps) {
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState<'all' | 'new' | 'in_progress' | 'purchased' | 'discarded'>('all')

  const filteredRequests = initialRequests.filter(req => {
    // Filter by status
    if (activeFilter !== 'all' && req.status !== activeFilter) {
      return false
    }

    // Filter by search
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

  // Counts
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

      <div className="flex flex-col gap-6">
        {/* Filters and Search */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0B0B0D] border border-[#1F1F24] rounded-xl p-4">
          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0" style={{ scrollbarWidth: 'none' }}>
            {filters.map(filter => (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id as any)}
                className={`
                  px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors
                  ${activeFilter === filter.id 
                    ? 'bg-[#1F1F24] text-white' 
                    : 'text-[#A8A8B0] hover:text-white hover:bg-[#131313]'}
                `}
              >
                {filter.label}
                <span className="ml-2 text-xs opacity-50">({filter.count})</span>
              </button>
            ))}
          </div>

          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-[#A8A8B0]">
              search
            </span>
            <input
              type="text"
              placeholder="Buscar solicitud..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full md:w-64 bg-[#131313] text-white border border-[#1F1F24] rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-[#9867db] transition-colors"
            />
          </div>
        </div>

        {/* List */}
        {filteredRequests.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRequests.map(req => (
              <div key={req.id} className="bg-[#0B0B0D] border border-[#1F1F24] rounded-xl p-4 flex flex-col justify-between hover:border-[#383843] transition-colors">
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-[#F7F7F7] font-medium leading-tight">
                      {req.device_models?.name || 'Modelo desconocido'}
                    </h3>
                    <span className={`px-2.5 py-1 text-xs rounded-full border ${statusColors[req.status] || 'bg-gray-500/10 text-gray-500 border-gray-500/20'}`}>
                      {req.status === 'purchased' ? 'Comprado' : statusLabels[req.status] || req.status}
                    </span>
                  </div>

                  <div className="space-y-2 mb-6">
                    {/* Device info */}
                    <div className="flex items-center gap-2 text-sm text-[#A8A8B0]">
                      <span className="material-symbols-outlined text-[16px]">smartphone</span>
                      <span>
                        {[req.storage, req.color].filter(Boolean).join(' • ') || 'Configuración no especificada'}
                      </span>
                    </div>

                    {/* Customer info */}
                    <div className="flex items-center gap-2 text-sm text-[#A8A8B0]">
                      <span className="material-symbols-outlined text-[16px]">person</span>
                      <span className="truncate">{req.customer_name}</span>
                      {req.customer_location && (
                        <>
                          <span className="mx-1">•</span>
                          <span className="truncate">{req.customer_location}</span>
                        </>
                      )}
                    </div>

                    {/* Estimate */}
                    {req.estimated_min !== null && req.estimated_max !== null && (
                      <div className="flex items-center gap-2 text-sm text-[#d7baff]">
                        <span className="material-symbols-outlined text-[16px]">payments</span>
                        <span>{formatCurrency(req.estimated_min)} – {formatCurrency(req.estimated_max)}</span>
                      </div>
                    )}

                    {/* Date */}
                    <div className="flex items-center gap-2 text-xs text-[#6E6E78]">
                      <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                      <span>{new Date(req.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                    </div>
                  </div>
                </div>

                <Link
                  href={`/admin/solicitudes/${req.id}`}
                  className="w-full py-2 bg-[#1F1F24] hover:bg-[#2A2A35] text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  Ver solicitud
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-[#0B0B0D] border border-[#1F1F24] rounded-xl p-12 flex flex-col items-center justify-center text-center">
            <span className="material-symbols-outlined text-[48px] text-[#A8A8B0] mb-4">
              inbox
            </span>
            <h3 className="text-[#F7F7F7] text-lg font-medium mb-2">No hay solicitudes todavía.</h3>
            <p className="text-[#A8A8B0] text-sm max-w-md">
              Las solicitudes recibidas desde la web aparecerán aquí.
            </p>
          </div>
        )}
      </div>
    </AdminPageShell>
  )
}
