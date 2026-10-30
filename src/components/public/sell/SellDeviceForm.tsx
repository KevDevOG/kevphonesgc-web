'use client'

import React, { useState, useEffect, useRef } from 'react'
import { GuidedPhotoUpload, SelectedPhoto } from './GuidedPhotoUpload'
import { createSaleRequestUploadSessionAction } from '@/actions/public-sale-request-uploads'
import { finalizePublicSaleRequestAction } from '@/actions/public-sale-request-finalize'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface SellDeviceFormProps {
  models: any[]
  variants: any[]
}

function getTrustedMimeType(file: File): string {
  const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
  if (ACCEPTED.includes(file.type)) return file.type
  const lowerName = file.name.toLowerCase()
  if (lowerName.endsWith('.heic')) return 'image/heic'
  if (lowerName.endsWith('.heif')) return 'image/heif'
  return ''
}

export function SellDeviceForm({ models, variants }: SellDeviceFormProps) {
  // Step 1: Tipo, Step 2: Modelo, Step 3: Capacidad, Step 4: Color, Step 5: Estado, Step 6: Datos, Step 7: Fotos, Step 8: Revisar
  const [step, setStep] = useState(1) 
  const stepRef = useRef<HTMLDivElement>(null)
  const previousStepRef = useRef(step)

  useEffect(() => {
    if (previousStepRef.current === step) return
    previousStepRef.current = step
    const heading = stepRef.current?.querySelector<HTMLElement>('h2')
    heading?.focus({ preventScroll: true })
    stepRef.current?.scrollIntoView({ block: 'start', behavior: 'instant' })
  }, [step])

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState('')
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)
  
  // Validation error state for progressive validation
  const [validationError, setValidationError] = useState<string | null>(null)

  // Form State
  const [deviceType, setDeviceType] = useState('iphone')
  const [modelId, setModelId] = useState('')
  const [storage, setStorage] = useState('')
  const [color, setColor] = useState('')
  
  const [deviceCondition, setDeviceCondition] = useState('good')
  const [batteryHealth, setBatteryHealth] = useState('')
  const [batteryCycles, setBatteryCycles] = useState('')
  const [hasBox, setHasBox] = useState(false)
  const [hasCable, setHasCable] = useState(false)
  const [hasInvoice, setHasInvoice] = useState(false)
  const [originalParts, setOriginalParts] = useState(true)
  const [fullyFunctional, setFullyFunctional] = useState(true)
  const [blocked, setBlocked] = useState(false)
  const [officialWarrantyUntil, setOfficialWarrantyUntil] = useState('')

  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerLocation, setCustomerLocation] = useState('')
  const [notes, setNotes] = useState('')
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false)

  const [requiredPhotos, setRequiredPhotos] = useState<Record<string, SelectedPhoto | null>>({})
  const [extraPhotos, setExtraPhotos] = useState<SelectedPhoto[]>([])

  const [isPrefilled, setIsPrefilled] = useState(false)
  const [prefillTradeInTarget, setPrefillTradeInTarget] = useState<any | null>(null)
  const [quoteHandoffToken, setQuoteHandoffToken] = useState<string | null>(null)

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('kevphones_quote_prefill_v1')
      if (!stored) return

      const payload = JSON.parse(stored)
      if (payload.version !== 1 || !payload.createdAt) return

      const ageMs = Date.now() - payload.createdAt
      if (ageMs > 60 * 60 * 1000) {
        sessionStorage.removeItem('kevphones_quote_prefill_v1')
        return
      }

      if (payload.device && typeof payload.device === 'object') {
        const { modelId: pModelId, storage: pStorage, color: pColor } = payload.device
        
        const foundModel = models.find(m => m.id === pModelId)
        if (foundModel) {
          setModelId(pModelId)
          
          // Verify storage
          const availableS = variants.filter(v => v.model_id === pModelId && v.variant_type === 'storage')
          if (!pStorage || availableS.some(v => v.value === pStorage)) {
            setStorage(pStorage || '')
          }
          
          // Verify color
          const availableC = variants.filter(v => v.model_id === pModelId && v.variant_type === 'color')
          if (!pColor || availableC.some(v => v.value === pColor)) {
            setColor(pColor || '')
          }

          if (payload.device.condition) setDeviceCondition(payload.device.condition)
          if (payload.device.batteryHealth !== null && payload.device.batteryHealth !== undefined) setBatteryHealth(String(payload.device.batteryHealth))
          if (payload.device.batteryCycles !== null && payload.device.batteryCycles !== undefined) setBatteryCycles(String(payload.device.batteryCycles))
          if (typeof payload.device.hasBox === 'boolean') setHasBox(payload.device.hasBox)
          if (typeof payload.device.hasCable === 'boolean') setHasCable(payload.device.hasCable)
          if (typeof payload.device.hasInvoice === 'boolean') setHasInvoice(payload.device.hasInvoice)
          if (typeof payload.device.originalParts === 'boolean') setOriginalParts(payload.device.originalParts)
          if (typeof payload.device.fullyFunctional === 'boolean') setFullyFunctional(payload.device.fullyFunctional)
          if (typeof payload.device.blocked === 'boolean') setBlocked(payload.device.blocked)
          if (payload.device.officialWarrantyUntil) setOfficialWarrantyUntil(payload.device.officialWarrantyUntil)

          setIsPrefilled(true)
          setStep(5) // Start at Step 5 when prefilled
        }
      }

      if (payload.mode === 'trade_in' && payload.tradeInTarget) {
        setPrefillTradeInTarget(payload.tradeInTarget)
      }

      if (payload.handoffToken) {
        setQuoteHandoffToken(payload.handoffToken)
      }

    } catch (e) {
      // Ignore parse errors
    }
  }, [models, variants])

  const handleClearPrefill = () => {
    sessionStorage.removeItem('kevphones_quote_prefill_v1')
    setIsPrefilled(false)
    setPrefillTradeInTarget(null)
    setQuoteHandoffToken(null)
    setModelId('')
    setStorage('')
    setColor('')
    setDeviceCondition('good')
    setBatteryHealth('')
    setBatteryCycles('')
    setHasBox(false)
    setHasCable(false)
    setHasInvoice(false)
    setOriginalParts(true)
    setFullyFunctional(true)
    setBlocked(false)
    setOfficialWarrantyUntil('')
    setStep(1)
  }

  const selectedModel = models.find(m => m.id === modelId)
  const availableStorages = variants.filter(v => v.model_id === modelId && v.variant_type === 'storage')
  const availableColors = variants.filter(v => v.model_id === modelId && v.variant_type === 'color')

  const goNext = () => {
    setValidationError(null)
    setSubmitError(null)

    if (step === 1) {
      if (!deviceType) {
        setValidationError('Por favor, selecciona qué quieres vender.')
        return
      }
    } else if (step === 2) {
      if (!modelId) {
        setValidationError('Por favor, selecciona un modelo.')
        return
      }
    } else if (step === 3) {
      if (availableStorages.length > 0 && !storage) {
        setValidationError('Por favor, selecciona la capacidad.')
        return
      }
    } else if (step === 4) {
      if (availableColors.length > 0 && !color) {
        setValidationError('Por favor, selecciona un color.')
        return
      }
    } else if (step === 5) {
      if (selectedModel?.supports_battery_health && deviceCondition !== 'sealed') {
        const bh = parseInt(batteryHealth, 10)
        if (isNaN(bh) || bh < 0 || bh > 100) {
          setValidationError('Por favor, indica una salud de batería válida (0-100).')
          return
        }
      }
      if (selectedModel?.supports_cycles && batteryCycles !== '') {
        const bc = parseInt(batteryCycles, 10)
        if (isNaN(bc) || bc < 0) {
          setValidationError('Los ciclos de batería no son válidos.')
          return
        }
      }
    } else if (step === 6) {
      if (!customerName.trim()) {
        setValidationError('Por favor, indica tu nombre.')
        return
      }
      if (!customerPhone.trim()) {
        setValidationError('Por favor, indica tu teléfono de contacto.')
        return
      }
      if (!acceptedPrivacy) {
        setValidationError('Debes aceptar la política de privacidad para continuar.')
        return
      }
    } else if (step === 7) {
      const requiredTypes = ['front_off', 'front_on', 'back', 'right_side', 'left_side', 'top', 'bottom']
      const hasAllRequired = requiredTypes.every(t => requiredPhotos[t])
      if (!hasAllRequired) {
        setValidationError('Por favor, sube las 7 fotos obligatorias antes de continuar.')
        return
      }
    }

    setStep(s => s + 1)
  }

  const goBack = () => {
    setValidationError(null)
    setSubmitError(null)
    setStep(s => Math.max(1, s - 1))
  }

  const handleSubmit = async () => {
    if (!customerPhone || !customerName) {
      setSubmitError('Revisa tus datos personales.')
      return
    }

    if (!modelId || (availableStorages.length > 0 && !storage) || (availableColors.length > 0 && !color)) {
      setSubmitError('Faltan opciones del dispositivo por seleccionar.')
      return
    }

    if (!acceptedPrivacy) {
      setSubmitError('Debes aceptar la política de privacidad.')
      return
    }

    const bHealthNum = batteryHealth ? Number(batteryHealth) : null
    if (bHealthNum !== null && (!Number.isFinite(bHealthNum) || !Number.isInteger(bHealthNum) || bHealthNum < 0 || bHealthNum > 100)) {
      setSubmitError('La salud de batería no es válida.')
      return
    }

    const bCyclesNum = batteryCycles ? Number(batteryCycles) : null
    if (bCyclesNum !== null && (!Number.isFinite(bCyclesNum) || !Number.isInteger(bCyclesNum) || bCyclesNum < 0)) {
      setSubmitError('Los ciclos de batería no son válidos.')
      return
    }
    
    const requiredTypes = ['front_off', 'front_on', 'back', 'right_side', 'left_side', 'top', 'bottom']
    const hasAllRequired = requiredTypes.every(t => requiredPhotos[t])
    
    if (!hasAllRequired) {
      setSubmitError('Faltan fotos requeridas.')
      return
    }

    setIsSubmitting(true)
    setSubmitError(null)
    setSubmitStatus('Preparando subida...')

    try {
      const sessionRes = await createSaleRequestUploadSessionAction({
        customerPhone,
        category: 'iphone'
      })

      if (!sessionRes.success || !sessionRes.sessionId || !sessionRes.requiredUploads) {
        setSubmitError(sessionRes.error || 'Error al iniciar sesión.')
        setIsSubmitting(false)
        return
      }

      setSubmitStatus('Subiendo fotos...')
      
      const supabase = createClient()
      const bucket = 'sale-request-images'
      let uploadedCount = 0
      const totalUploads = sessionRes.requiredUploads.length + (sessionRes.optionalUploads ? extraPhotos.length : 0)

      const finalPhotos: Array<{ photoType: string, storagePath: string }> = []

      // Upload required
      for (const target of sessionRes.requiredUploads) {
        const photo = requiredPhotos[target.photoType]
        if (!photo) throw new Error('Missing photo')
        
        const trustedMime = getTrustedMimeType(photo.file)
        if (!trustedMime) throw new Error('Formato de imagen no válido.')
        
        const { error } = await supabase.storage.from(bucket).uploadToSignedUrl(
          target.path,
          target.token,
          photo.file,
          { contentType: trustedMime }
        )

        if (error) {
          throw new Error('No se pudieron subir todas las fotos. Inténtalo de nuevo.')
        }

        finalPhotos.push({
          photoType: target.photoType,
          storagePath: target.path
        })
        uploadedCount++
        setSubmitStatus(`Subiendo foto ${uploadedCount} de ${totalUploads}`)
      }

      // Upload extras
      if (extraPhotos.length > 0) {
        if (!sessionRes.optionalUploads || sessionRes.optionalUploads.length < extraPhotos.length) {
          throw new Error('No se pudieron subir todas las fotos. Inténtalo de nuevo.')
        }
        for (let i = 0; i < extraPhotos.length; i++) {
          const target = sessionRes.optionalUploads[i]
          if (!target) throw new Error('No se pudieron subir todas las fotos. Inténtalo de nuevo.')
          
          const photo = extraPhotos[i]
          const trustedMime = getTrustedMimeType(photo.file)
          if (!trustedMime) throw new Error('Formato de imagen no válido.')

          const { error } = await supabase.storage.from(bucket).uploadToSignedUrl(
            target.path,
            target.token,
            photo.file,
            { contentType: trustedMime }
          )

          if (error) {
            throw new Error('No se pudieron subir todas las fotos. Inténtalo de nuevo.')
          }

          finalPhotos.push({
            photoType: 'extra',
            storagePath: target.path
          })
          uploadedCount++
          setSubmitStatus(`Subiendo foto ${uploadedCount} de ${totalUploads}`)
        }
      }

      setSubmitStatus('Enviando solicitud...')

      let finalNotes = notes || ''
      if (prefillTradeInTarget) {
        const tradeInText = `\n\n--- Parte de pago para: ${prefillTradeInTarget.modelName} ${prefillTradeInTarget.storage || ''} ${prefillTradeInTarget.color || ''} (${prefillTradeInTarget.listingPrice} €) [ID: ${prefillTradeInTarget.id}] ---`
        finalNotes = finalNotes + tradeInText
      }

      const finalizeRes = await finalizePublicSaleRequestAction({
        sessionId: sessionRes.sessionId,
        modelId,
        storage: storage || null,
        color: color || null,
        batteryHealth: bHealthNum,
        batteryCycles: bCyclesNum,
        deviceCondition,
        hasBox,
        hasCable,
        hasInvoice,
        originalParts,
        fullyFunctional,
        blocked,
        officialWarrantyUntil: officialWarrantyUntil || null,
        customerName,
        customerLocation: customerLocation || null,
        notes: finalNotes.trim() || null,
        source: 'direct',
        photos: finalPhotos,
        quoteHandoffToken
      })

      if (!finalizeRes.success) {
        throw new Error(finalizeRes.error || 'Error al finalizar.')
      }

      setIsSuccess(true)
      sessionStorage.removeItem('kevphones_quote_prefill_v1')

    } catch (e: any) {
      setSubmitError(e.message || 'Error inesperado.')
      setIsSubmitting(false)
    }
  }

  // Helper for option buttons
  const optionCardClass = (active: boolean) =>
    `kevphones-sell__option ${active ? 'is-selected' : ''}`

  const btnClass = (active: boolean, match: boolean) =>
    `kevphones-sell__binary ${active === match ? 'is-selected' : ''}`

  // Battery health label helper
  const getBatteryLabel = (bh: number) => {
    if (bh < 80) return { text: "Necesita cambiarse", color: "text-red-400" }
    if (bh < 85) return { text: "Poca vida útil", color: "text-amber-500" }
    if (bh < 90) return { text: "Buena, con desgaste de uso", color: "text-amber-400" }
    if (bh < 95) return { text: "Buena salud", color: "text-emerald-400" }
    return { text: "Excelente salud", color: "text-emerald-500" }
  }

  // --- SUCCESS VIEW ---
  if (isSuccess) {
    return (
      <div className="kevphones-sell-success w-full flex flex-col items-center" role="status">
        <div className="w-20 h-20 bg-purple-900/20 border border-purple-500/30 rounded-full flex items-center justify-center mb-6">
          <svg className="w-10 h-10 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-3xl text-white font-bold mb-4">Solicitud enviada</h2>
        <p className="text-zinc-400 max-w-md text-center mb-4 leading-relaxed font-light">
          Hemos recibido los datos y las fotos de tu dispositivo. La valoración final se confirmará después de la revisión física.
        </p>
        <Link href="/" className="mt-8 px-8 py-4 bg-[#050506] hover:bg-[#111114] border border-[#1F1F24] text-zinc-300 font-medium rounded-xl transition-colors">
          Volver al inicio
        </Link>
      </div>
    )
  }

  const batteryHealthNum = parseInt(batteryHealth, 10)

  return (
    <div className="kevphones-sell" data-continuation={isPrefilled}>
      <header className="kevphones-sell__entry">
        <h1>Vende tu dispositivo</h1>
        <p>{isPrefilled ? 'Ya tienes tu valoración orientativa. Revisa los datos, añade tus fotos y envía la solicitud.' : 'Envíanos los datos y fotos de tu dispositivo para solicitar una revisión.'}</p>
        <div className="kevphones-sell__progress-row">
          <span>Paso {step} de 8</span>
          <progress className="kevphones-sell__progress" max={8} value={step} aria-label={`Paso ${step} de 8`} />
        </div>
      </header>
      <div className="kevphones-sell__content">
        {/* PREFILL BANNER */}
        {isPrefilled && (
          <div className="kevphones-sell__prefill">
            <div>
              <p className="text-purple-300 font-medium mb-1 text-sm">Datos de tu valoración conservados</p>
              <p className="text-zinc-400 text-xs">Revisa la información antes de enviar tu solicitud.</p>
            </div>
            <button 
              onClick={handleClearPrefill}
              className="text-xs text-zinc-400 hover:text-white px-3 py-2 bg-[#0B0B0E] rounded-lg transition-colors border border-[#1F1F24] hover:border-zinc-500"
            >
              Empezar de cero
            </button>
          </div>
        )}

        <div key={step} ref={stepRef} className="kevphones-sell__step" aria-describedby={validationError ? "sell-validation-error" : undefined}>
          
          {/* STEP 1: Tipo */}
          {step === 1 && (
            <>
              <div className="kevphones-sell__question">
                <h2 tabIndex={-1} className="text-2xl sm:text-3xl font-bold text-white mb-2">¿Qué dispositivo quieres vender?</h2>
              </div>
              <div className="flex-1  min-h-0 pr-1 sm:pr-2 space-y-4">
                <button onClick={() => setDeviceType('iphone')} aria-pressed={deviceType === 'iphone'} className={optionCardClass(deviceType === 'iphone')}>
                  <div>
                    <span className="text-lg font-medium text-white block mb-1">iPhone</span>
                    <span className="text-sm text-zinc-400">Vender mi iPhone usado o precintado</span>
                  </div>
                  {deviceType === 'iphone' && (
                    <div className="w-5 h-5 rounded-full bg-purple-500 text-white flex items-center justify-center">
                      <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </button>
                <button disabled className="kevphones-sell__unavailable">
                  <div>
                    <div className="text-lg font-medium text-white mb-1">PS5</div>
                    <div className="text-sm text-zinc-500">Próximamente</div>
                  </div>
                </button>
                <button disabled className="kevphones-sell__unavailable">
                  <div>
                    <div className="text-lg font-medium text-white mb-1">Nintendo Switch</div>
                    <div className="text-sm text-zinc-500">Próximamente</div>
                  </div>
                </button>
              </div>
            </>
          )}

          {/* STEP 2: Modelo */}
          {step === 2 && (
            <>
              <div className="kevphones-sell__question">
                <h2 tabIndex={-1} className="text-2xl sm:text-3xl font-bold text-white mb-2">¿Qué modelo tienes?</h2>
                <p className="text-zinc-400">Elige el modelo exacto de tu iPhone.</p>
              </div>
              <div className="flex-1  min-h-0 pr-1 sm:pr-2 pb-4">
                <div className="kevphones-sell__models">
                  {models.map(m => (
                    <button
                      key={m.id}
                      onClick={() => {
                        setModelId(m.id)
                        setStorage('')
                        setColor('')
                      }}
                      aria-pressed={modelId === m.id} className={optionCardClass(modelId === m.id)}
                    >
                      <span className={modelId === m.id ? 'text-white' : 'text-zinc-300'}>{m.name}</span>
                      {modelId === m.id && (
                        <div className="w-5 h-5 rounded-full bg-purple-500 text-white flex items-center justify-center ml-2 shrink-0">
                          <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* STEP 3: Capacidad */}
          {step === 3 && (
            <>
              <div className="kevphones-sell__question">
                <h2 tabIndex={-1} className="text-2xl sm:text-3xl font-bold text-white mb-2">¿Qué capacidad tiene?</h2>
                <p className="text-zinc-400">Capacidades disponibles para {selectedModel?.name}.</p>
              </div>
              <div className="flex-1  min-h-0 pr-1 sm:pr-2 pb-4">
                {availableStorages.length > 0 ? (
                  <div className="kevphones-sell__variants">
                    {availableStorages.map(v => (
                      <button
                        key={v.value}
                        onClick={() => setStorage(v.value)}
                        aria-pressed={storage === v.value} className={optionCardClass(storage === v.value)}
                      >
                        <span className={storage === v.value ? 'text-white' : 'text-zinc-300'}>{v.value}</span>
                        {storage === v.value && (
                          <div className="w-5 h-5 rounded-full bg-purple-500 text-white flex items-center justify-center ml-2 shrink-0">
                            <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 bg-[#0B0B0E] border border-[#1F1F24] rounded-xl text-zinc-400">
                    Este modelo no requiere seleccionar capacidad.
                  </div>
                )}
              </div>
            </>
          )}

          {/* STEP 4: Color */}
          {step === 4 && (
            <>
              <div className="kevphones-sell__question">
                <h2 tabIndex={-1} className="text-2xl sm:text-3xl font-bold text-white mb-2">¿De qué color es?</h2>
                <p className="text-zinc-400">Colores disponibles para {selectedModel?.name}.</p>
              </div>
              <div className="flex-1  min-h-0 pr-1 sm:pr-2 pb-4">
                {availableColors.length > 0 ? (
                  <div className="kevphones-sell__variants">
                    {availableColors.map(v => (
                      <button
                        key={v.value}
                        onClick={() => setColor(v.value)}
                        aria-pressed={color === v.value} className={optionCardClass(color === v.value)}
                      >
                        <span className={color === v.value ? 'text-white' : 'text-zinc-300'}>{v.value}</span>
                        {color === v.value && (
                          <div className="w-5 h-5 rounded-full bg-purple-500 text-white flex items-center justify-center ml-2 shrink-0">
                            <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 bg-[#0B0B0E] border border-[#1F1F24] rounded-xl text-zinc-400">
                    Este modelo no requiere seleccionar color.
                  </div>
                )}
              </div>
            </>
          )}

          {/* STEP 5: Estado */}
          {step === 5 && (
            <>
              <div className="kevphones-sell__question">
                <h2 tabIndex={-1} className="text-2xl sm:text-3xl font-bold text-white mb-2">¿En qué estado está tu iPhone?</h2>
              </div>
              <div className="flex-1  min-h-0 pr-1 sm:pr-2 space-y-8 pb-4">
                
                <div>
                  <h3 className="text-xs uppercase tracking-widest text-zinc-500 font-bold border-b border-[#1F1F24] pb-2 mb-4">Estado general</h3>
                  <div className="kevphones-sell__variants">
                    {[
                      { id: 'sealed', label: 'Precintado' },
                      { id: 'like_new', label: 'Como nuevo' },
                      { id: 'good', label: 'Buen estado' },
                      { id: 'marked', label: 'Con marcas' }
                    ].map(c => (
                      <button
                        key={c.id}
                        onClick={() => setDeviceCondition(c.id)}
                        aria-pressed={deviceCondition === c.id} className={optionCardClass(deviceCondition === c.id)}
                      >
                        <span>{c.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {deviceCondition !== 'sealed' && (
                  <>
                    {selectedModel?.supports_battery_health && (
                      <div className="animate-quote-step-enter">
                        <h3 className="text-xs uppercase tracking-widest text-zinc-500 font-bold border-b border-[#1F1F24] pb-2 mb-4">Salud de batería (%)</h3>
                        <div className="kevphones-sell__battery">
                          <div className="kevphones-sell__battery-value">
                            {batteryHealth !== '' ? (
                              <>
                                <div className="text-5xl sm:text-6xl font-semibold tracking-tight text-white mb-2 leading-none">
                                  {batteryHealth}%
                                </div>
                                <div className={`text-sm sm:text-base font-medium transition-colors ${getBatteryLabel(batteryHealthNum).color}`}>
                                  {getBatteryLabel(batteryHealthNum).text}
                                </div>
                              </>
                            ) : (
                              <div className="text-sm sm:text-base font-medium text-zinc-500">
                                Desliza para indicar la salud
                              </div>
                            )}
                          </div>

                          <div className="w-full relative">
                            <input 
                              type="range" aria-label="Salud de batería" 
                              min="0" 
                              max="100" 
                              value={batteryHealth !== '' ? batteryHealth : 50}
                              onChange={(e) => {
                                setBatteryHealth(e.target.value)
                                setValidationError(null)
                              }}
                              className="kevphones-sell__range"
                            />
                            <div className="flex justify-between mt-2.5 text-xs text-zinc-500 font-medium">
                              <span>0%</span>
                              <span>100%</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {selectedModel?.supports_cycles && (
                      <div className="animate-quote-step-enter">
                        <label htmlFor="sell-batteryCycles" className="block text-zinc-300 text-sm mb-2">Ciclos de batería (Opcional)</label>
                        <input
                          type="number"
                          min="0"
                          className="w-full bg-[#050506] border border-[#1F1F24] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500/50"
                          placeholder="Ej: 120"
                          id="sell-batteryCycles" value={batteryCycles}
                          onChange={e => setBatteryCycles(e.target.value)}
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-5">
                        <h3 className="text-xs uppercase tracking-widest text-zinc-500 font-bold border-b border-[#1F1F24] pb-2">Accesorios</h3>
                        
                        <fieldset>
                          <legend className="block text-zinc-300 text-sm mb-3">¿Tienes la caja original?</legend>
                          <div className="flex gap-2">
                            <button onClick={() => setHasBox(true)} aria-pressed={hasBox === true} className={btnClass(hasBox, true)}>Sí</button>
                            <button onClick={() => setHasBox(false)} aria-pressed={hasBox === false} className={btnClass(hasBox, false)}>No</button>
                          </div>
                        </fieldset>
                        <fieldset>
                          <legend className="block text-zinc-300 text-sm mb-3">¿Tienes el cable?</legend>
                          <div className="flex gap-2">
                            <button onClick={() => setHasCable(true)} aria-pressed={hasCable === true} className={btnClass(hasCable, true)}>Sí</button>
                            <button onClick={() => setHasCable(false)} aria-pressed={hasCable === false} className={btnClass(hasCable, false)}>No</button>
                          </div>
                        </fieldset>
                        <fieldset>
                          <legend className="block text-zinc-300 text-sm mb-3">¿Tienes factura?</legend>
                          <div className="flex gap-2">
                            <button onClick={() => setHasInvoice(true)} aria-pressed={hasInvoice === true} className={btnClass(hasInvoice, true)}>Sí</button>
                            <button onClick={() => setHasInvoice(false)} aria-pressed={hasInvoice === false} className={btnClass(hasInvoice, false)}>No</button>
                          </div>
                        </fieldset>
                      </div>

                      <div className="space-y-5">
                        <h3 className="text-xs uppercase tracking-widest text-zinc-500 font-bold border-b border-[#1F1F24] pb-2">Funcionamiento</h3>
                        
                        <fieldset>
                          <legend className="block text-zinc-300 text-sm mb-3">¿Piezas son originales?</legend>
                          <div className="flex gap-2">
                            <button onClick={() => setOriginalParts(true)} aria-pressed={originalParts === true} className={btnClass(originalParts, true)}>Sí</button>
                            <button onClick={() => setOriginalParts(false)} aria-pressed={originalParts === false} className={btnClass(originalParts, false)}>No</button>
                          </div>
                        </fieldset>
                        <fieldset>
                          <legend className="block text-zinc-300 text-sm mb-3">¿Funciona correctamente?</legend>
                          <div className="flex gap-2">
                            <button onClick={() => setFullyFunctional(true)} aria-pressed={fullyFunctional === true} className={btnClass(fullyFunctional, true)}>Sí</button>
                            <button onClick={() => setFullyFunctional(false)} aria-pressed={fullyFunctional === false} className={btnClass(fullyFunctional, false)}>No</button>
                          </div>
                        </fieldset>
                        <fieldset>
                          <legend className="block text-zinc-300 text-sm mb-3">¿Está libre de bloqueos?</legend>
                          <div className="flex gap-2">
                            <button onClick={() => setBlocked(false)} aria-pressed={blocked === false} className={btnClass(blocked, false)}>Sí</button>
                            <button onClick={() => setBlocked(true)} aria-pressed={blocked === true} className={btnClass(blocked, true)}>No</button>
                          </div>
                        </fieldset>
                      </div>
                    </div>
                  </>
                )}

                <div className="space-y-5">
                  <h3 className="text-xs uppercase tracking-widest text-zinc-500 font-bold border-b border-[#1F1F24] pb-2">Garantía oficial</h3>
                  <div>
                    <div className="flex gap-2">
                      <button onClick={() => setOfficialWarrantyUntil(officialWarrantyUntil || new Date().toISOString().split('T')[0])} aria-pressed={!!officialWarrantyUntil === true} className={btnClass(!!officialWarrantyUntil, true)}>Sí</button>
                      <button onClick={() => setOfficialWarrantyUntil('')} aria-pressed={!!officialWarrantyUntil === false} className={btnClass(!!officialWarrantyUntil, false)}>No</button>
                    </div>
                  </div>
                  
                  {!!officialWarrantyUntil && (
                    <div className="animate-quote-step-enter">
                      <label htmlFor="sell-officialWarrantyUntil" className="block text-zinc-300 text-sm mb-2">Fecha de fin de garantía</label>
                      <input 
                        type="date"
                        className="w-full bg-[#050506] border border-[#1F1F24] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500/50 [color-scheme:dark]"
                        id="sell-officialWarrantyUntil" value={officialWarrantyUntil}
                        onChange={e => setOfficialWarrantyUntil(e.target.value)}
                      />
                    </div>
                  )}
                </div>

              </div>
            </>
          )}

          {/* STEP 6: Tus datos */}
          {step === 6 && (
            <>
              <div className="kevphones-sell__question">
                <h2 tabIndex={-1} className="text-2xl sm:text-3xl font-bold text-white mb-2">¿Cómo podemos contactar contigo?</h2>
              </div>
              <div className="flex-1  min-h-0 pr-1 sm:pr-2 space-y-6 pb-4">
                <div>
                  <label htmlFor="sell-customerName" className="block text-zinc-300 text-sm mb-2">Nombre completo *</label>
                  <input
                    type="text"
                    id="sell-customerName" value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    className="w-full bg-[#050506] border border-[#1F1F24] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500/50"
                    placeholder="Tu nombre y apellidos"
                  />
                </div>
                <div>
                  <label htmlFor="sell-customerPhone" className="block text-zinc-300 text-sm mb-2">Teléfono *</label>
                  <input
                    type="tel"
                    id="sell-customerPhone" value={customerPhone}
                    onChange={e => setCustomerPhone(e.target.value)}
                    className="w-full bg-[#050506] border border-[#1F1F24] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500/50"
                    placeholder="+34 600 00 00 00"
                  />
                </div>
                <div>
                  <label htmlFor="sell-customerLocation" className="block text-zinc-300 text-sm mb-2">Ubicación (Opcional)</label>
                  <input
                    type="text"
                    id="sell-customerLocation" value={customerLocation}
                    onChange={e => setCustomerLocation(e.target.value)}
                    className="w-full bg-[#050506] border border-[#1F1F24] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500/50"
                    placeholder="Ciudad o municipio"
                  />
                </div>
                <div>
                  <label htmlFor="sell-notes" className="block text-zinc-300 text-sm mb-2">Notas adicionales (Opcional)</label>
                  <textarea
                    id="sell-notes" value={notes}
                    onChange={e => setNotes(e.target.value)}
                    className="w-full bg-[#050506] border border-[#1F1F24] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500/50 min-h-[120px] resize-y"
                    placeholder="¿Algo más que debamos saber?"
                  />
                </div>
                <div className="pt-2">
                  <label className="flex items-start gap-4 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      checked={acceptedPrivacy} 
                      onChange={e => setAcceptedPrivacy(e.target.checked)} 
                      className="accent-purple-500 w-5 h-5 mt-0.5 rounded border-zinc-800" 
                    />
                    <span className="text-sm text-zinc-400 group-hover:text-zinc-300 transition-colors leading-relaxed">
                      He leído y acepto la <Link href="/privacidad" className="text-purple-400 hover:underline" target="_blank">política de privacidad</Link>.
                    </span>
                  </label>
                </div>
              </div>
            </>
          )}

          {/* STEP 7: Fotos */}
          {step === 7 && (
            <>
              <div className="kevphones-sell__question">
                <h2 tabIndex={-1} className="text-2xl sm:text-3xl font-bold text-white mb-2">Enséñanos el estado del iPhone</h2>
                <p className="text-zinc-400">Necesitamos estas fotos para revisar correctamente el dispositivo.</p>
              </div>
              <div className="flex-1  min-h-0 pr-1 sm:pr-2 pb-4">
                <GuidedPhotoUpload
                  requiredPhotos={requiredPhotos}
                  extraPhotos={extraPhotos}
                  disabled={isSubmitting}
                  onRequiredChange={(slot, photo) => setRequiredPhotos(p => ({ ...p, [slot]: photo }))}
                  onExtraAdd={(photo) => setExtraPhotos(p => [...p, photo])}
                  onExtraRemove={(index) => setExtraPhotos(p => p.filter((_, i) => i !== index))}
                />
              </div>
            </>
          )}

          {/* STEP 8: Revisar y enviar */}
          {step === 8 && (
            <>
              <div className="kevphones-sell__question">
                <h2 tabIndex={-1} className="text-2xl sm:text-3xl font-bold text-white mb-2">Revisa tu solicitud</h2>
              </div>
              <div className="flex-1  min-h-0 pr-1 sm:pr-2 space-y-6 pb-4">
                
                {prefillTradeInTarget && (
                  <div className="kevphones-sell__target">
                    <h3 className="text-xs uppercase tracking-widest text-purple-400 font-bold mb-2">Parte de pago para</h3>
                    <p className="text-lg font-medium text-white">
                      {prefillTradeInTarget.modelName}
                      {(prefillTradeInTarget.storage || prefillTradeInTarget.color) && (
                        <span className="text-zinc-400">
                          {' · '}
                          {[prefillTradeInTarget.storage, prefillTradeInTarget.color].filter(Boolean).join(' / ')}
                        </span>
                      )}
                    </p>
                    <p className="text-purple-400 font-bold mt-1">{prefillTradeInTarget.listingPrice} €</p>
                  </div>
                )}

                <div className="kevphones-sell__review space-y-5">
                  <div>
                    <h3 className="text-xs uppercase tracking-widest text-zinc-500 font-bold mb-2">Dispositivo</h3>
                    <p className="text-white">{selectedModel?.name}</p>
                    <p className="text-sm text-zinc-400">
                      {[storage, color].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-xs uppercase tracking-widest text-zinc-500 font-bold mb-2">Estado</h3>
                    <p className="text-white capitalize">{({ sealed: 'Precintado', like_new: 'Como nuevo', good: 'Buen estado', marked: 'Con marcas' } as Record<string, string>)[deviceCondition] || deviceCondition}</p>
                    {deviceCondition !== 'sealed' && batteryHealth && (
                      <p className="text-sm text-zinc-400">Batería: {batteryHealth}% {batteryCycles ? `(${batteryCycles} ciclos)` : ''}</p>
                    )}
                  </div>
                  
                  {deviceCondition !== 'sealed' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-xs uppercase tracking-widest text-zinc-500 font-bold mb-2">Incluye</h3>
                        <ul className="text-sm text-zinc-300 space-y-1">
                          <li>Caja: {hasBox ? 'Sí' : 'No'}</li>
                          <li>Cable: {hasCable ? 'Sí' : 'No'}</li>
                          <li>Factura: {hasInvoice ? 'Sí' : 'No'}</li>
                        </ul>
                      </div>
                      <div>
                        <h3 className="text-xs uppercase tracking-widest text-zinc-500 font-bold mb-2">Funcionamiento</h3>
                        <ul className="text-sm text-zinc-300 space-y-1">
                          <li>Original: {originalParts ? 'Sí' : 'No'}</li>
                          <li>Funciona: {fullyFunctional ? 'Sí' : 'No'}</li>
                          <li>Bloqueado: {blocked ? 'Sí' : 'No'}</li>
                          {officialWarrantyUntil && <li>Garantía: Sí</li>}
                        </ul>
                      </div>
                    </div>
                  )}

                  <div>
                    <h3 className="text-xs uppercase tracking-widest text-zinc-500 font-bold mb-2">Tus datos</h3>
                    <p className="text-white">{customerName}</p>
                    <p className="text-sm text-zinc-400">{customerPhone}</p>
                    {customerLocation && <p className="text-sm text-zinc-400">{customerLocation}</p>}
                  </div>

                  <div>
                    <h3 className="text-xs uppercase tracking-widest text-zinc-500 font-bold mb-2">Fotos</h3>
                    <p className="text-white text-sm">7 fotos obligatorias completas</p>
                    {extraPhotos.length > 0 && (
                      <p className="text-sm text-zinc-400">+{extraPhotos.length} fotos extra</p>
                    )}
                  </div>
                </div>

              </div>
            </>
          )}

          {/* Validation Error Message */}
          {validationError && step < 8 && (
            <div id="sell-validation-error" role="alert" className="mt-4 p-4 bg-red-900/10 border border-red-500/20 rounded-[14px] text-red-400 text-sm font-medium flex-none">
              {validationError}
            </div>
          )}

          {/* Submit Error Message */}
          {submitError && !isSubmitting && (
            <div role="alert" className="mt-4 p-4 bg-red-900/10 border border-red-500/20 rounded-[14px] text-red-400 text-sm font-medium flex-none">
              {submitError}
            </div>
          )}

          {/* BOTTOM NAVIGATION */}
          {!isSubmitting && (
            <div className="kevphones-sell__navigation flex-none flex items-center gap-4 mt-6 pt-6 border-t border-[#1F1F24]">
              {step > 1 && (
                <button
                  onClick={goBack}
                  className="kevphones-sell__back"
                >
                  <span>←</span> Atrás
                </button>
              )}
              
              <div className="flex-1" />
              
              {step < 8 ? (
                <button
                  onClick={goNext}
                  className="kevphones-sell__next"
                >
                  Siguiente
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  className="kevphones-sell__next"
                >
                  Enviar solicitud
                </button>
              )}
            </div>
          )}

          {/* Submitting Overlay */}
          {isSubmitting && (
            <div role="status" aria-live="polite" className="kevphones-sell__loading">
              <div className="bg-[#0B0B0E] border border-[#1F1F24] p-6 rounded-2xl flex flex-col items-center w-full text-center">
                <div className="w-8 h-8 border-[3px] border-purple-500/30 border-t-purple-500 rounded-full animate-spin mb-4" />
                <div className="text-white font-medium mb-1">{submitStatus}</div>
                <p className="text-xs text-zinc-400">Por favor, no cierres esta ventana.</p>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
