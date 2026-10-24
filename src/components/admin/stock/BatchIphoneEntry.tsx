'use client'

import { useCallback, useEffect, useMemo, useRef, useState, type ComponentProps } from 'react'
import Link from 'next/link'
import { NewDeviceForm, type NewDeviceInitialValues, type NewDeviceSubmitResult, type NewDeviceSubmitSummary } from '@/components/admin/stock/NewDeviceForm'
import { useStoryLauncher } from '@/components/admin/stock/useStoryLauncher'
import { parseIphoneBatchAction } from '@/actions/quick-entry'

type FormProps = Omit<ComponentProps<typeof NewDeviceForm>, 'initialValues' | 'mode' | 'embedded' | 'formId' | 'onSubmitResult'>

type Draft = { id: string; values: NewDeviceInitialValues; warnings: string[]; version?: number }
type DraftStatus = { state: 'idle' | 'saving' | 'saved' | 'error' | 'review'; message?: string; deviceId?: string; summary?: NewDeviceSubmitSummary }

const formatEur = (n: number | null | undefined) =>
  typeof n === 'number' ? `${new Intl.NumberFormat('es-ES', { maximumFractionDigits: 2 }).format(n)} €` : '—'

const describeSaved = (s?: NewDeviceSubmitSummary) =>
  s ? [s.modelName, s.storage, s.color].filter(Boolean).join(' · ') : 'iPhone'

const MAX_RECORDING_SECONDS = 120
const MAX_AUDIO_BYTES = 4 * 1024 * 1024
const MIME_CANDIDATES = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/mp4;codecs=mp4a.40.2']

const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

/* ------------------------------------------------------------------ */
/* Tarjeta de borrador                                                 */
/* ------------------------------------------------------------------ */

function DraftCard({
  index, draft, formId, status, formProps, onResult, onStory, storyLoadingId,
}: {
  index: number
  draft: Draft
  formId: string
  status: DraftStatus
  formProps: FormProps
  onResult: (result: NewDeviceSubmitResult) => void
  onStory: (deviceId: string) => void
  storyLoadingId: string | null
}) {
  const [summary, setSummary] = useState('')
  const [missing, setMissing] = useState(0)
  const [userOpen, setUserOpen] = useState(true)
  const open = userOpen || status.state === 'review' || status.state === 'error'

  const refresh = useCallback(() => {
    const form = document.getElementById(formId)
    if (!(form instanceof HTMLFormElement)) return
    const fd = new FormData(form)
    const get = (k: string) => String(fd.get(k) ?? '').trim()
    const modelName = formProps.models.find(m => m.id === get('model_id'))?.name
    const battery = get('battery_health') ? `${get('battery_health')}%${get('battery_cycles') ? ` (${get('battery_cycles')} ciclos)` : ''}` : ''
    const prices = get('purchase_price') || get('listing_price')
      ? `compra ${get('purchase_price') || '—'}€ / venta ${get('listing_price') || '—'}€`
      : ''
    setSummary([modelName, get('storage'), get('color'), battery, prices].filter(Boolean).join(' · '))

    const invalidCount = Array.from(form.elements).filter(el => {
      const f = el as HTMLInputElement
      return f.willValidate && !f.validity.valid
    }).length

    const hasSeller = Boolean(get('seller_client_id') || (get('seller_name') && get('seller_phone')))
    const effectiveMissing = hasSeller ? invalidCount : Math.max(invalidCount, 1)

    setMissing(effectiveMissing)
  }, [formId, formProps.models])

  const refreshSoon = useCallback(() => { setTimeout(refresh, 0) }, [refresh])

  useEffect(() => { refreshSoon() }, [refreshSoon, status.state, draft.version])

  const valid = missing === 0
  let badge: { label: string; cls: string }
  if (status.state === 'saved') badge = { label: 'Guardado', cls: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' }
  else if (status.state === 'saving') badge = { label: 'Guardando...', cls: 'text-[#d7baff] bg-[#7a32d4]/10 border-[#7a32d4]/30' }
  else if (status.state === 'error') badge = { label: 'Error', cls: 'text-red-400 bg-red-500/10 border-red-500/30' }
  else if (status.state === 'review' || !valid) badge = { label: 'Necesita revisión', cls: 'text-amber-300 bg-amber-500/10 border-amber-500/30' }
  else badge = { label: 'Completo', cls: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' }

  return (
    <div
      onChange={refreshSoon}
      onInput={refreshSoon}
      className="bg-[#0B0B0E] border border-[#1F1F24] rounded-2xl p-4 sm:p-6 flex flex-col gap-4"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1 min-w-0">
          <h3 className="text-lg font-extrabold text-white">iPhone {index + 1}</h3>
          <p className="text-sm text-zinc-400 break-words">{summary || 'Sin datos todavía'}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-[11px] font-bold border px-2.5 py-1 rounded-full ${badge.cls}`}>{badge.label}</span>
          {status.state !== 'saved' && (
            <button
              type="button"
              onClick={() => setUserOpen(o => !o)}
              className="text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
            >
              {open ? 'Ocultar' : 'Editar'}
            </button>
          )}
        </div>
      </div>

      {status.state !== 'saved' && status.state !== 'saving' && missing > 0 && (
        <p className="text-xs text-amber-300">
          Faltan {missing} {missing === 1 ? 'campo obligatorio' : 'campos obligatorios'} (por ejemplo, los datos del vendedor).
        </p>
      )}
      {status.state === 'error' && status.message && (
        <p className="text-sm text-red-400 font-semibold">{status.message}</p>
      )}
      {draft.warnings.length > 0 && status.state !== 'saved' && (
        <ul className="bg-amber-500/10 border border-amber-500/20 text-amber-300 p-3 rounded-xl text-xs font-medium flex flex-col gap-1">
          {Array.from(new Set(draft.warnings)).map(w => <li key={w}>{w}</li>)}
        </ul>
      )}

      {status.state === 'saved' && status.deviceId && (
        <div className="flex flex-col gap-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-col gap-0.5 min-w-0">
              <p className="text-sm font-bold text-white break-words">{describeSaved(status.summary)}</p>
              <p className="text-sm text-zinc-300">{formatEur(status.summary?.listingPrice)}</p>
            </div>
            <span className="text-xs font-bold text-emerald-400">Guardado</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onStory(status.deviceId!)}
              disabled={storyLoadingId === status.deviceId}
              className="bg-[#7a32d4] hover:bg-[#8b46e0] text-white font-bold text-sm py-2.5 px-5 rounded-xl transition-all disabled:opacity-60"
            >
              {storyLoadingId === status.deviceId ? 'Cargando...' : 'Generar Story'}
            </button>
            <Link
              href={`/admin/stock/${status.deviceId}`}
              className="border border-[#1F1F24] text-zinc-200 hover:bg-[#1F1F24] font-semibold text-sm py-2.5 px-5 rounded-xl transition-all"
            >
              Ver dispositivo
            </Link>
          </div>
        </div>
      )}

      <div className={open || status.state === 'saved' ? '' : 'hidden'}>
        <NewDeviceForm
          key={`${draft.id}-${draft.version ?? 0}`}
          {...formProps}
          initialValues={draft.values}
          mode="quick"
          embedded
          formId={formId}
          onSubmitResult={onResult}
        />
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Entrada por lotes                                                   */
/* ------------------------------------------------------------------ */

export function BatchIphoneEntry(props: FormProps) {
  // Grabación
  const [recState, setRecState] = useState<'idle' | 'recording' | 'recorded'>('idle')
  const [elapsed, setElapsed] = useState(0)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Transcripción y análisis
  const [text, setText] = useState('')
  const [stage, setStage] = useState<'transcribing' | 'analyzing' | null>(null)
  const [error, setError] = useState('')

  // Stories de dispositivos guardados
  const story = useStoryLauncher()
  const [showStoryList, setShowStoryList] = useState(false)

  // Datos comunes del lote (Vendedor, Fecha y Lugar de compra)
  const [sharedSellerMode, setSharedSellerMode] = useState<'existing' | 'new'>('existing')
  const [sharedClientId, setSharedClientId] = useState<string>('')
  const [sharedClientSearch, setSharedClientSearch] = useState('')
  const [sharedSellerName, setSharedSellerName] = useState('')
  const [sharedSellerPhone, setSharedSellerPhone] = useState('')
  const [sharedSellerLocation, setSharedSellerLocation] = useState('')
  const [sharedPurchasedAt, setSharedPurchasedAt] = useState(new Date().toISOString().split('T')[0])
  const [sharedPurchaseLocation, setSharedPurchaseLocation] = useState('')
  const [sharedError, setSharedError] = useState('')

  const filteredSharedClients = useMemo(() => {
    const list = props.clients ?? []
    if (!sharedClientSearch) return list.slice(0, 5)
    const q = sharedClientSearch.toLowerCase()
    return list.filter(c => c.name.toLowerCase().includes(q) || c.phone.toLowerCase().includes(q))
  }, [props.clients, sharedClientSearch])

  const selectedSharedClient = useMemo(() => {
    return (props.clients ?? []).find(c => c.id === sharedClientId)
  }, [props.clients, sharedClientId])

  const getSharedValues = useCallback((): Partial<NewDeviceInitialValues> => {
    const purchaseFields: Partial<NewDeviceInitialValues> = {
      purchased_at: sharedPurchasedAt.trim() || null,
      purchase_location: sharedPurchaseLocation.trim() || null,
    }

    if (sharedSellerMode === 'existing') {
      return {
        ...purchaseFields,
        seller_client_id: sharedClientId || null,
        seller_name: null,
        seller_phone: null,
        seller_location: null,
      }
    }

    return {
      ...purchaseFields,
      seller_client_id: null,
      seller_name: sharedSellerName.trim() || null,
      seller_phone: sharedSellerPhone.trim() || null,
      seller_location: sharedSellerLocation.trim() || null,
    }
  }, [
    sharedPurchasedAt,
    sharedPurchaseLocation,
    sharedSellerMode,
    sharedClientId,
    sharedSellerName,
    sharedSellerPhone,
    sharedSellerLocation,
  ])

  const isSharedDataComplete = useCallback(() => {
    if (!sharedPurchasedAt) return false
    if (sharedSellerMode === 'existing') return Boolean(sharedClientId)
    return Boolean(sharedSellerName.trim() && sharedSellerPhone.trim())
  }, [sharedPurchasedAt, sharedSellerMode, sharedClientId, sharedSellerName, sharedSellerPhone])

  // Borradores
  const [drafts, setDrafts] = useState<Draft[]>([])
  const [statuses, setStatuses] = useState<Record<string, DraftStatus>>({})
  const [saving, setSaving] = useState(false)
  const resolvers = useRef(new Map<string, (r: NewDeviceSubmitResult) => void>())

  const stopTracks = () => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
  }
  const clearTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = null
  }

  useEffect(() => {
    return () => {
      clearTimer()
      if (recorderRef.current && recorderRef.current.state !== 'inactive') {
        recorderRef.current.onstop = null
        recorderRef.current.stop()
      }
      stopTracks()
    }
  }, [])

  useEffect(() => {
    return () => { if (audioUrl) URL.revokeObjectURL(audioUrl) }
  }, [audioUrl])

  const discardAudio = () => {
    setAudioBlob(null)
    setAudioUrl(null)
    setElapsed(0)
    setRecState('idle')
    chunksRef.current = []
  }

  const stopRecording = () => {
    clearTimer()
    if (recorderRef.current && recorderRef.current.state !== 'inactive') recorderRef.current.stop()
  }

  const startRecording = async () => {
    setError('')
    discardAudio()
    if (typeof MediaRecorder === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setError('Este navegador no permite grabar audio. Prueba con Safari o Chrome actualizados.')
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const mime = MIME_CANDIDATES.find(m => MediaRecorder.isTypeSupported(m))
      const recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined)
      recorderRef.current = recorder
      chunksRef.current = []

      recorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      recorder.onstop = () => {
        const type = recorder.mimeType || mime || 'audio/webm'
        const blob = new Blob(chunksRef.current, { type })
        chunksRef.current = []
        stopTracks()
        if (blob.size === 0) {
          setError('No se grabó ningún audio. Inténtalo de nuevo.')
          setRecState('idle')
          return
        }
        setAudioBlob(blob)
        setAudioUrl(URL.createObjectURL(blob))
        setRecState('recorded')
      }

      const startedAt = Date.now()
      recorder.start()
      setElapsed(0)
      setRecState('recording')
      timerRef.current = setInterval(() => {
        const secs = Math.floor((Date.now() - startedAt) / 1000)
        setElapsed(Math.min(secs, MAX_RECORDING_SECONDS))
        if (secs >= MAX_RECORDING_SECONDS) stopRecording()
      }, 250)
    } catch {
      stopTracks()
      setError('No se pudo acceder al micrófono. Revisa los permisos del navegador.')
      setRecState('idle')
    }
  }

  const analyze = async (textToParse: string) => {
    setStage('analyzing')
    try {
      const result = await parseIphoneBatchAction(textToParse)
      if (result.error !== undefined) {
        setError(result.error)
        return
      }
      const sharedVals = getSharedValues()
      const shouldApply = isSharedDataComplete()
      const next: Draft[] = result.devices.map(d => ({
        id: crypto.randomUUID(),
        values: {
          ...d.values,
          ...(shouldApply ? sharedVals : {}),
        },
        warnings: d.warnings,
        version: 0,
      }))
      setDrafts(next)
      setStatuses({})
    } catch {
      setError('Error inesperado al analizar el lote.')
    } finally {
      setStage(null)
    }
  }

  const handleAnalyze = async () => {
    if (!text.trim()) return
    setError('')
    await analyze(text)
  }

  const handleApplyToAll = () => {
    setSharedError('')
    if (sharedSellerMode === 'existing' && !sharedClientId) {
      setSharedError('Selecciona un cliente existente para poder aplicarlo a todos los dispositivos.')
      return
    }
    if (sharedSellerMode === 'new' && (!sharedSellerName.trim() || !sharedSellerPhone.trim())) {
      setSharedError('Introduce al menos el nombre y teléfono del vendedor antes de aplicar a todos.')
      return
    }
    if (!sharedPurchasedAt) {
      setSharedError('Introduce la fecha de compra antes de aplicar a todos.')
      return
    }

    const sharedVals = getSharedValues()

    setDrafts(prev => prev.map(draft => {
      if (statuses[draft.id]?.state === 'saved') return draft

      // Preserve any technical/product data currently entered in the DOM form
      const form = document.getElementById(`batch-draft-${draft.id}`)
      let currentValues: NewDeviceInitialValues = { ...draft.values }
      if (form instanceof HTMLFormElement) {
        const fd = new FormData(form)
        const getStr = (k: string) => {
          const v = fd.get(k)
          return typeof v === 'string' && v.trim() ? v.trim() : null
        }
        const getNum = (k: string) => {
          const v = fd.get(k)
          if (!v) return null
          const n = Number(v)
          return isNaN(n) ? null : n
        }
        currentValues = {
          ...currentValues,
          model_id: getStr('model_id') ?? currentValues.model_id,
          storage: getStr('storage') ?? currentValues.storage,
          color: getStr('color') ?? currentValues.color,
          imei_serial: getStr('imei_serial'),
          battery_health: getNum('battery_health') ?? currentValues.battery_health,
          battery_cycles: getNum('battery_cycles') ?? currentValues.battery_cycles,
          condition: getStr('condition') ?? currentValues.condition,
          has_box: fd.has('has_box') ? fd.get('has_box') === 'on' : currentValues.has_box,
          has_cable: fd.has('has_cable') ? fd.get('has_cable') === 'on' : currentValues.has_cable,
          has_invoice: fd.has('has_invoice') ? fd.get('has_invoice') === 'on' : currentValues.has_invoice,
          original_parts: fd.has('original_parts') ? fd.get('original_parts') === 'on' : currentValues.original_parts,
          fully_functional: fd.has('fully_functional') ? fd.get('fully_functional') === 'on' : currentValues.fully_functional,
          warranty_until: getStr('warranty_until'),
          purchase_price: getNum('purchase_price') ?? currentValues.purchase_price,
          listing_price: getNum('listing_price') ?? currentValues.listing_price,
          internal_notes: getStr('internal_notes'),
        }
      }

      return {
        ...draft,
        values: {
          ...currentValues,
          ...sharedVals,
        },
        version: (draft.version ?? 0) + 1,
      }
    }))

    // Reset review statuses so cards re-evaluate validity to 'Completo'
    setStatuses(prev => {
      const next = { ...prev }
      for (const draft of drafts) {
        if (next[draft.id]?.state === 'review') {
          delete next[draft.id]
        }
      }
      return next
    })
  }

  const handleTranscribe = async () => {
    if (!audioBlob) return
    if (audioBlob.size > MAX_AUDIO_BYTES) {
      setError('El audio es demasiado grande (máx. 4 MB). Graba un audio más corto.')
      return
    }
    setError('')
    setStage('transcribing')
    try {
      const fd = new FormData()
      fd.append('audio', new File([audioBlob], 'audio', { type: audioBlob.type }))
      const res = await fetch('/api/admin/quick-entry/transcribe', { method: 'POST', body: fd })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || typeof data.text !== 'string') {
        setError(typeof data.error === 'string' ? data.error : 'No se pudo transcribir el audio.')
        setStage(null)
        return
      }
      setText(data.text)
      discardAudio() // el audio no se conserva tras transcribir
      await analyze(data.text)
    } catch {
      setError('Error de red al transcribir el audio.')
      setStage(null)
    }
  }

  const setStatus = (id: string, s: DraftStatus) => setStatuses(prev => ({ ...prev, [id]: s }))

  const handleSaveValid = async () => {
    setSaving(true)
    setError('')
    let firstInvalid: HTMLFormElement | null = null
    try {
      // Secuencial: cada borrador pasa por el createDeviceAction existente (vía su propio formulario).
      for (const draft of drafts) {
        if (statuses[draft.id]?.state === 'saved') continue
        const el = document.getElementById(`batch-draft-${draft.id}`)
        if (!(el instanceof HTMLFormElement)) continue

        if (!el.checkValidity()) {
          setStatus(draft.id, { state: 'review' })
          if (!firstInvalid) firstInvalid = el
          continue
        }

        setStatus(draft.id, { state: 'saving' })
        const result = await new Promise<NewDeviceSubmitResult>(resolve => {
          resolvers.current.set(draft.id, resolve)
          el.requestSubmit()
        })
        setStatus(draft.id, result.success ? { state: 'saved', deviceId: result.deviceId, summary: result.summary } : { state: 'error', message: result.error || 'Error al guardar.' })
      }
    } finally {
      setSaving(false)
    }
    const target = firstInvalid as HTMLFormElement | null
    if (target) setTimeout(() => target.reportValidity(), 50)
  }

  const handleResult = (id: string) => (result: NewDeviceSubmitResult) => {
    const resolve = resolvers.current.get(id)
    if (resolve) {
      resolvers.current.delete(id)
      resolve(result)
    }
  }

  const savedCount = drafts.filter(d => statuses[d.id]?.state === 'saved').length
  const errorCount = drafts.filter(d => statuses[d.id]?.state === 'error').length
  const reviewCount = drafts.filter(d => statuses[d.id]?.state === 'review').length
  const allSaved = drafts.length > 0 && savedCount === drafts.length
  const busy = stage !== null || saving

  const resetBatch = () => {
    if (savedCount < drafts.length && drafts.length > 0 && !window.confirm('Hay borradores sin guardar que se perderán. ¿Registrar otro lote?')) return
    stopRecording()
    discardAudio()
    setText('')
    setDrafts([])
    setStatuses({})
    setShowStoryList(false)
    setError('')
    setSharedError('')
    setSharedClientId('')
    setSharedClientSearch('')
    setSharedSellerName('')
    setSharedSellerPhone('')
    setSharedSellerLocation('')
    setSharedPurchasedAt(new Date().toISOString().split('T')[0])
    setSharedPurchaseLocation('')
  }

  return (
    <div className="flex flex-col gap-6 lg:gap-8">
      {/* Entrada manual / dictado de varios iPhone */}
      <section className="bg-[#0B0B0E] border border-[#1F1F24] rounded-2xl p-6 flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="batch-entry-text" className="text-[13px] font-semibold text-zinc-400">
            Describe varios iPhone
          </label>
          <p className="text-xs text-zinc-500">
            Puedes escribir, pegar texto o usar el dictado del teclado.
          </p>
          <textarea
            id="batch-entry-text"
            value={text}
            onChange={e => setText(e.target.value)}
            rows={6}
            maxLength={6000}
            placeholder="Tengo tres iPhone. Todos con caja, cable, piezas originales y funcionando correctamente. Primero: iPhone 15 Pro 256 GB Natural Titanium, batería 89%, 317 ciclos, como nuevo, compra 430€, venta 579€. Segundo: iPhone 14 128 GB Midnight, batería 86%, buen estado, compra 280€, venta 399€. Tercero: iPhone 18 Pro 256 GB Glacier, precintado, compra 1050€, venta 1350€."
            className="w-full bg-[#121217] border border-[#1F1F24] rounded-xl px-4 py-3 text-[15px] text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#7a32d4]/50 focus:ring-1 focus:ring-[#7a32d4]/50 transition-all resize-y"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleAnalyze}
            disabled={busy || !text.trim() || savedCount > 0}
            className="w-full sm:w-auto bg-[#7a32d4]/10 hover:bg-[#7a32d4]/20 border border-[#7a32d4]/30 text-[#d7baff] font-bold text-sm py-3.5 px-8 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
            {stage === 'analyzing' ? 'Analizando...' : 'Analizar lote'}
          </button>
          {drafts.length > 0 && (
            <button
              type="button"
              onClick={handleAnalyze}
              disabled={busy || !text.trim() || savedCount > 0}
              className="w-full sm:w-auto bg-[#121217] hover:bg-[#1F1F24] border border-[#1F1F24] text-zinc-200 font-semibold text-sm py-3.5 px-5 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">refresh</span>
              {stage === 'analyzing' ? 'Analizando...' : 'Volver a analizar'}
            </button>
          )}
          {savedCount > 0 && (
            <span className="text-xs text-zinc-500">No se puede volver a analizar una vez guardados dispositivos del lote.</span>
          )}
        </div>

        {stage && (
          <p className="text-sm text-[#d7baff] font-semibold">
            {stage === 'transcribing' ? 'Transcribiendo audio…' : 'Analizando lote…'}
          </p>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm font-semibold">
            {error}
          </div>
        )}
      </section>

      {/* Grabación de audio */}
      <section className="bg-[#0B0B0E] border border-[#1F1F24] rounded-2xl p-6 flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-[13px] font-semibold text-zinc-400">Describe varios iPhone en un solo audio</h2>
          <p className="text-xs text-zinc-500">
            Ejemplo: «Primero un iPhone 15 Pro de 256 Natural Titanium, batería 89, compra 430, venta 579. Segundo un iPhone 14 de 128 Midnight… todos con caja y cable». Máximo 2 minutos.
          </p>
        </div>

        {recState === 'idle' && (
          <button
            type="button"
            onClick={startRecording}
            disabled={busy}
            className="self-start bg-[#7a32d4]/10 hover:bg-[#7a32d4]/20 border border-[#7a32d4]/30 text-[#d7baff] font-bold text-sm py-3.5 px-8 rounded-xl transition-all disabled:opacity-50 flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">mic</span>
            Grabar audio
          </button>
        )}

        {recState === 'recording' && (
          <div className="flex flex-wrap items-center gap-4 bg-red-500/10 border border-red-500/20 rounded-xl p-4">
            <span className="flex items-center gap-2 text-red-400 font-bold text-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
              Grabando… {formatTime(elapsed)} / {formatTime(MAX_RECORDING_SECONDS)}
            </span>
            <button
              type="button"
              onClick={stopRecording}
              className="bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-200 font-bold text-sm py-2.5 px-5 rounded-xl transition-all flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">stop_circle</span>
              Detener
            </button>
          </div>
        )}

        {recState === 'recorded' && audioUrl && (
          <div className="flex flex-col gap-3 bg-[#121217] border border-[#1F1F24] rounded-xl p-4">
            <span className="text-xs text-zinc-400">Audio grabado ({formatTime(elapsed)}). Escúchalo antes de procesarlo.</span>
            <audio controls src={audioUrl} className="w-full" />
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleTranscribe}
                disabled={busy}
                className="bg-[#7a32d4]/10 hover:bg-[#7a32d4]/20 border border-[#7a32d4]/30 text-[#d7baff] font-bold text-sm py-2.5 px-5 rounded-xl transition-all disabled:opacity-50 flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                {stage === 'transcribing' ? 'Transcribiendo...' : stage === 'analyzing' ? 'Analizando...' : 'Transcribir y rellenar'}
              </button>
              <button
                type="button"
                onClick={startRecording}
                disabled={busy}
                className="border border-[#1F1F24] text-zinc-300 hover:bg-[#1F1F24] font-semibold text-sm py-2.5 px-4 rounded-xl transition-all disabled:opacity-50"
              >
                Volver a grabar
              </button>
              <button
                type="button"
                onClick={discardAudio}
                disabled={busy}
                className="text-zinc-400 hover:text-white font-semibold text-sm py-2.5 px-3 transition-colors disabled:opacity-50"
              >
                Descartar
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Borradores */}
      {drafts.length > 0 && (
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-extrabold text-white">
              {drafts.length} {drafts.length === 1 ? 'iPhone detectado' : 'iPhone detectados'}
            </h2>
            <p className="text-sm text-zinc-400">
              Revisa cada tarjeta. Cada iPhone necesita sus datos de vendedor para poder guardarse.
            </p>
          </div>

          {/* Datos comunes del lote */}
          <section className="bg-[#0B0B0E] border border-[#1F1F24] rounded-2xl p-6 flex flex-col gap-5">
            <div className="flex flex-col gap-1 border-b border-[#1F1F24] pb-3">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-[#d7baff]">group_work</span>
                Datos comunes del lote
              </h3>
              <p className="text-xs text-zinc-400">
                Aplica el mismo vendedor y fecha/lugar de compra a todos los dispositivos del lote con un solo clic.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              {/* Vendedor */}
              <div className="flex flex-col gap-3">
                <label className="text-[13px] font-semibold text-zinc-400 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px]">person</span>
                  Vendedor
                </label>

                {/* Toggle Cliente existente / Nuevo cliente */}
                <div className="flex p-1 bg-[#121217] rounded-xl border border-[#1F1F24] w-fit">
                  <button
                    type="button"
                    onClick={() => { setSharedSellerMode('existing'); setSharedError('') }}
                    className={`px-4 py-2 rounded-lg text-[13px] font-semibold transition-colors ${
                      sharedSellerMode === 'existing' ? 'bg-[#7a32d4]/10 text-[#d7baff]' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Cliente existente
                  </button>
                  <button
                    type="button"
                    onClick={() => { setSharedSellerMode('new'); setSharedError('') }}
                    className={`px-4 py-2 rounded-lg text-[13px] font-semibold transition-colors ${
                      sharedSellerMode === 'new' ? 'bg-[#7a32d4]/10 text-[#d7baff]' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Nuevo cliente
                  </button>
                </div>

                {sharedSellerMode === 'existing' && (
                  <div className="flex flex-col gap-2">
                    {selectedSharedClient ? (
                      <div className="bg-[#121217] border border-[#7a32d4]/30 rounded-xl p-4 flex justify-between items-start">
                        <div className="flex flex-col">
                          <span className="text-white font-bold">{selectedSharedClient.name}</span>
                          <span className="text-zinc-400 text-sm">
                            {selectedSharedClient.phone}
                            {selectedSharedClient.location ? ` · ${selectedSharedClient.location}` : ''}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSharedClientId('')}
                          className="text-zinc-500 hover:text-white"
                          title="Quitar selección"
                        >
                          <span className="material-symbols-outlined text-[18px]">close</span>
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        <div className="relative">
                          <span className="material-symbols-outlined absolute left-3 top-3 text-zinc-500 text-[18px]">search</span>
                          <input
                            type="text"
                            placeholder="Buscar por nombre o teléfono..."
                            value={sharedClientSearch}
                            onChange={e => setSharedClientSearch(e.target.value)}
                            className="w-full bg-[#121217] border border-[#1F1F24] rounded-xl pl-10 pr-4 py-2.5 text-[14px] text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#7a32d4]/50 focus:ring-1 focus:ring-[#7a32d4]/50 transition-all"
                          />
                        </div>
                        {sharedClientSearch && filteredSharedClients.length > 0 && (
                          <div className="flex flex-col bg-[#121217] border border-[#1F1F24] rounded-xl overflow-hidden max-h-[180px] overflow-y-auto">
                            {filteredSharedClients.map(client => (
                              <button
                                key={client.id}
                                type="button"
                                onClick={() => {
                                  setSharedClientId(client.id)
                                  setSharedClientSearch('')
                                }}
                                className="flex flex-col items-start p-3 hover:bg-[#1F1F24] transition-colors border-b border-[#1F1F24] last:border-0 text-left"
                              >
                                <span className="text-white text-sm font-semibold">{client.name}</span>
                                <span className="text-zinc-400 text-xs">
                                  {client.phone}{client.location ? ` · ${client.location}` : ''}
                                </span>
                              </button>
                            ))}
                          </div>
                        )}
                        {sharedClientSearch && filteredSharedClients.length === 0 && (
                          <div className="text-center p-3 text-sm text-zinc-500">
                            No se encontraron clientes.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {sharedSellerMode === 'new' && (
                  <div className="flex flex-col gap-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-zinc-400">Nombre *</label>
                        <input
                          type="text"
                          value={sharedSellerName}
                          onChange={e => setSharedSellerName(e.target.value)}
                          placeholder="Ej. Juan Pérez"
                          className="bg-[#121217] border border-[#1F1F24] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#7a32d4]/50"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-zinc-400">Teléfono *</label>
                        <input
                          type="text"
                          value={sharedSellerPhone}
                          onChange={e => setSharedSellerPhone(e.target.value)}
                          placeholder="Ej. 600 000 000"
                          className="bg-[#121217] border border-[#1F1F24] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#7a32d4]/50"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-zinc-400">Ubicación (Opcional)</label>
                      <input
                        type="text"
                        value={sharedSellerLocation}
                        onChange={e => setSharedSellerLocation(e.target.value)}
                        placeholder="Ej. Las Palmas"
                        className="bg-[#121217] border border-[#1F1F24] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#7a32d4]/50"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Fecha y Lugar de compra */}
              <div className="flex flex-col gap-3">
                <label className="text-[13px] font-semibold text-zinc-400 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px]">receipt_long</span>
                  Datos de compra
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-zinc-400">Fecha de compra *</label>
                    <input
                      type="date"
                      value={sharedPurchasedAt}
                      onChange={e => setSharedPurchasedAt(e.target.value)}
                      className="bg-[#121217] border border-[#1F1F24] rounded-xl px-3.5 py-2.5 text-sm text-white [color-scheme:dark] focus:outline-none focus:border-[#7a32d4]/50"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-zinc-400">Lugar de compra (Opcional)</label>
                    <input
                      type="text"
                      value={sharedPurchaseLocation}
                      onChange={e => setSharedPurchaseLocation(e.target.value)}
                      placeholder="Ej. Particular, Wallapop..."
                      className="bg-[#121217] border border-[#1F1F24] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#7a32d4]/50"
                    />
                  </div>
                </div>
              </div>
            </div>

            {sharedError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-xs font-semibold">
                {sharedError}
              </div>
            )}

            <div className="pt-2 border-t border-[#1F1F24] flex items-center justify-between flex-wrap gap-3">
              <button
                type="button"
                onClick={handleApplyToAll}
                disabled={busy}
                className="bg-[#7a32d4]/10 hover:bg-[#7a32d4]/20 border border-[#7a32d4]/30 text-[#d7baff] font-bold text-sm py-2.5 px-6 rounded-xl transition-all disabled:opacity-50 flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">done_all</span>
                Aplicar a todos
              </button>
              <span className="text-xs text-zinc-500">
                Copia el vendedor, fecha y lugar de compra a los {drafts.length} {drafts.length === 1 ? 'dispositivo' : 'dispositivos'} del lote.
              </span>
            </div>
          </section>

          {drafts.map((draft, i) => (
            <DraftCard
              key={draft.id}
              index={i}
              draft={draft}
              formId={`batch-draft-${draft.id}`}
              status={statuses[draft.id] ?? { state: 'idle' }}
              formProps={props}
              onResult={handleResult(draft.id)}
              onStory={story.open}
              storyLoadingId={story.loadingId}
            />
          ))}

          <div className="flex flex-col gap-3 bg-[#0B0B0E] border border-[#1F1F24] rounded-2xl p-6">
            {(savedCount > 0 || errorCount > 0 || reviewCount > 0) && (
              <p className="text-sm text-zinc-300 font-medium">
                Guardados: <span className="text-emerald-400 font-bold">{savedCount}</span>
                {' · '}Errores: <span className="text-red-400 font-bold">{errorCount}</span>
                {' · '}Necesitan revisión: <span className="text-amber-300 font-bold">{reviewCount}</span>
              </p>
            )}
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleSaveValid}
                disabled={busy || allSaved}
                className="w-full sm:w-auto bg-[#7a32d4]/10 hover:bg-[#7a32d4]/20 border border-[#7a32d4]/30 text-[#d7baff] font-bold text-sm py-4 px-10 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">cloud_upload</span>
                {saving ? 'Guardando...' : 'Guardar dispositivos válidos'}
              </button>
              {savedCount > 0 && !saving && (
                <button
                  type="button"
                  onClick={resetBatch}
                  className="w-full sm:w-auto border border-[#1F1F24] text-zinc-200 hover:bg-[#1F1F24] font-semibold text-sm py-4 px-8 rounded-xl transition-all"
                >
                  Registrar otro lote
                </button>
              )}
              {savedCount >= 2 && (
                <button
                  type="button"
                  onClick={() => setShowStoryList(v => !v)}
                  className="w-full sm:w-auto border border-[#7a32d4]/30 text-[#d7baff] hover:bg-[#7a32d4]/10 font-semibold text-sm py-4 px-8 rounded-xl transition-all"
                >
                  Generar Stories
                </button>
              )}
            </div>
            {story.error && <p className="text-sm text-red-400 font-semibold">{story.error}</p>}
            {savedCount >= 2 && showStoryList && (
              <ul className="flex flex-col divide-y divide-[#1F1F24] border border-[#1F1F24] rounded-xl">
                {drafts.filter(d => statuses[d.id]?.state === 'saved' && statuses[d.id]?.deviceId).map(d => {
                  const st = statuses[d.id]
                  return (
                    <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 p-3">
                      <span className="text-sm text-zinc-200 break-words min-w-0">
                        {describeSaved(st.summary)} · {formatEur(st.summary?.listingPrice)}
                      </span>
                      <button
                        type="button"
                        onClick={() => story.open(st.deviceId!)}
                        disabled={story.loadingId === st.deviceId}
                        className="bg-[#7a32d4] hover:bg-[#8b46e0] text-white font-bold text-xs py-2 px-4 rounded-lg disabled:opacity-60"
                      >
                        {story.loadingId === st.deviceId ? 'Cargando...' : 'Generar Story'}
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>
      )}
      {story.modal}
    </div>
  )
}
