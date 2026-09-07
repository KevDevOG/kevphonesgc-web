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
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Precios base</h2>
        </div>
      </div>

      {/* Information Panel */}
      <div className="bg-[#0B0B0E] border border-[#1F1F24] rounded-xl p-4 flex gap-4 items-start">
        <span className="material-symbols-outlined text-[#d7baff]">info</span>
        <div className="flex flex-col gap-1">
          <h3 className="text-[14px] font-bold text-white">Precio ideal</h3>
          <p className="text-[13px] text-zinc-400 font-medium">
            Introduce el máximo que pagarías por el dispositivo en condiciones ideales.
          </p>
          <p className="text-[13px] text-zinc-400 font-medium">
            El cliente verá automáticamente un intervalo de 30 € por debajo.
          </p>
          <p className="text-[13px] text-zinc-500 font-mono mt-1">
            Ej: 850 € → 820–850 €
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm font-bold">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-[#7a32d4]/10 border border-[#7a32d4]/20 text-[#d7baff] p-4 rounded-xl text-sm font-bold">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-6 relative">
        <div className="flex flex-col gap-4">
          {models.map(model => {
            const modelVariants = variants.filter(v => v.model_id === model.id)
            if (modelVariants.length === 0) return null

            return (
              <div key={model.id} className="bg-[#0B0B0E] border border-[#1F1F24] rounded-xl overflow-hidden flex flex-col">
                <div className="bg-[#121217] border-b border-[#1F1F24] px-4 py-3 flex items-center justify-between">
                  <h4 className="font-bold text-[15px] text-white">{model.name}</h4>
                </div>
                
                <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-2 border-b border-[#1F1F24] bg-[#0B0B0E]">
                  <div className="col-span-3 text-[12px] font-semibold text-zinc-500 uppercase tracking-wider">Capacidad</div>
                  <div className="col-span-4 text-[12px] font-semibold text-zinc-500 uppercase tracking-wider">Precio ideal</div>
                  <div className="col-span-5 text-[12px] font-semibold text-zinc-500 uppercase tracking-wider">Valoración resultante</div>
                </div>

                <div className="flex flex-col divide-y divide-[#1F1F24]">
                  {modelVariants.map(variant => {
                    const key = `${model.id}_${variant.value}`
                    const valStr = prices[key] || ''
                    const valNum = parseFloat(valStr)
                    
                    return (
                      <div key={variant.id} className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 px-4 py-3 items-center hover:bg-[#121217]/50 transition-colors">
                        <div className="md:col-span-3 font-semibold text-white text-[14px]">
                          {variant.value}
                        </div>
                        
                        <div className="md:col-span-4 flex items-center">
                          <div className="relative w-full md:w-32">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 font-bold text-[14px]">€</span>
                            <input
                              type="number"
                              step="0.01"
                              min="30"
                              value={valStr}
                              onChange={(e) => handlePriceChange(model.id, variant.value, e.target.value)}
                              placeholder="0.00"
                              className="w-full bg-[#121217] border border-[#1F1F24] rounded-lg pl-8 pr-3 py-1.5 text-white font-bold text-[14px] focus:outline-none focus:border-[#7a32d4]/50 focus:ring-1 focus:ring-[#7a32d4]/50 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                          </div>
                        </div>

                        <div className="md:col-span-5 flex items-center">
                          {valStr && !isNaN(valNum) && valNum >= 30 ? (
                            <span className="text-[13px] font-mono text-[#d7baff] font-bold">
                              {Math.max(0, valNum - 30)}–{valNum} €
                            </span>
                          ) : (
                            <span className="text-[13px] font-medium text-zinc-600">Sin configurar</span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>

        <div className="sticky bottom-4 z-20 mt-2 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-[#d7baff] bg-[#7a32d4]/10 hover:bg-[#7a32d4]/20 border border-[#7a32d4]/30 transition-all disabled:opacity-50 text-[14px] shadow-lg shadow-black/50 backdrop-blur-md"
          >
            {loading ? 'Guardando...' : 'Guardar precios'}
          </button>
        </div>
      </form>
    </div>
  )
}
