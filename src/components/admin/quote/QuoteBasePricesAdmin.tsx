'use client'

import { useId, useState } from 'react'
import { flushSync } from 'react-dom'
import { saveBasePricesBulk } from '@/actions/quote-config'

type DeviceModel = {
  id: string
  name: string
  sort_order: number
}

type DeviceVariant = {
  id: string
  model_id: string
  value: string
  sort_order: number
}

type BasePrice = {
  id: string
  model_id: string
  storage: string
  min_price: number
  max_price: number
  active: boolean
}

interface QuoteBasePricesAdminProps {
  models: DeviceModel[]
  variants: DeviceVariant[]
  basePrices: BasePrice[]
}

export function QuoteBasePricesAdmin({ models, variants, basePrices }: QuoteBasePricesAdminProps) {
  const uiId = useId()
  const [search, setSearch] = useState('')
  const query = search.trim().toLowerCase()
  const matches = (model: DeviceModel, variant: DeviceVariant) =>
    !query || `${model.name} ${variant.value}`.toLowerCase().includes(query)
  const visibleCount = models.reduce((count, model) =>
    count + variants.filter(variant => variant.model_id === model.id && matches(model, variant)).length, 0)
  const hasVariants = models.some(model => variants.some(variant => variant.model_id === model.id))

  // Initialize state with existing prices
  const [prices, setPrices] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {}
    basePrices.forEach(bp => {
      initial[`${bp.model_id}_${bp.storage}`] = bp.max_price.toString()
    })
    return initial
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handlePriceChange = (modelId: string, storage: string, value: string) => {
    setPrices(prev => ({
      ...prev,
      [`${modelId}_${storage}`]: value
    }))
    setSuccess('')
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    const rowsToSave = []

    for (const model of models) {
      const modelVariants = variants.filter(v => v.model_id === model.id)
      for (const variant of modelVariants) {
        const key = `${model.id}_${variant.value}`
        const rawValue = prices[key]
        
        if (rawValue !== undefined && rawValue.trim() !== '') {
          const ideal = parseFloat(rawValue)
          if (isNaN(ideal) || ideal < 30) {
            setError(`El precio ideal para ${model.name} ${variant.value} es inválido (mínimo 30 €).`)
            setLoading(false)
            return
          }
          rowsToSave.push({
            model_id: model.id,
            storage: variant.value,
            ideal_price: ideal
          })
        }
      }
    }

    if (rowsToSave.length === 0) {
      setError('No hay precios válidos para guardar.')
      setLoading(false)
      return
    }

    const res = await saveBasePricesBulk(rowsToSave)

    if (res.success) {
      setSuccess('Precios guardados correctamente.')
    } else {
      setError(res.error || 'Ocurrió un error al guardar.')
    }
    setLoading(false)
  }

  return (
    <section className="admin-quote-prices" aria-labelledby={`${uiId}-title`}>
      <header className="admin-quote-prices__intro">
        <h2 id={`${uiId}-title`}>Precios base</h2>
        <p>Introduce el máximo que pagarías por el dispositivo en condiciones ideales.</p>
        <p id={`${uiId}-explanation`}>El cliente verá automáticamente un intervalo de 30 € por debajo. <span>Ej: 850 € → 820–850 €</span></p>
      </header>

      <div className="admin-quote-prices__toolbar">
        <label className="admin-quote-prices__search">
          <span className="sr-only">Buscar por modelo o almacenamiento</span>
          <span className="material-symbols-outlined" aria-hidden="true">search</span>
          <input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar modelo..." />
        </label>
        {query && <button type="button" className="admin-quote-prices__reset" onClick={() => setSearch('')}>Limpiar búsqueda</button>}
        <span className="admin-quote-prices__count" role="status">{visibleCount} combinaciones</span>
      </div>

      <form onSubmit={handleSubmit} className="admin-quote-prices__form"
        onInvalidCapture={() => {
          // Keep every input mounted for native validation; reveal filtered invalid fields before browser focus.
          if (query) flushSync(() => setSearch(''))
        }}>
        <div className="admin-quote-prices__columns" aria-hidden="true">
          <span>Modelo / almacenamiento</span><span>Precio ideal</span><span>Rango resultante</span>
        </div>
        <div className="admin-quote-prices__models">
          {models.map(model => {
            const modelVariants = variants.filter(v => v.model_id === model.id)
            if (modelVariants.length === 0) return null
            const groupVisible = modelVariants.some(variant => matches(model, variant))

            return (
              <section key={model.id} className="admin-quote-prices__model" hidden={!groupVisible} aria-labelledby={`${uiId}-${model.id}`}>
                <h3 id={`${uiId}-${model.id}`}>{model.name}</h3>
                {modelVariants.map(variant => {
                  const key = `${model.id}_${variant.value}`
                  const valStr = prices[key] || ''
                  const valNum = parseFloat(valStr)
                  const inputId = `${uiId}-${variant.id}-price`
                  const rangeId = `${uiId}-${variant.id}-range`

                  return (
                    <div key={variant.id} className="admin-quote-prices__row" hidden={!matches(model, variant)}>
                      <div className="admin-quote-prices__storage">{variant.value}</div>
                      <label className="admin-quote-prices__price" htmlFor={inputId}>
                        <span className="admin-quote-prices__mobile-label" aria-hidden="true">Precio ideal</span>
                        <span className="sr-only">Precio ideal de {model.name}, {variant.value}, en euros</span>
                        <span className="admin-quote-prices__input">
                          <span aria-hidden="true">€</span>
                          <input
                            id={inputId}
                            type="number"
                            step="0.01"
                            min="30"
                            value={valStr}
                            onChange={(e) => handlePriceChange(model.id, variant.value, e.target.value)}
                            placeholder="0.00"
                            aria-describedby={`${rangeId} ${error ? `${uiId}-error` : `${uiId}-explanation`}`}
                          />
                        </span>
                      </label>
                      <div className="admin-quote-prices__range" id={rangeId}>
                        <span className="admin-quote-prices__mobile-label">Rango resultante</span>
                        {valStr && !isNaN(valNum) && valNum >= 30 ? (
                          <span>{Math.max(0, valNum - 30)}–{valNum} €</span>
                        ) : (
                          <span className="admin-quote-prices__unconfigured">Sin configurar</span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </section>
            )
          })}
        </div>

        {!visibleCount && <div className="admin-quote-prices__empty">
          <p>{!models.length ? 'No hay modelos disponibles.' : !hasVariants ? 'No hay variantes de almacenamiento disponibles.' : 'No hay precios que coincidan con tu búsqueda.'}</p>
          {query && <button type="button" className="admin-quote-prices__reset" onClick={() => setSearch('')}>Limpiar búsqueda</button>}
        </div>}

        <div className="admin-quote-prices__save">
          <div className="admin-quote-prices__feedback">
            {error && <p id={`${uiId}-error`} className="admin-quote-prices__error" role="alert">{error}</p>}
            {success && <p role="status" className="admin-quote-prices__success">{success}</p>}
            <p>El guardado incluye todos los precios, también los que no muestra la búsqueda.</p>
          </div>
          <button type="submit" disabled={loading} aria-busy={loading}>
            {loading ? 'Guardando...' : 'Guardar precios'}
          </button>
        </div>
      </form>
    </section>
  )
}
