'use client'

import React, { useId, useRef, useState } from 'react'
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
  const searchId = useId()
  const [searchTerm, setSearchTerm] = useState('')
  const [sortOrder, setSortOrder] = useState('recent')
  const query = searchTerm.trim().toLocaleLowerCase('es')
  const filteredClients = clients.filter(client => !query ||
    [client.name, client.phone, client.location].filter(Boolean).join(' ').toLocaleLowerCase('es').includes(query)
  )
  // Preserve the server's newest-first ordering by default; sort copies only.
  const visibleClients = sortOrder === 'oldest'
    ? [...filteredClients].sort((a, b) => Date.parse(a.created_at) - Date.parse(b.created_at))
    : sortOrder === 'name_asc' || sortOrder === 'name_desc'
      ? [...filteredClients].sort((a, b) => (a.name || '').localeCompare(b.name || '', 'es', { sensitivity: 'base', numeric: true }) * (sortOrder === 'name_desc' ? -1 : 1))
      : filteredClients

  const totalClients = clients.length
  const totalCompradores = clients.filter(c => c.purchases_count > 0).length
  const totalVendedores = clients.filter(c => c.sales_to_business_count > 0).length
  const resetSearch = () => setSearchTerm('')

  return (
    <div className="admin-clients">
      <AdminPageHeader
        title="Clientes"
        subtitle="Contactos e historial de compras y ventas."
        action={<p className="admin-clients__total"><strong>{totalClients}</strong> {totalClients === 1 ? 'cliente' : 'clientes'}</p>}
      />
      <p className="admin-clients__summary"><span><strong>{totalCompradores}</strong> compradores</span><span><strong>{totalVendedores}</strong> vendedores</span></p>

      <div className="admin-clients__toolbar">
        <div className="admin-clients__search">
          <label htmlFor={searchId} className="sr-only">Buscar cliente por nombre, teléfono o ubicación</label>
          <span aria-hidden="true" className="material-symbols-outlined">search</span>
          <input id={searchId} type="search" placeholder="Buscar cliente..." value={searchTerm} onChange={event => setSearchTerm(event.target.value)} />
        </div>
        <label className="admin-clients__sort">Ordenar
          <select value={sortOrder} onChange={event => setSortOrder(event.target.value)}>
            <option value="recent">Más recientes</option>
            <option value="oldest">Más antiguos</option>
            <option value="name_asc">Nombre A-Z</option>
            <option value="name_desc">Nombre Z-A</option>
          </select>
        </label>
        {query && <button type="button" className="admin-clients__reset" onClick={resetSearch}>Limpiar búsqueda</button>}
      </div>
      <p className="admin-clients__results" role="status" aria-live="polite">{visibleClients.length} {visibleClients.length === 1 ? 'cliente' : 'clientes'}</p>

      {visibleClients.length === 0 ? <div className="admin-clients__empty">
        <h3>{clients.length === 0 ? 'No hay clientes registrados.' : 'No se encontraron clientes que coincidan con la búsqueda.'}</h3>
        {clients.length === 0 ? <p>Los clientes aparecerán automáticamente al registrar compras o ventas.</p> : <button type="button" onClick={resetSearch}>Limpiar búsqueda</button>}
      </div> : <table role="table" className="admin-clients__table">
        <caption className="sr-only">Directorio de clientes</caption>
        <thead><tr><th scope="col">Cliente</th><th scope="col">Contacto</th><th scope="col">Ubicación</th><th scope="col">Actividad con KevPhones</th><th scope="col"><span className="sr-only">Acciones</span></th></tr></thead>
        <tbody>{visibleClients.map(client => <ClientItem key={client.id} client={client} />)}</tbody>
      </table>}
    </div>
  )
}

function ClientItem({ client }: { client: Client }) {
  const menuId = useId()
  const menuTrigger = useRef<HTMLButtonElement>(null)
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
      <tr className="admin-clients__inline-row"><td colSpan={5}>
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
      </td></tr>
    )
  }

  if (isDeleting) {
    return (
      <tr className="admin-clients__inline-row"><td colSpan={5}>
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
      </td></tr>
    )
  }

  return (
    <tr className="admin-clients__row">
      <td className="admin-clients__identity"><strong>{client.name || 'Sin nombre'}</strong></td>
      <td className="admin-clients__contact">{client.phone || 'Sin teléfono'}</td>
      <td className="admin-clients__location">{client.location || 'Sin ubicación'}</td>
      <td className="admin-clients__activity">
        <span className="admin-clients__activity-label">Con KevPhones</span>
        <dl aria-label="Actividad con KevPhones">
          <div><dt>Ventas</dt><dd>{client.sales_to_business_count}</dd></div>
          <div><dt>Compras</dt><dd>{client.purchases_count}</dd></div>
        </dl>
      </td>
      <td className="admin-clients__actions" onKeyDown={event => {
        if (event.key === 'Escape' && menuOpen) {
          setMenuOpen(false)
          menuTrigger.current?.focus()
        }
      }}>
        <Link href={`/admin/clientes/${client.id}`} className="admin-clients__view">Ver cliente<span className="sr-only">: {client.name}</span></Link>
        <div className="admin-clients__more">
          <button type="button" ref={menuTrigger} aria-label={`Más acciones para ${client.name || 'este cliente'}`} aria-expanded={menuOpen} aria-controls={menuId} onClick={() => setMenuOpen(!menuOpen)} className="admin-clients__menu-trigger">
            <span aria-hidden="true" className="material-symbols-outlined">more_vert</span>
          </button>
          {menuOpen && <>
            <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)}></div>
            <div id={menuId} className="admin-clients__menu" role="group" aria-label={`Acciones de ${client.name || 'cliente'}`}>
              <button type="button" onClick={() => { setMenuOpen(false); setIsEditing(true); }}>
                <span aria-hidden="true" className="material-symbols-outlined">edit</span> Editar
              </button>
              <button type="button" onClick={() => { setMenuOpen(false); setIsDeleting(true); }}>
                <span aria-hidden="true" className="material-symbols-outlined">delete</span> Eliminar
              </button>
            </div>
          </>}
        </div>
      </td>
    </tr>
  )
}
