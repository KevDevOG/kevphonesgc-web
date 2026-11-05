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

export type DashboardAlert = {
  id: string
  title: string
  count: number
  description: string
  href: string
  actionLabel: string
  priority: 'high' | 'medium'
  icon: string
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
  alerts?: DashboardAlert[]
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR"
  }).format(amount)
}

function financialTone(value: number) {
  return value > 0 ? 'positive' : value < 0 ? 'negative' : 'neutral'
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
  recentActivities,
  alerts = []
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

  const quickActions = [
    { href: '/admin/stock/rapido', label: 'Entrada rápida', icon: 'add_box' },
    { href: '/admin/stock/nuevo', label: 'Nuevo dispositivo', icon: 'add_circle' },
    { href: '/admin/solicitudes', label: 'Solicitudes', icon: 'inbox' },
    { href: '/admin/gastos', label: 'Registrar gasto', icon: 'receipt_long' },
    { href: '/admin/finanzas', label: 'Finanzas', icon: 'account_balance' },
  ]

  return (
    <AdminPageShell>
      <div className="admin-dashboard">
        <AdminPageHeader title="Inicio" subtitle="Resumen operativo de KevPhonesGC" action={<p className="admin-dashboard__period">{monthLabel}</p>} />

        <section aria-label="Indicadores principales" className="admin-dashboard__kpis">
          <div><h3>Stock disponible</h3><strong>{availableStockCount}</strong><p>Dispositivos disponibles</p></div>
          <div><h3>Ventas del mes</h3><strong>{formatCurrency(monthlySalesRevenue)}</strong><p>{monthlySoldCount === 1 ? '1 vendido' : `${monthlySoldCount} vendidos`}</p></div>
          <div className="admin-dashboard__kpi-primary" data-tone={financialTone(monthlyFinalProfit)}><h3>Beneficio del mes</h3><strong data-tone={financialTone(monthlyFinalProfit)}>{monthlyFinalProfit > 0 ? '+' : ''}{formatCurrency(monthlyFinalProfit)}</strong><p>Después de gastos</p></div>
          <div className="admin-dashboard__kpi-primary admin-dashboard__kpi-capital"><h3>Capital total</h3><strong>{formatCurrency(totalCapital)}</strong><p>Efectivo y capital en stock</p></div>
        </section>

        {(availableStockCount === 0 || expectedCash < 0) && (
          <section aria-label="Avisos operativos" className="admin-dashboard__alerts">
            {availableStockCount === 0 && <Link href="/admin/stock/nuevo"><span>No hay stock disponible</span><span>Añadir dispositivo</span></Link>}
            {expectedCash < 0 && <Link href="/admin/finanzas"><span>El efectivo calculado es negativo</span><span>Revisar finanzas</span></Link>}
          </section>
        )}

        <section aria-labelledby="dashboard-attention-title">
          <div className="flex items-center justify-between gap-2 mb-3">
            <h2 id="dashboard-attention-title" className="admin-dashboard__section-title">
              Requiere atención
            </h2>
            {alerts && alerts.length > 0 && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#1f1f24] text-zinc-300 tabular-nums">
                {alerts.length} {alerts.length === 1 ? 'aviso' : 'avisos'}
              </span>
            )}
          </div>

          {alerts && alerts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {alerts.map(alert => (
                <Link
                  key={alert.id}
                  href={alert.href}
                  className={`group flex items-center justify-between p-3.5 rounded-xl border bg-[#0b0b0e] hover:bg-[#121217] transition-all min-h-[56px] gap-3 ${
                    alert.priority === 'high'
                      ? 'border-[#1f1f24] border-l-4 border-l-red-500'
                      : alert.id === 'slow-stock'
                      ? 'border-[#1f1f24] border-l-4 border-l-orange-500'
                      : 'border-[#1f1f24] border-l-4 border-l-amber-500'
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <span
                      aria-hidden="true"
                      className={`material-symbols-outlined text-[20px] flex-shrink-0 mt-0.5 ${
                        alert.priority === 'high'
                          ? 'text-red-400'
                          : alert.id === 'slow-stock'
                          ? 'text-orange-400'
                          : 'text-amber-400'
                      }`}
                    >
                      {alert.icon}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-semibold text-white group-hover:text-[var(--admin-accent-text)] transition-colors">
                          {alert.title}
                        </h3>
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                            alert.priority === 'high'
                              ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                              : alert.id === 'slow-stock'
                              ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}
                        >
                          {alert.count}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 mt-0.5 line-clamp-2">
                        {alert.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-semibold text-[var(--admin-accent-text)] flex-shrink-0 ml-1">
                    <span className="hidden sm:inline">{alert.actionLabel}</span>
                    <span aria-hidden="true" className="material-symbols-outlined text-[16px] group-hover:translate-x-0.5 transition-transform">
                      arrow_forward
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-3 p-3.5 rounded-xl border border-[#1f1f24] bg-[#0b0b0e] text-zinc-400">
              <span aria-hidden="true" className="material-symbols-outlined text-emerald-400 text-[20px] flex-shrink-0">
                check_circle
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-zinc-200">Todo al día</p>
                <p className="text-xs text-zinc-400 mt-0.5">Ahora mismo no hay tareas prioritarias.</p>
              </div>
            </div>
          )}
        </section>

        <section aria-labelledby="dashboard-actions-title">
          <h2 id="dashboard-actions-title" className="admin-dashboard__section-title">Acciones rápidas</h2>
          <div className="admin-dashboard__actions">
            {quickActions.map(action => <Link key={action.href} href={action.href}>
              <span aria-hidden="true" className="material-symbols-outlined">{action.icon}</span><span>{action.label}</span>
            </Link>)}
          </div>
        </section>

        <section aria-labelledby="dashboard-finance-title" className="admin-dashboard__finance">
          <h2 id="dashboard-finance-title" className="admin-dashboard__section-title">Caja y resultado del mes</h2>
          <dl>
            <div className="admin-dashboard__liquidity" data-tone={financialTone(expectedCash)}><dt>Efectivo disponible</dt><dd data-tone={financialTone(expectedCash)}>{expectedCash > 0 ? '+' : ''}{formatCurrency(expectedCash)}</dd></div>
            <div><dt>Capital en stock</dt><dd>{formatCurrency(stockCapital)}</dd></div>
            <div><dt>Beneficio operativo</dt><dd data-tone={financialTone(monthlyOperationProfit)}>{monthlyOperationProfit > 0 ? '+' : ''}{formatCurrency(monthlyOperationProfit)}</dd></div>
            <div><dt>Gastos del mes</dt><dd>{formatCurrency(monthlyExpenses)}</dd></div>
          </dl>
        </section>

        <div className="admin-dashboard__lower">
          <section className="admin-dashboard__panel" aria-labelledby="dashboard-profit-title">
            <h2 id="dashboard-profit-title" className="admin-dashboard__section-title">Evolución del beneficio</h2>
            <p className="admin-dashboard__context">Últimos seis meses · beneficio después de gastos</p>
            <svg className="admin-dashboard__chart" aria-hidden="true" viewBox="-5 0 310 100" preserveAspectRatio="none">
              <path d="M0 10H300M0 50H300M0 90H300" fill="none" stroke="#1f1f24" strokeWidth="1" />
              <polyline points={points} fill="none" stroke="#7a32d4" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {allZero && <p className="admin-dashboard__context">Sin beneficio registrado en este periodo.</p>}
            <dl className="admin-dashboard__chart-values" aria-label="Beneficio por mes">
              {profitEvolution.map((month, i) => <div key={i} data-current={month.isCurrent}>
                <dt>{month.label}{month.isCurrent && <span className="sr-only"> (mes actual)</span>}</dt>
                <dd data-negative={month.profit < 0}>{formatCurrency(month.profit)}</dd>
              </div>)}
            </dl>
          </section>

          <section className="admin-dashboard__panel" aria-labelledby="dashboard-activity-title">
            <div className="admin-dashboard__panel-heading">
              <h2 id="dashboard-activity-title" className="admin-dashboard__section-title">Últimos movimientos</h2>
              <Link href="/admin/actividad">Ver todos</Link>
            </div>
            <ul className="admin-dashboard__activity">
              {recentActivities.length === 0 ? <li className="admin-dashboard__context">No hay movimientos recientes.</li> : recentActivities.map((act, i) => (
                <li key={i}>
                  <div><p>{act.title}</p><time dateTime={act.dateStr}>{formatDateActivity(act.dateStr)}</time></div>
                  <strong data-tone={financialTone(act.amount < 0 ? act.amount : act.sign === '-' ? -act.amount : act.amount)}>{act.sign}{formatCurrency(act.amount)}</strong>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </AdminPageShell>
  )
}
