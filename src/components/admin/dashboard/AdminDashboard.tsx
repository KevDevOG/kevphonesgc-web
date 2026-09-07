'use client'

import React from 'react'
import { AdminPageShell } from '@/components/admin/layout/AdminPageShell'
import { AdminPageHeader } from '@/components/admin/layout/AdminPageHeader'
import Link from 'next/link'

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
  const maxProfit = Math.max(...profitEvolution.map(p => Math.abs(p.profit)), 100)
  const points = profitEvolution.map((p, i) => {
    const x = i * (300 / 5) 
    const normalized = (p.profit / (maxProfit * 1.2))
    const y = 50 - (normalized * 40)
    return `${x} ${y}`
  }).join(' ')

  const allZero = profitEvolution.every(p => p.profit === 0)

  return (
    <AdminPageShell>
        <AdminPageHeader 
          title="Resumen" 
          subtitle="Vista general de KevPhonesGC" 
          action={
            <div className="bg-[#1F1F24]/50 border border-[#2a2a30] rounded-lg px-3 py-1.5 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#d7baff] animate-pulse"></span>
              <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">{monthLabel}</span>
            </div>
          }
        />

        <div className="flex flex-col gap-6">
          {/* TOP ROW: PRIMARY KPIs & QUICK ACTIONS */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            
            {/* Main Financial KPI */}
            <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Total Capital */}
              <div className="sm:col-span-3 bg-[#0B0B0E] border border-[#1F1F24] rounded-2xl p-6 flex flex-col justify-center relative overflow-hidden group hover:border-[#2a2a30] transition-colors">
                <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                  <span className="material-symbols-outlined text-6xl text-[#d7baff]" style={{ fontVariationSettings: "'FILL' 0" }}>account_balance</span>
                </div>
                <p className="text-[13px] font-bold text-zinc-500 uppercase tracking-widest mb-2 relative z-10">Capital total</p>
                <p className="text-5xl lg:text-6xl font-semibold text-white leading-tight tracking-tight relative z-10">
                  {formatCurrency(totalCapital)}
                </p>
              </div>

              {/* Secondary Capital */}
              <div className="sm:col-span-1 bg-[#0B0B0E] border border-[#1F1F24] rounded-2xl p-5 flex flex-col justify-center">
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Efectivo disponible</p>
                <p className="text-2xl font-semibold text-[#d7baff]">
                  {formatCurrency(expectedCash)}
                </p>
              </div>

              <div className="sm:col-span-2 bg-[#0B0B0E] border border-[#1F1F24] rounded-2xl p-5 flex flex-col justify-center">
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Capital en stock</p>
                <p className="text-2xl font-semibold text-white">
                  {formatCurrency(stockCapital)}
                </p>
              </div>
            </div>

            {/* Quick Actions (Desktop Right Side, Mobile Stack) */}
            <div className="lg:col-span-4 flex flex-row lg:flex-col gap-3 overflow-x-auto no-scrollbar snap-x">
              <Link href="/admin/stock/nuevo" className="snap-start flex-shrink-0 lg:flex-shrink flex-1 flex flex-col items-center justify-center gap-2 bg-[#7a32d4]/10 hover:bg-[#7a32d4]/20 border border-[#7a32d4]/30 rounded-2xl p-4 transition-colors min-w-[140px] text-center">
                <span className="material-symbols-outlined text-[#d7baff] text-3xl">add_circle</span>
                <span className="text-sm font-semibold text-[#d7baff]">Añadir dispositivo</span>
              </Link>
              <Link href="/admin/gastos" className="snap-start flex-shrink-0 lg:flex-shrink flex-1 flex flex-col items-center justify-center gap-2 bg-[#0B0B0E] hover:bg-[#1F1F24] border border-[#1F1F24] rounded-2xl p-4 transition-colors min-w-[140px] text-center">
                <span className="material-symbols-outlined text-zinc-400 text-3xl">receipt_long</span>
                <span className="text-sm font-semibold text-zinc-300">Registrar gasto</span>
              </Link>
            </div>
          </section>

          {/* MIDDLE ROW: MONTHLY METRICS & STOCK SUMMARY */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            
            <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-px bg-[#1F1F24] rounded-2xl overflow-hidden border border-[#1F1F24]">
              <div className="bg-[#0B0B0E] p-5 flex flex-col justify-center">
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Ventas</span>
                <span className="text-xl font-semibold text-white">
                  {formatCurrency(monthlySalesRevenue)}
                </span>
                <span className="text-[11px] text-zinc-500 mt-1 font-medium">
                  {monthlySoldCount === 1 ? '1 vendido' : `${monthlySoldCount} vendidos`}
                </span>
              </div>
              
              <div className="bg-[#0B0B0E] p-5 flex flex-col justify-center">
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Beneficio op.</span>
                <span className={`text-xl font-semibold ${monthlyOperationProfit >= 0 ? 'text-[#d7baff]' : 'text-red-400'}`}>
                  {formatCurrency(monthlyOperationProfit)}
                </span>
              </div>
              
              <div className="bg-[#0B0B0E] p-5 flex flex-col justify-center">
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Gastos</span>
                <span className="text-xl font-semibold text-red-400">
                  {formatCurrency(monthlyExpenses)}
                </span>
              </div>
              
              <div className="bg-[#0B0B0E] p-5 flex flex-col justify-center relative">
                <div className="absolute inset-0 bg-[#d7baff]/5 pointer-events-none"></div>
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1 relative z-10">Beneficio final</span>
                <span className={`text-2xl font-semibold relative z-10 ${monthlyFinalProfit >= 0 ? 'text-white' : 'text-red-400'}`}>
                  {formatCurrency(monthlyFinalProfit)}
                </span>
              </div>
            </div>

            <div className="lg:col-span-1 bg-[#0B0B0E] border border-[#1F1F24] rounded-2xl p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="material-symbols-outlined text-zinc-400 text-lg">inventory_2</span>
                  <h4 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Stock disponible</h4>
                </div>
                <p className="text-4xl font-semibold text-white mb-1 leading-none">{availableStockCount}</p>
                <p className="text-sm font-medium text-zinc-500">{formatCurrency(stockCapital)} invertidos</p>
              </div>
              <Link href="/admin/stock" className="mt-4 w-full flex items-center justify-center bg-[#1F1F24] hover:bg-[#2a2a30] transition-colors py-2.5 rounded-lg text-sm font-semibold text-white">
                Ver stock
              </Link>
            </div>
            
          </section>

          {/* LOWER ROW: PROFIT CHART & RECENT ACTIVITY */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Profit Chart */}
            <div className="bg-[#0B0B0E] border border-[#1F1F24] rounded-2xl p-6 flex flex-col">
              <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-6">Evolución del beneficio</h3>
              
              <div className="flex-1 min-h-[160px] w-full flex items-end justify-between gap-2 relative mt-4">
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-6">
                  <div className="w-full h-px bg-zinc-800/50"></div>
                  <div className="w-full h-px bg-zinc-800/50"></div>
                  <div className="w-full h-px bg-zinc-800/50"></div>
                </div>
                
                {!allZero ? (
                  <svg className="absolute inset-0 w-full h-[calc(100%-24px)] pointer-events-none" preserveAspectRatio="none" viewBox="0 0 300 100">
                    <polyline points={points} fill="none" stroke="#7a32d4" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"></polyline>
                  </svg>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center pb-6">
                    <p className="text-zinc-600 text-sm font-medium">Sin datos de beneficio recientes</p>
                  </div>
                )}
                
                {profitEvolution.map((p, i) => {
                  const normalized = (p.profit / (maxProfit * 1.2))
                  const mBottom = 50 + (normalized * 40)
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center justify-end h-full relative z-10 pb-6 group">
                      <div 
                        className={`w-2.5 h-2.5 rounded-full mb-2 border-[2px] border-[#0B0B0E] ${p.isCurrent ? 'bg-[#d7baff] shadow-[0_0_8px_rgba(215,186,255,0.6)]' : 'bg-[#7a32d4]'}`} 
                        style={{ marginBottom: `calc(${Math.max(5, Math.min(95, mBottom))}% - 1.5rem)` }}
                        title={formatCurrency(p.profit)}
                      ></div>
                      <span className={`absolute bottom-0 text-[11px] uppercase tracking-wider ${p.isCurrent ? 'text-white font-bold' : 'text-zinc-500 font-semibold'}`}>
                        {p.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-[#0B0B0E] border border-[#1F1F24] rounded-2xl flex flex-col overflow-hidden">
              <div className="p-6 border-b border-[#1F1F24]">
                <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Últimos Movimientos</h3>
              </div>
              <ul className="flex flex-col overflow-y-auto max-h-[300px] lg:max-h-full">
                {recentActivities.length === 0 ? (
                  <div className="p-6">
                    <p className="text-zinc-500 text-sm">No hay movimientos recientes.</p>
                  </div>
                ) : (
                  recentActivities.map((act, i) => {
                    let icon = ''
                    let iconClass = ''
                    let bgClass = ''
                    let amountClass = ''
                    
                    if (act.type === 'sale') {
                      icon = 'trending_up'
                      iconClass = 'text-[#d7baff]'
                      bgClass = 'bg-[#7a32d4]/10 border border-[#7a32d4]/20'
                      amountClass = 'text-[#d7baff]'
                    } else if (act.type === 'purchase') {
                      icon = 'shopping_cart'
                      iconClass = 'text-zinc-300'
                      bgClass = 'bg-[#1F1F24] border border-[#2a2a30]'
                      amountClass = 'text-white'
                    } else if (act.type === 'expense') {
                      icon = 'receipt'
                      iconClass = 'text-red-400'
                      bgClass = 'bg-red-500/10 border border-red-500/20'
                      amountClass = 'text-red-400'
                    } else if (act.type === 'capital') {
                      icon = 'account_balance_wallet'
                      if (act.sign === '+') {
                        iconClass = 'text-[#d7baff]'
                        bgClass = 'bg-[#7a32d4]/10 border border-[#7a32d4]/20'
                        amountClass = 'text-[#d7baff]'
                      } else {
                        iconClass = 'text-red-400'
                        bgClass = 'bg-red-500/10 border border-red-500/20'
                        amountClass = 'text-red-400'
                      }
                    }

                    return (
                      <li key={i} className="flex items-center justify-between p-4 px-6 border-b border-[#1F1F24]/50 last:border-b-0 hover:bg-[#121217] transition-colors">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bgClass} ${iconClass}`}>
                            <span className="material-symbols-outlined text-[20px]">{icon}</span>
                          </div>
                          <div>
                            <p className="text-sm text-white font-semibold line-clamp-1">{act.title}</p>
                            <p className="text-xs text-zinc-500 font-medium mt-0.5">{formatDateActivity(act.dateStr)}</p>
                          </div>
                        </div>
                        <span className={`text-base font-semibold whitespace-nowrap ml-4 ${amountClass}`}>
                          {act.sign}{formatCurrency(act.amount)}
                        </span>
                      </li>
                    )
                  })
                )}
              </ul>
            </div>
            
          </section>
        </div>
    </AdminPageShell>
  )
}
