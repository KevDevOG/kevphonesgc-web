'use client'

import { useState } from 'react'
import Link from 'next/link'

export type StatisticsMetric = {
  label: string
  value: number | null
  format: 'currency' | 'count' | 'days'
  context: string
  coverage?: string
  primary?: boolean
  semantic?: boolean
}

export type MonthlyStatistics = { key: string; label: string; revenue: number | null; profit: number | null; units: number | null }
export type SellingModel = { id: string; name: string; units: number; revenue: number | null }
export type MarginModel = { id: string; name: string; units: number; grossMargin: number; averageMargin: number }

export type StatisticsOperations = {
  purchaseSalesSeries: { key: string; label: string; purchases: number | null; sales: number | null }[]
  comparisonEmpty: boolean
  comparisonNotes: string[]
  expenseCategoryBreakdown: { key: string; name: string; amount: number | null; percentage: number | null }[]
  expenseCount: number | null
  expenseNote: string | null
  requestStatusBreakdown: { key: string; label: string; count: number }[]
  requestTotal: number | null
}

type Props = {
  period: string
  periodLabel: string
  periodMetrics: StatisticsMetric[]
  periodNotes: string[]
  stockMetrics: StatisticsMetric[]
  stockNotes: string[]
  monthlySeries: MonthlyStatistics[]
  evolutionNote?: string
  topSellingModels: SellingModel[]
  topMarginModels: MarginModel[]
  rankingCoverage: string
  marginCoverage: string
  rankingsAvailable: boolean
  operations: StatisticsOperations
}

const periods = [
  { value: '1', label: 'Este mes' },
  { value: '3', label: '3 meses' },
  { value: '6', label: '6 meses' },
  { value: '12', label: '12 meses' },
  { value: 'all', label: 'Todo' }
]
const euros = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' })
const integers = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 0 })
const days = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 1 })

function Metric({ metric }: { metric: StatisticsMetric }) {
  const value = metric.value
  const available = value !== null && Number.isFinite(value)
  const tone = metric.semantic && available ? value > 0 ? 'positive' : value < 0 ? 'negative' : 'neutral' : 'neutral'
  const formatted = !available ? 'Sin datos' : metric.format === 'currency' ? euros.format(value) : metric.format === 'days' ? days.format(value) : integers.format(value)

  return (
    <div className="admin-statistics__metric" data-primary={metric.primary || undefined} data-tone={tone}>
      <dt>{metric.label}</dt>
      <dd data-available={available}>{available && metric.semantic && value > 0 ? '+' : ''}{formatted}</dd>
      <p>{metric.context}</p>
      {metric.coverage && <small>{metric.coverage}</small>}
    </div>
  )
}

function signedEuros(value: number) {
  return `${value > 0 ? '+' : ''}${euros.format(value)}`
}

function MonthlyEvolution({ series, note }: { series: MonthlyStatistics[]; note?: string }) {
  const [selected, setSelected] = useState<'revenue' | 'profit' | 'units'>('revenue')
  const options = [{ key: 'revenue', label: 'Ventas' }, { key: 'profit', label: 'Beneficio' }, { key: 'units', label: 'Unidades' }] as const
  const selectedLabel = options.find(option => option.key === selected)!.label
  const values = series.map(month => month[selected]).filter((value): value is number => value !== null)
  const min = Math.min(0, ...values)
  const max = Math.max(0, ...values)
  const range = max - min || 1
  const y = (value: number) => 16 + (max - value) / range * 120
  const baseline = y(0)
  const width = Math.max(280, series.length * 128)
  const format = (value: number | null) => value === null ? 'Sin datos' : selected === 'units' ? integers.format(value) : selected === 'profit' ? signedEuros(value) : euros.format(value)
  const noSales = series.length > 0 && series.every(month => month.units === 0)

  return (
    <section className="admin-statistics__section admin-statistics__evolution" aria-labelledby="statistics-evolution-title">
      <header><h2 id="statistics-evolution-title">Evolución</h2><p>Por mes natural · ventas y beneficio incluyen históricos</p></header>
      <div className="admin-statistics__chart-controls" role="group" aria-label="Indicador de evolución">
        {options.map(option => <button key={option.key} type="button" aria-pressed={selected === option.key} onClick={() => setSelected(option.key)}>{option.label}</button>)}
      </div>
      {noSales && <p className="admin-statistics__context">Sin ventas en este periodo.</p>}
      {!series.length || !values.length ? <p className="admin-statistics__empty">{!series.length ? 'Sin actividad mensual disponible.' : 'Sin datos suficientes para este indicador.'}</p> : (
        <figure aria-label={`${selectedLabel} por mes`}>
          <figcaption className="admin-statistics__context">{selected === 'profit' ? 'Beneficio después de gastos.' : selected === 'revenue' ? 'Ingresos por ventas registradas.' : 'Número de ventas registradas.'} Todos los valores se muestran bajo el gráfico.</figcaption>
          <div className="admin-statistics__chart-scroll" role="region" aria-label="Gráfico y valores mensuales; desplazamiento horizontal" tabIndex={0}>
            <div className="admin-statistics__chart-content" style={{ minWidth: width }}>
              <svg aria-hidden="true" viewBox={`0 0 ${width} 152`} preserveAspectRatio="none" className="admin-statistics__chart">
                <line x1="0" x2={width} y1={baseline} y2={baseline} className="admin-statistics__chart-baseline" />
                {series.map((month, index) => {
                  const value = month[selected]
                  if (value === null) return null
                  const tone = selected === 'profit' ? value > 0 ? 'positive' : value < 0 ? 'negative' : 'neutral' : selected === 'revenue' ? 'brand' : 'neutral'
                  return <rect key={month.key} x={(index + .5) * width / series.length - 14} y={value === 0 ? baseline - 1 : Math.min(y(value), baseline)} width="28" height={Math.max(2, Math.abs(baseline - y(value)))} rx="2" data-tone={tone} />
                })}
              </svg>
              <dl className="admin-statistics__chart-values" aria-label={`${selectedLabel} mensual`} style={{ gridTemplateColumns: `repeat(${series.length}, minmax(0,1fr))` }}>
                {series.map(month => <div key={month.key}><dt>{month.label}</dt><dd data-tone={selected === 'profit' && month.profit !== null ? month.profit > 0 ? 'positive' : month.profit < 0 ? 'negative' : 'neutral' : 'neutral'}>{format(month[selected])}</dd></div>)}
              </dl>
            </div>
          </div>
        </figure>
      )}
      {note && <p className="admin-statistics__context">{note}</p>}
      {series.some(month => month[selected] === null) && <p className="admin-statistics__context">Los meses sin datos suficientes se muestran como «Sin datos».</p>}
    </section>
  )
}

function OperationsOverview({ data }: { data: StatisticsOperations }) {
  const series = data.purchaseSalesSeries
  const max = Math.max(1, ...series.flatMap(month => [month.purchases ?? 0, month.sales ?? 0]))
  const width = Math.max(280, series.length * 160)
  const y = (value: number) => 136 - value / max * 120
  const percentages = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 1 })
  const amount = (value: number | null) => value === null ? 'Sin datos' : euros.format(value)

  return (
    <section className="admin-statistics__section admin-statistics__operations" aria-labelledby="statistics-operations-title">
      <header><h2 id="statistics-operations-title">Operativa</h2></header>
      <section className="admin-statistics__comparison" aria-labelledby="statistics-comparison-title">
        <h3 id="statistics-comparison-title">Compras vs ventas</h3>
        <p className="admin-statistics__context">Cada operación se muestra en su mes de compra o venta. Esta comparación no representa el beneficio.</p>
        <p className="admin-statistics__comparison-legend"><span>Compras</span><span>Ventas</span></p>
        {data.comparisonEmpty ? <p className="admin-statistics__empty">Sin operaciones registradas en este periodo.</p> : !series.length || series.every(month => month.purchases === null && month.sales === null) ? <p className="admin-statistics__empty">Sin datos suficientes para comparar este periodo.</p> : (
          <figure aria-label="Compras y ventas por mes">
            <div className="admin-statistics__chart-scroll" role="region" aria-label="Comparación mensual y valores; desplazamiento horizontal" tabIndex={0}>
              <div className="admin-statistics__chart-content" style={{ minWidth: width }}>
                <svg aria-hidden="true" viewBox={`0 0 ${width} 152`} preserveAspectRatio="none" className="admin-statistics__chart">
                  <line x1="0" x2={width} y1="136" y2="136" className="admin-statistics__chart-baseline" />
                  {series.map((month, index) => {
                    const center = (index + .5) * width / series.length
                    return <g key={month.key}>
                      {month.purchases !== null && <rect x={center - 28} y={month.purchases === 0 ? 135 : y(month.purchases)} width="24" height={Math.max(2,136 - y(month.purchases))} rx="2" />}
                      {month.sales !== null && <rect x={center + 4} y={month.sales === 0 ? 135 : y(month.sales)} width="24" height={Math.max(2,136 - y(month.sales))} rx="2" data-tone="brand" />}
                    </g>
                  })}
                </svg>
                <dl className="admin-statistics__chart-values admin-statistics__comparison-values" style={{ gridTemplateColumns: `repeat(${series.length},minmax(0,1fr))` }}>
                  {series.map(month => <div key={month.key}><dt>{month.label}</dt><dd><span>Compras</span> {amount(month.purchases)}</dd><dd><span>Ventas</span> {amount(month.sales)}</dd></div>)}
                </dl>
              </div>
            </div>
          </figure>
        )}
        {data.comparisonNotes.length > 0 && <ul className="admin-statistics__notes">{data.comparisonNotes.map(note => <li key={note}>{note}</li>)}</ul>}
      </section>

      <div className="admin-statistics__operations-lower">
        <section aria-labelledby="statistics-expenses-title">
          <h3 id="statistics-expenses-title">Gastos por categoría</h3>
          <p className="admin-statistics__context">Gastos del periodo, incluidas las categorías actualmente inactivas.</p>
          {data.expenseCount === null ? <p className="admin-statistics__empty">No se pudieron cargar los gastos del periodo.</p> : data.expenseCount === 0 ? <p className="admin-statistics__empty">Sin gastos registrados en este periodo.</p> : (
            <ol className="admin-statistics__expense-breakdown">
              {data.expenseCategoryBreakdown.map(category => <li key={category.key}>
                <div><span>{category.name}</span><strong>{amount(category.amount)}</strong></div>
                {category.percentage !== null && <>
                  <div className="admin-statistics__expense-track" aria-hidden="true"><span style={{ width: `${category.percentage}%` }} /></div>
                  <p>{percentages.format(category.percentage)} % del gasto del periodo</p>
                </>}
              </li>)}
            </ol>
          )}
          {data.expenseNote && <p className="admin-statistics__context">{data.expenseNote}</p>}
        </section>
        <section aria-labelledby="statistics-requests-title">
          <h3 id="statistics-requests-title">Solicitudes</h3>
          <p className="admin-statistics__context">Solicitudes creadas en el periodo, agrupadas por estado actual.</p>
          {data.requestTotal === null ? <p className="admin-statistics__empty">No se pudieron cargar las solicitudes del periodo.</p> : (
            <>
              <dl className="admin-statistics__request-counts">
                <div className="admin-statistics__request-total"><dt>Total solicitudes</dt><dd>{integers.format(data.requestTotal)}</dd></div>
                {data.requestStatusBreakdown.map(status => <div key={status.key} data-status={status.key}><dt>{status.label}</dt><dd>{integers.format(status.count)}</dd></div>)}
              </dl>
              {data.requestTotal === 0 && <p className="admin-statistics__context">Sin solicitudes creadas en este periodo.</p>}
            </>
          )}
        </section>
      </div>
    </section>
  )
}

export function StatisticsOverview({ period, periodLabel, periodMetrics, periodNotes, stockMetrics, stockNotes, monthlySeries, evolutionNote, topSellingModels, topMarginModels, rankingCoverage, marginCoverage, rankingsAvailable, operations }: Props) {
  return (
    <div className="admin-statistics">
      <header className="admin-statistics__header">
        <h1>Estadísticas</h1>
        <p>Ventas, resultado del periodo e inventario disponible.</p>
      </header>

      <nav className="admin-statistics__periods" aria-label="Periodo de estadísticas">
        {periods.map(option => <Link key={option.value} href={`/admin/estadisticas?period=${option.value}`} aria-current={period === option.value ? 'page' : undefined} scroll={false} prefetch={false}>{option.label}</Link>)}
      </nav>

      <section className="admin-statistics__section" aria-labelledby="statistics-period-title">
        <header><h2 id="statistics-period-title">Resumen del periodo</h2><p>{periodLabel}</p></header>
        <dl className="admin-statistics__period-grid">{periodMetrics.map(metric => <Metric key={metric.label} metric={metric} />)}</dl>
        {periodNotes.length > 0 && <ul className="admin-statistics__notes" aria-label="Cobertura de los datos del periodo">{periodNotes.map(note => <li key={note}>{note}</li>)}</ul>}
      </section>

      <section className="admin-statistics__section admin-statistics__stock" aria-labelledby="statistics-stock-title">
        <header><h2 id="statistics-stock-title">Stock actual</h2><p>Inventario disponible ahora. No depende del periodo seleccionado.</p></header>
        <dl className="admin-statistics__stock-grid">{stockMetrics.map(metric => <Metric key={metric.label} metric={metric} />)}</dl>
        <p className="admin-statistics__context">El valor y el margen potenciales son estimaciones a precio actual, antes de gastos; no son ingresos realizados.</p>
        {stockNotes.length > 0 && <ul className="admin-statistics__notes" aria-label="Cobertura del stock">{stockNotes.map(note => <li key={note}>{note}</li>)}</ul>}
      </section>
      <MonthlyEvolution key={period} series={monthlySeries} note={evolutionNote} />

      <section className="admin-statistics__section admin-statistics__products" aria-labelledby="statistics-products-title">
        <header><h2 id="statistics-products-title">Productos</h2><p>Top 5 del periodo</p></header>
        <p className="admin-statistics__context">{rankingCoverage}</p>
        <div className="admin-statistics__rankings">
          <section aria-labelledby="statistics-selling-title">
            <h3 id="statistics-selling-title">Modelos más vendidos</h3>
            {!rankingsAvailable ? <p className="admin-statistics__empty">No se pudieron cargar los modelos vendidos.</p> : !topSellingModels.length ? <p className="admin-statistics__empty">Sin ventas con modelo identificado.</p> : (
              <ol className="admin-statistics__ranking">
                {topSellingModels.map((model, index) => <li key={model.id}>
                  <span className="admin-statistics__rank-position" aria-hidden="true">{index + 1}</span>
                  <div><strong>{model.name}</strong><p>{integers.format(model.units)} {model.units === 1 ? 'unidad' : 'unidades'}</p></div>
                  <div className="admin-statistics__rank-amount"><span>Ventas</span><strong>{model.revenue === null ? 'Sin datos' : euros.format(model.revenue)}</strong></div>
                </li>)}
              </ol>
            )}
          </section>
          <section aria-labelledby="statistics-margin-title">
            <h3 id="statistics-margin-title">Mayor margen por modelo</h3>
            <p className="admin-statistics__context">{marginCoverage} Margen bruto antes de gastos.</p>
            {!rankingsAvailable ? <p className="admin-statistics__empty">No se pudieron cargar los márgenes por modelo.</p> : !topMarginModels.length ? <p className="admin-statistics__empty">Sin datos suficientes para calcular márgenes.</p> : (
              <ol className="admin-statistics__ranking">
                {topMarginModels.map((model, index) => <li key={model.id}>
                  <span className="admin-statistics__rank-position" aria-hidden="true">{index + 1}</span>
                  <div><strong>{model.name}</strong><p>{integers.format(model.units)} {model.units === 1 ? 'unidad con margen válido' : 'unidades con margen válido'}</p><p>Media: {signedEuros(model.averageMargin)}</p></div>
                  <div className="admin-statistics__rank-amount"><span>Margen bruto</span><strong data-tone={model.grossMargin > 0 ? 'positive' : model.grossMargin < 0 ? 'negative' : 'neutral'}>{signedEuros(model.grossMargin)}</strong></div>
                </li>)}
              </ol>
            )}
          </section>
        </div>
      </section>
      <OperationsOverview data={operations} />
    </div>
  )
}
