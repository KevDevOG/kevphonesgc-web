'use client'

import React, { useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'

export function AdminBottomNav() {
  const pathname = usePathname()
  const [showMoreMenu, setShowMoreMenu] = useState(false)

  if (!pathname || pathname === '/admin/login') {
    return null
  }

  const isActive = (path: string, exact = false) => {
    if (exact) return pathname === path
    return pathname.startsWith(path)
  }

  const isInicio = isActive('/admin', true)
  const isStock = isActive('/admin/stock')
  const isFinanzas = isActive('/admin/finanzas')
  const isClientes = isActive('/admin/clientes')
  const isGastos = isActive('/admin/gastos')
  const isMovimientos = isActive('/admin/movimientos')
  const isModelos = isActive('/admin/modelos')
  const isSolicitudes = isActive('/admin/solicitudes')
  const isConfiguracion = isActive('/admin/configuracion')
  const isResenas = isActive('/admin/resenas')
  
  const isMas = isGastos || isMovimientos || isModelos || isSolicitudes || isConfiguracion || isResenas || showMoreMenu

  const SidebarItem = ({ href, icon, label, active }: { href: string, icon: string, label: string, active: boolean }) => (
    <Link 
      href={href}
      className={`flex items-center gap-3 px-4 py-3 mx-4 my-0.5 rounded-xl transition-all ${
        active 
          ? 'bg-[#7a32d4]/15 text-[#d7baff] font-semibold' 
          : 'text-zinc-400 hover:bg-[#1F1F24] hover:text-white'
      }`}
    >
      <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}>{icon}</span>
      <span className="text-[14px]">{label}</span>
    </Link>
  )

  const MobileMoreItem = ({ href, icon, label, active }: { href: string, icon: string, label: string, active: boolean }) => (
    <Link 
      href={href} 
      onClick={() => setShowMoreMenu(false)}
      className={`flex items-center gap-3 p-3.5 rounded-xl transition-colors ${
        active 
          ? 'bg-[#7a32d4]/15 text-[#d7baff] font-semibold' 
          : 'text-zinc-400 hover:bg-[#1F1F24] hover:text-white font-medium'
      }`}
    >
      <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}>{icon}</span>
      <span className="text-[15px]">{label}</span>
    </Link>
  )

  return (
    <>
      {/* DESKTOP SIDEBAR (lg+) */}
      <aside className="hidden lg:flex flex-col fixed inset-y-0 left-0 w-[260px] bg-[#0B0B0E] border-r border-[#1F1F24] z-50 overflow-y-auto">
        <div className="px-6 py-8 flex flex-col mb-4 gap-4">
          <img src="/brand/kevphonesgc-logo.PNG" alt="KevPhonesGC" className="w-[48px] h-[48px] rounded-xl object-cover" />
          <div>
            <h2 className="text-white font-bold text-xl tracking-tight leading-none mb-1.5">KevPhonesGC</h2>
            <p className="text-zinc-500 text-[10px] uppercase tracking-widest font-bold">Panel Admin</p>
          </div>
        </div>

        <nav className="flex-1 flex flex-col pb-8">
          <SidebarItem href="/admin" icon="dashboard" label="Inicio" active={isInicio} />
          <SidebarItem href="/admin/stock" icon="inventory_2" label="Stock" active={isStock} />
          <SidebarItem href="/admin/finanzas" icon="account_balance" label="Finanzas" active={isFinanzas} />
          <SidebarItem href="/admin/solicitudes" icon="inbox" label="Solicitudes" active={isSolicitudes} />
          <SidebarItem href="/admin/clientes" icon="group" label="Clientes" active={isClientes} />
          
          <div className="mt-8 mb-3 px-8 text-[11px] font-bold uppercase tracking-wider text-zinc-600">Operaciones</div>
          <SidebarItem href="/admin/gastos" icon="receipt_long" label="Gastos" active={isGastos} />
          <SidebarItem href="/admin/movimientos" icon="sync_alt" label="Movimientos" active={isMovimientos} />
          
          <div className="mt-8 mb-3 px-8 text-[11px] font-bold uppercase tracking-wider text-zinc-600">Sistema</div>
          <SidebarItem href="/admin/cotizador" icon="calculate" label="Cotizador" active={isActive('/admin/cotizador')} />
          <SidebarItem href="/admin/modelos" icon="devices" label="Modelos" active={isModelos} />
          <SidebarItem href="/admin/resenas" icon="reviews" label="Reseñas" active={isResenas} />
          <SidebarItem href="/admin/configuracion" icon="settings" label="Configuración" active={isConfiguracion} />
        </nav>
      </aside>

      {/* MOBILE MORE MENU */}
      {showMoreMenu && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity lg:hidden"
          onClick={() => setShowMoreMenu(false)}
        />
      )}
      
      {showMoreMenu && (
        <div className="fixed bottom-[calc(3.5rem+env(safe-area-inset-bottom))] left-0 w-full bg-[#0B0B0E] border-t border-[#1F1F24] z-50 p-4 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.5)] lg:hidden max-h-[70vh] overflow-y-auto">
          <div className="w-10 h-1 bg-[#1F1F24] rounded-full mx-auto mb-4"></div>
          <div className="flex flex-col gap-1 max-w-sm mx-auto">
            <MobileMoreItem href="/admin/solicitudes" icon="inbox" label="Solicitudes" active={isSolicitudes} />
            <MobileMoreItem href="/admin/gastos" icon="receipt_long" label="Gastos" active={isGastos} />
            <MobileMoreItem href="/admin/movimientos" icon="sync_alt" label="Movimientos" active={isMovimientos} />
            <MobileMoreItem href="/admin/cotizador" icon="calculate" label="Cotizador" active={isActive('/admin/cotizador')} />
            <MobileMoreItem href="/admin/modelos" icon="devices" label="Modelos" active={isModelos} />
            <MobileMoreItem href="/admin/resenas" icon="reviews" label="Reseñas" active={isResenas} />
            <MobileMoreItem href="/admin/configuracion" icon="settings" label="Configuración" active={isConfiguracion} />
          </div>
        </div>
      )}

      {/* MOBILE BOTTOM NAV */}
      <nav className="lg:hidden bg-[#0B0B0E]/95 backdrop-blur-md fixed bottom-0 w-full z-50 flex justify-around items-center h-[calc(3.5rem+env(safe-area-inset-bottom))] pb-[env(safe-area-inset-bottom)] px-2 left-0 border-t border-[#1F1F24]">
        <Link href="/admin" className={`flex flex-col items-center justify-center w-16 h-full transition-colors ${isInicio ? 'text-[#d7baff]' : 'text-zinc-500 hover:text-[#d7baff]'}`}>
          <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: isInicio ? "'FILL' 1" : "'FILL' 0" }}>dashboard</span>
          <span className="text-[10px] font-semibold mt-0.5">Inicio</span>
        </Link>
        <Link href="/admin/stock" className={`flex flex-col items-center justify-center w-16 h-full transition-colors ${isStock ? 'text-[#d7baff]' : 'text-zinc-500 hover:text-[#d7baff]'}`}>
          <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: isStock ? "'FILL' 1" : "'FILL' 0" }}>inventory_2</span>
          <span className="text-[10px] font-semibold mt-0.5">Stock</span>
        </Link>
        <Link href="/admin/finanzas" className={`flex flex-col items-center justify-center w-16 h-full transition-colors ${isFinanzas ? 'text-[#d7baff]' : 'text-zinc-500 hover:text-[#d7baff]'}`}>
          <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: isFinanzas ? "'FILL' 1" : "'FILL' 0" }}>account_balance</span>
          <span className="text-[10px] font-semibold mt-0.5">Finanzas</span>
        </Link>
        <Link href="/admin/clientes" className={`flex flex-col items-center justify-center w-16 h-full transition-colors ${isClientes ? 'text-[#d7baff]' : 'text-zinc-500 hover:text-[#d7baff]'}`}>
          <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: isClientes ? "'FILL' 1" : "'FILL' 0" }}>group</span>
          <span className="text-[10px] font-semibold mt-0.5">Clientes</span>
        </Link>
        <button 
          onClick={() => setShowMoreMenu(!showMoreMenu)}
          className={`flex flex-col items-center justify-center w-16 h-full transition-colors ${isMas ? 'text-[#d7baff]' : 'text-zinc-500 hover:text-[#d7baff]'}`}
        >
          <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: isMas ? "'FILL' 1" : "'FILL' 0" }}>more_horiz</span>
          <span className="text-[10px] font-semibold mt-0.5">Más</span>
        </button>
      </nav>
    </>
  )
}
