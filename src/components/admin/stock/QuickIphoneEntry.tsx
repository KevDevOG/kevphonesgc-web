'use client'

import { useEffect, useMemo, useRef, useState, type ComponentProps } from 'react'
import Link from 'next/link'
import { NewDeviceForm, type NewDeviceInitialValues, type NewDeviceSubmitResult } from '@/components/admin/stock/NewDeviceForm'
import { parseIphoneQuickEntryAction, scanIphoneLabelAction } from '@/actions/quick-entry'
import { BatchIphoneEntry } from '@/components/admin/stock/BatchIphoneEntry'
import { useStoryLauncher } from '@/components/admin/stock/useStoryLauncher'

type FormProps = Omit<ComponentProps<typeof NewDeviceForm>, 'initialValues' | 'mode'>
type SourceResult = { values: NewDeviceInitialValues; warnings: string[] }

const MAX_IMAGE_BYTES = 8 * 1024 * 1024
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
// Server actions have a ~1 MB body limit, so the label is downscaled before sending.
const MAX_UPLOAD_BYTES = 900 * 1024
const RESIZE_STEPS: [number, number][] = [[1600, 0.85], [1600, 0.7], [1280, 0.6], [1024, 0.5]]

async function prepareLabelImage(file: File): Promise<Blob> {
  const url = URL.createObjectURL(file)
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image()
      el.onload = () => resolve(el)
      el.onerror = () => reject(new Error('decode'))
      el.src = url
    })
    for (const [maxSide, quality] of RESIZE_STEPS) {
      const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.naturalWidth * scale)
      canvas.height = Math.round(img.naturalHeight * scale)
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
      const blob = await new Promise<Blob | null>(res => canvas.toBlob(res, 'image/jpeg', quality))
      if (blob && blob.size <= MAX_UPLOAD_BYTES) return blob
    }
    throw new Error('too-large')
  } finally {
    URL.revokeObjectURL(url)
  }
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '')

export function QuickIphoneEntry(props: FormProps) {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [textResult, setTextResult] = useState<SourceResult | null>(null)

  const [entryMode, setEntryMode] = useState<'single' | 'batch'>('single')
  const [scanFile, setScanFile] = useState<File | null>(null)
  const [scanPreview, setScanPreview] = useState<string | null>(null)
  const [scanning, setScanning] = useState(false)
  const [scanError, setScanError] = useState('')
  const [scanResult, setScanResult] = useState<SourceResult | null>(null)

  const [formKey, setFormKey] = useState(0)
  const [created, setCreated] = useState<{ deviceId: string; summary: NonNullable<NewDeviceSubmitResult['summary']> } | null>(null)
  const story = useStoryLauncher()
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    return () => { if (scanPreview) URL.revokeObjectURL(scanPreview) }
  }, [scanPreview])

  const modelName = (id?: string | null) => props.models.find(m => m.id === id)?.name ?? ''

  // Merge both sources. Conflicting identification values are never chosen silently:
  // the field is left empty and the admin must confirm it manually.
  const merged = useMemo(() => {
    if (!textResult && !scanResult) return null
    const t = textResult?.values ?? {}
    const s = scanResult?.values ?? {}
    const warnings: string[] = []
    const values: NewDeviceInitialValues = { ...t }

    const pick = (a?: string | null, b?: string | null) => a ?? b ?? null

    const modelConflict = !!(t.model_id && s.model_id && t.model_id !== s.model_id)
    if (modelConflict) {
      values.model_id = null
      values.storage = null
      values.color = null
      warnings.push(
        `El modelo no coincide: la etiqueta indica «${modelName(s.model_id)}» y el texto «${modelName(t.model_id)}». Selecciónalo manualmente (capacidad y color también).`
      )
    } else {
      values.model_id = pick(s.model_id, t.model_id)
      const cmp = (key: 'storage' | 'color', label: string) => {
        if (s[key] && t[key] && norm(s[key]!) !== norm(t[key]!)) {
          values[key] = null
          warnings.push(`${label} no coincide: la etiqueta indica «${s[key]}» y el texto «${t[key]}». Elígelo manualmente.`)
        } else {
          values[key] = pick(s[key], t[key])
        }
      }
      cmp('storage', 'La capacidad')
      cmp('color', 'El color')
    }

    if (s.imei_serial && t.imei_serial && norm(s.imei_serial) !== norm(t.imei_serial)) {
      values.imei_serial = null
      warnings.push(`El IMEI / serie no coincide: la etiqueta indica «${s.imei_serial}» y el texto «${t.imei_serial}». Introdúcelo manualmente.`)
    } else {
      values.imei_serial = pick(s.imei_serial, t.imei_serial)
    }

    const all = [...(textResult?.warnings ?? []), ...(scanResult?.warnings ?? []), ...warnings]
    // A missing model/storage/color in one source is irrelevant if the other source supplied it.
    const filtered = all.filter(w => {
      if (w.startsWith('No se pudo identificar el modelo') && values.model_id) return false
      if (w.startsWith('No se pudo identificar la capacidad') && values.storage) return false
      if (w.startsWith('No se pudo identificar el color') && values.color) return false
      return true
    })
    return { values, warnings: Array.from(new Set(filtered)) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [textResult, scanResult, props.models])

  const runTextParse = async (hintModelId?: string | null) => {
    const result = await parseIphoneQuickEntryAction(text, hintModelId)
    if (result.error !== undefined) {
      setError(result.error)
      return false
    }
    setTextResult({ values: result.values, warnings: result.warnings })
    return true
  }

  const handleParse = async () => {
    setLoading(true)
    setError('')
    try {
      if (await runTextParse(scanResult?.values.model_id)) setFormKey(k => k + 1)
    } catch {
      setError('Error inesperado al contactar con la IA.')
    } finally {
      setLoading(false)
    }
  }

  const handleFile = (file: File | undefined) => {
    if (!file) return
    setScanError('')
    setScanResult(null)
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setScanError('Formato de imagen no admitido. Usa JPEG, PNG o WEBP.')
      return
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setScanError('La imagen supera el máximo de 8 MB.')
      return
    }
    setScanFile(file)
    setScanPreview(URL.createObjectURL(file))
  }

  const clearScan = () => {
    setScanFile(null)
    setScanPreview(null)
    setScanResult(null)
    setScanError('')
    if (cameraInputRef.current) cameraInputRef.current.value = ''
    if (galleryInputRef.current) galleryInputRef.current.value = ''
  }

  const handleScan = async () => {
    if (!scanFile) return
    setScanning(true)
    setScanError('')
    try {
      let blob: Blob
      try {
        blob = await prepareLabelImage(scanFile)
      } catch {
        setScanError('No se pudo procesar la imagen (¿formato HEIC no compatible?). Haz la foto en JPEG o elige otra imagen.')
        return
      }
      const fd = new FormData()
      fd.append('image', new File([blob], 'etiqueta.jpg', { type: 'image/jpeg' }))
      const result = await scanIphoneLabelAction(fd)
      if (result.error !== undefined) {
        setScanError(result.error)
        return
      }
      setScanResult({ values: result.values, warnings: result.warnings })

      // If the text didn't identify a model, re-read it using the scanned model as context.
      if (text.trim() && textResult && !textResult.values.model_id && result.values.model_id) {
        await runTextParse(result.values.model_id)
      }
      setFormKey(k => k + 1)
    } catch {
      setScanError('Error inesperado al analizar la etiqueta.')
    } finally {
      setScanning(false)
    }
  }

  const handleSingleResult = (result: NewDeviceSubmitResult) => {
    if (result.success && result.deviceId && result.summary) {
      setCreated({ deviceId: result.deviceId, summary: result.summary })
    }
  }

  const handleRegisterAnother = () => {
    setCreated(null)
    setText('')
    setError('')
    setTextResult(null)
    clearScan()
    setFormKey(k => k + 1)
  }

  return (
    <div className="flex flex-col gap-6 lg:gap-8">
      <div role="tablist" aria-label="Modo de entrada" className="flex p-1 bg-[#121217] rounded-xl border border-[#1F1F24] w-fit">
        {([['single', 'Un iPhone'], ['batch', 'Varios iPhone']] as const).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={entryMode === id}
            onClick={() => setEntryMode(id)}
            className={`px-5 py-2.5 rounded-lg text-[13px] font-semibold transition-colors ${entryMode === id ? 'bg-[#7a32d4]/10 text-[#d7baff]' : 'text-zinc-400 hover:text-white'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Ambos modos permanecen montados para no perder el estado al cambiar de pestaña */}
      <div className={entryMode === 'batch' ? 'hidden' : ''}>
    <div className="flex flex-col gap-6 lg:gap-8">
      {created && (
        <section className="bg-[#0B0B0E] border border-[#22c55e]/20 rounded-2xl p-6 sm:p-8 flex flex-col items-center text-center gap-5">
          <span className="material-symbols-outlined text-[#22c55e] text-5xl">check_circle</span>
          <h3 className="text-xl font-bold text-white">iPhone registrado correctamente</h3>
          <div className="flex flex-col gap-1">
            <p className="text-base font-bold text-white">
              {[created.summary.modelName, created.summary.storage, created.summary.color].filter(Boolean).join(' · ')}
            </p>
            {created.summary.listingPrice !== null && (
              <p className="text-sm font-semibold text-[#d7baff]">
                {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 }).format(created.summary.listingPrice)}
              </p>
            )}
          </div>
          {story.error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm font-semibold">
              {story.error}
            </div>
          )}
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => story.open(created.deviceId)}
              disabled={story.loadingId === created.deviceId}
              className="bg-[#7a32d4]/10 hover:bg-[#7a32d4]/20 border border-[#7a32d4]/30 text-[#d7baff] font-bold text-sm py-3.5 px-6 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
              {story.loadingId === created.deviceId ? 'Preparando...' : 'Generar Story'}
            </button>
            <Link
              href={`/admin/stock/${created.deviceId}`}
              className="bg-[#121217] hover:bg-[#1F1F24] border border-[#1F1F24] text-white font-semibold text-sm py-3.5 px-6 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">smartphone</span>
              Ver dispositivo
            </Link>
            <button
              type="button"
              onClick={handleRegisterAnother}
              className="border border-[#1F1F24] text-zinc-200 hover:bg-[#1F1F24] font-semibold text-sm py-3.5 px-6 rounded-xl transition-colors"
            >
              Registrar otro
            </button>
          </div>
        </section>
      )}
      <section className={`bg-[#0B0B0E] border border-[#1F1F24] rounded-2xl p-6 flex flex-col gap-4 ${created ? 'hidden' : ''}`}>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="quick-entry-text" className="text-[13px] font-semibold text-zinc-400">
            Describe el iPhone
          </label>
          <textarea
            id="quick-entry-text"
            value={text}
            onChange={e => setText(e.target.value)}
            rows={5}
            maxLength={2000}
            placeholder="iPhone 15 Pro 256GB Natural Titanium, batería 89%, 317 ciclos, como nuevo, con caja y cable, comprado por 430€, venta 579€"
            className="w-full bg-[#121217] border border-[#1F1F24] rounded-xl px-4 py-3 text-[15px] text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#7a32d4]/50 focus:ring-1 focus:ring-[#7a32d4]/50 transition-all resize-y"
          />
        </div>
        <div className="flex flex-col sm:flex-row sm:justify-end gap-3">
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            className="w-full sm:w-auto bg-[#121217] hover:bg-[#1F1F24] border border-[#1F1F24] text-zinc-200 font-semibold text-sm py-3.5 px-6 rounded-xl transition-all flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">document_scanner</span>
            Escanear etiqueta
          </button>
          <button
            type="button"
            onClick={handleParse}
            disabled={loading || !text.trim()}
            className="w-full sm:w-auto bg-[#7a32d4]/10 hover:bg-[#7a32d4]/20 border border-[#7a32d4]/30 text-[#d7baff] font-bold text-sm py-3.5 px-8 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
            {loading ? 'Analizando...' : 'Rellenar con IA'}
          </button>
        </div>

        {/* Inputs ocultos: cámara directa y selección de foto existente (compatibles con Safari/iPhone) */}
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
          capture="environment"
          className="hidden"
          onChange={e => { handleFile(e.target.files?.[0]); e.target.value = '' }}
        />
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
          className="hidden"
          onChange={e => { handleFile(e.target.files?.[0]); e.target.value = '' }}
        />

        {(scanPreview || scanError) && (
          <div className="flex flex-col gap-3 bg-[#121217] border border-[#1F1F24] rounded-xl p-4">
            {scanPreview && (
              <>
                <div className="flex items-start gap-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={scanPreview}
                    alt="Vista previa de la etiqueta"
                    className="w-28 h-28 sm:w-40 sm:h-40 object-cover rounded-lg border border-[#1F1F24] bg-black"
                  />
                  <div className="flex flex-col gap-2 text-xs text-zinc-400">
                    <span>La imagen solo se usa para leer la etiqueta; no se guarda ni se añade a las fotos del dispositivo.</span>
                    {scanResult && (
                      <span className="text-emerald-400 font-semibold">Etiqueta analizada.</span>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleScan}
                    disabled={scanning}
                    className="bg-[#7a32d4]/10 hover:bg-[#7a32d4]/20 border border-[#7a32d4]/30 text-[#d7baff] font-bold text-sm py-2.5 px-5 rounded-xl transition-all disabled:opacity-50 flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[18px]">image_search</span>
                    {scanning ? 'Analizando etiqueta...' : 'Analizar etiqueta'}
                  </button>
                  <button
                    type="button"
                    onClick={() => galleryInputRef.current?.click()}
                    className="border border-[#1F1F24] text-zinc-300 hover:bg-[#1F1F24] font-semibold text-sm py-2.5 px-4 rounded-xl transition-all"
                  >
                    Elegir otra foto
                  </button>
                  <button
                    type="button"
                    onClick={clearScan}
                    className="text-zinc-400 hover:text-white font-semibold text-sm py-2.5 px-3 transition-colors"
                  >
                    Quitar
                  </button>
                </div>
              </>
            )}
            {scanError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm font-semibold">
                {scanError}
              </div>
            )}
          </div>
        )}

        {!scanPreview && (
          <button
            type="button"
            onClick={() => galleryInputRef.current?.click()}
            className="self-start text-xs font-semibold text-zinc-400 hover:text-[#d7baff] transition-colors"
          >
            O elegir una foto existente de la etiqueta
          </button>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm font-semibold">
            {error}
          </div>
        )}
        {merged && merged.warnings.length > 0 && (
          <ul className="bg-amber-500/10 border border-amber-500/20 text-amber-300 p-4 rounded-xl text-sm font-medium flex flex-col gap-1">
            {merged.warnings.map(w => <li key={w}>{w}</li>)}
          </ul>
        )}
      </section>

      {merged && !created && <NewDeviceForm key={formKey} {...props} initialValues={merged.values} mode="quick" onSubmitResult={handleSingleResult} />}
    </div>
      </div>

      <div className={entryMode === 'single' ? 'hidden' : ''}>
        <BatchIphoneEntry {...props} />
      </div>
      {story.modal}
    </div>
  )
}
