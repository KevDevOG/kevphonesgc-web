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
    <div className="flex flex-col gap-6 lg:gap-8 w-full max-w-6xl mx-auto pb-12">
      <AdminPageHeader 
        title="Finanzas" 
        subtitle="Controla el efectivo y concilia el saldo del negocio." 
      />

      {isConfigured && breakdown ? (
        <>
          {/* TOP: primary expected cash overview */}
          <ExpectedCashPrimary expectedCash={breakdown.expectedCash} />

          {/* MIDDLE: 2-column layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
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

function ExpectedCashPrimary({ expectedCash }: { expectedCash: number }) {
  return (
    <section className="bg-[#7a32d4]/5 border border-[#7a32d4]/30 rounded-2xl p-6 md:p-8 flex flex-col justify-center items-center text-center relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1.5 bg-[#7a32d4]"></div>
      <p className="text-[13px] font-bold text-[#d7baff] uppercase tracking-wider mb-2">Efectivo esperado</p>
      <p className="text-5xl md:text-6xl font-extrabold text-white tracking-tight">{formatCurrency(expectedCash)}</p>
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

  return (
    <section className="bg-[#0B0B0E] border border-[#1F1F24] rounded-2xl p-6 flex flex-col gap-6">
      <h3 className="text-[14px] font-bold text-white uppercase tracking-wider flex items-center gap-2">
        <span className="material-symbols-outlined text-[18px] text-zinc-500">list_alt</span>
        Desglose de efectivo
      </h3>
      
      <div className="flex flex-col gap-3">
        {items.map((item, i) => (
          <div key={i} className="flex justify-between items-center py-2 border-b border-[#1F1F24] last:border-0 last:pb-0">
            <span className="text-[14px] font-medium text-zinc-400">{item.label}</span>
            <span className={`text-[15px] font-bold ${item.ignoreSign ? 'text-white' : item.positive ? 'text-[#d7baff]' : 'text-red-400'}`}>
              {item.ignoreSign ? '' : item.showSignAlways && item.value === 0 ? '' : item.positive ? '+' : '-'}
              {formatCurrency(Math.abs(item.value))}
            </span>
          </div>
        ))}
      </div>
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
    <section className="bg-[#0B0B0E] border border-[#1F1F24] rounded-2xl p-6 flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h3 className="text-[14px] font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px] text-zinc-500">settings</span>
          {isConfigured ? 'Configuración financiera actual' : 'Configuración financiera inicial'}
        </h3>
        {!isConfigured && (
          <p className="text-[13px] font-medium text-zinc-500 mt-2">
            Efectivo inicial es el dinero real disponible en el negocio al comienzo de esta fecha. No incluyas el valor del stock.
          </p>
        )}
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-[13px] font-bold p-4 rounded-xl">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-[#7a32d4]/10 border border-[#7a32d4]/20 text-[#d7baff] text-[13px] font-bold p-4 rounded-xl">
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
    <section className="bg-[#0B0B0E] border border-[#1F1F24] rounded-2xl p-6 flex flex-col gap-6">
      <h3 className="text-[14px] font-bold text-white uppercase tracking-wider flex items-center gap-2">
        <span className="material-symbols-outlined text-[18px] text-zinc-500">account_balance_wallet</span>
        Conciliar caja
      </h3>
      
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-[13px] font-bold p-4 rounded-xl">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-[#7a32d4]/10 border border-[#7a32d4]/20 text-[#d7baff] text-[13px] font-bold p-4 rounded-xl">
          {success}
        </div>
      )}

      <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col">
            <label className={labelClass}>Efectivo esperado</label>
            <div className="w-full bg-[#121217] border border-[#1F1F24] text-zinc-400 text-[15px] font-bold rounded-xl px-4 py-2.5">
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
          <div className="bg-[#121217] border border-[#1F1F24] p-4 rounded-xl flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <span className="text-[14px] font-bold text-zinc-400">Diferencia</span>
              <span className={`text-[20px] font-extrabold ${difference > 0 ? 'text-[#d7baff]' : difference < 0 ? 'text-amber-400' : 'text-white'}`}>
                {difference > 0 ? '+' : difference < 0 ? '-' : ''}{formatCurrency(Math.abs(difference))}
              </span>
            </div>
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
          className="w-full px-6 py-3 bg-[#7a32d4]/10 hover:bg-[#7a32d4]/20 border border-[#7a32d4]/30 text-[#d7baff] font-bold text-[14px] rounded-xl transition-all disabled:opacity-50"
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
    <section className="flex flex-col gap-4">
      <h3 className="text-[14px] font-bold text-white uppercase tracking-wider flex items-center gap-2">
        <span className="material-symbols-outlined text-[18px] text-zinc-500">history</span>
        Historial de conciliaciones
      </h3>
      
      <div className="hidden md:block overflow-hidden bg-[#0B0B0E] border border-[#1F1F24] rounded-2xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#1F1F24] bg-[#121217]">
              <th className="p-4 text-[12px] font-semibold text-zinc-400 uppercase tracking-wider">Fecha</th>
              <th className="p-4 text-[12px] font-semibold text-zinc-400 uppercase tracking-wider">Esperado</th>
              <th className="p-4 text-[12px] font-semibold text-zinc-400 uppercase tracking-wider">Real</th>
              <th className="p-4 text-[12px] font-semibold text-zinc-400 uppercase tracking-wider">Diferencia</th>
              <th className="p-4 text-[12px] font-semibold text-zinc-400 uppercase tracking-wider">Nota</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1F1F24]">
            {reconciliations.map(rec => (
              <tr key={rec.id} className="hover:bg-[#121217] transition-colors">
                <td className="p-4 text-[14px] font-medium text-white">{formatDate(rec.reconciliation_date)}</td>
                <td className="p-4 text-[14px] font-mono text-zinc-400">{formatCurrency(rec.expected_cash)}</td>
                <td className="p-4 text-[14px] font-mono text-white">{formatCurrency(rec.actual_cash)}</td>
                <td className={`p-4 text-[14px] font-bold ${rec.difference > 0 ? 'text-[#d7baff]' : rec.difference < 0 ? 'text-amber-400' : 'text-zinc-500'}`}>
                  {rec.difference > 0 ? '+' : rec.difference < 0 ? '-' : ''}{formatCurrency(Math.abs(rec.difference))}
                </td>
                <td className="p-4 text-[13px] font-medium text-zinc-500">{rec.note || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="md:hidden flex flex-col gap-3">
        {reconciliations.map(rec => (
          <div key={rec.id} className="bg-[#0B0B0E] border border-[#1F1F24] rounded-2xl p-4 flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <span className="text-[14px] font-bold text-white">{formatDate(rec.reconciliation_date)}</span>
              <span className={`text-[15px] font-extrabold ${rec.difference > 0 ? 'text-[#d7baff]' : rec.difference < 0 ? 'text-amber-400' : 'text-zinc-500'}`}>
                {rec.difference > 0 ? '+' : rec.difference < 0 ? '-' : ''}{formatCurrency(Math.abs(rec.difference))}
              </span>
            </div>
            <div className="flex justify-between items-center text-[13px]">
              <span className="text-zinc-500 font-medium">Esperado: <span className="text-zinc-400">{formatCurrency(rec.expected_cash)}</span></span>
              <span className="text-zinc-500 font-medium">Real: <span className="text-white font-bold">{formatCurrency(rec.actual_cash)}</span></span>
            </div>
            {rec.note && (
              <div className="text-[12px] font-medium text-zinc-500 pt-2 border-t border-[#1F1F24]">
                {rec.note}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
