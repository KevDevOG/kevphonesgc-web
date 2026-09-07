'use client'

import React, { useState, useRef } from 'react'
import { AdminPageHeader } from '@/components/admin/layout/AdminPageHeader'
import { registerExpense, editExpense, deleteExpense } from '@/actions/expenses'

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

export function ExpensesPage({ categories, expenses, monthlyTotal, monthlyCount, monthLabel, categoryTotals }: Props) {
  return (
    <div className="flex flex-col gap-6 lg:gap-8 w-full max-w-6xl mx-auto pb-12">
      <AdminPageHeader 
        title="Gastos" 
        subtitle="Registra y controla los gastos del negocio." 
      />

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[#7a32d4]/5 border border-[#7a32d4]/30 rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-[#7a32d4]"></div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-[13px] font-bold text-[#d7baff] uppercase tracking-wider">Total del mes</span>
            <span className="text-[12px] font-semibold text-[#d7baff]/70 uppercase tracking-wider">{monthLabel}</span>
          </div>
          <p className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">{formatCurrency(monthlyTotal)}</p>
        </div>

        <div className="bg-[#0B0B0E] border border-[#1F1F24] rounded-2xl p-6 flex flex-col justify-between">
          <span className="text-[13px] font-bold text-zinc-500 uppercase tracking-wider mb-4">Operaciones</span>
          <p className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">{monthlyCount}</p>
          <span className="text-[13px] font-medium text-zinc-500 mt-2">{monthlyCount === 1 ? 'gasto registrado' : 'gastos registrados'} este mes</span>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        <RegisterExpenseForm categories={categories} />
        
        {monthlyCount > 0 ? (
          <section className="bg-[#0B0B0E] border border-[#1F1F24] rounded-2xl p-6 flex flex-col gap-6">
            <h3 className="text-[14px] font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-zinc-500">pie_chart</span>
              Por categoría
            </h3>
            
            <div className="flex flex-col gap-3">
              {Object.entries(categoryTotals)
                .sort((a, b) => b[1] - a[1]) // Sort desc by amount
                .map(([catName, total]) => (
                  <div key={catName} className="flex justify-between items-center py-2 border-b border-[#1F1F24] last:border-0 last:pb-0">
                    <span className="text-[14px] font-medium text-zinc-400">{catName}</span>
                    <span className="text-[15px] font-bold text-white">{formatCurrency(total)}</span>
                  </div>
              ))}
            </div>
          </section>
        ) : (
          <section className="bg-[#0B0B0E] border border-[#1F1F24] rounded-2xl p-6 flex flex-col items-center justify-center text-center gap-3">
            <span className="material-symbols-outlined text-[48px] text-zinc-700">receipt_long</span>
            <p className="text-[14px] font-bold text-zinc-500">No hay gastos en {monthLabel}</p>
          </section>
        )}
      </div>

      <section className="flex flex-col gap-4">
        <h3 className="text-[14px] font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px] text-zinc-500">history</span>
          Historial
        </h3>
        
        {expenses.length === 0 ? (
          <div className="bg-[#0B0B0E] border border-[#1F1F24] rounded-2xl p-8 text-center">
            <p className="text-zinc-500 text-[14px] font-medium">No hay gastos registrados en absoluto.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {expenses.map(expense => (
              <ExpenseItem key={expense.id} expense={expense} categories={categories} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function RegisterExpenseForm({ categories }: { categories: Category[] }) {
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
        if (formRef.current) {
          const amountInput = formRef.current.elements.namedItem('amount') as HTMLInputElement
          const noteInput = formRef.current.elements.namedItem('note') as HTMLInputElement
          if (amountInput) amountInput.value = ''
          if (noteInput) noteInput.value = ''
        }
        setTimeout(() => setSuccess(null), 3000)
      }
    } catch (err) {
      setError('No se pudo registrar el gasto.')
    } finally {
      setIsPending(false)
    }
  }

  const inputClass = "w-full bg-[#121217] text-white border border-[#1F1F24] rounded-xl px-4 py-2.5 text-[14px] focus:outline-none focus:border-[#7a32d4]/50 focus:ring-1 focus:ring-[#7a32d4]/50 transition-all placeholder:text-zinc-500"
  const labelClass = "block text-[13px] font-semibold text-zinc-400 mb-1.5"

  return (
    <section className="bg-[#0B0B0E] border border-[#1F1F24] rounded-2xl p-6 flex flex-col gap-6">
      <h3 className="text-[14px] font-bold text-white uppercase tracking-wider flex items-center gap-2">
        <span className="material-symbols-outlined text-[18px] text-zinc-500">add_circle</span>
        Registrar gasto
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
            <label className={labelClass} htmlFor="category_id">Categoría</label>
            <select 
              id="category_id" 
              name="category_id" 
              required
              className={inputClass}
            >
              <option value="">Selecciona...</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col">
            <label className={labelClass} htmlFor="amount">Importe (€)</label>
            <div className="relative">
              <span className="absolute left-4 top-[11px] text-zinc-500 font-bold">€</span>
              <input 
                type="number" 
                id="amount" 
                name="amount" 
                step="0.01" 
                min="0.01" 
                required
                placeholder="0.00"
                className={`${inputClass} pl-9 font-bold text-white`}
              />
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col">
            <label className={labelClass} htmlFor="expense_date">Fecha</label>
            <input 
              type="date" 
              id="expense_date" 
              name="expense_date" 
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
              placeholder="Ej. Viaje Madrid"
              className={inputClass}
            />
          </div>
        </div>
        
        <button 
          type="submit" 
          disabled={isPending}
          className="w-full px-6 py-3 bg-[#7a32d4]/10 hover:bg-[#7a32d4]/20 border border-[#7a32d4]/30 text-[#d7baff] font-bold text-[14px] rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
        >
          {isPending ? 'Guardando...' : 'Registrar gasto'}
        </button>
      </form>
    </section>
  )
}

function ExpenseItem({ expense, categories }: { expense: Expense, categories: Category[] }) {
  const [isEditing, setIsEditing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsPending(true)
    setError(null)
    
    const formData = new FormData(e.currentTarget)
    formData.append('id', expense.id)
    
    try {
      const result = await editExpense(formData)
      if (result.error) {
        setError(result.error)
      } else {
        setIsEditing(false)
      }
    } catch (err) {
      setError('No se pudo actualizar el gasto.')
    } finally {
      setIsPending(false)
    }
  }

  const handleDeleteSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsPending(true)
    setError(null)
    
    const formData = new FormData()
    formData.append('id', expense.id)
    
    try {
      const result = await deleteExpense(formData)
      if (result.error) {
        setError(result.error)
        setIsPending(false)
      }
    } catch (err) {
      setError('No se pudo eliminar el gasto.')
      setIsPending(false)
    }
  }

  const inputClass = "w-full bg-[#121217] text-white border border-[#1F1F24] rounded-xl px-4 py-2.5 text-[14px] focus:outline-none focus:border-[#7a32d4]/50 focus:ring-1 focus:ring-[#7a32d4]/50 transition-all placeholder:text-zinc-500"
  const labelClass = "block text-[12px] font-semibold text-zinc-400 mb-1.5"

  if (isEditing) {
    return (
      <div className="bg-[#0B0B0E] border border-[#1F1F24] rounded-2xl p-5 flex flex-col gap-4">
        <h4 className="text-[14px] font-bold text-white uppercase tracking-wider border-b border-[#1F1F24] pb-3">Editar gasto</h4>
        
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-[13px] font-bold p-3 rounded-xl">
            {error}
          </div>
        )}
        
        <form onSubmit={handleEditSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col">
              <label className={labelClass} htmlFor={`edit_cat_${expense.id}`}>Categoría</label>
              <select 
                id={`edit_cat_${expense.id}`}
                name="category_id" 
                required
                defaultValue={expense.expense_categories.id}
                className={inputClass}
              >
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col">
              <label className={labelClass} htmlFor={`edit_amount_${expense.id}`}>Importe (€)</label>
              <div className="relative">
                <span className="absolute left-4 top-[11px] text-zinc-500 font-bold">€</span>
                <input 
                  type="number" 
                  id={`edit_amount_${expense.id}`}
                  name="amount" 
                  step="0.01" 
                  min="0.01"
                  required
                  defaultValue={expense.amount}
                  className={`${inputClass} pl-9 font-bold text-white`}
                />
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col">
              <label className={labelClass} htmlFor={`edit_date_${expense.id}`}>Fecha</label>
              <input 
                type="date" 
                id={`edit_date_${expense.id}`}
                name="expense_date" 
                required
                defaultValue={expense.expense_date}
                className={`${inputClass} [color-scheme:dark]`}
              />
            </div>
            <div className="flex flex-col">
              <label className={labelClass} htmlFor={`edit_note_${expense.id}`}>Nota</label>
              <input 
                type="text" 
                id={`edit_note_${expense.id}`}
                name="note" 
                defaultValue={expense.note || ''}
                className={inputClass}
              />
            </div>
          </div>
          
          <div className="flex gap-3 justify-end mt-2 pt-4 border-t border-[#1F1F24]">
            <button 
              type="button" 
              onClick={() => { setIsEditing(false); setError(null); }}
              disabled={isPending}
              className="px-5 py-2.5 bg-[#121217] hover:bg-[#1F1F24] border border-[#1F1F24] text-white rounded-xl text-[14px] font-bold transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={isPending}
              className="px-5 py-2.5 bg-[#7a32d4]/10 hover:bg-[#7a32d4]/20 border border-[#7a32d4]/30 text-[#d7baff] font-bold text-[14px] rounded-xl transition-all disabled:opacity-50"
            >
              {isPending ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    )
  }

  if (isDeleting) {
    return (
      <div className="bg-[#0B0B0E] border border-red-500/30 rounded-2xl p-5 flex flex-col gap-4 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-red-500/50"></div>
        <h4 className="text-[16px] font-bold text-red-400 border-b border-red-500/20 pb-3">¿Eliminar este gasto?</h4>
        <p className="text-[14px] font-medium text-zinc-400">Esta acción eliminará el gasto y recalculará los valores financieros.</p>
        
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-[13px] font-bold p-3 rounded-xl">
            {error}
          </div>
        )}
        
        <form onSubmit={handleDeleteSubmit} className="flex gap-3 justify-end mt-2 pt-4 border-t border-[#1F1F24]">
          <button 
            type="button" 
            onClick={() => { setIsDeleting(false); setError(null); }}
            disabled={isPending}
            className="px-5 py-2.5 bg-[#121217] hover:bg-[#1F1F24] border border-[#1F1F24] text-white rounded-xl text-[14px] font-bold transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button 
            type="submit" 
            disabled={isPending}
            className="px-5 py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 font-bold text-[14px] rounded-xl transition-all disabled:opacity-50"
          >
            {isPending ? 'Eliminando...' : 'Sí, eliminar'}
          </button>
        </form>
      </div>
    )
  }

  const slug = expense.expense_categories.slug
  let icon = 'receipt_long'
  if (slug === 'gasolina') icon = 'local_gas_station'
  if (slug === 'viajes') icon = 'flight'
  if (slug === 'editora') icon = 'history_edu'

  return (
    <div className="group bg-[#0B0B0E] border border-[#1F1F24] hover:border-[#7a32d4]/30 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row gap-4 justify-between transition-colors">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 shrink-0 rounded-xl bg-[#121217] border border-[#1F1F24] flex items-center justify-center text-zinc-500 group-hover:text-[#d7baff] transition-colors">
          <span className="material-symbols-outlined text-[20px]">{icon}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[15px] font-bold text-white leading-tight">{expense.expense_categories.name}</span>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-[13px] font-medium text-zinc-500">
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[14px]">calendar_today</span>
              {formatDate(expense.expense_date)}
            </span>
            {expense.note && (
              <>
                <span className="hidden sm:inline">•</span>
                <span className="italic">"{expense.note}"</span>
              </>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-4 sm:gap-2 mt-2 sm:mt-0 pt-3 sm:pt-0 border-t border-[#1F1F24] sm:border-0 w-full sm:w-auto">
        <span className="text-[18px] font-extrabold text-red-400">
          -{formatCurrency(expense.amount)}
        </span>
        <div className="flex gap-2">
          <button 
            onClick={() => setIsEditing(true)}
            className="w-8 h-8 flex items-center justify-center bg-[#121217] hover:bg-[#1F1F24] border border-[#1F1F24] text-zinc-400 hover:text-white rounded-lg transition-colors"
            title="Editar gasto"
          >
            <span className="material-symbols-outlined text-[16px]">edit</span>
          </button>
          <button 
            onClick={() => setIsDeleting(true)}
            className="w-8 h-8 flex items-center justify-center bg-[#121217] hover:bg-red-500/10 border border-[#1F1F24] hover:border-red-500/30 text-zinc-400 hover:text-red-400 rounded-lg transition-colors"
            title="Eliminar gasto"
          >
            <span className="material-symbols-outlined text-[16px]">delete</span>
          </button>
        </div>
      </div>
    </div>
  )
}
