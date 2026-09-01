'use client'

import { useState } from 'react'

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
    <>
      <section className="grid grid-cols-2 gap-3">
        <div className="bg-[#0B0B0D] border border-[#1F1F24] rounded-lg p-3 flex flex-col gap-1 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-[#7a32d4]/5 to-transparent pointer-events-none opacity-50"></div>
          <span className="text-[14px] font-semibold text-[#A8A8B0]">Total clientes</span>
          <span className="text-[28px] font-extrabold text-[#B98AFF]" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>{totalClients}</span>
        </div>
        <div className="bg-[#0B0B0D] border border-[#1F1F24] rounded-lg p-3 flex flex-col gap-1 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-[#7a32d4]/5 to-transparent pointer-events-none opacity-50"></div>
          <span className="text-[14px] font-semibold text-[#A8A8B0]">Compradores</span>
          <span className="text-[28px] font-extrabold text-[#B98AFF]" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>{totalCompradores}</span>
        </div>
        <div className="col-span-2 bg-[#0B0B0D] border border-[#1F1F24] rounded-lg p-3 flex flex-col gap-1 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-[#7a32d4]/5 to-transparent pointer-events-none opacity-50"></div>
          <span className="text-[14px] font-semibold text-[#A8A8B0]">Vendedores (te venden)</span>
          <span className="text-[28px] font-extrabold text-[#B98AFF]" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>{totalVendedores}</span>
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
            <a 
              key={client.id} 
              href={`/admin/clientes/${client.id}`}
              className="bg-[#0B0B0D] border border-[#1F1F24] rounded-lg p-4 flex flex-col gap-2 text-left hover:border-[#d7baff]/50 transition-colors active:scale-[0.98] duration-150 relative overflow-hidden group focus:outline-none focus:ring-2 focus:ring-[#d7baff]/50 block"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-[#d7baff]/0 via-[#d7baff]/0 to-[#d7baff]/0 group-hover:from-[#d7baff]/5 transition-all pointer-events-none"></div>
              
              <div className="flex justify-between items-start w-full">
                <div className="flex flex-col">
                  <span className="text-[24px] font-bold text-[#F7F7F7]" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
                    {client.name}
                  </span>
                  <span className="text-[16px] text-[#A8A8B0] flex items-center gap-1 mt-1">
                    <span className="material-symbols-outlined text-lg">call</span> {client.phone}
                  </span>
                </div>
                {client.location && (
                  <div className="bg-[#101014] border border-[#1F1F24] rounded px-2 py-1 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[#A8A8B0] text-sm">location_on</span>
                    <span className="text-[14px] font-semibold text-[#A8A8B0]">{client.location}</span>
                  </div>
                )}
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

              <div className="mt-2 flex items-center justify-end w-full">
                <span className="material-symbols-outlined text-[#d7baff] group-hover:translate-x-1 transition-transform">arrow_forward</span>
              </div>
            </a>
          ))
        )}
      </section>
    </>
  )
}
