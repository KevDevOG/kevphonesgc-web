'use client'

import React, { useState, useEffect } from 'react'
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
  const [step, setStep] = useState(0) // 0: Category, 1: Device, 2: Condition, 3: Data, 4: Photos
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState('')
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)

  // Form State
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
          setStep(1) // Skip category selection if prefilled
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
    setStep(0)
  }

  const selectedModel = models.find(m => m.id === modelId)
  const availableStorages = variants.filter(v => v.model_id === modelId && v.variant_type === 'storage')
  const availableColors = variants.filter(v => v.model_id === modelId && v.variant_type === 'color')

  const handleNext = () => setStep(s => s + 1)
  const handleBack = () => setStep(s => s - 1)

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

  if (isSuccess) {
    return (
      <div className="text-center py-20 px-4 bg-zinc-900/30 rounded-3xl border border-zinc-800/50 mt-8">
        <div className="w-20 h-20 bg-purple-500/20 text-purple-400 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-3xl font-semibold mb-4">Solicitud enviada</h2>
        <p className="text-zinc-300 text-lg mb-3 max-w-md mx-auto">
          Hemos recibido los datos y las fotos de tu dispositivo. Revisaremos la solicitud y nos pondremos en contacto contigo.
        </p>
        <p className="text-zinc-500 text-sm mb-10 max-w-sm mx-auto">
          La valoración final se confirmará después de revisar el dispositivo en persona.
        </p>
        <Link href="/" className="inline-block bg-white text-black px-8 py-4 rounded-xl font-medium hover:bg-zinc-200 transition-colors">
          Volver al inicio
        </Link>
      </div>
    )
  }

  // Step 0: Category
  if (step === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-medium mb-6">¿Qué dispositivo quieres vender?</h2>
        
        <button onClick={() => setStep(1)} className="w-full text-left p-6 rounded-2xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 transition-colors flex items-center justify-between group">
          <div>
            <div className="text-lg font-medium text-white mb-1">iPhone</div>
            <div className="text-sm text-zinc-400">Vender mi iPhone usado o precintado</div>
          </div>
          <div className="text-purple-400 transform group-hover:translate-x-1 transition-transform">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </button>

        <button disabled className="w-full text-left p-6 rounded-2xl border border-zinc-800/50 bg-zinc-900/20 opacity-60 flex items-center justify-between cursor-not-allowed">
          <div>
            <div className="text-lg font-medium text-white mb-1">PS5</div>
            <div className="text-sm text-zinc-500">Próximamente</div>
          </div>
        </button>

        <button disabled className="w-full text-left p-6 rounded-2xl border border-zinc-800/50 bg-zinc-900/20 opacity-60 flex items-center justify-between cursor-not-allowed">
          <div>
            <div className="text-lg font-medium text-white mb-1">Nintendo Switch</div>
            <div className="text-sm text-zinc-500">Próximamente</div>
          </div>
        </button>
      </div>
    )
  }

  // Steps Header
  const stepsList = ['Dispositivo', 'Estado', 'Datos', 'Fotos']
  const currentStepIndex = step - 1

  return (
    <div>
      <div className="flex items-center gap-2 mb-10 overflow-x-auto pb-4 scrollbar-none">
        {stepsList.map((s, i) => (
          <React.Fragment key={s}>
            <div className={`flex items-center gap-2 text-sm font-medium whitespace-nowrap transition-colors ${currentStepIndex >= i ? 'text-purple-400' : 'text-zinc-600'}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border transition-colors ${currentStepIndex >= i ? 'border-purple-400 bg-purple-400/10' : 'border-zinc-700 bg-zinc-900/50'}`}>
                {i + 1}
              </div>
              {s}
            </div>
            {i < stepsList.length - 1 && <div className={`w-8 md:w-12 h-[2px] rounded-full transition-colors ${currentStepIndex > i ? 'bg-purple-400/50' : 'bg-zinc-800'}`} />}
          </React.Fragment>
        ))}
      </div>

      <div className="relative">
        {isPrefilled && (
          <div className="mb-6 p-4 bg-purple-900/20 border border-purple-500/30 rounded-xl flex items-center justify-between animate-in fade-in">
            <div>
              <p className="text-purple-300 font-medium mb-1">Datos importados desde tu valoración</p>
              <p className="text-zinc-400 text-sm">Revisa que la información sea correcta antes de enviar la solicitud.</p>
            </div>
            <button 
              onClick={handleClearPrefill}
              className="text-xs text-zinc-400 hover:text-white px-3 py-1.5 bg-zinc-900 rounded-lg transition-colors border border-zinc-700 hover:border-zinc-500"
            >
              Empezar de cero
            </button>
          </div>
        )}

        {prefillTradeInTarget && (
          <div className="mb-6 p-6 bg-zinc-900 border border-[#9867db]/30 rounded-2xl flex flex-col items-center shadow-lg text-center animate-in fade-in">
            <h2 className="text-sm uppercase tracking-widest text-[#6E6E78] font-bold mb-2">Parte de pago para</h2>
            <p className="text-xl font-medium text-white mb-1">
              {prefillTradeInTarget.modelName}
              {(prefillTradeInTarget.storage || prefillTradeInTarget.color) && (
                <span className="text-zinc-400">
                  {' · '}
                  {[prefillTradeInTarget.storage, prefillTradeInTarget.color].filter(Boolean).join(' / ')}
                </span>
              )}
            </p>
            <p className="text-2xl font-bold text-[#9867db] mb-4">{prefillTradeInTarget.listingPrice} €</p>
            <p className="text-sm text-zinc-400 max-w-md mx-auto">
              Enviaremos tu solicitud para revisar tu iPhone y confirmar la diferencia final.
            </p>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-3">Modelo</label>
              <select
                value={modelId}
                onChange={(e) => {
                  setModelId(e.target.value)
                  setStorage('')
                  setColor('')
                }}
                className="w-full p-4 bg-zinc-900 border border-zinc-800 rounded-xl text-white outline-none focus:border-purple-500/80 focus:ring-1 focus:ring-purple-500/50 transition-all appearance-none"
              >
                <option value="">Selecciona un modelo</option>
                {models.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>

            {availableStorages.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-3">Almacenamiento</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {availableStorages.map(v => (
                    <button
                      key={v.value}
                      onClick={() => setStorage(v.value)}
                      className={`p-4 text-sm font-medium rounded-xl border transition-all ${storage === v.value ? 'bg-purple-500/10 border-purple-500 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.15)]' : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-600 hover:bg-zinc-800'}`}
                    >
                      {v.value}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {availableColors.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-3">Color</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {availableColors.map(v => (
                    <button
                      key={v.value}
                      onClick={() => setColor(v.value)}
                      className={`p-4 text-sm font-medium rounded-xl border transition-all ${color === v.value ? 'bg-purple-500/10 border-purple-500 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.15)]' : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-600 hover:bg-zinc-800'}`}
                    >
                      {v.value}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-4">Estado general</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { id: 'sealed', label: 'Precintado', desc: 'Nuevo sin abrir' },
                  { id: 'like_new', label: 'Como nuevo', desc: 'Impecable, sin marcas' },
                  { id: 'good', label: 'Buen estado', desc: 'Marcas ligeras de uso' },
                  { id: 'marked', label: 'Con marcas', desc: 'Golpes o roces visibles' }
                ].map(c => (
                  <button
                    key={c.id}
                    onClick={() => setDeviceCondition(c.id)}
                    className={`p-5 rounded-xl border text-left transition-all ${deviceCondition === c.id ? 'bg-purple-500/10 border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.15)]' : 'bg-zinc-900 border-zinc-800 hover:border-zinc-600 hover:bg-zinc-800'}`}
                  >
                    <div className={`font-medium ${deviceCondition === c.id ? 'text-purple-300' : 'text-white'}`}>{c.label}</div>
                    <div className={`text-sm mt-1 ${deviceCondition === c.id ? 'text-purple-400/70' : 'text-zinc-500'}`}>{c.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {deviceCondition !== 'sealed' && (
              <>
                {selectedModel?.supports_battery_health && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-zinc-400 mb-2">Salud batería (%)</label>
                      <input
                        type="number"
                        min="0" max="100"
                        value={batteryHealth}
                        onChange={e => setBatteryHealth(e.target.value)}
                        className="w-full p-4 bg-zinc-900 border border-zinc-800 rounded-xl text-white outline-none focus:border-purple-500/80 focus:ring-1 focus:ring-purple-500/50 transition-all"
                        placeholder="Ej: 95"
                      />
                    </div>
                    {selectedModel?.supports_cycles && (
                      <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-2">Ciclos</label>
                        <input
                          type="number"
                          min="0"
                          value={batteryCycles}
                          onChange={e => setBatteryCycles(e.target.value)}
                          className="w-full p-4 bg-zinc-900 border border-zinc-800 rounded-xl text-white outline-none focus:border-purple-500/80 focus:ring-1 focus:ring-purple-500/50 transition-all"
                          placeholder="Ej: 120"
                        />
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-4">Accesorios incluidos</label>
                  <div className="flex flex-wrap gap-6">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input type="checkbox" checked={hasBox} onChange={e => setHasBox(e.target.checked)} className="accent-purple-500 w-5 h-5 rounded-md bg-zinc-900 border-zinc-800" />
                      <span className="text-zinc-300 group-hover:text-white transition-colors">Caja</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input type="checkbox" checked={hasCable} onChange={e => setHasCable(e.target.checked)} className="accent-purple-500 w-5 h-5 rounded-md bg-zinc-900 border-zinc-800" />
                      <span className="text-zinc-300 group-hover:text-white transition-colors">Cable</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input type="checkbox" checked={hasInvoice} onChange={e => setHasInvoice(e.target.checked)} className="accent-purple-500 w-5 h-5 rounded-md bg-zinc-900 border-zinc-800" />
                      <span className="text-zinc-300 group-hover:text-white transition-colors">Factura</span>
                    </label>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <label className="flex items-start gap-4 cursor-pointer p-5 bg-zinc-900/40 border border-zinc-800/80 hover:border-zinc-700 rounded-xl transition-colors">
                    <input type="checkbox" checked={!originalParts} onChange={e => setOriginalParts(!e.target.checked)} className="accent-purple-500 mt-1 w-5 h-5" />
                    <div>
                      <span className="text-base font-medium text-zinc-200 block mb-1">Piezas reemplazadas</span>
                      <span className="text-sm text-zinc-500 leading-snug block">Marca esta opción si el dispositivo tiene piezas no originales (pantalla, batería, etc).</span>
                    </div>
                  </label>
                  <label className="flex items-start gap-4 cursor-pointer p-5 bg-zinc-900/40 border border-zinc-800/80 hover:border-zinc-700 rounded-xl transition-colors">
                    <input type="checkbox" checked={!fullyFunctional} onChange={e => setFullyFunctional(!e.target.checked)} className="accent-purple-500 mt-1 w-5 h-5" />
                    <div>
                      <span className="text-base font-medium text-zinc-200 block mb-1">Tiene algún fallo</span>
                      <span className="text-sm text-zinc-500 leading-snug block">Marca esta opción si falla FaceID, cámaras, altavoz, vibración o micrófonos.</span>
                    </div>
                  </label>
                </div>
              </>
            )}

            <div>
              <label className="flex items-start gap-4 cursor-pointer p-5 border border-red-900/30 bg-red-900/10 hover:bg-red-900/20 rounded-xl transition-colors">
                <input type="checkbox" checked={blocked} onChange={e => setBlocked(e.target.checked)} className="accent-red-500 mt-1 w-5 h-5" />
                <div>
                  <span className="text-base font-medium text-red-300 block">¿Está bloqueado por operadora o iCloud?</span>
                </div>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Garantía oficial hasta (Opcional)</label>
              <input
                type="date"
                value={officialWarrantyUntil}
                onChange={e => setOfficialWarrantyUntil(e.target.value)}
                className="w-full p-4 bg-zinc-900 border border-zinc-800 rounded-xl text-white outline-none focus:border-purple-500/80 focus:ring-1 focus:ring-purple-500/50 transition-all [color-scheme:dark]"
              />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Nombre completo *</label>
              <input
                type="text"
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                className="w-full p-4 bg-zinc-900 border border-zinc-800 rounded-xl text-white outline-none focus:border-purple-500/80 focus:ring-1 focus:ring-purple-500/50 transition-all"
                placeholder="Tu nombre y apellidos"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Teléfono *</label>
              <input
                type="tel"
                value={customerPhone}
                onChange={e => setCustomerPhone(e.target.value)}
                className="w-full p-4 bg-zinc-900 border border-zinc-800 rounded-xl text-white outline-none focus:border-purple-500/80 focus:ring-1 focus:ring-purple-500/50 transition-all"
                placeholder="+34 600 00 00 00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Ubicación (Opcional)</label>
              <input
                type="text"
                value={customerLocation}
                onChange={e => setCustomerLocation(e.target.value)}
                className="w-full p-4 bg-zinc-900 border border-zinc-800 rounded-xl text-white outline-none focus:border-purple-500/80 focus:ring-1 focus:ring-purple-500/50 transition-all"
                placeholder="Ciudad o municipio"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Notas adicionales (Opcional)</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full p-4 bg-zinc-900 border border-zinc-800 rounded-xl text-white outline-none focus:border-purple-500/80 focus:ring-1 focus:ring-purple-500/50 transition-all min-h-[120px] resize-y"
                placeholder="¿Algo más que debamos saber sobre el dispositivo?"
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
                  He leído y acepto la política de privacidad. Consiento el tratamiento de mis datos para la valoración del dispositivo.
                </span>
              </label>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            <GuidedPhotoUpload
              requiredPhotos={requiredPhotos}
              extraPhotos={extraPhotos}
              disabled={isSubmitting}
              onRequiredChange={(slot, photo) => setRequiredPhotos(p => ({ ...p, [slot]: photo }))}
              onExtraAdd={(photo) => setExtraPhotos(p => [...p, photo])}
              onExtraRemove={(index) => setExtraPhotos(p => p.filter((_, i) => i !== index))}
            />
          </div>
        )}

        {/* Lock overlay when submitting */}
        {isSubmitting && (
          <div className="absolute inset-0 z-10 bg-[#0a0a0a]/80 backdrop-blur-[2px] rounded-2xl flex flex-col items-center justify-center -mx-4 px-4">
            <div className="bg-zinc-900/90 border border-zinc-800 p-8 rounded-2xl shadow-2xl flex flex-col items-center max-w-sm w-full text-center">
              <div className="w-12 h-12 border-[3px] border-purple-500/30 border-t-purple-500 rounded-full animate-spin mb-6" />
              <div className="text-lg font-medium text-white mb-2">{submitStatus}</div>
              <p className="text-sm text-zinc-400">Por favor, no cierres esta ventana.</p>
            </div>
          </div>
        )}
      </div>

      {submitError && !isSubmitting && (
        <div className="mt-8 p-4 bg-red-900/20 border border-red-900/50 text-red-400 text-sm rounded-xl text-center font-medium animate-in fade-in">
          {submitError}
        </div>
      )}

      <div className="mt-12 flex gap-4 pt-6 border-t border-zinc-800/50 pb-8">
        <button
          onClick={handleBack}
          disabled={isSubmitting}
          className="px-6 py-4 rounded-xl font-medium text-white bg-zinc-800 hover:bg-zinc-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Atrás
        </button>
        
        {step < 4 ? (
          <button
            onClick={handleNext}
            disabled={
              (step === 1 && (!modelId || (availableStorages.length > 0 && !storage) || (availableColors.length > 0 && !color))) ||
              (step === 3 && (!customerName || !customerPhone || !acceptedPrivacy)) ||
              isSubmitting
            }
            className="flex-1 px-6 py-4 rounded-xl font-semibold text-black bg-white hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Siguiente paso
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={Object.values(requiredPhotos).filter(Boolean).length < 7 || isSubmitting}
            className="flex-1 px-6 py-4 rounded-xl font-semibold text-white bg-purple-600 hover:bg-purple-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(147,51,234,0.3)] hover:shadow-[0_0_30px_rgba(147,51,234,0.5)] disabled:shadow-none"
          >
            Enviar solicitud
          </button>
        )}
      </div>
    </div>
  )
}
