'use client'

import React, { useState } from 'react'
import { usePathname } from 'next/navigation'

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
  
  const isMas = isGastos || isMovimientos || showMoreMenu

  return (
    <>
      {showMoreMenu && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 transition-opacity"
          onClick={() => setShowMoreMenu(false)}
        />
      )}
      
      {showMoreMenu && (
        <div className="fixed bottom-[calc(4rem+env(safe-area-inset-bottom))] left-0 w-full bg-[#101014] border-t border-[#1F1F24] z-50 p-4 rounded-t-2xl shadow-2xl">
          <div className="flex flex-col gap-2 max-w-sm mx-auto">
            <a 
              href="/admin/gastos" 
              className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${isGastos ? 'bg-[#7a32d4]/20 text-[#d7baff]' : 'text-[#A8A8B0] hover:bg-[#1c1b1b] hover:text-[#d7baff]'}`}
            >
              <span className="material-symbols-outlined" style={{ fontVariationSettings: isGastos ? "'FILL' 1" : "'FILL' 0" }}>receipt_long</span>
              <span className="font-semibold">Gastos</span>
            </a>
            <a 
              href="/admin/movimientos" 
              className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${isMovimientos ? 'bg-[#7a32d4]/20 text-[#d7baff]' : 'text-[#A8A8B0] hover:bg-[#1c1b1b] hover:text-[#d7baff]'}`}
            >
              <span className="material-symbols-outlined" style={{ fontVariationSettings: isMovimientos ? "'FILL' 1" : "'FILL' 0" }}>sync_alt</span>
              <span className="font-semibold">Movimientos</span>
            </a>
          </div>
        </div>
      )}

      <nav className="bg-[#101014] fixed bottom-0 w-full z-50 flex justify-around items-center h-[calc(4rem+env(safe-area-inset-bottom))] pb-[env(safe-area-inset-bottom)] px-1 left-0 border-t border-[#1F1F24]">
        <a href="/admin" className={`flex flex-col items-center justify-center cursor-pointer transition-transform w-16 ${isInicio ? 'text-[#d7baff] font-bold' : 'text-[#A8A8B0] hover:text-[#d7baff]'}`}>
          <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: isInicio ? "'FILL' 1" : "'FILL' 0" }}>dashboard</span>
          <span className="text-[12px] font-semibold mt-1">Inicio</span>
        </a>
        <a href="/admin/stock" className={`flex flex-col items-center justify-center cursor-pointer transition-all w-16 ${isStock ? 'text-[#d7baff] font-bold' : 'text-[#A8A8B0] hover:text-[#d7baff]'}`}>
          <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: isStock ? "'FILL' 1" : "'FILL' 0" }}>inventory_2</span>
          <span className="text-[12px] font-semibold mt-1">Stock</span>
        </a>
        <a href="/admin/finanzas" className={`flex flex-col items-center justify-center cursor-pointer transition-all w-16 ${isFinanzas ? 'text-[#d7baff] font-bold' : 'text-[#A8A8B0] hover:text-[#d7baff]'}`}>
          <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: isFinanzas ? "'FILL' 1" : "'FILL' 0" }}>account_balance</span>
          <span className="text-[12px] font-semibold mt-1">Finanzas</span>
        </a>
        <a href="/admin/clientes" className={`flex flex-col items-center justify-center cursor-pointer transition-all w-16 ${isClientes ? 'text-[#d7baff] font-bold' : 'text-[#A8A8B0] hover:text-[#d7baff]'}`}>
          <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: isClientes ? "'FILL' 1" : "'FILL' 0" }}>group</span>
          <span className="text-[12px] font-semibold mt-1">Clientes</span>
        </a>
        <button 
          onClick={() => setShowMoreMenu(!showMoreMenu)}
          className={`flex flex-col items-center justify-center cursor-pointer transition-all w-16 ${isMas ? 'text-[#d7baff] font-bold' : 'text-[#A8A8B0] hover:text-[#d7baff]'}`}
        >
          <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: isMas ? "'FILL' 1" : "'FILL' 0" }}>more_horiz</span>
          <span className="text-[12px] font-semibold mt-1">Más</span>
        </button>
      </nav>
    </>
  )
}
