'use client'

import { useState } from 'react'
import { submitPublicIphoneQuote } from '@/actions/public-quote'
import QuoteResultCard from './QuoteResultCard'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

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
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5 | 6 | 7>(1)
  
  // Step 1: Modelo
  const [modelId, setModelId] = useState('')
  
  // Step 2: Capacidad
  const [storage, setStorage] = useState('')
  
  // Step 3: Color
  const [color, setColor] = useState('')

  // Step 4: Estado
  const [deviceCondition, setDeviceCondition] = useState<'sealed'|'like_new'|'good'|'marked'|''>('')
  
  // Step 5: Batería
  const [batteryHealth, setBatteryHealth] = useState<number>(0)
  const [batteryTouched, setBatteryTouched] = useState(false)
  
  // Step 6: Detalles
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
  
  // Results (Step 7)
  const [quoteResult, setQuoteResult] = useState<any | null>(null)
  const [manualReview, setManualReview] = useState(false)
  const router = useRouter()

  const selectedModel = models.find(m => m.id === modelId)

  // -- HANDLERS --

  const handleModelChange = (id: string) => {
    setModelId(id)
    setStorage('')
    setColor('')
    setBatteryHealth(0)
    setBatteryTouched(false)
    setBatteryCycles('')
  }

  const goNext = () => {
    setValidationError('')
    
    // Validation per step
    if (step === 1) {
      if (!modelId) {
        setValidationError('Por favor, selecciona un modelo.')
        return
      }
    } else if (step === 2) {
      if (!storage) {
        setValidationError('Por favor, selecciona una capacidad.')
        return
      }
    } else if (step === 3) {
      if (selectedModel && selectedModel.colors.length > 0 && !color) {
        setValidationError('Por favor, selecciona un color.')
        return
      }
    } else if (step === 4) {
      if (!deviceCondition) {
        setValidationError('Por favor, selecciona el estado físico.')
        return
      }
    } else if (step === 5) {
      if (selectedModel?.supports_battery_health) {
        if (!batteryTouched) {
          setValidationError('Por favor, indica la salud de batería desplazando el control.')
          return
        }
        if (batteryHealth < 0 || batteryHealth > 100) {
          setValidationError('Por favor, indica un valor válido de salud de batería (0-100).')
          return
        }
      }
    } else if (step === 6) {
      // In step 6, clicking the primary button calls handleSubmit directly.
      // So this branch shouldn't be hit via "Siguiente", but just in case:
      handleSubmit()
      return
    }

    setStep((prev) => (prev + 1) as any)
  }

  const goBack = () => {
    if (step > 1) {
      setValidationError('')
      setStep((prev) => (prev - 1) as any)
    }
  }

  const handleSubmit = async () => {
    setValidationError('')
    
    // Final validation for Step 6 before moving to Step 7
    if (selectedModel?.supports_cycles && batteryCycles !== '') {
      const cy = parseInt(batteryCycles, 10)
      if (isNaN(cy) || cy < 0) {
        setValidationError('Por favor, introduce ciclos válidos (o déjalo vacío).')
        return
      }
    }
    if (
      hasBox === null || 
      hasCable === null || 
      hasInvoice === null || 
      originalParts === null || 
      fullyFunctional === null || 
      isBlocked === null || 
      hasWarranty === null
    ) {
      setValidationError('Por favor, responde a todas las preguntas de Sí/No.')
      return
    }
    if (hasWarranty && !officialWarrantyUntil) {
      setValidationError('Por favor, introduce la fecha de fin de garantía.')
      return
    }

    setLoading(true)
    setErrorMsg('')
    setStep(7) // Move to step 7 to show loading

    const payload = {
      quoteMode: quoteMode,
      modelId,
      storage,
      color: color || null,
      deviceCondition,
      batteryHealth: selectedModel?.supports_battery_health && batteryTouched ? batteryHealth : null,
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
        } else if (res.code === 'not_configured') {
          setErrorMsg('No podemos valorar esta configuración automáticamente ahora mismo.')
        } else {
          setErrorMsg('No hemos podido calcular la valoración. Inténtalo de nuevo.')
        }
      } else {
        setQuoteResult(res)
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
    setBatteryHealth(0)
    setBatteryTouched(false)
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

  const handleContinueToVender = () => {
    try {
      const payload = {
        version: 1,
        createdAt: Date.now(),
        mode: quoteMode,
        handoffToken: quoteResult?.handoffToken || undefined,
        device: {
          modelId,
          storage,
          color,
          condition: deviceCondition,
          batteryHealth: batteryTouched ? batteryHealth : null,
          batteryCycles,
          hasBox,
          hasCable,
          hasInvoice,
          originalParts,
          fullyFunctional,
          blocked: isBlocked,
          officialWarrantyUntil
        },
        tradeInTarget: quoteMode === 'trade_in' && targetDevice ? {
          id: targetDevice.id,
          modelName: targetDevice.model_name,
          storage: targetDevice.storage,
          color: targetDevice.color,
          listingPrice: targetDevice.listing_price
        } : undefined
      }
      
      sessionStorage.setItem('kevphones_quote_prefill_v1', JSON.stringify(payload))
    } catch (e) {
      // Safely ignore storage errors
    }
    
    router.push('/vender')
  }

  // -- UTILS --
  
  const btnClass = (active: boolean | null, target: boolean) => 
    `flex-1 py-3 px-4 rounded-[14px] border font-medium transition-all duration-200 active:scale-[0.98] ${
      active === target 
        ? 'bg-purple-900/30 border-purple-500/50 text-purple-300' 
        : 'bg-[#0B0B0E] border-[#1F1F24] text-zinc-400 hover:border-zinc-700 hover:text-white'
    }`

  const optionCardClass = (active: boolean, compact: boolean = false) =>
    `w-full ${compact ? 'py-3 px-4 min-h-[48px]' : 'p-4 sm:p-5'} rounded-[16px] border text-left font-medium transition-all duration-200 active:scale-[0.98] flex items-center justify-between ${
      active
        ? 'bg-purple-900/20 border-purple-500/50 text-white'
        : 'bg-[#0B0B0E] border-[#1F1F24] text-zinc-300 hover:border-zinc-700 hover:bg-[#111114]'
    }`

  const getBatteryLabel = (health: number) => {
    if (health < 80) return { text: 'Necesita cambiarse', color: 'text-red-400' }
    if (health <= 84) return { text: 'Poca vida útil', color: 'text-amber-500' }
    if (health <= 89) return { text: 'Buena, con desgaste de uso', color: 'text-yellow-400' }
    if (health <= 94) return { text: 'Buena salud', color: 'text-purple-300' }
    return { text: 'Excelente salud', color: 'text-[#9867db]' }
  }

  return (
    <div className="w-full flex flex-col lg:flex-row gap-6 lg:gap-12 items-start lg:h-[calc(100vh-140px)]">
      
      {/* DESKTOP SIDEBAR / MOBILE HEADER */}
      <div className="w-full lg:w-[32%] xl:w-[28%] shrink-0">
        <div className="flex flex-col">
          
          <div className="mb-8">
            <h3 className="text-xs font-bold tracking-widest uppercase text-purple-500/70 mb-2">Cotizador</h3>
            <h1 className="text-3xl lg:text-4xl font-bold text-white tracking-tight mb-2">Precio orientativo</h1>
            <p className="text-zinc-500">Paso {step} de 7</p>
          </div>

          {/* Progress Indicator */}
          <div className="flex gap-2 mb-8 lg:mb-auto">
            {[1, 2, 3, 4, 5, 6, 7].map(s => (
              <div 
                key={s} 
                className={`flex-1 h-1.5 rounded-full transition-colors duration-300 ${
                  s < step ? 'bg-purple-600/50' : s === step ? 'bg-purple-500' : 'bg-[#1F1F24]'
                }`}
              />
            ))}
          </div>

          {/* Trust strip (Desktop only) */}
          <div className="hidden lg:block mt-16 space-y-4 text-sm text-zinc-500">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Trato directo
            </div>
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Atención en Canarias
            </div>
          </div>
        </div>
      </div>

      {/* VERTICAL DIVIDER (Desktop only) */}
      <div className="hidden lg:block w-px bg-[#1F1F24] self-stretch" />

      {/* RIGHT PANEL CONTENT */}
      <div className="flex-1 min-w-0 flex flex-col h-full lg:overflow-hidden pb-8 lg:pb-0">
        
        {/* Trade-In Banner */}
        {quoteMode === 'trade_in' && targetDevice && step < 7 && (
          <div className="flex-none mb-6 p-5 bg-[#0B0B0E] border border-purple-500/20 rounded-[20px] flex items-center justify-between shadow-lg">
            <div>
              <p className="text-[10px] sm:text-xs uppercase tracking-widest text-zinc-500 font-bold mb-1">Parte de pago para</p>
              <p className="text-sm sm:text-base font-medium text-white">
                {targetDevice.model_name}
                {(targetDevice.storage || targetDevice.color) && (
                  <span className="text-zinc-400">
                    {' · '}{[targetDevice.storage, targetDevice.color].filter(Boolean).join(' / ')}
                  </span>
                )}
              </p>
            </div>
            <div className="text-lg sm:text-xl font-bold text-purple-400">{targetDevice.listing_price} €</div>
          </div>
        )}

        {/* Global Error Banner */}
        {errorMsg && step < 7 && (
          <div className="flex-none mb-6 p-5 bg-red-900/10 border border-red-500/20 rounded-[20px] text-red-400 text-sm">
            <p>{errorMsg}</p>
            {errorMsg === 'No podemos valorar esta configuración automáticamente ahora mismo.' && (
              <button onClick={() => setErrorMsg('')} className="mt-3 text-white underline font-medium">
                Intentar otra configuración
              </button>
            )}
          </div>
        )}

        {/* --- WIZARD STEPS --- */}
        <div key={step} className="animate-quote-step-enter flex flex-col flex-1 min-h-0">
          
          {/* STEP 1: Modelo */}
          {step === 1 && (
            <>
              <div className="flex-none mb-6">
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">¿Qué modelo tienes?</h2>
                <p className="text-zinc-400">Elige el modelo exacto de tu iPhone.</p>
              </div>
              
              <div className="flex-1 overflow-y-auto min-h-0 pr-1 sm:pr-2 pb-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {models.map(m => (
                  <button
                    key={m.id}
                    onClick={() => {
                      handleModelChange(m.id)
                      setValidationError('')
                    }}
                    className={optionCardClass(modelId === m.id, true)}
                  >
                    {m.name}
                    {modelId === m.id && (
                      <span className="w-5 h-5 rounded-full bg-purple-500 text-white flex items-center justify-center">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </span>
                    )}
                  </button>
                ))}
                </div>
              </div>
            </>
          )}

          {/* STEP 2: Capacidad */}
          {step === 2 && (
            <>
              <div className="flex-none mb-6">
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">¿Qué capacidad tiene?</h2>
                <p className="text-zinc-400">Capacidades disponibles para {selectedModel?.name}.</p>
              </div>
              
              <div className="flex-1 overflow-y-auto min-h-0 pr-1 sm:pr-2 pb-2">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                {selectedModel?.storages.map(s => (
                  <button
                    key={s}
                    onClick={() => {
                      setStorage(s)
                      setValidationError('')
                    }}
                    className={optionCardClass(storage === s)}
                  >
                    <span className="w-full text-center">{s}</span>
                  </button>
                ))}
                </div>
              </div>
            </>
          )}

          {/* STEP 3: Color */}
          {step === 3 && (
            <>
              <div className="flex-none mb-6">
                <h2 className="text-2xl sm:text-3xl font-bold text-white">¿De qué color es?</h2>
              </div>
              
              <div className="flex-1 overflow-y-auto min-h-0 pr-1 sm:pr-2 pb-2">
                {selectedModel?.colors.length === 0 ? (
                  <div className="p-6 bg-[#0B0B0E] border border-[#1F1F24] rounded-[20px] text-center">
                    <p className="text-zinc-400">Este modelo no requiere seleccionar color.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                  {selectedModel?.colors.map(c => (
                    <button
                      key={c}
                      onClick={() => {
                        setColor(c)
                        setValidationError('')
                      }}
                      className={optionCardClass(color === c)}
                    >
                      <span className="w-full text-center">{c}</span>
                    </button>
                  ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* STEP 4: Estado */}
          {step === 4 && (
            <>
              <div className="flex-none mb-6">
                <h2 className="text-2xl sm:text-3xl font-bold text-white">¿En qué estado se encuentra?</h2>
              </div>
              
              <div className="flex-1 overflow-y-auto min-h-0 pr-1 sm:pr-2 pb-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { value: 'sealed', label: 'Precintado', desc: 'Caja sin abrir, garantías intactas.' },
                  { value: 'like_new', label: 'Como nuevo', desc: 'Impecable, sin marcas ni roces.' },
                  { value: 'good', label: 'Buen estado', desc: 'Pequeñas marcas de uso normales.' },
                  { value: 'marked', label: 'Con marcas', desc: 'Arañazos visibles o pequeños golpes.' }
                ].map(cond => (
                  <button
                    key={cond.value}
                    onClick={() => {
                      setDeviceCondition(cond.value as any)
                      setValidationError('')
                    }}
                    className={`w-full p-5 sm:p-6 rounded-[20px] border text-left transition-all duration-200 active:scale-[0.99] flex flex-col ${
                      deviceCondition === cond.value
                        ? 'bg-purple-900/20 border-purple-500/50 text-white'
                        : 'bg-[#0B0B0E] border-[#1F1F24] hover:border-zinc-700 hover:bg-[#111114]'
                    }`}
                  >
                    <span className="font-semibold text-lg mb-1">{cond.label}</span>
                    <span className={`text-sm ${deviceCondition === cond.value ? 'text-purple-300' : 'text-zinc-500'}`}>
                      {cond.desc}
                    </span>
                  </button>
                ))}
                </div>
              </div>
            </>
          )}

          {/* STEP 5: Batería */}
          {step === 5 && (
            <>
              <div className="flex-none mb-6">
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">¿Qué salud de batería tiene?</h2>
                <p className="text-zinc-400">Puedes verla en Ajustes &gt; Batería &gt; Salud y carga de la batería.</p>
              </div>

              <div className="flex-1 overflow-y-auto min-h-0 pr-1 sm:pr-2 pb-2 flex flex-col justify-center">
                {!selectedModel?.supports_battery_health ? (
                  <div className="p-6 bg-[#0B0B0E] border border-[#1F1F24] rounded-[20px] text-center">
                  <p className="text-zinc-400">Este modelo no requiere seleccionar salud de batería.</p>
                </div>
              ) : (
                <div className="p-8 sm:p-10 bg-[#0B0B0E] border border-[#1F1F24] rounded-[24px] flex flex-col items-center">
                  <div className="text-center mb-8">
                    <div className={`text-6xl sm:text-7xl font-bold tracking-tight mb-2 ${batteryTouched ? 'text-white' : 'text-zinc-700'}`}>
                      {batteryTouched ? batteryHealth : '--'}%
                    </div>
                    
                    <div className={`text-sm sm:text-base font-medium h-6 transition-colors ${batteryTouched ? getBatteryLabel(batteryHealth).color : 'text-transparent'}`}>
                      {batteryTouched ? getBatteryLabel(batteryHealth).text : 'Mueve el deslizador'}
                    </div>
                  </div>

                  <div className="w-full relative">
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={batteryTouched ? batteryHealth : 50}
                      onChange={(e) => {
                        setBatteryTouched(true)
                        setBatteryHealth(parseInt(e.target.value, 10))
                        setValidationError('')
                      }}
                      className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-purple-500 hover:accent-purple-400 transition-all [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-lg"
                    />
                    <div className="flex justify-between mt-4 text-xs text-zinc-500 font-medium">
                      <span>0%</span>
                      <span>100%</span>
                    </div>
                  </div>
                </div>
                )}
              </div>
            </>
          )}

          {/* STEP 6: Detalles */}
          {step === 6 && (
            <>
              <div className="flex-none mb-6">
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">Cuéntanos un poco más</h2>
                <p className="text-zinc-400">Detalles finales para calcular tu valoración.</p>
              </div>
              
              <div className="flex-1 overflow-y-auto min-h-0 pr-1 sm:pr-2 pb-2 space-y-6">
                
                {selectedModel?.supports_cycles && (
                  <div className="p-6 bg-[#0B0B0E] border border-[#1F1F24] rounded-[20px]">
                    <label className="block text-white font-medium mb-1">Ciclos de batería</label>
                    <p className="text-zinc-500 text-xs mb-4">Puedes dejarlo vacío si no conoces este dato.</p>
                    <input 
                      type="number"
                      inputMode="numeric"
                      min="0"
                      className="w-full bg-[#050506] border border-[#1F1F24] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      value={batteryCycles}
                      onChange={e => setBatteryCycles(e.target.value)}
                      placeholder="Ej. 120"
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-5">
                    <h3 className="text-xs uppercase tracking-widest text-zinc-500 font-bold border-b border-[#1F1F24] pb-2">Accesorios</h3>
                    
                    <div>
                      <label className="block text-zinc-300 text-sm mb-3">¿Tienes la caja original?</label>
                      <div className="flex gap-2">
                        <button onClick={() => setHasBox(true)} className={btnClass(hasBox, true)}>Sí</button>
                        <button onClick={() => setHasBox(false)} className={btnClass(hasBox, false)}>No</button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-zinc-300 text-sm mb-3">¿Tienes el cable?</label>
                      <div className="flex gap-2">
                        <button onClick={() => setHasCable(true)} className={btnClass(hasCable, true)}>Sí</button>
                        <button onClick={() => setHasCable(false)} className={btnClass(hasCable, false)}>No</button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-zinc-300 text-sm mb-3">¿Tienes factura?</label>
                      <div className="flex gap-2">
                        <button onClick={() => setHasInvoice(true)} className={btnClass(hasInvoice, true)}>Sí</button>
                        <button onClick={() => setHasInvoice(false)} className={btnClass(hasInvoice, false)}>No</button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-5">
                    <h3 className="text-xs uppercase tracking-widest text-zinc-500 font-bold border-b border-[#1F1F24] pb-2">Funcionamiento</h3>
                    
                    <div>
                      <label className="block text-zinc-300 text-sm mb-3">¿Piezas son originales?</label>
                      <div className="flex gap-2">
                      <button onClick={() => setOriginalParts(true)} className={btnClass(originalParts, true)}>Sí</button>
                      <button onClick={() => setOriginalParts(false)} className={btnClass(originalParts, false)}>No</button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-zinc-300 text-sm mb-3">¿Funciona correctamente?</label>
                    <div className="flex gap-2">
                      <button onClick={() => setFullyFunctional(true)} className={btnClass(fullyFunctional, true)}>Sí</button>
                      <button onClick={() => setFullyFunctional(false)} className={btnClass(fullyFunctional, false)}>No</button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-zinc-300 text-sm mb-3">¿Está libre de bloqueos?</label>
                    <div className="flex gap-2">
                      <button onClick={() => setIsBlocked(false)} className={btnClass(isBlocked, false)}>Sí</button>
                      <button onClick={() => setIsBlocked(true)} className={btnClass(isBlocked, true)}>No</button>
                    </div>
                  </div>
                </div>
                </div>

                <div className="space-y-5">
                  <h3 className="text-xs uppercase tracking-widest text-zinc-500 font-bold border-b border-[#1F1F24] pb-2">Garantía oficial</h3>
                  <div>
                    <div className="flex gap-3">
                      <button onClick={() => setHasWarranty(true)} className={btnClass(hasWarranty, true)}>Sí</button>
                      <button onClick={() => setHasWarranty(false)} className={btnClass(hasWarranty, false)}>No</button>
                    </div>
                  </div>
                  
                  {hasWarranty && (
                    <div className="animate-quote-step-enter">
                      <label className="block text-zinc-300 text-sm mb-2">Fecha de fin de garantía</label>
                      <input 
                        type="date"
                        className="w-full bg-[#050506] border border-[#1F1F24] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500/50 [color-scheme:dark]"
                        value={officialWarrantyUntil}
                        onChange={e => setOfficialWarrantyUntil(e.target.value)}
                      />
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* STEP 7: Loading or Result */}
          {step === 7 && (
            <div className="flex-1 overflow-y-auto min-h-0 pr-1 sm:pr-2 pb-2 flex flex-col items-center justify-center">
              {loading ? (
                <div className="flex flex-col items-center gap-6">
                  <div className="w-12 h-12 border-4 border-[#1F1F24] border-t-purple-500 rounded-full animate-spin"></div>
                  <p className="text-zinc-400 font-medium">Calculando valoración...</p>
                </div>
              ) : (
                <>
                  {errorMsg && (
                    <div className="p-6 bg-red-900/10 border border-red-500/20 rounded-[20px] text-center max-w-xl mx-auto w-full">
                      <p className="text-red-400 mb-4">{errorMsg}</p>
                      <button onClick={resetFlow} className="px-6 py-2 bg-zinc-800 rounded-lg text-sm text-white hover:bg-zinc-700">
                        Volver al inicio
                      </button>
                    </div>
                  )}

                  {manualReview && !errorMsg && (
                    <div className="bg-[#0B0B0E] border border-[#1F1F24] rounded-[24px] p-8 md:p-10 text-center max-w-xl mx-auto shadow-2xl w-full">
                      <div className="w-16 h-16 bg-purple-900/20 border border-purple-500/30 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-8 h-8 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </div>
                      <h2 className="text-2xl text-white font-bold mb-4">Necesitamos revisarlo</h2>
                      <p className="text-zinc-400 mb-10 leading-relaxed font-light">
                        {quoteMode === 'trade_in' 
                          ? 'No podemos calcular automáticamente la diferencia para este dispositivo. Envíanos una solicitud y revisaremos la operación personalmente.'
                          : 'Por las características indicadas no podemos ofrecer una valoración automática. Puedes enviarnos una solicitud para revisarlo personalmente.'}
                      </p>
                      <div className="space-y-4">
                        <button 
                          onClick={handleContinueToVender}
                          className="block w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-4 px-6 rounded-xl transition-all shadow-[0_0_20px_rgba(147,51,234,0.15)]"
                        >
                          Enviar solicitud
                        </button>
                        <button
                          onClick={resetFlow}
                          className="block w-full bg-[#050506] hover:bg-[#111114] border border-[#1F1F24] text-zinc-300 font-medium py-4 px-6 rounded-xl transition-colors"
                        >
                          Calcular otro iPhone
                        </button>
                      </div>
                    </div>
                  )}

                  {quoteResult && !manualReview && !errorMsg && (
                    <QuoteResultCard 
                      result={quoteResult} 
                      quoteMode={quoteMode}
                      onReset={resetFlow} 
                      onContinue={handleContinueToVender}
                    />
                  )}
                </>
              )}
            </div>
          )}

          {/* Validation Error Message */}
          {validationError && step < 7 && (
            <div className="mt-8 p-4 bg-red-900/10 border border-red-500/20 rounded-[14px] text-red-400 text-sm font-medium animate-quote-step-enter">
              {validationError}
            </div>
          )}

          {/* BOTTOM NAVIGATION (Only for steps 1 to 6) */}
          {step < 7 && (
            <div className="flex-none flex items-center gap-4 mt-6 pt-6 border-t border-[#1F1F24]">
              {step > 1 && (
                <button
                  onClick={goBack}
                  className="px-6 py-4 rounded-xl text-zinc-400 font-medium hover:text-white transition-colors flex items-center gap-2"
                >
                  <span>←</span> Atrás
                </button>
              )}
              
              <div className="flex-1" />
              
              {step < 6 ? (
                <button
                  onClick={goNext}
                  className="px-8 py-4 bg-white hover:bg-zinc-200 text-black font-semibold rounded-xl transition-colors shadow-lg active:scale-[0.98]"
                >
                  Siguiente
                </button>
              ) : (
                <button
                  onClick={goNext}
                  className="px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl transition-all shadow-[0_0_20px_rgba(147,51,234,0.15)] active:scale-[0.98]"
                >
                  Ver valoración
                </button>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
