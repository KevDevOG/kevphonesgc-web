'use client'

import React, { useState, useRef } from 'react'
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
            {expenses.map(expense => (
              <ExpenseItem key={expense.id} expense={expense} categories={categories} />
            ))}
          </div>
        ) : (
          expenses.map(expense => (
            <ExpenseItem key={expense.id} expense={expense} categories={categories} />
          ))
        )}
      </section>
    </div>
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
      setError('No se pudo actualizar el gasto. Inténtalo de nuevo.')
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
      setError('No se pudo eliminar el gasto. Inténtalo de nuevo.')
      setIsPending(false)
    }
  }

  if (isEditing) {
    return (
      <div className="p-4 border-b border-[#1F1F24] bg-[#101014] flex flex-col gap-4 relative">
        <h4 className="text-[14px] font-semibold text-[#F7F7F7] uppercase tracking-wider border-b border-[#1F1F24] pb-2">Editar gasto</h4>
        
        {error && (
          <div className="bg-[#93000a]/20 border border-[#93000a] text-[#ffb4ab] text-[14px] p-3 rounded-lg mb-2">
            {error}
          </div>
        )}
        
        <form onSubmit={handleEditSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-[12px] font-semibold text-[#A8A8B0]" htmlFor={`edit_cat_${expense.id}`}>Categoría</label>
              <select 
                id={`edit_cat_${expense.id}`}
                name="category_id" 
                required
                defaultValue={expense.expense_categories.id}
                className="bg-[#0B0B0D] border border-[#1F1F24] text-[#F7F7F7] text-[16px] rounded-lg px-3 py-2 outline-none focus:border-[#7a32d4] focus:ring-1 focus:ring-[#7a32d4] transition-all"
              >
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[12px] font-semibold text-[#A8A8B0]" htmlFor={`edit_amount_${expense.id}`}>Importe (€)</label>
              <input 
                type="number" 
                id={`edit_amount_${expense.id}`}
                name="amount" 
                step="0.01" 
                min="0.01"
                required
                defaultValue={expense.amount}
                className="bg-[#0B0B0D] border border-[#1F1F24] text-[#F7F7F7] text-[16px] rounded-lg px-3 py-2 outline-none focus:border-[#7a32d4] focus:ring-1 focus:ring-[#7a32d4] transition-all"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-[12px] font-semibold text-[#A8A8B0]" htmlFor={`edit_date_${expense.id}`}>Fecha</label>
              <input 
                type="date" 
                id={`edit_date_${expense.id}`}
                name="expense_date" 
                required
                defaultValue={expense.expense_date}
                className="bg-[#0B0B0D] border border-[#1F1F24] text-[#A8A8B0] text-[16px] rounded-lg px-3 py-2 outline-none focus:border-[#7a32d4] focus:ring-1 focus:ring-[#7a32d4] transition-all"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[12px] font-semibold text-[#A8A8B0]" htmlFor={`edit_note_${expense.id}`}>Nota</label>
              <input 
                type="text" 
                id={`edit_note_${expense.id}`}
                name="note" 
                defaultValue={expense.note || ''}
                className="bg-[#0B0B0D] border border-[#1F1F24] text-[#F7F7F7] text-[16px] rounded-lg px-3 py-2 outline-none focus:border-[#7a32d4] focus:ring-1 focus:ring-[#7a32d4] transition-all"
              />
            </div>
          </div>
          
          <div className="flex gap-2 justify-end mt-2">
            <button 
              type="button" 
              onClick={() => { setIsEditing(false); setError(null); }}
              disabled={isPending}
              className="bg-[#353534] hover:bg-[#4b4454] text-[#F7F7F7] font-semibold text-[14px] px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={isPending}
              className="bg-[#7a32d4] hover:bg-[#6e02d2] text-[#F7F7F7] font-semibold text-[14px] px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
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
      <div className="p-4 border-b border-[#1F1F24] bg-[#93000a]/10 flex flex-col gap-4 relative">
        <h4 className="text-[16px] font-bold text-[#ffb4ab] uppercase tracking-wider border-b border-[#93000a]/30 pb-2">¿Eliminar este gasto?</h4>
        <p className="text-[14px] text-[#A8A8B0]">Esta acción eliminará el gasto y recalculará los valores financieros.</p>
        
        {error && (
          <div className="bg-[#93000a]/20 border border-[#93000a] text-[#ffb4ab] text-[14px] p-3 rounded-lg mb-2">
            {error}
          </div>
        )}
        
        <form onSubmit={handleDeleteSubmit} className="flex gap-2 justify-end mt-2">
          <button 
            type="button" 
            onClick={() => { setIsDeleting(false); setError(null); }}
            disabled={isPending}
            className="bg-[#353534] hover:bg-[#4b4454] text-[#F7F7F7] font-semibold text-[14px] px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button 
            type="submit" 
            disabled={isPending}
            className="bg-[#93000a] hover:bg-[#690005] text-[#ffb4ab] font-bold text-[14px] px-4 py-2 rounded-lg transition-colors disabled:opacity-50 border border-[#ffb4ab]/30"
          >
            {isPending ? 'Eliminando...' : 'Eliminar definitivamente'}
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
    <div className="group flex flex-col py-4 border-b border-[#1F1F24] hover:bg-[#1c1b1b]/50 px-2 -mx-2 rounded-lg transition-colors relative">
      <div className="flex items-center justify-between">
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

      <div className="flex justify-end mt-3 border-t border-[#1F1F24]/50 pt-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="flex gap-3">
          <button 
            onClick={() => setIsEditing(true)}
            className="text-[13px] font-semibold text-[#A8A8B0] hover:text-[#d7baff] transition-colors flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[16px]">edit</span>
            Editar
          </button>
          <button 
            onClick={() => setIsDeleting(true)}
            className="text-[13px] font-semibold text-[#A8A8B0] hover:text-[#ffb4ab] transition-colors flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[16px]">delete</span>
            Eliminar
          </button>
        </div>
      </div>
    </div>
  )
}
