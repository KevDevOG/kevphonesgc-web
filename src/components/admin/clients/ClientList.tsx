'use client'

import React, { useState } from 'react'
import { AdminPageShell } from '@/components/admin/layout/AdminPageShell'
import { AdminPageHeader } from '@/components/admin/layout/AdminPageHeader'
import { updateClientAction, deleteClientAction } from '@/actions/clients'
import Link from 'next/link'

type Client = {
  id: string
  name: string
  phone: string
  location: string | null
  created_at: string
  purchases_count: number
  sales_to_business_count: number
}

export function ClientList({ clients }: { clients: Client[] }) {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredClients = clients.filter(client => {
    if (!searchTerm) return true
    const term = searchTerm.toLowerCase()
    return (
      client.name.toLowerCase().includes(term) ||
      client.phone.toLowerCase().includes(term) ||
      (client.location && client.location.toLowerCase().includes(term))
    )
  })

  const totalClients = clients.length
  const totalCompradores = clients.filter(c => c.purchases_count > 0).length
  const totalVendedores = clients.filter(c => c.sales_to_business_count > 0).length

  return (
    <div className="flex flex-col gap-6 lg:gap-8 w-full max-w-7xl mx-auto pb-12">
      <AdminPageHeader 
        title="Clientes" 
        subtitle="Historial de personas que han comprado o vendido contigo." 
      />

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#7a32d4]/5 border border-[#7a32d4]/30 rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-[#7a32d4]"></div>
          <p className="text-[13px] font-bold text-[#d7baff] uppercase tracking-wider mb-2">Total clientes</p>
          <p className="text-4xl font-extrabold text-white tracking-tight">{totalClients}</p>
          <span className="material-symbols-outlined absolute right-4 bottom-4 text-[48px] text-[#7a32d4]/20 pointer-events-none">groups</span>
        </div>

        <div className="bg-[#0B0B0E] border border-[#1F1F24] rounded-2xl p-5 flex flex-col justify-between">
          <p className="text-[13px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Compradores</p>
          <p className="text-3xl font-extrabold text-[#d7baff] tracking-tight">{totalCompradores}</p>
        </div>

        <div className="bg-[#0B0B0E] border border-[#1F1F24] rounded-2xl p-5 flex flex-col justify-between">
          <p className="text-[13px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Vendedores</p>
          <p className="text-3xl font-extrabold text-white tracking-tight">{totalVendedores}</p>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 text-[20px]">search</span>
          <input 
            type="text" 
            placeholder="Buscar por nombre, teléfono o ubicación" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-96 bg-[#121217] border border-[#1F1F24] rounded-xl py-2.5 pl-12 pr-4 text-[14px] text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#7a32d4]/50 focus:ring-1 focus:ring-[#7a32d4]/50 transition-all"
          />
        </div>

        {filteredClients.length === 0 ? (
          <div className="bg-[#0B0B0E] border border-[#1F1F24] rounded-2xl p-12 flex flex-col items-center justify-center text-center gap-3">
            <span className="material-symbols-outlined text-[48px] text-zinc-700">group_off</span>
            <p className="text-[15px] font-bold text-white">
              {searchTerm 
                ? "No se encontraron clientes que coincidan con la búsqueda." 
                : "No hay clientes registrados."}
            </p>
            {!searchTerm && (
              <p className="text-[13px] font-medium text-zinc-500 max-w-sm">
                Los clientes aparecerán automáticamente al registrar compras o ventas.
              </p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredClients.map(client => (
              <ClientItem key={client.id} client={client} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function ClientItem({ client }: { client: Client }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleEdit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsPending(true)
    setError(null)
    const formData = new FormData(e.currentTarget)
    
    try {
      const res = await updateClientAction(client.id, formData)
      if (!res.success) {
        setError(res.error || 'No se pudo actualizar el cliente.')
      } else {
        setIsEditing(false)
      }
    } catch (err) {
      setError('Ocurrió un error al actualizar.')
    } finally {
      setIsPending(false)
    }
  }

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsPending(true)
    setError(null)
    
    try {
      const res = await deleteClientAction(client.id)
      if (!res.success) {
        setError(res.error || 'No se pudo eliminar el cliente.')
      }
    } catch (err) {
      setError('Ocurrió un error al eliminar.')
    } finally {
      setIsPending(false)
    }
  }

  if (isEditing) {
    return (
      <div className="bg-[#0B0B0E] border border-[#1F1F24] rounded-2xl p-5 flex flex-col gap-4">
        <h4 className="text-[14px] font-bold text-white uppercase tracking-wider border-b border-[#1F1F24] pb-3">Editar cliente</h4>
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-[13px] font-bold p-3 rounded-xl">
            {error}
          </div>
        )}
        <form onSubmit={handleEdit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-semibold text-zinc-400">Nombre</label>
            <input required name="name" defaultValue={client.name} className="w-full bg-[#121217] text-white border border-[#1F1F24] rounded-xl px-3 py-2 text-[14px] focus:outline-none focus:border-[#7a32d4]/50 focus:ring-1 focus:ring-[#7a32d4]/50 transition-all" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-semibold text-zinc-400">Teléfono</label>
            <input required name="phone" defaultValue={client.phone} className="w-full bg-[#121217] text-white border border-[#1F1F24] rounded-xl px-3 py-2 text-[14px] focus:outline-none focus:border-[#7a32d4]/50 focus:ring-1 focus:ring-[#7a32d4]/50 transition-all" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-semibold text-zinc-400">Ubicación (opcional)</label>
            <input name="location" defaultValue={client.location || ''} className="w-full bg-[#121217] text-white border border-[#1F1F24] rounded-xl px-3 py-2 text-[14px] focus:outline-none focus:border-[#7a32d4]/50 focus:ring-1 focus:ring-[#7a32d4]/50 transition-all" />
          </div>
          <div className="flex justify-end gap-2 mt-2">
            <button 
              type="button" 
              onClick={() => { setIsEditing(false); setError(null); }}
              disabled={isPending}
              className="px-4 py-2 bg-[#121217] border border-[#1F1F24] text-white rounded-xl text-[13px] font-bold hover:bg-[#1F1F24] transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={isPending}
              className="px-4 py-2 bg-[#7a32d4]/10 border border-[#7a32d4]/30 text-[#d7baff] hover:bg-[#7a32d4]/20 rounded-xl text-[13px] font-bold transition-all disabled:opacity-50"
            >
              {isPending ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    )
  }

  if (isDeleting) {
    return (
      <div className="bg-[#0B0B0E] border border-red-500/30 rounded-2xl p-5 flex flex-col gap-4 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-red-500/50"></div>
        <h4 className="text-[15px] font-bold text-red-400">¿Eliminar este cliente?</h4>
        <p className="text-[13px] font-medium text-zinc-400 leading-relaxed">
          Solo se podrá eliminar si no tiene compras o ventas asociadas. Las operaciones históricas nunca se eliminarán.
        </p>
        
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-[13px] font-bold p-3 rounded-xl">
            {error}
          </div>
        )}
        
        <form onSubmit={handleDelete} className="flex justify-end gap-2 mt-2">
          <button 
            type="button" 
            onClick={() => { setIsDeleting(false); setError(null); }}
            disabled={isPending}
            className="px-4 py-2.5 bg-[#121217] border border-[#1F1F24] text-white rounded-xl text-[13px] font-bold hover:bg-[#1F1F24] transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button 
            type="submit" 
            disabled={isPending}
            className="px-4 py-2.5 bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 font-bold text-[13px] rounded-xl transition-colors disabled:opacity-50"
          >
            {isPending ? 'Eliminando...' : 'Sí, eliminar'}
          </button>
        </form>
      </div>
    )
  }

  return (
    <div className="bg-[#0B0B0E] border border-[#1F1F24] rounded-2xl p-5 flex flex-col justify-between hover:border-[#7a32d4]/30 transition-colors group">
      <div className="flex justify-between items-start mb-4">
        <div className="flex flex-col gap-1 pr-4">
          <h3 className="text-[16px] font-bold text-white leading-tight">
            {client.name}
          </h3>
          <div className="flex items-center gap-1.5 text-zinc-400">
            <span className="material-symbols-outlined text-[14px]">call</span>
            <span className="text-[13px] font-medium">{client.phone}</span>
          </div>
          {client.location && (
            <div className="flex items-center gap-1.5 text-zinc-500 mt-0.5">
              <span className="material-symbols-outlined text-[14px]">location_on</span>
              <span className="text-[12px] font-medium">{client.location}</span>
            </div>
          )}
        </div>
        
        <div className="relative shrink-0">
          <button 
            onClick={() => setMenuOpen(!menuOpen)}
            className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-white bg-[#121217] border border-[#1F1F24] rounded-full transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">more_vert</span>
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)}></div>
              <div className="absolute right-0 top-10 w-36 bg-[#121217] border border-[#1F1F24] rounded-xl shadow-2xl z-50 py-1.5 overflow-hidden">
                <Link href={`/admin/clientes/${client.id}`} className="flex items-center gap-2 px-4 py-2 text-[13px] font-semibold text-white hover:bg-[#1F1F24] transition-colors">
                  <span className="material-symbols-outlined text-[16px]">visibility</span>
                  Ver detalle
                </Link>
                <button 
                  onClick={() => { setMenuOpen(false); setIsEditing(true); }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-[13px] font-semibold text-white hover:bg-[#1F1F24] transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">edit</span>
                  Editar
                </button>
                <div className="h-px bg-[#1F1F24] my-1"></div>
                <button 
                  onClick={() => { setMenuOpen(false); setIsDeleting(true); }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-[13px] font-semibold text-red-400 hover:bg-[#1F1F24] transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">delete</span>
                  Eliminar
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="h-px bg-[#1F1F24] w-full mb-4"></div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col">
          <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-0.5">Ventas a KevPhones</span>
          <span className="text-[15px] font-bold text-white">{client.sales_to_business_count}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[11px] font-bold text-[#d7baff] uppercase tracking-wider mb-0.5">Compras a KevPhones</span>
          <span className="text-[15px] font-bold text-[#d7baff]">{client.purchases_count}</span>
        </div>
      </div>
    </div>
  )
}
