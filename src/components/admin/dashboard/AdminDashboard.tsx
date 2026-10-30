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
