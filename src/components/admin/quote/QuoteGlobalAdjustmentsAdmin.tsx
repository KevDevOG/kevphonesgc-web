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

const GROUPS = [
  {
    type: 'condition',
    title: 'Estado',
    items: [
      { key: 'sealed', label: 'Precintado', ideal: true },
      { key: 'like_new', label: 'Como nuevo', ideal: true },
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
      setMessage({ type: 'error', text: 'El descuento debe ser un número positivo.' })
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
      setMessage({ type: 'success', text: 'Descuento guardado.' })
      setTimeout(() => setMessage(null), 3000)
    } else {
      setMessage({ type: 'error', text: res.error || 'Error al guardar.' })
    }
    
    setLoadingKey(null)
  }

  return (
    <div className="space-y-8 pb-12">
      <div className="pt-8 border-t border-[#1F1F24]">
        <h2 className="font-bold text-4xl tracking-wide mb-2" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>Descuentos globales</h2>
        <p className="text-[#A8A8B0]">Configura cuánto se descuenta del precio base ideal cuando el iPhone no cumple las condiciones ideales.</p>
      </div>

      <div className="bg-[#9867db]/10 border border-[#9867db]/20 rounded-2xl p-6 mb-8">
        <h3 className="font-bold text-white text-lg flex items-center mb-2">
          <span className="material-symbols-outlined mr-2 text-[#9867db]">info</span>
          Información de descuentos
        </h3>
        <p className="text-[#A8A8B0] text-sm leading-relaxed">
          Estos descuentos se aplican por defecto a todos los modelos. El intervalo de valoración siempre mantiene 30 € de diferencia.
        </p>
      </div>

      {message && (
        <div className={`p-4 rounded-xl text-sm ${message.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'} border sticky top-16 z-40 backdrop-blur-md`}>
          {message.text}
        </div>
      )}

      <div className="space-y-8">
        {GROUPS.map(group => (
          <div key={group.type} className="bg-[#131313] border border-[#1F1F24] rounded-2xl overflow-hidden">
            <div className="bg-[#0B0B0D] border-b border-[#1F1F24] px-6 py-4">
              <h4 className="font-bold text-white text-lg">{group.title}</h4>
            </div>
            
            <div className="divide-y divide-[#1F1F24]">
              {group.items.map(item => {
                const id = `${group.type}_${item.key}`
                const val = discounts[id] ?? ''
                const isActive = activeStates[id] !== undefined ? activeStates[id] : true
                const isLoading = loadingKey === id

                return (
                  <div key={item.key} className="p-4 sm:p-6 flex flex-col lg:flex-row lg:items-center gap-4 hover:bg-[#1A1A1F] transition-colors">
                    {/* Label Area */}
                    <div className="flex-1">
                      <span className="font-medium text-white block mb-1">{item.label}</span>
                      {item.ideal && (
                        <span className="text-xs text-[#9867db]">Condición ideal: normalmente 0 €</span>
                      )}
                    </div>
                    
                    {/* Controls Area */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                      
                      {/* Active Toggle */}
                      <div className="flex items-center gap-3 order-2 sm:order-1 sm:w-32">
                        <button
                          type="button"
                          onClick={() => setActiveStates(prev => ({ ...prev, [id]: !isActive }))}
                          className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none ${isActive ? 'bg-[#9867db]' : 'bg-[#1F1F24]'}`}
                        >
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isActive ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                        <span className="text-sm text-[#A8A8B0] min-w-[60px]">{isActive ? 'Activo' : 'Inactivo'}</span>
                      </div>

                      {/* Input */}
                      <div className="relative w-full sm:w-32 order-1 sm:order-2 shrink-0">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={val}
                          onChange={(e) => setDiscounts(prev => ({ ...prev, [id]: e.target.value }))}
                          placeholder="0.00"
                          className="w-full bg-[#0B0B0D] border border-[#1F1F24] rounded-xl pl-4 pr-10 py-2.5 text-right text-white focus:outline-none focus:border-[#9867db] transition-colors placeholder:text-[#4A4A52] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#4A4A52] pointer-events-none">€</span>
                      </div>

                      {/* Save Button */}
                      <button
                        onClick={() => handleSave(group.type, item.key)}
                        disabled={isLoading}
                        className="order-3 shrink-0 px-4 py-2.5 rounded-xl font-bold text-sm text-[#050505] bg-[#9867db] hover:bg-[#a67ae0] transition-colors disabled:opacity-50 text-center"
                      >
                        {isLoading ? '...' : 'Guardar'}
                      </button>

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
