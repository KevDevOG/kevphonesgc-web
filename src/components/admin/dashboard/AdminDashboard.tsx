'use client'

import React from 'react'
import { AdminPageShell } from '@/components/admin/layout/AdminPageShell'
import { AdminPageHeader } from '@/components/admin/layout/AdminPageHeader'

type ProfitEvo = {
  label: string
  profit: number
  isCurrent: boolean
}

type Activity = {
  type: string
  dateStr: string
  timestamp: number
  title: string
  amount: number
  sign: string
  originalAmount?: number
}

type Props = {
  expectedCash: number
  stockCapital: number
  totalCapital: number
  monthLabel: string
  monthlySalesRevenue: number
  monthlySoldCount: number
  monthlyOperationProfit: number
  monthlyExpenses: number
  monthlyFinalProfit: number
  availableStockCount: number
  profitEvolution: ProfitEvo[]
  recentActivities: Activity[]
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR"
  }).format(amount)
}

function formatDateActivity(dateStr: string) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  
  const isToday = d.toDateString() === today.toDateString()
  const isYesterday = d.toDateString() === yesterday.toDateString()
  
  if (isToday) return 'Hoy'
  if (isYesterday) return 'Ayer'
  
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
}

export function AdminDashboard({
  expectedCash,
  stockCapital,
  totalCapital,
  monthLabel,
  monthlySalesRevenue,
  monthlySoldCount,
  monthlyOperationProfit,
  monthlyExpenses,
  monthlyFinalProfit,
  availableStockCount,
  profitEvolution,
  recentActivities
}: Props) {

  // For profit chart
  const maxProfit = Math.max(...profitEvolution.map(p => Math.abs(p.profit)), 100) // minimum 100 to avoid div by zero
  // Let's create a simple SVG polyline string for positive and negative values
  // SVG coordinates: y is inverted (0 is top, 100 is bottom). We map -maxProfit..maxProfit to 100..0
  const points = profitEvolution.map((p, i) => {
    const x = i * (300 / 5) // 5 intervals for 6 points
    // Center is 50. range is 10 to 90
    const yRange = 80 // 10 to 90
    const normalized = (p.profit / (maxProfit * 1.2)) // slightly higher max to give padding
    const y = 50 - (normalized * 40) // center 50, +40 up, -40 down
    return `${x} ${y}`
  }).join(' ')

  const allZero = profitEvolution.every(p => p.profit === 0)

  return (
    <AdminPageShell>
        
        <AdminPageHeader 
          title="Resumen" 
          subtitle="Vista general de KevPhonesGC" 
          action={
            <div className="bg-[#7247b0] rounded px-3 py-1 flex items-center gap-1 w-fit">
              <span className="w-2 h-2 rounded-full bg-[#B98AFF]"></span>
              <span className="text-[14px] font-semibold text-[#e5d0ff] uppercase tracking-wider">{monthLabel}</span>
            </div>
          }
        />

        {/* Capital Summary */}
        <section className="grid grid-cols-2 gap-3">
          <div className="col-span-2 bg-[#0B0B0D] border border-[#1F1F24] rounded-xl p-4 flex justify-between items-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-[#7a32d4]/20 to-transparent pointer-events-none"></div>
            <div className="relative z-10">
              <p className="text-[14px] font-semibold text-[#A8A8B0] mb-1">CAPITAL TOTAL</p>
              <p className="text-[48px] font-extrabold text-[#F7F7F7] leading-none" style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '-0.02em' }}>
                {formatCurrency(totalCapital)}
              </p>
            </div>
            <span className="material-symbols-outlined text-[48px] text-[#d7baff] relative z-10" style={{ fontVariationSettings: "'FILL' 0" }}>account_balance</span>
          </div>
          
          <div className="bg-[#0B0B0D] border border-[#1F1F24] rounded-xl p-4 flex flex-col justify-between h-32">
            <p className="text-[14px] font-semibold text-[#A8A8B0]">EFECTIVO DISPONIBLE</p>
            <p className="text-[28px] font-extrabold text-[#B98AFF] leading-none" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
              {formatCurrency(expectedCash)}
            </p>
          </div>
          
          <div className="bg-[#0B0B0D] border border-[#1F1F24] rounded-xl p-4 flex flex-col justify-between h-32">
            <p className="text-[14px] font-semibold text-[#A8A8B0]">CAPITAL EN STOCK</p>
            <p className="text-[28px] font-extrabold text-[#F7F7F7] leading-none" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
              {formatCurrency(stockCapital)}
            </p>
          </div>
        </section>

        {/* Quick Actions */}
        <section className="flex gap-3 overflow-x-auto pb-2 snap-x -mx-4 px-4 no-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          <a href="/admin/stock/nuevo" className="snap-start flex-shrink-0 flex items-center gap-2 bg-gradient-to-r from-[#7a32d4] to-[#6e02d2] px-4 py-3 rounded-lg border border-[#d7baff] text-[#F7F7F7] hover:brightness-110 transition-all">
            <span className="material-symbols-outlined">add_circle</span>
            <span className="text-[14px] font-semibold">Añadir dispositivo</span>
          </a>
          <a href="/admin/gastos" className="snap-start flex-shrink-0 flex items-center gap-2 bg-transparent border border-[#d7baff] px-4 py-3 rounded-lg text-[#d7baff] hover:bg-[#2a2a2a] transition-all">
            <span className="material-symbols-outlined">receipt_long</span>
            <span className="text-[14px] font-semibold">Registrar gasto</span>
          </a>
        </section>

        {/* Monthly Metrics */}
        <section>
          <h3 className="text-[24px] font-bold text-[#F7F7F7] mb-4 border-b border-[#1F1F24] pb-2" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>Métricas Mensuales</h3>
          <div className="grid grid-cols-2 gap-[1px] bg-[#1F1F24] rounded-xl overflow-hidden border border-[#1F1F24]">
            
            <div className="bg-[#0B0B0D] p-4 flex flex-col">
              <span className="text-[16px] text-[#A8A8B0]">Ventas</span>
              <span className="text-[24px] font-bold text-[#F7F7F7] mt-1" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
                {formatCurrency(monthlySalesRevenue)}
              </span>
              <span className="text-[12px] text-[#A8A8B0] mt-1">
                {monthlySoldCount === 1 ? '1 dispositivo vendido' : `${monthlySoldCount} dispositivos vendidos`}
              </span>
            </div>
            
            <div className="bg-[#0B0B0D] p-4 flex flex-col">
              <span className="text-[16px] text-[#A8A8B0]">Beneficio op.</span>
              <span className={`text-[24px] font-bold mt-1 ${monthlyOperationProfit >= 0 ? 'text-[#B98AFF]' : 'text-[#ffb4ab]'}`} style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
                {formatCurrency(monthlyOperationProfit)}
              </span>
            </div>
            
            <div className="bg-[#0B0B0D] p-4 flex flex-col">
              <span className="text-[16px] text-[#A8A8B0]">Gastos</span>
              <span className="text-[24px] font-bold text-[#ffb4ab] mt-1" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
                {formatCurrency(monthlyExpenses)}
              </span>
            </div>
            
            <div className="bg-[#0B0B0D] p-4 flex flex-col relative overflow-hidden">
              <div className="absolute inset-0 bg-[#7a32d4]/10"></div>
              <span className="text-[16px] text-[#A8A8B0] relative z-10">Beneficio final</span>
              <span className={`text-[24px] font-bold mt-1 relative z-10 ${monthlyFinalProfit >= 0 ? 'text-[#F7F7F7]' : 'text-[#ffb4ab]'}`} style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
                {formatCurrency(monthlyFinalProfit)}
              </span>
            </div>
            
          </div>
        </section>

        {/* Stock */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-[#0B0B0D] border border-[#1F1F24] rounded-xl p-4 flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#A8A8B0]">inventory_2</span>
                <h4 className="text-[24px] font-bold text-[#F7F7F7]" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>Stock</h4>
              </div>
              <div className="bg-[#7247b0] px-2 py-1 rounded text-[#e5d0ff] text-[14px] font-semibold">
                {formatCurrency(stockCapital)} inv.
              </div>
            </div>
            <div className="mb-4">
              <p className="text-[48px] font-extrabold text-[#F7F7F7] mb-1 leading-none" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>{availableStockCount}</p>
              <p className="text-[16px] text-[#A8A8B0]">Dispositivos disponibles</p>
            </div>
            <a href="/admin/stock" className="w-full block text-center bg-transparent border border-[#d7baff] py-2 rounded text-[#d7baff] text-[14px] font-semibold hover:bg-[#2a2a2a] transition-colors">
              Ver stock
            </a>
          </div>
        </section>

        {/* Profit Chart */}
        <section className="bg-[#0B0B0D] border border-[#1F1F24] rounded-xl p-4">
          <h3 className="text-[24px] font-bold text-[#F7F7F7] mb-4" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>Evolución del beneficio</h3>
          
          <div className="h-32 w-full flex items-end justify-between gap-2 relative">
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
              <div className="w-full h-px bg-[#1F1F24]"></div>
              <div className="w-full h-px bg-[#1F1F24]"></div>
              <div className="w-full h-px bg-[#1F1F24]"></div>
            </div>
            
            {!allZero ? (
              <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none" viewBox="0 0 300 100">
                <polyline points={points} fill="none" stroke="#d7baff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="opacity-80"></polyline>
              </svg>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-[#A8A8B0] text-[14px] italic">Sin datos de beneficio recientes</p>
              </div>
            )}
            
            {profitEvolution.map((p, i) => {
              const normalized = (p.profit / (maxProfit * 1.2))
              const mBottom = 50 + (normalized * 40)
              return (
                <div key={i} className="flex-1 flex flex-col items-center justify-end h-full relative z-10">
                  <div 
                    className={`w-3 h-3 rounded-full mb-2 border-2 border-[#0B0B0D] ${p.isCurrent ? 'bg-[#B98AFF] shadow-[0_0_12px_rgba(185,138,255,1)]' : 'bg-[#d7baff]'}`} 
                    style={{ marginBottom: `${Math.max(5, Math.min(95, mBottom))}%` }}
                    title={formatCurrency(p.profit)}
                  ></div>
                  <span className={`text-[14px] ${p.isCurrent ? 'text-[#F7F7F7] font-bold' : 'text-[#A8A8B0] font-semibold'}`}>
                    {p.label}
                  </span>
                </div>
              )
            })}
          </div>
        </section>

        {/* Recent Activity */}
        <section className="mb-8">
          <div className="flex justify-between items-center mb-4 border-b border-[#1F1F24] pb-2">
            <h3 className="text-[24px] font-bold text-[#F7F7F7]" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>Últimos Movimientos</h3>
          </div>
          <ul className="flex flex-col gap-0">
            {recentActivities.length === 0 ? (
              <p className="text-[#A8A8B0] text-[14px] italic">No hay movimientos recientes.</p>
            ) : (
              recentActivities.map((act, i) => {
                let icon = ''
                let iconClass = ''
                let bgClass = ''
                let amountClass = ''
                
                if (act.type === 'sale') {
                  icon = 'trending_up'
                  iconClass = 'text-[#B98AFF]'
                  bgClass = 'bg-[#7247b0]/20'
                  amountClass = 'text-[#B98AFF]'
                } else if (act.type === 'purchase') {
                  icon = 'shopping_cart'
                  iconClass = 'text-[#A8A8B0]'
                  bgClass = 'bg-[#2a2a2a]'
                  amountClass = 'text-[#F7F7F7]'
                } else if (act.type === 'expense') {
                  icon = 'receipt'
                  iconClass = 'text-[#ffb4ab]'
                  bgClass = 'bg-[#93000a]/20'
                  amountClass = 'text-[#ffb4ab]'
                } else if (act.type === 'capital') {
                  icon = 'account_balance_wallet'
                  if (act.sign === '+') {
                    iconClass = 'text-[#d7baff]'
                    bgClass = 'bg-[#7a32d4]/20'
                    amountClass = 'text-[#d7baff]'
                  } else {
                    iconClass = 'text-[#ffb4ab]'
                    bgClass = 'bg-[#93000a]/20'
                    amountClass = 'text-[#ffb4ab]'
                  }
                }

                return (
                  <li key={i} className="flex items-center justify-between py-3 border-b border-[#0B0B0D] last:border-b-0">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded flex items-center justify-center ${bgClass} ${iconClass}`}>
                        <span className="material-symbols-outlined">{icon}</span>
                      </div>
                      <div>
                        <p className="text-[16px] text-[#F7F7F7] font-semibold">{act.title}</p>
                        <p className="text-[14px] text-[#A8A8B0] font-semibold">{formatDateActivity(act.dateStr)}</p>
                      </div>
                    </div>
                    <span className={`text-[24px] font-bold ${amountClass}`} style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
                      {act.sign}{formatCurrency(act.amount)}
                    </span>
                  </li>
                )
              })
            )}
          </ul>
        </section>
    </AdminPageShell>
  )
}
