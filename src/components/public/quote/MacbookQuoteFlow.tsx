'use client'

import { useState } from 'react'

export type MacbookModelData = {
  id: string
  name: string
  chips: string[]
  memories: string[]
  storages: string[]
  colors: string[]
  compatibilities: {
    parent_variant_type: string
    parent_value: string
    child_variant_type: string
    child_value: string
  }[]
}

type Props = {
  models: MacbookModelData[]
  onBackToCategory: () => void
}

export default function MacbookQuoteFlow({ models, onBackToCategory }: Props) {
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5 | 6>(1)
  
  const [modelId, setModelId] = useState('')
  const [chip, setChip] = useState('')
  const [memory, setMemory] = useState('')
  const [storage, setStorage] = useState('')
  const [color, setColor] = useState('')

  const [validationError, setValidationError] = useState('')

  const selectedModel = models.find(m => m.id === modelId)

  // Filtering helpers
  const getCompatibleValues = (childType: 'memory' | 'storage') => {
    if (!selectedModel || !chip) return []
    const compatible = selectedModel.compatibilities
      .filter(c => c.parent_variant_type === 'chip' && c.parent_value === chip && c.child_variant_type === childType)
      .map(c => c.child_value)
    
    // Sort preserving the original order in the arrays
    const originalArray = childType === 'memory' ? selectedModel.memories : selectedModel.storages
    return originalArray.filter(v => compatible.includes(v))
  }

  const handleModelChange = (id: string) => {
    setModelId(id)
    setChip('')
    setMemory('')
    setStorage('')
    setColor('')
  }

  const handleChipChange = (c: string) => {
    setChip(c)
    setMemory('')
    setStorage('')
  }

  const goNext = () => {
    setValidationError('')
    
    if (step === 1) {
      if (!modelId) {
        setValidationError('Por favor, selecciona un modelo.')
        return
      }
    } else if (step === 2) {
      if (!chip) {
        setValidationError('Por favor, selecciona un procesador (chip).')
        return
      }
    } else if (step === 3) {
      if (!memory) {
        setValidationError('Por favor, selecciona la memoria (RAM).')
        return
      }
    } else if (step === 4) {
      if (!storage) {
        setValidationError('Por favor, selecciona el almacenamiento (SSD).')
        return
      }
    } else if (step === 5) {
      if (selectedModel && selectedModel.colors.length > 0 && !color) {
        setValidationError('Por favor, selecciona un color.')
        return
      }
      // If we reach the end, just go to step 6 (done)
      setStep(6)
      return
    }

    setStep((prev) => (prev + 1) as any)
  }

  const goBack = () => {
    if (step > 1) {
      setValidationError('')
      setStep((prev) => (prev - 1) as any)
    } else {
      onBackToCategory()
    }
  }

  const optionCardClass = (active: boolean, compact: boolean = false) =>
    `w-full ${compact ? 'py-3 px-4 min-h-[48px]' : 'p-4 sm:p-5'} rounded-[16px] border text-left font-medium transition-all duration-200 active:scale-[0.98] flex items-center justify-between ${
      active
        ? 'bg-purple-900/20 border-purple-500/50 text-white'
        : 'bg-[#0B0B0E] border-[#1F1F24] text-zinc-300 hover:border-zinc-700 hover:bg-[#111114]'
    }`

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <>
            <div className="flex-none mb-6">
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">¿Qué MacBook tienes?</h2>
              <p className="text-zinc-400">Elige el modelo exacto de tu MacBook.</p>
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
        )
      case 2:
        return (
          <>
            <div className="flex-none mb-6">
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">¿Qué procesador tiene?</h2>
              <p className="text-zinc-400">Chip / Procesador para {selectedModel?.name}.</p>
            </div>
            <div className="flex-1 overflow-y-auto min-h-0 pr-1 sm:pr-2 pb-2">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
              {selectedModel?.chips.map(c => (
                <button
                  key={c}
                  onClick={() => {
                    handleChipChange(c)
                    setValidationError('')
                  }}
                  className={optionCardClass(chip === c)}
                >
                  <span className="w-full text-center">{c}</span>
                </button>
              ))}
              </div>
            </div>
          </>
        )
      case 3:
        const compatibleMemories = getCompatibleValues('memory')
        return (
          <>
            <div className="flex-none mb-6">
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">¿Cuánta memoria (RAM)?</h2>
              <p className="text-zinc-400">Opciones disponibles para el procesador {chip}.</p>
            </div>
            <div className="flex-1 overflow-y-auto min-h-0 pr-1 sm:pr-2 pb-2">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
              {compatibleMemories.map(m => (
                <button
                  key={m}
                  onClick={() => {
                    setMemory(m)
                    setValidationError('')
                  }}
                  className={optionCardClass(memory === m)}
                >
                  <span className="w-full text-center">{m}</span>
                </button>
              ))}
              </div>
            </div>
          </>
        )
      case 4:
        const compatibleStorages = getCompatibleValues('storage')
        return (
          <>
            <div className="flex-none mb-6">
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">¿Qué almacenamiento (SSD) tiene?</h2>
              <p className="text-zinc-400">Opciones disponibles para el procesador {chip}.</p>
            </div>
            <div className="flex-1 overflow-y-auto min-h-0 pr-1 sm:pr-2 pb-2">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
              {compatibleStorages.map(s => (
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
        )
      case 5:
        return (
          <>
            <div className="flex-none mb-6">
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">¿De qué color es?</h2>
            </div>
            <div className="flex-1 overflow-y-auto min-h-0 pr-1 sm:pr-2 pb-2">
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
            </div>
          </>
        )
      case 6:
        return (
          <div className="flex-1 flex flex-col items-center justify-center text-center max-w-xl mx-auto w-full">
            <h2 className="text-2xl text-white font-bold mb-4">Configuración completada</h2>
            <p className="text-zinc-400 mb-8">
              Has seleccionado el <strong>{selectedModel?.name}</strong> con <strong>{chip}</strong>, <strong>{memory}</strong> RAM, <strong>{storage}</strong> SSD en color <strong>{color}</strong>.
              <br /><br />
              Las valoraciones para MacBook aún no están disponibles, pero tu configuración técnica se ha validado correctamente.
            </p>
            <button
              onClick={() => {
                setModelId('')
                setChip('')
                setMemory('')
                setStorage('')
                setColor('')
                setStep(1)
              }}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-xl transition-colors"
            >
              Configurar otro MacBook
            </button>
          </div>
        )
    }
  }

  return (
    <div className="w-full flex flex-col lg:flex-row gap-6 lg:gap-12 items-start lg:h-[calc(100vh-140px)]">
      {/* DESKTOP SIDEBAR / MOBILE HEADER */}
      <div className="w-full lg:w-[32%] xl:w-[28%] shrink-0">
        <div className="flex flex-col">
          <div className="mb-8">
            <h3 className="text-xs font-bold tracking-widest uppercase text-purple-500/70 mb-2">Cotizador MacBook</h3>
            <h1 className="text-3xl lg:text-4xl font-bold text-white tracking-tight mb-2">Configuración</h1>
            <p className="text-zinc-500">Paso {step > 5 ? 5 : step} de 5</p>
          </div>

          <div className="flex gap-2 mb-8 lg:mb-auto">
            {[1, 2, 3, 4, 5].map(s => (
              <div 
                key={s} 
                className={`flex-1 h-1.5 rounded-full transition-colors duration-300 ${
                  s < step ? 'bg-purple-600/50' : s === step ? 'bg-purple-500' : 'bg-[#1F1F24]'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="hidden lg:block w-px bg-[#1F1F24] self-stretch" />

      {/* RIGHT PANEL CONTENT */}
      <div className="flex-1 min-w-0 flex flex-col h-full lg:overflow-hidden pb-8 lg:pb-0">
        <div key={step} className="animate-quote-step-enter flex flex-col flex-1 min-h-0">
          {renderStep()}

          {validationError && step < 6 && (
            <div className="mt-8 p-4 bg-red-900/10 border border-red-500/20 rounded-[14px] text-red-400 text-sm font-medium animate-quote-step-enter">
              {validationError}
            </div>
          )}

          {step < 6 && (
            <div className="flex-none flex items-center gap-4 mt-6 pt-6 border-t border-[#1F1F24]">
              <button
                onClick={goBack}
                className="flex items-center justify-center w-12 h-12 rounded-xl bg-[#0B0B0E] border border-[#1F1F24] text-zinc-400 hover:text-white hover:border-zinc-700 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <button
                onClick={goNext}
                className="flex-1 py-3 px-6 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-xl transition-all active:scale-[0.98]"
              >
                {step === 5 ? 'Ver resumen' : 'Siguiente'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
