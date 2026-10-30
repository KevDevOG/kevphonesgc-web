'use client'

import React, { useState, useRef, useId } from 'react'
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
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [sort, setSort] = useState('original')
  const query = search.trim().toLowerCase()
  const hasFilters = Boolean(query || category !== 'all' || sort !== 'original')
  const resetFilters = () => { setSearch(''); setCategory('all'); setSort('original') }
  const filteredExpenses = expenses.filter(expense =>
    (category === 'all' || expense.expense_categories.id === category) &&
    (!query || `${expense.expense_categories.name} ${expense.note || ''}`.toLowerCase().includes(query))
  )
  if (sort !== 'original') {
    filteredExpenses.sort((a, b) => {
      if (sort === 'highest') return b.amount - a.amount
      if (sort === 'lowest') return a.amount - b.amount
      // Compare stored date strings without changing their timezone or display semantics.
      const comparison = a.expense_date.localeCompare(b.expense_date)
      return sort === 'oldest' ? comparison : -comparison
    })
  }

  return (
    <div className="admin-expenses">
      <AdminPageHeader title="Gastos" subtitle="Registra y controla los gastos del negocio." />

      <dl className="admin-expenses__summary" aria-label={`Resumen de ${monthLabel}`}>
        <div><dt>Total del mes <span>{monthLabel}</span></dt><dd>{formatCurrency(monthlyTotal)}</dd></div>
        <div><dt>Operaciones</dt><dd>{monthlyCount}<span>{monthlyCount === 1 ? 'gasto registrado' : 'gastos registrados'} este mes</span></dd></div>
      </dl>

      <RegisterExpenseForm categories={categories} />

      <details className="admin-expenses__breakdown">
        <summary>Por categoría <span>{monthLabel}</span><span className="material-symbols-outlined" aria-hidden="true">expand_more</span></summary>
        {monthlyCount > 0 ? (
          <dl>
            {Object.entries(categoryTotals)
              .sort((a, b) => b[1] - a[1])
              .map(([catName, total]) => (
                <div key={catName}><dt>{catName}</dt><dd>{formatCurrency(total)}</dd></div>
              ))}
          </dl>
        ) : <p>No hay gastos en {monthLabel}</p>}
      </details>

      <section className="admin-expenses__history" aria-label="Historial de gastos">
        <header><h2>Historial</h2><span role="status">{filteredExpenses.length} de {expenses.length} gastos</span></header>
        <div className="admin-expenses__toolbar">
          <label className="admin-expenses__search">
            <span className="sr-only">Buscar por categoría o nota</span>
            <span className="material-symbols-outlined" aria-hidden="true">search</span>
            <input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar gasto..." />
          </label>
          <label className="admin-expenses__filter"><span>Categoría</span>
            <select value={category} onChange={e => setCategory(e.target.value)}>
              <option value="all">Todas</option>
              {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
            </select>
          </label>
          <label className="admin-expenses__filter"><span>Orden</span>
            <select value={sort} onChange={e => setSort(e.target.value)}>
              <option value="original">Orden actual</option>
              <option value="newest">Más recientes</option><option value="oldest">Más antiguos</option>
              <option value="highest">Mayor importe</option><option value="lowest">Menor importe</option>
            </select>
          </label>
          {hasFilters && <button type="button" className="admin-expenses__reset" onClick={resetFilters}>Limpiar filtros</button>}
        </div>

        {!filteredExpenses.length ? (
          <div className="admin-expenses__empty">
            <p>{!expenses.length ? 'No hay gastos registrados.' : 'No hay gastos que coincidan con los filtros.'}</p>
            {hasFilters && <button type="button" className="admin-expenses__reset" onClick={resetFilters}>Limpiar filtros</button>}
          </div>
        ) : (
          <table className="admin-expenses__table">
            <caption className="sr-only">Historial de gastos registrados</caption>
            <thead><tr><th scope="col">Gasto / categoría</th><th scope="col">Fecha</th><th scope="col">Nota</th><th scope="col">Importe</th><th scope="col">Acciones</th></tr></thead>
            <tbody>{filteredExpenses.map(expense => <ExpenseItem key={expense.id} expense={expense} categories={categories} />)}</tbody>
          </table>
        )}
      </section>
    </div>
  )
}

function RegisterExpenseForm({ categories }: { categories: Category[] }) {
  const feedbackId = useId()
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
    <section className="admin-expenses__register">
      <h2 className="admin-expenses__section-title">
        <span className="material-symbols-outlined text-[18px] text-zinc-500" aria-hidden="true">add_circle</span>
        Registrar gasto
      </h2>
      
      {error && (
        <div id={feedbackId} role="alert" className="admin-expenses__feedback admin-expenses__feedback--error">
          {error}
        </div>
      )}
      
      {success && (
        <div id={feedbackId} role="status" className="admin-expenses__feedback">
          {success}
        </div>
      )}

      <form ref={formRef} onSubmit={handleSubmit} className="admin-expenses__register-form" aria-describedby={error || success ? feedbackId : undefined}>
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
  const errorId = useId()
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
      <tr className="admin-expenses__editor-row"><td colSpan={5}>
      <div className="admin-expenses__editor">
        <h3 className="admin-expenses__edit-title">Editar gasto</h3>
        
        {error && (
          <div id={errorId} role="alert" className="admin-expenses__feedback admin-expenses__feedback--error">
            {error}
          </div>
        )}
        
        <form onSubmit={handleEditSubmit} aria-describedby={error ? errorId : undefined} className="flex flex-col gap-4">
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
      </td></tr>
    )
  }

  if (isDeleting) {
    return (
      <tr className="admin-expenses__editor-row"><td colSpan={5}>
      <div className="admin-expenses__editor admin-expenses__editor--delete">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-red-500/50"></div>
        <h3 className="admin-expenses__delete-title">¿Eliminar este gasto?</h3>
        <p className="text-[14px] font-medium text-zinc-400">Esta acción eliminará el gasto y recalculará los valores financieros.</p>
        
        {error && (
          <div id={errorId} role="alert" className="admin-expenses__feedback admin-expenses__feedback--error">
            {error}
          </div>
        )}
        
        <form onSubmit={handleDeleteSubmit} aria-describedby={error ? errorId : undefined} className="flex gap-3 justify-end mt-2 pt-4 border-t border-[#1F1F24]">
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
      </td></tr>
    )
  }

  return (
    <tr className="admin-expenses__row">
      <th scope="row" className="admin-expenses__category">{expense.expense_categories.name}</th>
      <td className="admin-expenses__date">{formatDate(expense.expense_date)}</td>
      <td className="admin-expenses__note"><span title={expense.note || undefined}>{expense.note || '—'}</span></td>
      <td className="admin-expenses__amount">-{formatCurrency(expense.amount)}</td>
      <td className="admin-expenses__actions"><div>
        <button type="button" onClick={() => setIsEditing(true)} title="Editar gasto" aria-label={`Editar gasto de ${expense.expense_categories.name}, ${formatDate(expense.expense_date)}`}>
          <span className="material-symbols-outlined" aria-hidden="true">edit</span>
        </button>
        <button type="button" className="admin-expenses__delete" onClick={() => setIsDeleting(true)} title="Eliminar gasto" aria-label={`Eliminar gasto de ${expense.expense_categories.name}, ${formatDate(expense.expense_date)}`}>
          <span className="material-symbols-outlined" aria-hidden="true">delete</span>
        </button>
      </div></td>
    </tr>
  )
}
