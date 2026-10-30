'use client'

import React, { useState, useRef } from 'react'
import { AdminPageHeader } from '@/components/admin/layout/AdminPageHeader'
import { updateFinancialSettings, registerReconciliation } from '@/actions/finance'

type FinancialSettings = {
  opening_cash: number | null
  opening_date: string | null
}

type Breakdown = {
  openingCash: number
  salesTotal: number
  purchasesTotal: number
  expensesTotal: number
  contributionsTotal: number
  withdrawalsTotal: number
  adjustmentsTotal: number
  expectedCash: number
}

type Reconciliation = {
  id: string
  expected_cash: number
  actual_cash: number
  difference: number
  reconciliation_date: string
  note: string | null
  created_at: string
}

type Props = {
  settings: FinancialSettings
  breakdown: Breakdown | null
  reconciliations: Reconciliation[]
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR"
  }).format(amount)
}

function formatDate(dateStr: string) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function FinancePage({ settings, breakdown, reconciliations }: Props) {
  const isConfigured = settings.opening_cash !== null && settings.opening_date !== null

  return (
    <div className="admin-finance">
      <AdminPageHeader 
        title="Finanzas" 
        subtitle="Controla el efectivo y concilia el saldo del negocio." 
      />

      {isConfigured && breakdown ? (
        <>
          {/* TOP: primary expected cash overview */}
          <ExpectedCashPrimary expectedCash={breakdown.expectedCash} openingDate={settings.opening_date} />

          {/* MIDDLE: 2-column layout */}
          <div className="admin-finance__workspace">
            <ExpectedCashBreakdown breakdown={breakdown} />
            <ReconciliationForm expectedCash={breakdown.expectedCash} />
          </div>

          {/* BOTTOM: history and settings */}
          <ReconciliationHistory reconciliations={reconciliations} />
          <BaselineSettingsForm settings={settings} isConfigured={isConfigured} />
        </>
      ) : (
        <BaselineSettingsForm settings={settings} isConfigured={isConfigured} />
      )}
    </div>
  )
}

function ExpectedCashPrimary({ expectedCash, openingDate }: { expectedCash: number; openingDate: string | null }) {
  return (
    <section className="admin-finance__primary" aria-labelledby="finance-cash-title">
      <div>
        <h2 id="finance-cash-title">Efectivo esperado</h2>
        <p className="admin-finance__cash" data-tone={expectedCash > 0 ? 'positive' : expectedCash < 0 ? 'negative' : 'neutral'}>{expectedCash > 0 ? '+' : ''}{formatCurrency(expectedCash)}</p>
      </div>
      {openingDate && <p className="admin-finance__period">Desde el {formatDate(openingDate)}</p>}
    </section>
  )
}

function ExpectedCashBreakdown({ breakdown }: { breakdown: Breakdown }) {
  const items = [
    { label: 'Efectivo inicial', value: breakdown.openingCash, positive: true, ignoreSign: true },
    { label: 'Ventas', value: breakdown.salesTotal, positive: true },
    { label: 'Compras', value: breakdown.purchasesTotal, positive: false },
    { label: 'Gastos', value: breakdown.expensesTotal, positive: false },
    { label: 'Aportaciones', value: breakdown.contributionsTotal, positive: true },
    { label: 'Retiradas', value: breakdown.withdrawalsTotal, positive: false },
    { label: 'Ajustes', value: breakdown.adjustmentsTotal, positive: breakdown.adjustmentsTotal >= 0, showSignAlways: true }
  ]

  const renderValue = (item: typeof items[number]) => <>
    {item.ignoreSign ? '' : item.showSignAlways && item.value === 0 ? '' : item.positive ? '+' : '-'}
    {formatCurrency(Math.abs(item.value))}
  </>

  return (
    <section className="admin-finance__section admin-finance__breakdown">
      <h2>Desglose de efectivo</h2>
      <dl className="admin-finance__flows">
        {items.slice(1, 4).map(item => <div key={item.label}>
          <dt>{item.label}</dt><dd>{renderValue(item)}</dd>
        </div>)}
      </dl>
      <dl className="admin-finance__funding">
        {items.filter((_, index) => index === 0 || index > 3).map(item => <div key={item.label}>
          <dt>{item.label}</dt><dd>{renderValue(item)}</dd>
        </div>)}
      </dl>
    </section>
  )
}

function BaselineSettingsForm({ settings, isConfigured }: { settings: FinancialSettings, isConfigured: boolean }) {
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    if (isConfigured) {
      if (!confirm('Modificar estos datos recalculará el efectivo histórico de la aplicación. ¿Deseas continuar?')) {
        return
      }
    }

    setIsPending(true)
    setError(null)
    setSuccess(null)
    
    const formData = new FormData(e.currentTarget)
    
    try {
      const result = await updateFinancialSettings(formData)
      if (result.error) {
        setError(result.error)
      } else {
        setSuccess('Configuración guardada correctamente.')
        setTimeout(() => setSuccess(null), 3000)
      }
    } catch (err) {
      setError('No se pudo guardar la configuración. Inténtalo de nuevo.')
    } finally {
      setIsPending(false)
    }
  }

  const inputClass = "w-full bg-[#121217] text-white border border-[#1F1F24] rounded-xl px-4 py-2.5 text-[14px] focus:outline-none focus:border-[#7a32d4]/50 focus:ring-1 focus:ring-[#7a32d4]/50 transition-all placeholder:text-zinc-500"
  const labelClass = "block text-[13px] font-semibold text-zinc-400 mb-1.5"

  return (
    <section className="admin-finance__section">
      <div className="flex flex-col gap-1">
        <h2 className="admin-finance__section-title">
          <span aria-hidden="true" className="material-symbols-outlined text-[18px] text-zinc-500">settings</span>
          {isConfigured ? 'Configuración financiera actual' : 'Configuración financiera inicial'}
        </h2>
        {!isConfigured && (
          <p className="text-[13px] font-medium text-zinc-500 mt-2">
            Efectivo inicial es el dinero real disponible en el negocio al comienzo de esta fecha. No incluyas el valor del stock.
          </p>
        )}
      </div>

      {error && (
        <div role="alert" className="admin-finance__error">
          {error}
        </div>
      )}
      
      {success && (
        <div role="status" className="admin-finance__success">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col md:flex-row md:items-end gap-4">
        <div className="flex-1">
          <label className={labelClass} htmlFor="opening_cash">Efectivo inicial (€)</label>
          <div className="relative">
            <span className="absolute left-4 top-[11px] text-zinc-500 font-bold">€</span>
            <input 
              type="number" 
              id="opening_cash" 
              name="opening_cash" 
              step="0.01" 
              min="0"
              required
              defaultValue={settings.opening_cash ?? ''}
              className={`${inputClass} pl-9`}
            />
          </div>
        </div>
        <div className="flex-1">
          <label className={labelClass} htmlFor="opening_date">Fecha de inicio</label>
          <input 
            type="date" 
            id="opening_date" 
            name="opening_date" 
            required
            defaultValue={settings.opening_date ?? ''}
            className={`${inputClass} [color-scheme:dark]`}
          />
        </div>
        <div className="w-full md:w-auto">
          <button 
            type="submit" 
            disabled={isPending}
            className="w-full md:w-auto px-6 py-2.5 bg-[#121217] hover:bg-[#1F1F24] border border-[#1F1F24] text-white rounded-xl text-[14px] font-bold transition-colors disabled:opacity-50"
          >
            {isPending ? 'Guardando...' : (isConfigured ? 'Actualizar' : 'Guardar')}
          </button>
        </div>
      </form>
    </section>
  )
}

function ReconciliationForm({ expectedCash }: { expectedCash: number }) {
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [actualCashStr, setActualCashStr] = useState('')
  
  const formRef = useRef<HTMLFormElement>(null)

  let difference = 0
  const actualCash = parseFloat(actualCashStr)
  if (!isNaN(actualCash)) {
    difference = actualCash - expectedCash
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsPending(true)
    setError(null)
    setSuccess(null)
    
    const formData = new FormData(e.currentTarget)
    
    try {
      const result = await registerReconciliation(formData)
      if (result.error) {
        setError(result.error)
      } else {
        setSuccess('Conciliación registrada con éxito.')
        setActualCashStr('')
        if (formRef.current) {
          const noteInput = formRef.current.elements.namedItem('note') as HTMLInputElement
          if (noteInput) noteInput.value = ''
        }
        setTimeout(() => setSuccess(null), 3000)
      }
    } catch (err) {
      setError('No se pudo registrar la conciliación.')
    } finally {
      setIsPending(false)
    }
  }

  const inputClass = "w-full bg-[#121217] text-white border border-[#1F1F24] rounded-xl px-4 py-2.5 text-[14px] focus:outline-none focus:border-[#7a32d4]/50 focus:ring-1 focus:ring-[#7a32d4]/50 transition-all placeholder:text-zinc-500"
  const labelClass = "block text-[13px] font-semibold text-zinc-400 mb-1.5"

  return (
    <section className="admin-finance__section">
      <h2 className="admin-finance__section-title">
        <span aria-hidden="true" className="material-symbols-outlined text-[18px] text-zinc-500">account_balance_wallet</span>
        Conciliar caja
      </h2>
      
      {error && (
        <div role="alert" className="admin-finance__error">
          {error}
        </div>
      )}
      
      {success && (
        <div role="status" className="admin-finance__success">
          {success}
        </div>
      )}

      <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col">
            <span className={labelClass}>Efectivo esperado</span>
            <div className="admin-finance__expected">
              {formatCurrency(expectedCash)}
            </div>
          </div>
          <div className="flex flex-col">
            <label className={labelClass} htmlFor="actual_cash">Efectivo real (€)</label>
            <div className="relative">
              <span className="absolute left-4 top-[11px] text-zinc-500 font-bold">€</span>
              <input 
                type="number" 
                id="actual_cash" 
                name="actual_cash" 
                step="0.01" 
                min="0"
                required
                value={actualCashStr}
                onChange={(e) => setActualCashStr(e.target.value)}
                placeholder="0.00"
                className={`${inputClass} pl-9 font-bold`}
              />
            </div>
          </div>
        </div>
        
        {actualCashStr !== '' && !isNaN(actualCash) && (
          <div className="admin-finance__difference">
            <div className="flex justify-between items-center">
              <span className="text-[14px] font-bold text-zinc-400">Diferencia</span>
              <span className="admin-finance__difference-value" data-state={difference === 0 ? 'match' : 'mismatch'}>
                {difference > 0 ? '+' : difference < 0 ? '-' : ''}{formatCurrency(Math.abs(difference))}
              </span>
            </div>
            <p className="admin-finance__difference-state">{difference === 0 ? 'La caja coincide.' : difference > 0 ? 'Hay más efectivo del esperado.' : 'Hay menos efectivo del esperado.'}</p>
            {difference !== 0 && (
              <p className="text-[12px] font-medium text-zinc-500 mt-1">Si existe una diferencia, se registrará automáticamente como un ajuste de capital.</p>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col">
            <label className={labelClass} htmlFor="reconciliation_date">Fecha de conciliación</label>
            <input 
              type="date" 
              id="reconciliation_date" 
              name="reconciliation_date" 
              required
              defaultValue={new Date().toISOString().split('T')[0]}
              className={`${inputClass} [color-scheme:dark]`}
            />
          </div>
          <div className="flex flex-col">
            <label className={labelClass} htmlFor="note">Nota (opcional)</label>
            <input 
              type="text" 
              id="note" 
              name="note" 
              placeholder="Ej. Cierre de semana"
              className={inputClass}
            />
          </div>
        </div>
        
        <button 
          type="submit" 
          disabled={isPending}
          className="admin-finance__submit"
        >
          {isPending ? 'Conciliando...' : 'Registrar conciliación'}
        </button>
      </form>
    </section>
  )
}

function ReconciliationHistory({ reconciliations }: { reconciliations: Reconciliation[] }) {
  if (reconciliations.length === 0) return null;

  return (
    <section className="admin-finance__section admin-finance__history">
      <h2>Historial de conciliaciones</h2>
      <div className="admin-finance__history-desktop">
        <table>
          <caption className="sr-only">Efectivo esperado, real y diferencia de cada conciliación</caption>
          <thead><tr><th scope="col">Fecha</th><th scope="col">Esperado</th><th scope="col">Real</th><th scope="col">Diferencia</th><th scope="col">Nota</th></tr></thead>
          <tbody>{reconciliations.map(rec => (
            <tr key={rec.id}>
              <td>{formatDate(rec.reconciliation_date)}</td>
              <td>{formatCurrency(rec.expected_cash)}</td>
              <td>{formatCurrency(rec.actual_cash)}</td>
              <td><span className="admin-finance__difference-value" data-state={rec.difference === 0 ? 'match' : 'mismatch'}>{rec.difference > 0 ? '+' : rec.difference < 0 ? '-' : ''}{formatCurrency(Math.abs(rec.difference))}</span><span className="admin-finance__history-state">{rec.difference === 0 ? 'Cuadrada' : 'Diferencia registrada'}</span></td>
              <td>{rec.note || '-'}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      <ul className="admin-finance__history-mobile" aria-label="Conciliaciones registradas">
        {reconciliations.map(rec => <li key={rec.id}>
          <div className="admin-finance__history-heading"><time dateTime={rec.reconciliation_date}>{formatDate(rec.reconciliation_date)}</time><span className="admin-finance__difference-value" data-state={rec.difference === 0 ? 'match' : 'mismatch'}><span className="sr-only">Diferencia: </span>{rec.difference > 0 ? '+' : rec.difference < 0 ? '-' : ''}{formatCurrency(Math.abs(rec.difference))}</span></div>
          <p className="admin-finance__history-state">{rec.difference === 0 ? 'Cuadrada' : 'Diferencia registrada'}</p>
          <dl><div><dt>Esperado</dt><dd>{formatCurrency(rec.expected_cash)}</dd></div><div><dt>Real</dt><dd>{formatCurrency(rec.actual_cash)}</dd></div></dl>
          {rec.note && <p className="admin-finance__history-note">{rec.note}</p>}
        </li>)}
      </ul>
    </section>
  )
}
