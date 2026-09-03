'use client'

import React, { useState } from 'react'
import { AdminPageShell } from '@/components/admin/layout/AdminPageShell'
import { AdminPageHeader } from '@/components/admin/layout/AdminPageHeader'
import { updateClientAction, deleteClientAction } from '@/actions/clients'

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
    <AdminPageShell>
      <AdminPageHeader 
        title="Clientes" 
        subtitle="Consulta y administra tus clientes." 
      />

      <section className="grid grid-cols-2 gap-3 mb-8">
        <div className="col-span-2 bg-[#0B0B0D] border border-[#1F1F24] rounded-xl p-4 flex justify-between items-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-[#7a32d4]/20 to-transparent pointer-events-none"></div>
          <div className="relative z-10">
            <p className="text-[14px] font-semibold text-[#A8A8B0] mb-1 uppercase">Total clientes</p>
            <p className="text-[48px] font-extrabold text-[#F7F7F7] leading-none" style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '-0.02em' }}>
              {totalClients}
            </p>
          </div>
          <span className="material-symbols-outlined text-[48px] text-[#d7baff] relative z-10" style={{ fontVariationSettings: "'FILL' 0" }}>groups</span>
        </div>

        <div className="bg-[#0B0B0D] border border-[#1F1F24] rounded-xl p-4 flex flex-col justify-between h-32">
          <p className="text-[14px] font-semibold text-[#A8A8B0] uppercase">Compradores</p>
          <p className="text-[28px] font-extrabold text-[#B98AFF] leading-none" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
            {totalCompradores}
          </p>
        </div>

        <div className="bg-[#0B0B0D] border border-[#1F1F24] rounded-xl p-4 flex flex-col justify-between h-32">
          <p className="text-[14px] font-semibold text-[#A8A8B0] uppercase">Vendedores</p>
          <p className="text-[28px] font-extrabold text-[#F7F7F7] leading-none" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
            {totalVendedores}
          </p>
        </div>
      </section>

      <section>
        <div className="relative group">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#A8A8B0] group-focus-within:text-[#d7baff] transition-colors">search</span>
          <input 
            type="text" 
            placeholder="Buscar por nombre o teléfono" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#101014] border border-[#1F1F24] rounded-lg py-3 pl-12 pr-4 text-[16px] text-[#F7F7F7] placeholder:text-[#A8A8B0] focus:outline-none focus:border-[#d7baff] focus:ring-1 focus:ring-[#d7baff] transition-all shadow-sm shadow-black/50"
          />
        </div>
      </section>

      <section className="flex flex-col gap-4">
        {filteredClients.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-8 px-4 gap-4 bg-[#0B0B0D] rounded-lg border border-[#1F1F24] border-dashed">
            <span className="material-symbols-outlined text-4xl text-[#A8A8B0]">group_off</span>
            <p className="text-[16px] text-[#A8A8B0]">
              {searchTerm 
                ? "No se encontraron clientes que coincidan con la búsqueda." 
                : "No hay clientes registrados. Los clientes aparecerán automáticamente al registrar compras o ventas."}
            </p>
          </div>
        ) : (
          filteredClients.map(client => (
            <ClientItem key={client.id} client={client} />
          ))
        )}
      </section>
    </AdminPageShell>
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
        setError(res.error || 'No se pudo actualizar el cliente. Inténtalo de nuevo.')
      } else {
        setIsEditing(false)
      }
    } catch (err) {
      setError('No se pudo actualizar el cliente. Inténtalo de nuevo.')
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
        setError(res.error || 'No se pudo eliminar el cliente. Inténtalo de nuevo.')
      }
    } catch (err) {
      setError('No se pudo eliminar el cliente. Inténtalo de nuevo.')
    } finally {
      setIsPending(false)
    }
  }

  if (isEditing) {
    return (
      <div className="bg-[#0B0B0D] border border-[#1F1F24] rounded-lg p-4 flex flex-col gap-4">
        <h4 className="text-[16px] font-bold text-[#F7F7F7] uppercase tracking-wider border-b border-[#1F1F24] pb-2">Editar cliente</h4>
        {error && (
          <div className="bg-[#93000a]/20 border border-[#93000a] text-[#ffb4ab] text-[14px] p-3 rounded-lg">
            {error}
          </div>
        )}
        <form onSubmit={handleEdit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-[12px] font-semibold text-[#A8A8B0]">Nombre</label>
            <input required name="name" defaultValue={client.name} className="bg-[#1c1b1b] border border-[#1F1F24] text-[#F7F7F7] text-[16px] rounded-lg px-3 py-2 outline-none focus:border-[#7a32d4] focus:ring-1 focus:ring-[#7a32d4]" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[12px] font-semibold text-[#A8A8B0]">Teléfono</label>
            <input required name="phone" defaultValue={client.phone} className="bg-[#1c1b1b] border border-[#1F1F24] text-[#F7F7F7] text-[16px] rounded-lg px-3 py-2 outline-none focus:border-[#7a32d4] focus:ring-1 focus:ring-[#7a32d4]" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[12px] font-semibold text-[#A8A8B0]">Ubicación (opcional)</label>
            <input name="location" defaultValue={client.location || ''} className="bg-[#1c1b1b] border border-[#1F1F24] text-[#F7F7F7] text-[16px] rounded-lg px-3 py-2 outline-none focus:border-[#7a32d4] focus:ring-1 focus:ring-[#7a32d4]" />
          </div>
          <div className="flex justify-end gap-2 mt-2">
            <button 
              type="button" 
              onClick={() => { setIsEditing(false); setError(null); }}
              disabled={isPending}
              className="bg-[#353534] hover:bg-[#4b4454] text-[#F7F7F7] font-semibold text-[14px] px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={isPending}
              className="bg-gradient-to-r from-[#7a32d4] to-[#6e02d2] border border-[#d7baff] text-[#131313] font-bold text-[14px] px-4 py-2 rounded-lg hover:brightness-110 transition-all disabled:opacity-50 disabled:hover:brightness-100"
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
      <div className="bg-[#0B0B0D] border border-[#1F1F24] rounded-lg p-4 flex flex-col gap-4 relative">
        <h4 className="text-[16px] font-bold text-[#ffb4ab] uppercase tracking-wider border-b border-[#93000a]/30 pb-2">¿Eliminar este cliente?</h4>
        <p className="text-[14px] text-[#A8A8B0]">Solo se podrá eliminar si no tiene compras o ventas asociadas.</p>
        <p className="text-[12px] text-[#A8A8B0] font-semibold">Las operaciones históricas nunca se eliminarán.</p>
        
        {error && (
          <div className="bg-[#93000a]/20 border border-[#93000a] text-[#ffb4ab] text-[14px] p-3 rounded-lg">
            {error}
          </div>
        )}
        
        <form onSubmit={handleDelete} className="flex justify-end gap-2 mt-2">
          <button 
            type="button" 
            onClick={() => { setIsDeleting(false); setError(null); }}
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
    )
  }

  return (
    <div className="bg-[#0B0B0D] border border-[#1F1F24] rounded-lg p-4 flex flex-col gap-2 relative">
      <div className="flex justify-between items-start w-full">
        <div className="flex flex-col">
          <span className="text-[24px] font-bold text-[#F7F7F7]" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
            {client.name}
          </span>
          <span className="text-[16px] text-[#A8A8B0] flex items-center gap-1 mt-1">
            <span className="material-symbols-outlined text-lg">call</span> {client.phone}
          </span>
        </div>
        
        <div className="flex items-start gap-2">
          {client.location && (
            <div className="bg-[#101014] border border-[#1F1F24] rounded px-2 py-1 flex items-center gap-1">
              <span className="material-symbols-outlined text-[#A8A8B0] text-sm">location_on</span>
              <span className="text-[14px] font-semibold text-[#A8A8B0]">{client.location}</span>
            </div>
          )}
          <div className="relative">
            <button 
              onClick={() => setMenuOpen(!menuOpen)}
              className="text-[#A8A8B0] hover:text-[#d7baff] transition-colors p-1 rounded hover:bg-[#1c1b1b]"
            >
              <span className="material-symbols-outlined">more_vert</span>
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)}></div>
                <div className="absolute right-0 top-8 w-40 bg-[#1c1b1b] border border-[#1F1F24] rounded-lg shadow-xl z-50 py-1 overflow-hidden">
                  <a href={`/admin/clientes/${client.id}`} className="block px-4 py-2 text-sm text-[#F7F7F7] hover:bg-[#353534]">Ver detalle</a>
                  <button 
                    onClick={() => { setMenuOpen(false); setIsEditing(true); }}
                    className="block w-full text-left px-4 py-2 text-sm text-[#F7F7F7] hover:bg-[#353534]"
                  >
                    Editar
                  </button>
                  <button 
                    onClick={() => { setMenuOpen(false); setIsDeleting(true); }}
                    className="block w-full text-left px-4 py-2 text-sm text-[#ffb4ab] hover:bg-[#353534]"
                  >
                    Eliminar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-3 mt-2 pt-3 border-t border-[#131313]">
        <div className="flex-1 flex flex-col gap-1">
          <span className="text-[14px] font-semibold text-[#A8A8B0]">Te ha vendido</span>
          <span className="text-[16px] text-[#F7F7F7]">{client.sales_to_business_count}</span>
        </div>
        <div className="flex-1 flex flex-col gap-1">
          <span className="text-[14px] font-semibold text-[#A8A8B0]">Te ha comprado</span>
          <span className="text-[16px] text-[#F7F7F7]">{client.purchases_count}</span>
        </div>
      </div>

      <div className="flex gap-2 mt-2">
        {client.purchases_count > 0 && (
          <span className="bg-[#7247b0]/20 text-[#d7baff] text-xs px-2 py-1 rounded font-semibold border border-[#7247b0]/30">Comprador</span>
        )}
        {client.sales_to_business_count > 0 && (
          <span className="bg-[#4b4454]/30 text-[#cdc2d6] text-xs px-2 py-1 rounded font-semibold border border-[#4b4454]/40">Vendedor</span>
        )}
      </div>
    </div>
  )
}
