'use client'

import React, { useState, useRef, useEffect } from 'react'
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
  return amount.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'
}

function formatDate(dateStr: string) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function FinancePage({ settings, breakdown, reconciliations }: Props) {
  const isConfigured = settings.opening_cash !== null && settings.opening_date !== null

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-1">
        <h1 className="font-headline-lg text-[32px] font-extrabold text-[#F7F7F7] leading-none" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>Finanzas</h1>
        <p className="font-body-md text-[16px] text-[#A8A8B0]">Gestión de caja y conciliaciones.</p>
      </section>

      <BaselineSettingsForm settings={settings} isConfigured={isConfigured} />

      {isConfigured && breakdown && (
        <>
          <ExpectedCashSection breakdown={breakdown} />
          <ReconciliationForm expectedCash={breakdown.expectedCash} />
          <ReconciliationHistory reconciliations={reconciliations} />
        </>
      )}
    </div>
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

  return (
    <section className="bg-[#1c1b1b] border border-[#1F1F24] rounded-xl p-4 shadow-sm relative overflow-hidden">
      <h3 className="text-[14px] font-semibold text-[#F7F7F7] uppercase tracking-wider mb-4 border-b border-[#1F1F24] pb-2">
        {isConfigured ? 'Configuración financiera actual' : 'Configuración financiera inicial'}
      </h3>
      
      {!isConfigured && (
        <p className="text-[#A8A8B0] text-[14px] mb-4">
          Efectivo inicial es el dinero real disponible en el negocio al comienzo de esta fecha. No incluyas el valor del stock.
        </p>
      )}

      {error && (
        <div className="bg-[#93000a]/20 border border-[#93000a] text-[#ffb4ab] text-[14px] p-3 rounded-lg mb-4">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-[#7a32d4]/20 border border-[#7a32d4] text-[#d7baff] text-[14px] p-3 rounded-lg mb-4">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-[12px] font-semibold text-[#A8A8B0]" htmlFor="opening_cash">Efectivo inicial (€)</label>
            <input 
              type="number" 
              id="opening_cash" 
              name="opening_cash" 
              step="0.01" 
              min="0"
              required
              defaultValue={settings.opening_cash ?? ''}
              className="bg-[#0B0B0D] border border-[#1F1F24] text-[#F7F7F7] text-[16px] rounded-lg px-3 py-2 outline-none focus:border-[#7a32d4] focus:ring-1 focus:ring-[#7a32d4] transition-all"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[12px] font-semibold text-[#A8A8B0]" htmlFor="opening_date">Fecha de inicio</label>
            <input 
              type="date" 
              id="opening_date" 
              name="opening_date" 
              required
              defaultValue={settings.opening_date ?? ''}
              className="bg-[#0B0B0D] border border-[#1F1F24] text-[#F7F7F7] text-[16px] rounded-lg px-3 py-2 outline-none focus:border-[#7a32d4] focus:ring-1 focus:ring-[#7a32d4] transition-all"
            />
          </div>
        </div>
        
        <button 
          type="submit" 
          disabled={isPending}
          className="mt-2 w-full bg-[#353534] hover:bg-[#4b4454] text-[#F7F7F7] font-semibold text-[14px] py-3 rounded-lg transition-colors flex justify-center items-center gap-2 disabled:opacity-50"
        >
          {isPending ? 'Guardando...' : (isConfigured ? 'Actualizar configuración' : 'Guardar configuración')}
        </button>
      </form>
    </section>
  )
}

function ExpectedCashSection({ breakdown }: { breakdown: Breakdown }) {
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
    <section className="bg-[#0B0B0D] border border-[#1F1F24] rounded-xl p-4 shadow-sm relative overflow-hidden group">
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#7a32d4] rounded-full blur-[64px] opacity-20 pointer-events-none"></div>
      
      <div className="relative z-10 flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <span className="font-label-md text-[14px] text-[#A8A8B0] uppercase tracking-wider font-semibold">Efectivo esperado</span>
          <div className="font-price-display text-[36px] font-extrabold text-[#B98AFF]" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
            {formatCurrency(breakdown.expectedCash)}
          </div>
        </div>

        <div className="flex flex-col gap-2 pt-4 border-t border-[#1F1F24]">
          {items.map((item, i) => (
            <div key={i} className="flex justify-between items-center">
              <span className="text-[14px] text-[#A8A8B0]">{item.label}</span>
              <span className={`text-[14px] font-mono ${item.ignoreSign ? 'text-[#F7F7F7]' : item.positive ? 'text-[#d7baff]' : 'text-[#ffb4ab]'}`}>
                {item.ignoreSign ? '' : item.showSignAlways && item.value === 0 ? '' : item.positive ? '+' : '-'}
                {formatCurrency(Math.abs(item.value))}
              </span>
            </div>
          ))}
        </div>
      </div>
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
      setError('No se pudo registrar la conciliación. Inténtalo de nuevo.')
    } finally {
      setIsPending(false)
    }
  }

  return (
    <section className="bg-[#1c1b1b] border border-[#1F1F24] rounded-xl p-4 shadow-sm relative overflow-hidden">
      <h3 className="text-[14px] font-semibold text-[#F7F7F7] uppercase tracking-wider mb-4 border-b border-[#1F1F24] pb-2">Conciliar caja</h3>
      
      {error && (
        <div className="bg-[#93000a]/20 border border-[#93000a] text-[#ffb4ab] text-[14px] p-3 rounded-lg mb-4">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-[#7a32d4]/20 border border-[#7a32d4] text-[#d7baff] text-[14px] p-3 rounded-lg mb-4">
          {success}
        </div>
      )}

      <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-[12px] font-semibold text-[#A8A8B0]">Efectivo esperado</label>
            <div className="bg-[#101014] border border-[#1F1F24] text-[#A8A8B0] text-[16px] rounded-lg px-3 py-2">
              {formatCurrency(expectedCash)}
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[12px] font-semibold text-[#A8A8B0]" htmlFor="actual_cash">Efectivo real (€)</label>
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
              className="bg-[#0B0B0D] border border-[#1F1F24] text-[#F7F7F7] text-[16px] rounded-lg px-3 py-2 outline-none focus:border-[#7a32d4] focus:ring-1 focus:ring-[#7a32d4] transition-all"
            />
          </div>
        </div>
        
        {actualCashStr !== '' && !isNaN(actualCash) && (
          <div className="bg-[#101014] p-4 rounded-lg border border-[#1F1F24] flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <span className="text-[14px] text-[#A8A8B0] font-semibold">Diferencia</span>
              <span className={`text-[18px] font-bold ${difference > 0 ? 'text-[#d7baff]' : difference < 0 ? 'text-[#ffb4ab]' : 'text-[#F7F7F7]'}`}>
                {difference > 0 ? '+' : difference < 0 ? '-' : ''}{formatCurrency(Math.abs(difference))}
              </span>
            </div>
            {difference !== 0 && (
              <p className="text-[12px] text-[#A8A8B0] italic">Si existe una diferencia, se registrará automáticamente como un ajuste de capital.</p>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-[12px] font-semibold text-[#A8A8B0]" htmlFor="reconciliation_date">Fecha de conciliación</label>
            <input 
              type="date" 
              id="reconciliation_date" 
              name="reconciliation_date" 
              required
              defaultValue={new Date().toISOString().split('T')[0]}
              className="bg-[#0B0B0D] border border-[#1F1F24] text-[#A8A8B0] text-[16px] rounded-lg px-3 py-2 outline-none focus:border-[#7a32d4] focus:ring-1 focus:ring-[#7a32d4] transition-all"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[12px] font-semibold text-[#A8A8B0]" htmlFor="note">Nota (opcional)</label>
            <input 
              type="text" 
              id="note" 
              name="note" 
              placeholder="Ej. Cierre de semana"
              className="bg-[#0B0B0D] border border-[#1F1F24] text-[#F7F7F7] text-[16px] rounded-lg px-3 py-2 outline-none focus:border-[#7a32d4] focus:ring-1 focus:ring-[#7a32d4] transition-all"
            />
          </div>
        </div>
        
        <button 
          type="submit" 
          disabled={isPending}
          className="mt-2 w-full bg-gradient-to-r from-[#7a32d4] to-[#B98AFF] hover:opacity-90 text-[#131313] font-bold text-[14px] py-3 rounded-lg transition-all flex justify-center items-center gap-2 disabled:opacity-50"
        >
          {isPending ? 'Conciliando...' : 'Registrar conciliación'}
        </button>
      </form>
    </section>
  )
}

function ReconciliationHistory({ reconciliations }: { reconciliations: Reconciliation[] }) {
  return (
    <section className="flex flex-col">
      <h3 className="text-[14px] font-semibold text-[#F7F7F7] uppercase tracking-wider mb-4 border-b border-[#1F1F24] pb-2">Historial de conciliaciones</h3>
      
      {reconciliations.length === 0 ? (
        <p className="text-[#A8A8B0] text-[14px]">No hay conciliaciones registradas.</p>
      ) : (
        <div className="flex flex-col">
          {reconciliations.map(rec => (
            <div key={rec.id} className="flex flex-col gap-2 p-4 border-b border-[#1F1F24] hover:bg-[#101014] transition-colors">
              <div className="flex justify-between items-start">
                <span className="font-semibold text-[16px] text-[#F7F7F7]">{formatDate(rec.reconciliation_date)}</span>
                <span className={`font-extrabold text-[16px] ${rec.difference > 0 ? 'text-[#d7baff]' : rec.difference < 0 ? 'text-[#ffb4ab]' : 'text-[#A8A8B0]'}`} style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
                  {rec.difference > 0 ? '+' : rec.difference < 0 ? '-' : ''}{formatCurrency(Math.abs(rec.difference))}
                </span>
              </div>
              
              <div className="flex justify-between text-[14px] text-[#A8A8B0]">
                <span>Esperado: <span className="font-mono">{formatCurrency(rec.expected_cash)}</span></span>
                <span>Real: <span className="font-mono text-[#F7F7F7]">{formatCurrency(rec.actual_cash)}</span></span>
              </div>
              
              {rec.note && (
                <span className="text-[#A8A8B0] text-sm italic mt-1">{rec.note}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
