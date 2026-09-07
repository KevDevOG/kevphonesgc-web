'use client'

import React, { useState, useRef } from 'react'
import { AdminPageHeader } from '@/components/admin/layout/AdminPageHeader'
import { registerCapitalMovement, editCapitalMovement, deleteCapitalMovement } from '@/actions/capital-movements'

type Movement = {
  id: string
  movement_type: 'contribution' | 'withdrawal' | 'adjustment'
  amount: number
  movement_date: string
  note: string | null
  created_at: string
  is_reconciliation_adjustment: boolean
}

type Props = {
  movements: Movement[]
  totalContributions: number
  totalWithdrawals: number
  totalAdjustments: number
  netCapitalMovements: number
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

export function CapitalMovementsPage({ movements, totalContributions, totalWithdrawals, totalAdjustments, netCapitalMovements }: Props) {
  return (
    <div className="flex flex-col gap-6 lg:gap-8 w-full max-w-6xl mx-auto pb-12">
      <AdminPageHeader 
        title="Movimientos" 
        subtitle="Controla aportaciones, retiradas y ajustes de capital." 
      />

      {/* KPIs */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#7a32d4]/5 border border-[#7a32d4]/30 rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-[#7a32d4]"></div>
          <p className="text-[12px] font-bold text-[#d7baff] uppercase tracking-wider mb-2">Balance de movimientos</p>
          <p className="text-3xl font-extrabold text-white tracking-tight">{formatCurrency(netCapitalMovements)}</p>
        </div>

        <div className="bg-[#0B0B0E] border border-[#1F1F24] rounded-2xl p-5 flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-[16px] text-zinc-500">trending_up</span>
            <p className="text-[12px] font-bold text-zinc-500 uppercase tracking-wider">Aportaciones</p>
          </div>
          <p className="text-2xl font-extrabold text-white tracking-tight">+{formatCurrency(totalContributions)}</p>
        </div>

        <div className="bg-[#0B0B0E] border border-[#1F1F24] rounded-2xl p-5 flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-[16px] text-zinc-500">trending_down</span>
            <p className="text-[12px] font-bold text-zinc-500 uppercase tracking-wider">Retiradas</p>
          </div>
          <p className="text-2xl font-extrabold text-zinc-300 tracking-tight">-{formatCurrency(totalWithdrawals)}</p>
        </div>

        <div className="bg-[#0B0B0E] border border-[#1F1F24] rounded-2xl p-5 flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-[16px] text-zinc-500">tune</span>
            <p className="text-[12px] font-bold text-zinc-500 uppercase tracking-wider">Ajustes</p>
          </div>
          <p className="text-2xl font-extrabold text-zinc-300 tracking-tight">{totalAdjustments > 0 ? '+' : ''}{formatCurrency(totalAdjustments)}</p>
        </div>
      </section>

      <p className="text-[13px] font-medium text-zinc-500 text-center sm:text-left px-2">
        Los movimientos de capital afectan al efectivo, pero no al beneficio.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        <div className="lg:col-span-5 flex flex-col gap-6">
          <RegisterMovementForm />
        </div>
        
        <div className="lg:col-span-7 flex flex-col gap-4">
          <h3 className="text-[14px] font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-zinc-500">history</span>
            Historial de movimientos
          </h3>
          
          {movements.length === 0 ? (
            <div className="bg-[#0B0B0E] border border-[#1F1F24] rounded-2xl p-8 text-center">
              <p className="text-zinc-500 text-[14px] font-medium">No hay movimientos de capital registrados.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {movements.map(movement => (
                <MovementItem key={movement.id} movement={movement} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function RegisterMovementForm() {
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [movementType, setMovementType] = useState('contribution')
  
  const formRef = useRef<HTMLFormElement>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsPending(true)
    setError(null)
    setSuccess(null)
    
    const formData = new FormData(e.currentTarget)
    
    try {
      const result = await registerCapitalMovement(formData)
      if (result.error) {
        setError(result.error)
      } else {
        setSuccess('Movimiento registrado con éxito.')
        if (formRef.current) {
          const amountInput = formRef.current.elements.namedItem('amount') as HTMLInputElement
          const noteInput = formRef.current.elements.namedItem('note') as HTMLInputElement
          if (amountInput) amountInput.value = ''
          if (noteInput) noteInput.value = ''
        }
        setTimeout(() => setSuccess(null), 3000)
      }
    } catch (err) {
      setError('No se pudo registrar el movimiento.')
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
        Registrar movimiento
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
        <div className="flex flex-col">
          <label className={labelClass} htmlFor="movement_type">Tipo de movimiento</label>
          <select 
            id="movement_type" 
            name="movement_type" 
            required
            value={movementType}
            onChange={(e) => setMovementType(e.target.value)}
            className={inputClass}
          >
            <option value="contribution">Aportación</option>
            <option value="withdrawal">Retirada</option>
            <option value="adjustment">Ajuste</option>
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
              min={movementType === 'adjustment' ? undefined : "0.01"}
              required
              placeholder="0.00"
              className={`${inputClass} pl-9 font-bold text-white`}
            />
          </div>
          {movementType === 'adjustment' && (
            <p className="text-zinc-500 text-[12px] font-medium mt-1.5">Usa un importe positivo o negativo para corregir una diferencia de efectivo.</p>
          )}
        </div>
        
        <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row gap-4">
          <div className="flex flex-col flex-1">
            <label className={labelClass} htmlFor="movement_date">Fecha</label>
            <input 
              type="date" 
              id="movement_date" 
              name="movement_date" 
              required
              defaultValue={new Date().toISOString().split('T')[0]}
              className={`${inputClass} [color-scheme:dark]`}
            />
          </div>
          <div className="flex flex-col flex-1">
            <label className={labelClass} htmlFor="note">Nota (opcional)</label>
            <input 
              type="text" 
              id="note" 
              name="note" 
              placeholder={movementType === 'contribution' ? "Ej. Capital inicial" : movementType === 'withdrawal' ? "Ej. Retirada personal" : "Ej. Ajuste de caja"}
              className={inputClass}
            />
          </div>
        </div>
        
        <button 
          type="submit" 
          disabled={isPending}
          className="w-full px-6 py-3 bg-[#7a32d4]/10 hover:bg-[#7a32d4]/20 border border-[#7a32d4]/30 text-[#d7baff] font-bold text-[14px] rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
        >
          {isPending ? 'Guardando...' : 'Registrar movimiento'}
        </button>
      </form>
    </section>
  )
}

function MovementItem({ movement }: { movement: Movement }) {
  const [isEditing, setIsEditing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editType, setEditType] = useState(movement.movement_type)

  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsPending(true)
    setError(null)
    
    const formData = new FormData(e.currentTarget)
    formData.append('id', movement.id)
    
    try {
      const result = await editCapitalMovement(formData)
      if (result.error) {
        setError(result.error)
      } else {
        setIsEditing(false)
      }
    } catch (err) {
      setError('No se pudo actualizar el movimiento.')
    } finally {
      setIsPending(false)
    }
  }

  const handleDeleteSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsPending(true)
    setError(null)
    
    const formData = new FormData()
    formData.append('id', movement.id)
    
    try {
      const result = await deleteCapitalMovement(formData)
      if (result.error) {
        setError(result.error)
        setIsPending(false)
      }
    } catch (err) {
      setError('No se pudo eliminar el movimiento.')
      setIsPending(false)
    }
  }

  const inputClass = "w-full bg-[#121217] text-white border border-[#1F1F24] rounded-xl px-4 py-2.5 text-[14px] focus:outline-none focus:border-[#7a32d4]/50 focus:ring-1 focus:ring-[#7a32d4]/50 transition-all placeholder:text-zinc-500"
  const labelClass = "block text-[12px] font-semibold text-zinc-400 mb-1.5"

  if (isEditing) {
    return (
      <div className="bg-[#0B0B0E] border border-[#1F1F24] rounded-2xl p-5 flex flex-col gap-4">
        <h4 className="text-[14px] font-bold text-white uppercase tracking-wider border-b border-[#1F1F24] pb-3">Editar movimiento</h4>
        
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-[13px] font-bold p-3 rounded-xl">
            {error}
          </div>
        )}
        
        <form onSubmit={handleEditSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col">
              <label className={labelClass} htmlFor={`edit_type_${movement.id}`}>Tipo de movimiento</label>
              <select 
                id={`edit_type_${movement.id}`}
                name="movement_type" 
                required
                value={editType}
                onChange={(e) => setEditType(e.target.value as any)}
                className={inputClass}
              >
                <option value="contribution">Aportación</option>
                <option value="withdrawal">Retirada</option>
                <option value="adjustment">Ajuste</option>
              </select>
            </div>
            <div className="flex flex-col">
              <label className={labelClass} htmlFor={`edit_amount_${movement.id}`}>Importe (€)</label>
              <div className="relative">
                <span className="absolute left-4 top-[11px] text-zinc-500 font-bold">€</span>
                <input 
                  type="number" 
                  id={`edit_amount_${movement.id}`}
                  name="amount" 
                  step="0.01" 
                  min={editType === 'adjustment' ? undefined : "0.01"}
                  required
                  defaultValue={movement.amount}
                  className={`${inputClass} pl-9 font-bold text-white`}
                />
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col">
              <label className={labelClass} htmlFor={`edit_date_${movement.id}`}>Fecha</label>
              <input 
                type="date" 
                id={`edit_date_${movement.id}`}
                name="movement_date" 
                required
                defaultValue={movement.movement_date}
                className={`${inputClass} [color-scheme:dark]`}
              />
            </div>
            <div className="flex flex-col">
              <label className={labelClass} htmlFor={`edit_note_${movement.id}`}>Nota</label>
              <input 
                type="text" 
                id={`edit_note_${movement.id}`}
                name="note" 
                defaultValue={movement.note || ''}
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
        <h4 className="text-[16px] font-bold text-red-400 border-b border-red-500/20 pb-3">¿Eliminar este movimiento?</h4>
        <p className="text-[14px] font-medium text-zinc-400">Esta acción eliminará el movimiento y recalculará los valores financieros.</p>
        
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

  let icon = 'account_balance_wallet'
  let label = 'Desconocido'
  let iconColor = 'text-zinc-500'
  let amountColor = 'text-zinc-400'
  let sign = ''
  
  if (movement.movement_type === 'contribution') {
    icon = 'download'
    label = 'Aportación'
    iconColor = 'text-[#d7baff]'
    amountColor = 'text-white'
    sign = '+'
  } else if (movement.movement_type === 'withdrawal') {
    icon = 'upload'
    label = 'Retirada'
    iconColor = 'text-zinc-500'
    amountColor = 'text-zinc-300'
    sign = '-'
  } else if (movement.movement_type === 'adjustment') {
    icon = 'tune'
    label = 'Ajuste'
    iconColor = 'text-zinc-500'
    amountColor = 'text-zinc-300'
    sign = movement.amount > 0 ? '+' : movement.amount < 0 ? '-' : ''
  }

  return (
    <div className="group bg-[#0B0B0E] border border-[#1F1F24] hover:border-[#7a32d4]/30 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row gap-4 justify-between transition-colors">
      <div className="flex items-start gap-4">
        <div className={`w-10 h-10 shrink-0 rounded-xl bg-[#121217] border border-[#1F1F24] flex items-center justify-center transition-colors ${iconColor} group-hover:text-white`}>
          <span className="material-symbols-outlined text-[20px]">{icon}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[15px] font-bold text-white leading-tight">{label}</span>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-[13px] font-medium text-zinc-500">
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[14px]">calendar_today</span>
              {formatDate(movement.movement_date)}
            </span>
            {movement.note && (
              <>
                <span className="hidden sm:inline">•</span>
                <span className="italic">"{movement.note}"</span>
              </>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-4 sm:gap-2 mt-2 sm:mt-0 pt-3 sm:pt-0 border-t border-[#1F1F24] sm:border-0 w-full sm:w-auto">
        <span className={`text-[18px] font-extrabold ${amountColor}`}>
          {sign}{formatCurrency(Math.abs(movement.amount))}
        </span>
        
        {movement.is_reconciliation_adjustment ? (
          <span className="text-[11px] font-bold text-zinc-500 bg-[#121217] px-2 py-1 rounded-lg uppercase tracking-wider">Ajuste de conciliación</span>
        ) : (
          <div className="flex gap-2">
            <button 
              onClick={() => { setEditType(movement.movement_type); setIsEditing(true); }}
              className="w-8 h-8 flex items-center justify-center bg-[#121217] hover:bg-[#1F1F24] border border-[#1F1F24] text-zinc-400 hover:text-white rounded-lg transition-colors"
              title="Editar movimiento"
            >
              <span className="material-symbols-outlined text-[16px]">edit</span>
            </button>
            <button 
              onClick={() => setIsDeleting(true)}
              className="w-8 h-8 flex items-center justify-center bg-[#121217] hover:bg-red-500/10 border border-[#1F1F24] hover:border-red-500/30 text-zinc-400 hover:text-red-400 rounded-lg transition-colors"
              title="Eliminar movimiento"
            >
              <span className="material-symbols-outlined text-[16px]">delete</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
