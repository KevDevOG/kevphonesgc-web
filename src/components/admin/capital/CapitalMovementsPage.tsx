'use client'

import React, { useState, useRef } from 'react'
import { AdminPageShell } from '@/components/admin/layout/AdminPageShell'
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
      setError('No se pudo registrar el movimiento. Inténtalo de nuevo.')
    } finally {
      setIsPending(false)
    }
  }

  return (
    <AdminPageShell>
      {/* Page Header */}
      <AdminPageHeader 
        title="Movimientos" 
        subtitle="Controla aportaciones, retiradas y ajustes de capital." 
      />

      {/* Summary Section */}
      <section className="bg-[#0B0B0D] border border-[#1F1F24] rounded-xl p-4 relative overflow-hidden group">
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#7a32d4] rounded-full blur-[64px] opacity-20 pointer-events-none group-hover:opacity-30 transition-opacity"></div>
        <div className="flex flex-col gap-4 relative z-10">
          <div className="flex flex-col gap-1">
            <span className="font-label-md text-[14px] text-[#A8A8B0] uppercase tracking-wider font-semibold">Balance de movimientos</span>
            <div className="font-price-display text-[32px] font-extrabold text-[#B98AFF]" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>{formatCurrency(netCapitalMovements)}</div>
            <span className="font-body-md text-[12px] text-[#A8A8B0]">Saldo calculado</span>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2 p-3 bg-[#101014] rounded-lg border border-[#1F1F24] col-span-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] text-[#d7baff]">trending_up</span>
                <span className="font-label-md text-[14px] text-[#A8A8B0] font-semibold">Aportaciones</span>
              </div>
              <span className="font-body-md text-[16px] text-[#F7F7F7]">+{formatCurrency(totalContributions)}</span>
            </div>
            
            <div className="flex flex-col gap-2 p-3 bg-[#101014] rounded-lg border border-[#1F1F24]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] text-[#A8A8B0]">trending_down</span>
                <span className="font-label-md text-[14px] text-[#A8A8B0] font-semibold">Retiradas</span>
              </div>
              <span className="font-body-md text-[16px] text-[#A8A8B0] opacity-80">-{formatCurrency(totalWithdrawals)}</span>
            </div>

            <div className="flex flex-col gap-2 p-3 bg-[#101014] rounded-lg border border-[#1F1F24]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] text-[#A8A8B0]">tune</span>
                <span className="font-label-md text-[14px] text-[#A8A8B0] font-semibold">Ajustes</span>
              </div>
              <span className="font-body-md text-[16px] text-[#A8A8B0]">{totalAdjustments > 0 ? '+' : ''}{formatCurrency(totalAdjustments)}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Form Section */}
      <section className="bg-[#1c1b1b] border border-[#1F1F24] rounded-xl p-4 shadow-sm relative overflow-hidden">
        <h3 className="text-[14px] font-semibold text-[#F7F7F7] uppercase tracking-wider mb-4 border-b border-[#1F1F24] pb-2">Registrar movimiento</h3>
        
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
              <label className="text-[12px] font-semibold text-[#A8A8B0]" htmlFor="movement_type">Tipo de movimiento</label>
              <select 
                id="movement_type" 
                name="movement_type" 
                required
                value={movementType}
                onChange={(e) => setMovementType(e.target.value)}
                className="bg-[#0B0B0D] border border-[#1F1F24] text-[#F7F7F7] text-[16px] rounded-lg px-3 py-2 outline-none focus:border-[#7a32d4] focus:ring-1 focus:ring-[#7a32d4] transition-all"
              >
                <option value="contribution">Aportación</option>
                <option value="withdrawal">Retirada</option>
                <option value="adjustment">Ajuste</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[12px] font-semibold text-[#A8A8B0]" htmlFor="amount">Importe (€)</label>
              <input 
                type="number" 
                id="amount" 
                name="amount" 
                step="0.01" 
                min={movementType === 'adjustment' ? undefined : "0.01"}
                required
                placeholder="0.00"
                className="bg-[#0B0B0D] border border-[#1F1F24] text-[#F7F7F7] text-[16px] rounded-lg px-3 py-2 outline-none focus:border-[#7a32d4] focus:ring-1 focus:ring-[#7a32d4] transition-all"
              />
            </div>
          </div>
          {movementType === 'adjustment' && (
            <p className="text-[#A8A8B0] text-[12px] italic">Usa un importe positivo o negativo para corregir una diferencia de efectivo.</p>
          )}
          
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-[12px] font-semibold text-[#A8A8B0]" htmlFor="movement_date">Fecha</label>
              <input 
                type="date" 
                id="movement_date" 
                name="movement_date" 
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
                placeholder={movementType === 'contribution' ? "Ej. Capital inicial" : movementType === 'withdrawal' ? "Ej. Retirada personal" : "Ej. Ajuste de caja"}
                className="bg-[#0B0B0D] border border-[#1F1F24] text-[#F7F7F7] text-[16px] rounded-lg px-3 py-2 outline-none focus:border-[#7a32d4] focus:ring-1 focus:ring-[#7a32d4] transition-all"
              />
            </div>
          </div>
          
          <button 
            type="submit" 
            disabled={isPending}
            className="mt-2 w-full bg-gradient-to-r from-[#7a32d4] to-[#6e02d2] border border-[#d7baff] text-[#131313] font-bold text-[14px] py-3 rounded-lg hover:brightness-110 transition-all flex justify-center items-center gap-2 disabled:opacity-50 disabled:hover:brightness-100"
          >
            {isPending ? 'Guardando...' : (
              <>
                <span className="material-symbols-outlined text-[18px]">add</span>
                Registrar movimiento
              </>
            )}
          </button>
        </form>
      </section>

      {/* Movement List */}
      <section className="flex flex-col">
        <h3 className="text-[14px] font-semibold text-[#F7F7F7] uppercase tracking-wider mb-4 border-b border-[#1F1F24] pb-2">Historial</h3>
        
        {movements.length === 0 ? (
          <p className="text-[#A8A8B0] text-[14px]">No hay movimientos de capital registrados.</p>
        ) : (
          movements.map(movement => (
            <MovementItem key={movement.id} movement={movement} />
          ))
        )}
      </section>
    </AdminPageShell>
  )
}

function MovementItem({ movement }: { movement: Movement }) {
  const [isEditing, setIsEditing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [editType, setEditType] = useState(movement.movement_type)

  let icon = 'account_balance_wallet'
  let label = 'Desconocido'
  let iconColor = 'text-[#A8A8B0]'
  let amountColor = 'text-[#A8A8B0]'
  let sign = ''
  
  if (movement.movement_type === 'contribution') {
    icon = 'download'
    label = 'APORTACIÓN'
    iconColor = 'text-[#B98AFF]'
    amountColor = 'text-[#B98AFF]'
    sign = '+'
  } else if (movement.movement_type === 'withdrawal') {
    icon = 'upload'
    label = 'RETIRADA'
    iconColor = 'text-[#A8A8B0]'
    amountColor = 'text-[#A8A8B0] opacity-70'
    sign = '-'
  } else if (movement.movement_type === 'adjustment') {
    icon = 'tune'
    label = 'AJUSTE'
    iconColor = 'text-[#A8A8B0]'
    amountColor = 'text-[#A8A8B0] opacity-70'
    sign = movement.amount > 0 ? '+' : movement.amount < 0 ? '-' : ''
  }

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
      setError('No se pudo actualizar el movimiento. Inténtalo de nuevo.')
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
      // If success, it will disappear due to revalidatePath
    } catch (err) {
      setError('No se pudo eliminar el movimiento. Inténtalo de nuevo.')
      setIsPending(false)
    }
  }

  if (isEditing) {
    return (
      <div className="p-4 border-b border-[#1F1F24] bg-[#101014] flex flex-col gap-4 relative">
        <h4 className="text-[14px] font-semibold text-[#F7F7F7] uppercase tracking-wider border-b border-[#1F1F24] pb-2">Editar movimiento</h4>
        
        {error && (
          <div className="bg-[#93000a]/20 border border-[#93000a] text-[#ffb4ab] text-[14px] p-3 rounded-lg mb-2">
            {error}
          </div>
        )}
        
        <form onSubmit={handleEditSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-[12px] font-semibold text-[#A8A8B0]" htmlFor={`edit_type_${movement.id}`}>Tipo de movimiento</label>
              <select 
                id={`edit_type_${movement.id}`}
                name="movement_type" 
                required
                value={editType}
                onChange={(e) => setEditType(e.target.value as any)}
                className="bg-[#0B0B0D] border border-[#1F1F24] text-[#F7F7F7] text-[16px] rounded-lg px-3 py-2 outline-none focus:border-[#7a32d4] focus:ring-1 focus:ring-[#7a32d4] transition-all"
              >
                <option value="contribution">Aportación</option>
                <option value="withdrawal">Retirada</option>
                <option value="adjustment">Ajuste</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[12px] font-semibold text-[#A8A8B0]" htmlFor={`edit_amount_${movement.id}`}>Importe (€)</label>
              <input 
                type="number" 
                id={`edit_amount_${movement.id}`}
                name="amount" 
                step="0.01" 
                min={editType === 'adjustment' ? undefined : "0.01"}
                required
                defaultValue={movement.amount}
                className="bg-[#0B0B0D] border border-[#1F1F24] text-[#F7F7F7] text-[16px] rounded-lg px-3 py-2 outline-none focus:border-[#7a32d4] focus:ring-1 focus:ring-[#7a32d4] transition-all"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-[12px] font-semibold text-[#A8A8B0]" htmlFor={`edit_date_${movement.id}`}>Fecha</label>
              <input 
                type="date" 
                id={`edit_date_${movement.id}`}
                name="movement_date" 
                required
                defaultValue={movement.movement_date}
                className="bg-[#0B0B0D] border border-[#1F1F24] text-[#A8A8B0] text-[16px] rounded-lg px-3 py-2 outline-none focus:border-[#7a32d4] focus:ring-1 focus:ring-[#7a32d4] transition-all"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[12px] font-semibold text-[#A8A8B0]" htmlFor={`edit_note_${movement.id}`}>Nota</label>
              <input 
                type="text" 
                id={`edit_note_${movement.id}`}
                name="note" 
                defaultValue={movement.note || ''}
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
        <h4 className="text-[16px] font-bold text-[#ffb4ab] uppercase tracking-wider border-b border-[#93000a]/30 pb-2">¿Eliminar este movimiento?</h4>
        <p className="text-[14px] text-[#A8A8B0]">Esta acción eliminará el movimiento y recalculará los valores financieros.</p>
        
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

  return (
    <div className="group flex flex-col p-4 border-b border-[#1F1F24] hover:bg-[#101014] transition-colors relative">
      <div className="flex items-start gap-4">
        {/* Hover indicator */}
        <div className={`absolute left-0 top-0 bottom-0 w-1 scale-y-0 group-hover:scale-y-100 transition-transform origin-center ${movement.movement_type === 'contribution' ? 'bg-[#B98AFF]' : 'bg-[#1F1F24]'}`}></div>
        
        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border mt-1 ${movement.movement_type === 'contribution' ? 'bg-[#7a32d4]/20 border-[#7a32d4]/50' : 'bg-[#2a2a2a] border-[#1F1F24]'}`}>
          <span className={`material-symbols-outlined ${iconColor}`}>{icon}</span>
        </div>
        
        <div className="flex-1 flex flex-col gap-1 min-w-0">
          <div className="flex justify-between items-start gap-2">
            <span className={`font-semibold text-[16px] uppercase tracking-wider truncate ${movement.movement_type === 'contribution' ? 'text-[#F7F7F7]' : 'text-[#A8A8B0]'}`} style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>{label}</span>
            <span className={`font-extrabold text-[20px] whitespace-nowrap ${amountColor}`} style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
              {sign}{formatCurrency(Math.abs(movement.amount))}
            </span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-[#A8A8B0] text-sm">{formatDate(movement.movement_date)}</span>
            {movement.note && (
              <span className="text-[#A8A8B0] text-sm italic truncate pl-2">{movement.note}</span>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end mt-3 border-t border-[#1F1F24]/50 pt-2 opacity-0 group-hover:opacity-100 transition-opacity">
        {movement.is_reconciliation_adjustment ? (
          <span className="text-[12px] text-[#A8A8B0] italic bg-[#201f1f] px-2 py-1 rounded">Generado por conciliación</span>
        ) : (
          <div className="flex gap-3">
            <button 
              onClick={() => { setEditType(movement.movement_type); setIsEditing(true); }}
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
        )}
      </div>
    </div>
  )
}
