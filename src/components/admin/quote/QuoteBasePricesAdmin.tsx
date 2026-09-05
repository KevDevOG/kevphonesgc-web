'use client'

import { useState } from 'react'
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
    <div className="space-y-8">
      {/* Information Card */}
      <div className="bg-[#9867db]/10 border border-[#9867db]/20 rounded-2xl p-6">
        <h3 className="font-bold text-white text-lg flex items-center mb-2">
          <span className="material-symbols-outlined mr-2 text-[#9867db]">info</span>
          Precio base ideal
        </h3>
        <p className="text-[#A8A8B0] text-sm leading-relaxed">
          Introduce el máximo que pagarías por cada iPhone en condiciones ideales. El cotizador mostrará automáticamente un intervalo de 30 € por debajo. (Ej. 850 € → valoración base de 820–850 €)
        </p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-500/10 border border-green-500/20 text-green-400 p-4 rounded-xl text-sm">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8 pb-12">
        <div className="space-y-6">
          {models.map(model => {
            const modelVariants = variants.filter(v => v.model_id === model.id)
            if (modelVariants.length === 0) return null

            return (
              <div key={model.id} className="bg-[#131313] border border-[#1F1F24] rounded-2xl overflow-hidden">
                <div className="bg-[#0B0B0D] border-b border-[#1F1F24] px-6 py-4">
                  <h4 className="font-bold text-white text-lg">{model.name}</h4>
                </div>
                <div className="divide-y divide-[#1F1F24]">
                  {modelVariants.map(variant => {
                    const key = `${model.id}_${variant.value}`
                    const val = prices[key] || ''
                    return (
                      <div key={variant.id} className="px-6 py-4 flex items-center justify-between hover:bg-[#1A1A1F] transition-colors">
                        <span className="font-medium text-[#A8A8B0] w-1/3 sm:w-1/2">{variant.value}</span>
                        <div className="relative w-2/3 sm:w-1/2 max-w-xs flex justify-end">
                          <input
                            type="number"
                            step="0.01"
                            min="30"
                            value={val}
                            onChange={(e) => handlePriceChange(model.id, variant.value, e.target.value)}
                            placeholder="Sin configurar"
                            className="w-full bg-[#0B0B0D] border border-[#1F1F24] rounded-xl pl-4 pr-10 py-2 text-right text-white focus:outline-none focus:border-[#9867db] transition-colors placeholder:text-left placeholder:text-[#4A4A52] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#4A4A52] pointer-events-none">€</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>

        <div className="flex justify-end pt-4 border-t border-[#1F1F24] sticky bottom-0 bg-[#050505] py-4 z-10">
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-4 rounded-xl font-bold text-[#050505] bg-[#9867db] hover:bg-[#a67ae0] transition-colors shadow-[0_0_15px_rgba(152,103,219,0.3)] disabled:opacity-50 text-lg w-full sm:w-auto"
          >
            {loading ? 'Guardando...' : 'Guardar precios'}
          </button>
        </div>
      </form>
    </div>
  )
}
