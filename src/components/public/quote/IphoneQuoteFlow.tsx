'use client'

import { useState } from 'react'
import { submitPublicIphoneQuote } from '@/actions/public-quote'
import QuoteResultCard from './QuoteResultCard'
import Link from 'next/link'

type ModelData = {
  id: string
  name: string
  supports_battery_health: boolean
  supports_cycles: boolean
  storages: string[]
  colors: string[]
}

type TargetDeviceData = {
  id: string
  model_name: string
  storage?: string | null
  color?: string | null
  listing_price: number
}

type Props = {
  models: ModelData[]
  quoteMode?: 'sell' | 'trade_in'
  targetDevice?: TargetDeviceData | null
}

export default function IphoneQuoteFlow({ models, quoteMode = 'sell', targetDevice = null }: Props) {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  
  // Step 1: Dispositivo
  const [modelId, setModelId] = useState('')
  const [storage, setStorage] = useState('')
  const [color, setColor] = useState('')

  // Step 2: Estado
  const [deviceCondition, setDeviceCondition] = useState<'sealed'|'like_new'|'good'|'marked'|''>('')
  const [batteryHealth, setBatteryHealth] = useState<string>('')
  const [batteryCycles, setBatteryCycles] = useState<string>('')
  
  const [hasBox, setHasBox] = useState<boolean | null>(null)
  const [hasCable, setHasCable] = useState<boolean | null>(null)
  const [hasInvoice, setHasInvoice] = useState<boolean | null>(null)
  const [originalParts, setOriginalParts] = useState<boolean | null>(null)
  const [fullyFunctional, setFullyFunctional] = useState<boolean | null>(null)
  const [isBlocked, setIsBlocked] = useState<boolean | null>(null)
  
  const [hasWarranty, setHasWarranty] = useState<boolean | null>(null)
  const [officialWarrantyUntil, setOfficialWarrantyUntil] = useState('')

  // Submission state
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [validationError, setValidationError] = useState('')
  
  // Results
  const [quoteResult, setQuoteResult] = useState<any | null>(null)
  const [manualReview, setManualReview] = useState(false)

  const selectedModel = models.find(m => m.id === modelId)

  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setModelId(e.target.value)
    setStorage('')
    setColor('')
    setBatteryHealth('')
    setBatteryCycles('')
  }

  const handleNextToStep2 = () => {
    setValidationError('')
    if (!modelId) {
      setValidationError('Por favor, selecciona un modelo.')
      return
    }
    if (!storage) {
      setValidationError('Por favor, selecciona el almacenamiento.')
      return
    }
    if (selectedModel && selectedModel.colors.length > 0 && !color) {
      setValidationError('Por favor, selecciona el color.')
      return
    }
    setStep(2)
  }

  const handleSubmit = async () => {
    setValidationError('')
    
    if (!deviceCondition) {
      setValidationError('Por favor, selecciona el estado físico.')
      return
    }
    if (selectedModel?.supports_battery_health) {
      const bh = parseInt(batteryHealth, 10)
      if (isNaN(bh) || bh < 0 || bh > 100) {
        setValidationError('Por favor, introduce una salud de batería válida (0-100).')
        return
      }
    }
    if (selectedModel?.supports_cycles && batteryCycles !== '') {
      const cy = parseInt(batteryCycles, 10)
      if (isNaN(cy) || cy < 0) {
        setValidationError('Por favor, introduce ciclos válidos (o déjalo vacío).')
        return
      }
    }
    if (hasBox === null || hasCable === null || hasInvoice === null || originalParts === null || fullyFunctional === null || isBlocked === null || hasWarranty === null) {
      setValidationError('Por favor, responde a todas las preguntas de Sí/No.')
      return
    }
    if (hasWarranty && !officialWarrantyUntil) {
      setValidationError('Por favor, introduce la fecha de fin de garantía.')
      return
    }

    setLoading(true)
    setErrorMsg('')

    const payload = {
      quoteMode: quoteMode,
      modelId,
      storage,
      color: color || null,
      deviceCondition,
      batteryHealth: selectedModel?.supports_battery_health ? parseInt(batteryHealth, 10) : null,
      batteryCycles: (selectedModel?.supports_cycles && batteryCycles !== '') ? parseInt(batteryCycles, 10) : null,
      hasBox,
      hasCable,
      hasInvoice,
      originalParts,
      fullyFunctional,
      blocked: isBlocked,
      officialWarrantyUntil: hasWarranty ? officialWarrantyUntil : null,
      source: 'direct' as const,
      targetDeviceId: targetDevice?.id || null
    }

    try {
      const res = await submitPublicIphoneQuote(payload)
      
      if (!res.ok) {
        if (res.code === 'manual_review_required') {
          setManualReview(true)
          setStep(3)
        } else if (res.code === 'not_configured') {
          setErrorMsg('No podemos valorar esta configuración automáticamente ahora mismo.')
        } else {
          setErrorMsg('No hemos podido calcular la valoración. Inténtalo de nuevo.')
        }
      } else {
        setQuoteResult(res)
        setStep(3)
      }
    } catch (e) {
      setErrorMsg('No hemos podido calcular la valoración. Inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const resetFlow = () => {
    setStep(1)
    setModelId('')
    setStorage('')
    setColor('')
    setDeviceCondition('')
    setBatteryHealth('')
    setBatteryCycles('')
    setHasBox(null)
    setHasCable(null)
    setHasInvoice(null)
    setOriginalParts(null)
    setFullyFunctional(null)
    setIsBlocked(null)
    setHasWarranty(null)
    setOfficialWarrantyUntil('')
    setQuoteResult(null)
    setManualReview(false)
    setErrorMsg('')
    setValidationError('')
  }

  // Common styles
  const btnClass = (active: boolean | null, target: boolean) => 
    `flex-1 py-3 px-4 rounded-xl border font-medium transition-colors ${
      active === target 
        ? 'bg-purple-600/20 border-purple-500 text-purple-300' 
        : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200'
    }`

  return (
    <div className="w-full">
      {quoteMode === 'trade_in' && targetDevice && (
        <div className="mb-8 p-6 bg-zinc-900 border border-[#9867db]/30 rounded-2xl flex flex-col items-center shadow-lg text-center">
          <h2 className="text-sm uppercase tracking-widest text-[#6E6E78] font-bold mb-2">Tu parte de pago para</h2>
          <p className="text-xl font-medium text-white mb-1">
            {targetDevice.model_name}
            {(targetDevice.storage || targetDevice.color) && (
              <span className="text-zinc-400">
                {' · '}
                {[targetDevice.storage, targetDevice.color].filter(Boolean).join(' / ')}
              </span>
            )}
          </p>
          <p className="text-2xl font-bold text-[#9867db] mb-4">{targetDevice.listing_price} €</p>
          <p className="text-sm text-zinc-400">
            Tasaremos tu iPhone y calcularemos la diferencia estimada.
          </p>
        </div>
      )}

      {/* Progress */}
      <div className="flex items-center justify-between mb-8 text-sm">
        <div className={`flex flex-col items-center flex-1 ${step >= 1 ? 'text-purple-400' : 'text-zinc-600'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${step >= 1 ? 'bg-purple-600/20 border border-purple-500' : 'bg-zinc-800 border border-zinc-700'}`}>1</div>
          <span>Dispositivo</span>
        </div>
        <div className={`h-px bg-zinc-800 flex-1 mx-2 ${step >= 2 ? 'bg-purple-600/50' : ''}`} />
        <div className={`flex flex-col items-center flex-1 ${step >= 2 ? 'text-purple-400' : 'text-zinc-600'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${step >= 2 ? 'bg-purple-600/20 border border-purple-500' : 'bg-zinc-800 border border-zinc-700'}`}>2</div>
          <span>Estado</span>
        </div>
        <div className={`h-px bg-zinc-800 flex-1 mx-2 ${step >= 3 ? 'bg-purple-600/50' : ''}`} />
        <div className={`flex flex-col items-center flex-1 ${step >= 3 ? 'text-purple-400' : 'text-zinc-600'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${step >= 3 ? 'bg-purple-600/20 border border-purple-500' : 'bg-zinc-800 border border-zinc-700'}`}>3</div>
          <span>Valoración</span>
        </div>
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 bg-red-900/30 border border-red-500/50 rounded-xl text-red-200 text-center">
          <p>{errorMsg}</p>
          {errorMsg === 'No podemos valorar esta configuración automáticamente ahora mismo.' && (
            <button onClick={() => setErrorMsg('')} className="mt-4 px-6 py-2 bg-zinc-800 rounded-lg text-sm hover:bg-zinc-700">
              Volver
            </button>
          )}
        </div>
      )}

      {/* Step 1 */}
      {step === 1 && (
        <div className="space-y-6 bg-zinc-900 border border-zinc-800 rounded-2xl p-6 md:p-8">
          <div>
            <label className="block text-zinc-300 font-medium mb-2">Modelo</label>
            <select 
              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500"
              value={modelId}
              onChange={handleModelChange}
            >
              <option value="">Selecciona tu modelo</option>
              {models.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>

          {selectedModel && (
            <div>
              <label className="block text-zinc-300 font-medium mb-2">Almacenamiento</label>
              <select 
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                value={storage}
                onChange={e => setStorage(e.target.value)}
              >
                <option value="">Selecciona almacenamiento</option>
                {selectedModel.storages.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          )}

          {selectedModel && selectedModel.colors.length > 0 && (
            <div>
              <label className="block text-zinc-300 font-medium mb-2">Color</label>
              <select 
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                value={color}
                onChange={e => setColor(e.target.value)}
              >
                <option value="">Selecciona color</option>
                {selectedModel.colors.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          )}

          {validationError && <p className="text-red-400 text-sm mt-2">{validationError}</p>}

          <button
            onClick={handleNextToStep2}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-4 px-6 rounded-xl mt-4 transition-colors"
          >
            Continuar
          </button>
        </div>
      )}

      {/* Step 2 */}
      {step === 2 && (
        <div className="space-y-8 bg-zinc-900 border border-zinc-800 rounded-2xl p-6 md:p-8">
          <div>
            <label className="block text-zinc-300 font-medium mb-3">Estado físico</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'sealed', label: 'Precintado' },
                { value: 'like_new', label: 'Como nuevo' },
                { value: 'good', label: 'Buen estado' },
                { value: 'marked', label: 'Con marcas' }
              ].map(cond => (
                <button
                  key={cond.value}
                  onClick={() => setDeviceCondition(cond.value as any)}
                  className={`py-3 px-4 rounded-xl border text-sm font-medium transition-colors ${
                    deviceCondition === cond.value
                      ? 'bg-purple-600/20 border-purple-500 text-purple-300'
                      : 'bg-zinc-950 border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200'
                  }`}
                >
                  {cond.label}
                </button>
              ))}
            </div>
          </div>

          {selectedModel?.supports_battery_health && (
            <div>
              <label className="block text-zinc-300 font-medium mb-2">Salud de batería</label>
              <div className="relative">
                <input 
                  type="number"
                  inputMode="numeric"
                  min="0" max="100"
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl pl-4 pr-12 py-3 text-white focus:outline-none focus:border-purple-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  value={batteryHealth}
                  onChange={e => setBatteryHealth(e.target.value)}
                  placeholder="Ej. 95"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none">
                  %
                </div>
              </div>
            </div>
          )}

          {selectedModel?.supports_cycles && (
            <div>
              <label className="block text-zinc-300 font-medium mb-1">Ciclos de carga</label>
              <p className="text-zinc-500 text-xs mb-2">Puedes dejarlo vacío si no conoces este dato.</p>
              <input 
                type="number"
                inputMode="numeric"
                min="0"
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                value={batteryCycles}
                onChange={e => setBatteryCycles(e.target.value)}
                placeholder="Ej. 120"
              />
            </div>
          )}

          <div className="space-y-6 pt-4 border-t border-zinc-800">
            <div>
              <label className="block text-zinc-300 font-medium mb-3">¿Tienes la caja original?</label>
              <div className="flex gap-4">
                <button onClick={() => setHasBox(true)} className={btnClass(hasBox, true)}>Sí</button>
                <button onClick={() => setHasBox(false)} className={btnClass(hasBox, false)}>No</button>
              </div>
            </div>

            <div>
              <label className="block text-zinc-300 font-medium mb-3">¿Tienes el cable?</label>
              <div className="flex gap-4">
                <button onClick={() => setHasCable(true)} className={btnClass(hasCable, true)}>Sí</button>
                <button onClick={() => setHasCable(false)} className={btnClass(hasCable, false)}>No</button>
              </div>
            </div>

            <div>
              <label className="block text-zinc-300 font-medium mb-3">¿Tienes factura?</label>
              <div className="flex gap-4">
                <button onClick={() => setHasInvoice(true)} className={btnClass(hasInvoice, true)}>Sí</button>
                <button onClick={() => setHasInvoice(false)} className={btnClass(hasInvoice, false)}>No</button>
              </div>
            </div>

            <div>
              <label className="block text-zinc-300 font-medium mb-3">¿Todas las piezas son originales?</label>
              <div className="flex gap-4">
                <button onClick={() => setOriginalParts(true)} className={btnClass(originalParts, true)}>Sí</button>
                <button onClick={() => setOriginalParts(false)} className={btnClass(originalParts, false)}>No</button>
              </div>
            </div>

            <div>
              <label className="block text-zinc-300 font-medium mb-3">¿Funciona todo correctamente?</label>
              <div className="flex gap-4">
                <button onClick={() => setFullyFunctional(true)} className={btnClass(fullyFunctional, true)}>Sí</button>
                <button onClick={() => setFullyFunctional(false)} className={btnClass(fullyFunctional, false)}>No</button>
              </div>
            </div>

            <div>
              <label className="block text-zinc-300 font-medium mb-3">¿Está libre de bloqueos?</label>
              <div className="flex gap-4">
                <button onClick={() => setIsBlocked(false)} className={btnClass(isBlocked, false)}>Sí</button>
                <button onClick={() => setIsBlocked(true)} className={btnClass(isBlocked, true)}>No</button>
              </div>
            </div>

            <div>
              <label className="block text-zinc-300 font-medium mb-3">¿Tiene garantía oficial vigente?</label>
              <div className="flex gap-4">
                <button onClick={() => setHasWarranty(true)} className={btnClass(hasWarranty, true)}>Sí</button>
                <button onClick={() => setHasWarranty(false)} className={btnClass(hasWarranty, false)}>No</button>
              </div>
            </div>

            {hasWarranty && (
              <div>
                <label className="block text-zinc-300 font-medium mb-2">Fecha de fin de garantía</label>
                <input 
                  type="date"
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                  value={officialWarrantyUntil}
                  onChange={e => setOfficialWarrantyUntil(e.target.value)}
                />
              </div>
            )}
          </div>

          {validationError && <p className="text-red-400 text-sm mt-2">{validationError}</p>}

          <div className="flex gap-4 pt-4">
            <button
              onClick={() => setStep(1)}
              disabled={loading}
              className="px-6 py-4 rounded-xl border border-zinc-700 text-zinc-300 font-medium hover:bg-zinc-800 disabled:opacity-50"
            >
              Atrás
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-medium py-4 px-6 rounded-xl transition-colors disabled:opacity-50"
            >
              {loading ? 'Calculando valoración...' : 'Calcular valoración'}
            </button>
          </div>
        </div>
      )}

      {/* Step 3 */}
      {step === 3 && manualReview && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 md:p-8 text-center max-w-xl mx-auto shadow-2xl">
          <h2 className="text-xl text-white font-medium mb-4">Necesitamos revisar tu iPhone</h2>
          <p className="text-zinc-400 mb-8">
            {quoteMode === 'trade_in' 
              ? 'No podemos calcular automáticamente la diferencia para este dispositivo. Envíanos una solicitud y revisaremos la operación personalmente.'
              : 'Por las características indicadas no podemos ofrecer una valoración automática. Puedes enviarnos una solicitud para revisarlo personalmente.'}
          </p>
          <div className="space-y-4">
            <Link 
              href="/vender" 
              className="block w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-4 px-6 rounded-xl transition-colors"
            >
              Enviar solicitud
            </Link>
            <button
              onClick={resetFlow}
              className="block w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium py-4 px-6 rounded-xl transition-colors"
            >
              Calcular otro iPhone
            </button>
            {quoteMode === 'trade_in' && (
              <Link 
                href="/#stock" 
                className="block text-zinc-500 hover:text-zinc-400 font-medium text-sm mt-4 transition-colors"
              >
                Cambiar dispositivo
              </Link>
            )}
          </div>
        </div>
      )}

      {step === 3 && quoteResult && !manualReview && (
        <QuoteResultCard 
          result={quoteResult} 
          quoteMode={quoteMode}
          onReset={resetFlow} 
        />
      )}
    </div>
  )
}
