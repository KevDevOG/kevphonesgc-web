'use client'

import React, { useState, useRef } from 'react'
import { registerExpense } from '@/actions/expenses'

type Category = {
  id: string
  name: string
  slug: string
}

type Expense = {
  id: string
  amount: number
  expense_date: string
  note: string | null
  created_at: string
  expense_categories: Category
}

type Props = {
  categories: Category[]
  expenses: Expense[]
  monthlyTotal: number
  monthlyCount: number
  monthLabel: string
  categoryTotals: Record<string, number>
}

function formatCurrency(amount: number) {
  return amount.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + ' €'
}

function formatDate(dateStr: string) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function ExpensesPage({ categories, expenses, monthlyTotal, monthlyCount, monthLabel, categoryTotals }: Props) {
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  const formRef = useRef<HTMLFormElement>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsPending(true)
    setError(null)
    setSuccess(null)
    
    const formData = new FormData(e.currentTarget)
    
    try {
      const result = await registerExpense(formData)
      if (result.error) {
        setError(result.error)
      } else {
        setSuccess('Gasto registrado con éxito.')
        // Reset amount and note, keep category and date
        if (formRef.current) {
          const amountInput = formRef.current.elements.namedItem('amount') as HTMLInputElement
          const noteInput = formRef.current.elements.namedItem('note') as HTMLInputElement
          if (amountInput) amountInput.value = ''
          if (noteInput) noteInput.value = ''
        }
        setTimeout(() => setSuccess(null), 3000)
      }
    } catch (err) {
      setError('No se pudo registrar el gasto. Inténtalo de nuevo.')
    } finally {
      setIsPending(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <section className="flex flex-col gap-2">
        <h2 className="text-[32px] font-extrabold text-[#F7F7F7] leading-none" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>Gastos</h2>
        <p className="text-[16px] text-[#A8A8B0]">Controla los gastos generales del negocio.</p>
      </section>

      {/* Form Section */}
      <section className="bg-[#0B0B0D] border border-[#1F1F24] rounded-xl p-4 shadow-sm relative overflow-hidden">
        <h3 className="text-[14px] font-semibold text-[#F7F7F7] uppercase tracking-wider mb-4 border-b border-[#1F1F24] pb-2">Registrar gasto</h3>
        
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
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-[12px] font-semibold text-[#A8A8B0]" htmlFor="category_id">Categoría</label>
              <select 
                id="category_id" 
                name="category_id" 
                required
                className="bg-[#1c1b1b] border border-[#1F1F24] text-[#F7F7F7] text-[16px] rounded-lg px-3 py-2 outline-none focus:border-[#7a32d4] focus:ring-1 focus:ring-[#7a32d4] transition-all"
              >
                <option value="">Selecciona...</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[12px] font-semibold text-[#A8A8B0]" htmlFor="amount">Importe (€)</label>
              <input 
                type="number" 
                id="amount" 
                name="amount" 
                step="0.01" 
                min="0.01" 
                required
                placeholder="0.00"
                className="bg-[#1c1b1b] border border-[#1F1F24] text-[#F7F7F7] text-[16px] rounded-lg px-3 py-2 outline-none focus:border-[#7a32d4] focus:ring-1 focus:ring-[#7a32d4] transition-all"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-[12px] font-semibold text-[#A8A8B0]" htmlFor="expense_date">Fecha</label>
              <input 
                type="date" 
                id="expense_date" 
                name="expense_date" 
                required
                defaultValue={new Date().toISOString().split('T')[0]}
                className="bg-[#1c1b1b] border border-[#1F1F24] text-[#A8A8B0] text-[16px] rounded-lg px-3 py-2 outline-none focus:border-[#7a32d4] focus:ring-1 focus:ring-[#7a32d4] transition-all"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[12px] font-semibold text-[#A8A8B0]" htmlFor="note">Nota (opcional)</label>
              <input 
                type="text" 
                id="note" 
                name="note" 
                placeholder="Ej. Viaje Madrid"
                className="bg-[#1c1b1b] border border-[#1F1F24] text-[#F7F7F7] text-[16px] rounded-lg px-3 py-2 outline-none focus:border-[#7a32d4] focus:ring-1 focus:ring-[#7a32d4] transition-all"
              />
            </div>
          </div>
          
          <button 
            type="submit" 
            disabled={isPending}
            className="mt-2 w-full bg-gradient-to-r from-[#7a32d4] to-[#B98AFF] text-[#131313] font-bold text-[14px] py-3 rounded-lg hover:opacity-90 transition-opacity flex justify-center items-center gap-2 disabled:opacity-50"
          >
            {isPending ? 'Guardando...' : (
              <>
                <span className="material-symbols-outlined text-[18px]">add</span>
                Registrar gasto
              </>
            )}
          </button>
        </form>
      </section>

      {/* Summary Section */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between bg-[#1c1b1b] border border-[#1F1F24] rounded-lg px-4 py-3">
          <span className="text-[14px] font-semibold text-[#F7F7F7] uppercase">{monthLabel}</span>
          <span className="material-symbols-outlined text-[#A8A8B0]">calendar_month</span>
        </div>

        <div className="bg-[#0B0B0D] border border-[#1F1F24] p-4 rounded-xl flex flex-col gap-2 shadow-sm relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-32 h-32 bg-[#7a32d4] opacity-10 rounded-full blur-2xl pointer-events-none"></div>
          <h3 className="text-[12px] font-semibold text-[#A8A8B0] uppercase tracking-wider">Total del mes</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-[32px] font-extrabold text-[#B98AFF] leading-none" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
              {formatCurrency(monthlyTotal)}
            </span>
          </div>
          <span className="text-[14px] text-[#A8A8B0]">{monthlyCount} {monthlyCount === 1 ? 'gasto registrado' : 'gastos registrados'}</span>
        </div>
        
        {/* Category Totals */}
        {monthlyCount > 0 && (
          <div className="bg-[#0B0B0D] border border-[#1F1F24] p-4 rounded-xl flex flex-col gap-3">
            <h4 className="text-[12px] font-semibold text-[#A8A8B0] uppercase tracking-wider border-b border-[#1F1F24] pb-2">Por categoría</h4>
            <div className="flex flex-col gap-2">
              {Object.entries(categoryTotals)
                .sort((a, b) => b[1] - a[1]) // Sort desc by amount
                .map(([catName, total]) => (
                  <div key={catName} className="flex justify-between items-center">
                    <span className="text-[14px] text-[#F7F7F7]">{catName}</span>
                    <span className="text-[14px] font-semibold text-[#d7baff]">{formatCurrency(total)}</span>
                  </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Expense List */}
      <section className="flex flex-col">
        <h3 className="text-[14px] font-semibold text-[#F7F7F7] uppercase tracking-wider mb-4 border-b border-[#1F1F24] pb-2">Historial</h3>
        
        {expenses.length === 0 ? (
          <p className="text-[#A8A8B0] text-[14px]">No hay gastos registrados.</p>
        ) : monthlyCount === 0 && expenses.length > 0 ? (
          <div className="flex flex-col gap-4">
            <p className="text-[#A8A8B0] text-[14px] italic">No hay gastos registrados este mes.</p>
            {/* Show other months just for context or keep it hidden if strictly month view. We render all fetched ones. */}
            {expenses.map(expense => (
              <ExpenseItem key={expense.id} expense={expense} />
            ))}
          </div>
        ) : (
          expenses.map(expense => (
            <ExpenseItem key={expense.id} expense={expense} />
          ))
        )}
      </section>
    </div>
  )
}

function ExpenseItem({ expense }: { expense: Expense }) {
  // Simple logic to pick an icon based on slug
  const slug = expense.expense_categories.slug
  let icon = 'receipt_long'
  if (slug === 'gasolina') icon = 'local_gas_station'
  if (slug === 'viajes') icon = 'flight'
  if (slug === 'editora') icon = 'history_edu'

  return (
    <div className="flex items-center justify-between py-4 border-b border-[#1F1F24] group hover:bg-[#1c1b1b]/50 px-2 -mx-2 rounded-lg transition-colors">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-[#1c1b1b] border border-[#1F1F24] flex items-center justify-center text-[#A8A8B0] group-hover:text-[#d7baff] group-hover:border-[#7a32d4] transition-colors">
          <span className="material-symbols-outlined text-[20px]">{icon}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[16px] text-[#F7F7F7] font-semibold">{expense.expense_categories.name}</span>
          <span className="text-[14px] text-[#A8A8B0]">
            {formatDate(expense.expense_date)}
            {expense.note ? ` • ${expense.note}` : ''}
          </span>
        </div>
      </div>
      <span className="text-[16px] font-semibold text-[#ffb4ab] bg-[#93000a]/20 px-2 py-1 rounded border border-[#93000a]">
        -{formatCurrency(expense.amount)}
      </span>
    </div>
  )
}
