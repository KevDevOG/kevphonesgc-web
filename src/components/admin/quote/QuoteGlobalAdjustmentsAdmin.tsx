'use client'

import { useState } from 'react'
import { updateGlobalQuoteAdjustment } from '@/actions/quote-config'

type GlobalRule = {
  id: string
  rule_type: string
  rule_key: string
  min_delta: number
  max_delta: number
  active: boolean
  sort_order: number
}

interface QuoteGlobalAdjustmentsAdminProps {
  rules: GlobalRule[]
}

type GroupItem = {
  key: string
  label: string
  ideal?: boolean
  base?: boolean
  increment?: boolean
}

const GROUPS: { type: string, title: string, items: GroupItem[] }[] = [
  {
    type: 'condition',
    title: 'Estado',
    items: [
      { key: 'sealed', label: 'Precintado', ideal: false, base: false, increment: true },
      { key: 'like_new', label: 'Como nuevo', ideal: false, base: true, increment: false },
      { key: 'good', label: 'Buen estado' },
      { key: 'marked', label: 'Con marcas' }
    ]
  },
  {
    type: 'battery',
    title: 'Batería',
    items: [
      { key: '100', label: '100 %', ideal: true },
      { key: '95_99', label: '95–99 %' },
      { key: '90_94', label: '90–94 %' },
      { key: '85_89', label: '85–89 %' },
      { key: '80_84', label: '80–84 %' },
      { key: 'under_80', label: 'Menos de 80 %' }
    ]
  },
  {
    type: 'box',
    title: 'Caja',
    items: [
      { key: 'no', label: 'Sin caja' }
    ]
  },
  {
    type: 'cable',
    title: 'Cable',
    items: [
      { key: 'no', label: 'Sin cable' }
    ]
  },
  {
    type: 'invoice',
    title: 'Factura',
    items: [
      { key: 'no', label: 'Sin factura' }
    ]
  },
  {
    type: 'warranty',
    title: 'Garantía',
    items: [
      { key: 'no', label: 'Sin garantía oficial vigente' }
    ]
  },
  {
    type: 'cycles',
    title: 'Ciclos',
    items: [
      { key: '0_50', label: '0–50 ciclos', ideal: true },
      { key: '51_150', label: '51–150 ciclos' },
      { key: '151_300', label: '151–300 ciclos' },
      { key: '301_plus', label: '301 ciclos o más' }
    ]
  }
]

export function QuoteGlobalAdjustmentsAdmin({ rules }: QuoteGlobalAdjustmentsAdminProps) {
  const [loadingKey, setLoadingKey] = useState<string | null>(null)
  
  // Local state for each input to allow typing before saving
  const [discounts, setDiscounts] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {}
    rules.forEach(r => {
      initial[`${r.rule_type}_${r.rule_key}`] = Math.abs(r.min_delta).toString()
    })
    return initial
  })

  const [activeStates, setActiveStates] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {}
    rules.forEach(r => {
      initial[`${r.rule_type}_${r.rule_key}`] = r.active
    })
    return initial
  })

  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const handleSave = async (ruleType: string, ruleKey: string) => {
    const id = `${ruleType}_${ruleKey}`
    const val = discounts[id] || '0'
    const active = activeStates[id] !== undefined ? activeStates[id] : true
    const discount = parseFloat(val)

    if (isNaN(discount) || discount < 0) {
      setMessage({ type: 'error', text: 'El valor debe ser un número positivo.' })
      return
    }

    setLoadingKey(id)
    setMessage(null)

    const res = await updateGlobalQuoteAdjustment({
      ruleType,
      ruleKey,
      discount,
      active
    })

    if (res.success) {
      setMessage({ type: 'success', text: 'Ajuste guardado.' })
      setTimeout(() => setMessage(null), 3000)
    } else {
      setMessage({ type: 'error', text: res.error || 'Error al guardar.' })
    }
    
    setLoadingKey(null)
  }

  return (
    <div className="flex flex-col gap-6 mt-8">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold text-white tracking-tight pt-8 border-t border-[#1F1F24]">Ajustes globales</h2>
      </div>

      <div className="bg-[#0B0B0E] border border-[#1F1F24] rounded-xl p-4 flex gap-4 items-start">
        <span className="material-symbols-outlined text-[#d7baff]">info</span>
        <div className="flex flex-col gap-1">
          <p className="text-[13px] text-zinc-400 font-medium">
            Se aplican por defecto a todos los modelos.
          </p>
          <p className="text-[13px] text-zinc-400 font-medium">
            El intervalo final mantiene 30 € de diferencia.
          </p>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-xl text-[13px] font-bold sticky top-[72px] z-40 backdrop-blur-md shadow-lg ${message.type === 'success' ? 'bg-[#7a32d4]/10 border border-[#7a32d4]/20 text-[#d7baff]' : 'bg-red-500/10 border border-red-500/20 text-red-400'}`}>
          {message.text}
        </div>
      )}

      <div className="flex flex-col gap-6">
        {GROUPS.map(group => (
          <div key={group.type} className="bg-[#0B0B0E] border border-[#1F1F24] rounded-xl overflow-hidden flex flex-col">
            <div className="bg-[#121217] border-b border-[#1F1F24] px-4 py-3 flex items-center justify-between">
              <h4 className="font-bold text-[15px] text-white">{group.title}</h4>
            </div>
            
            <div className="flex flex-col divide-y divide-[#1F1F24]">
              {group.items.map(item => {
                const id = `${group.type}_${item.key}`
                const val = discounts[id] ?? ''
                const isActive = activeStates[id] !== undefined ? activeStates[id] : true
                const isLoading = loadingKey === id

                return (
                  <div key={item.key} className="flex flex-col sm:flex-row sm:items-center gap-4 px-4 py-3 hover:bg-[#121217]/50 transition-colors">
                    {/* Label Area */}
                    <div className="flex-1 flex flex-col">
                      <span className="font-semibold text-[14px] text-white">{item.label}</span>
                      {item.ideal && (
                        <span className="text-[11px] font-bold text-[#d7baff] uppercase tracking-wider mt-1">Condición ideal (Normalmente 0 €)</span>
                      )}
                      {item.base && (
                        <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mt-1">Condición base (Normalmente 0 €)</span>
                      )}
                      {item.increment && (
                        <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider mt-1">Incremento sobre el precio base</span>
                      )}
                    </div>
                    
                    {/* Controls Area */}
                    <div className="flex flex-row items-center gap-4 sm:gap-6 justify-between sm:justify-end">
                      {/* Active Toggle */}
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <div className="relative">
                          <input
                            type="checkbox"
                            className="sr-only"
                            checked={isActive}
                            onChange={() => setActiveStates(prev => ({ ...prev, [id]: !isActive }))}
                          />
                          <div className={`block w-10 h-6 rounded-full transition-colors ${isActive ? 'bg-[#7a32d4]' : 'bg-[#1F1F24] group-hover:bg-[#2a2a30]'}`}></div>
                          <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${isActive ? 'translate-x-4' : 'translate-x-0'}`}></div>
                        </div>
                        <span className="text-[13px] font-semibold text-zinc-500 w-12">{isActive ? 'Activo' : 'Inactivo'}</span>
                      </label>

                      {/* Input & Save */}
                      <div className="flex items-center gap-2">
                        <div className="relative w-24">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 font-bold text-[14px]">€</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={val}
                            onChange={(e) => setDiscounts(prev => ({ ...prev, [id]: e.target.value }))}
                            placeholder="0.00"
                            className="w-full bg-[#121217] border border-[#1F1F24] rounded-lg pl-8 pr-3 py-1.5 text-white font-bold text-[14px] focus:outline-none focus:border-[#7a32d4]/50 focus:ring-1 focus:ring-[#7a32d4]/50 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                        </div>

                        <button
                          onClick={() => handleSave(group.type, item.key)}
                          disabled={isLoading}
                          className="px-4 py-1.5 rounded-lg font-bold text-[13px] text-[#d7baff] bg-[#7a32d4]/10 hover:bg-[#7a32d4]/20 border border-[#7a32d4]/30 transition-all disabled:opacity-50"
                        >
                          {isLoading ? '...' : 'Guardar'}
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
