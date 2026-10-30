'use client'

import { useId, useState } from 'react'
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
  const uiId = useId()
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

  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string, ruleId: string } | null>(null)

  const handleSave = async (ruleType: string, ruleKey: string) => {
    const id = `${ruleType}_${ruleKey}`
    const val = discounts[id] || '0'
    const active = activeStates[id] !== undefined ? activeStates[id] : true
    const discount = parseFloat(val)

    if (isNaN(discount) || discount < 0) {
      setMessage({ type: 'error', text: 'El valor debe ser un número positivo.', ruleId: id })
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
      setMessage({ type: 'success', text: 'Ajuste guardado.', ruleId: id })
      setTimeout(() => setMessage(null), 3000)
    } else {
      setMessage({ type: 'error', text: res.error || 'Error al guardar.', ruleId: id })
    }
    
    setLoadingKey(null)
  }

  return (
    <section className="admin-quote-adjustments" aria-labelledby={`${uiId}-title`}>
      <header className="admin-quote-adjustments__intro">
        <h2 id={`${uiId}-title`}>Ajustes globales</h2>
        <p>Se aplican por defecto a todos los modelos. El intervalo final mantiene 30 € de diferencia.</p>
        <p>Cada regla se guarda por separado.</p>
      </header>

      <div className="admin-quote-adjustments__columns" aria-hidden="true">
        <span>Regla</span><span>Importe</span><span>Estado</span><span>Acción</span>
      </div>
      <div className="admin-quote-adjustments__groups">
        {GROUPS.map(group => (
          <section key={group.type} className="admin-quote-adjustments__group" aria-labelledby={`${uiId}-${group.type}`}>
            <h3 id={`${uiId}-${group.type}`}>{group.title}</h3>
            {group.items.map(item => {
              const id = `${group.type}_${item.key}`
              const val = discounts[id] ?? ''
              const isActive = activeStates[id] !== undefined ? activeStates[id] : true
              const isLoading = loadingKey === id
              const rowMessage = message?.ruleId === id ? message : null
              const amountId = `${uiId}-${id}-amount`
              const descriptionId = `${uiId}-${id}-description`
              const feedbackId = `${uiId}-${id}-feedback`
              const amount = parseFloat(val)
              const effect = amount > 0 ? (item.increment ? 'increment' : 'deduction') : 'neutral'

              return (
                <div key={item.key} className="admin-quote-adjustments__row" data-active={isActive}>
                  <div className="admin-quote-adjustments__label" id={descriptionId}>
                    <h4>{item.label}</h4>
                    {item.ideal && <p>Condición ideal (Normalmente 0 €)</p>}
                    {item.base && <p>Condición base (Normalmente 0 €)</p>}
                    {item.increment && <p>Incremento sobre el precio base</p>}
                  </div>

                  <label className="admin-quote-adjustments__amount" htmlFor={amountId}>
                    <span className="sr-only">Importe de {group.title}: {item.label}, en euros</span>
                    <span className="admin-quote-adjustments__input">
                      <span aria-hidden="true">€</span>
                      <input
                        id={amountId}
                        type="number"
                        step="0.01"
                        min="0"
                        value={val}
                        onChange={(e) => setDiscounts(prev => ({ ...prev, [id]: e.target.value }))}
                        placeholder="0.00"
                        aria-describedby={`${descriptionId} ${uiId}-${id}-effect${rowMessage ? ` ${feedbackId}` : ''}`}
                      />
                    </span>
                    <span id={`${uiId}-${id}-effect`} className="admin-quote-adjustments__effect" data-effect={effect}>
                      {amount === 0 ? 'Sin ajuste' : amount > 0 ? (item.increment ? 'Incremento' : 'Descuento') : 'Importe en euros'}
                    </span>
                  </label>

                  <label className="admin-quote-adjustments__state">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={() => setActiveStates(prev => ({ ...prev, [id]: !isActive }))}
                      aria-label={`Activar ${group.title}: ${item.label}`}
                    />
                    <span>{isActive ? 'Activo' : 'Inactivo'}</span>
                  </label>

                  <button
                    onClick={() => handleSave(group.type, item.key)}
                    disabled={isLoading}
                    aria-busy={isLoading}
                    aria-label={`Guardar ${group.title}: ${item.label}`}
                    className="admin-quote-adjustments__save"
                  >
                    {isLoading ? 'Guardando...' : 'Guardar'}
                  </button>

                  {rowMessage && <p id={feedbackId} role={rowMessage.type === 'error' ? 'alert' : 'status'} className="admin-quote-adjustments__feedback" data-type={rowMessage.type}>
                    {rowMessage.text}
                  </p>}
                </div>
              )
            })}
          </section>
        ))}
      </div>
    </section>
  )
}
