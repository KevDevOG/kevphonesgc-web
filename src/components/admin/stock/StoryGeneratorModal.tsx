'use client'

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import {
  StoryTemplate,
  StoryRenderOptions,
  renderStoryToCanvas
} from '@/lib/story/story-renderer'
import {
  StoryImageOption,
  resolveStoryImageCandidates
} from '@/lib/story/story-image-resolver'

export interface StoryGeneratorDevice {
  id: string
  model_id?: string
  storage: string | null
  color: string | null
  condition: string
  battery_health: number | null
  battery_cycles: number | null
  has_box: boolean
  has_cable: boolean
  has_invoice: boolean
  fully_functional?: boolean
  warranty_until?: string | null
  listing_price: number
  discount_price?: number | null
  device_models?: {
    name: string
    category: string
    brand?: string
  }
  device_images?: { storage_path: string }[]
}

interface StoryGeneratorModalProps {
  device: StoryGeneratorDevice
  catalogImages?: { model_id: string; color: string; storage_path: string }[]
  defaultTemplate?: StoryTemplate
  isOpen: boolean
  onClose: () => void
}

const TEMPLATE_PRESETS: { id: StoryTemplate; label: string; badge: string; icon: string; desc: string }[] = [
  {
    id: 'disponible',
    label: 'Disponible',
    badge: '¡DISPONIBLE AHORA!',
    icon: 'check_circle',
    desc: 'Plantilla principal corporativa morada KevPhones'
  },
  {
    id: 'oferta',
    label: 'Oferta',
    badge: '¡OFERTA!',
    icon: 'local_fire_department',
    desc: 'Versión promocional con precio destacado'
  }
]

export function StoryGeneratorModal({
  device,
  catalogImages = [],
  defaultTemplate,
  isOpen,
  onClose
}: StoryGeneratorModalProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [template, setTemplate] = useState<StoryTemplate>(
    defaultTemplate ??
      (device.discount_price && device.discount_price < device.listing_price ? 'oferta' : 'disponible')
  )
  const [customBadge, setCustomBadge] = useState<string>('')
  const [customPrice, setCustomPrice] = useState<string>('')
  const [isRendering, setIsRendering] = useState<boolean>(true)
  const [isExporting, setIsExporting] = useState<boolean>(false)
  const [canShareFiles, setCanShareFiles] = useState<boolean>(false)
  const [copiedText, setCopiedText] = useState<boolean>(false)
  const [shareFeedback, setShareFeedback] = useState<string | null>(null)
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null)

  const modelName = device.device_models?.name || 'iPhone'

  // Resolve image using exact model+color priority with fallback detection
  const {
    primary: defaultImage,
    candidates: imageCandidates,
    hasExactCatalogImage
  } = useMemo(() => {
    return resolveStoryImageCandidates({
      modelId: device.model_id,
      modelName,
      color: device.color,
      catalogImages,
      deviceImages: device.device_images || []
    })
  }, [device.model_id, modelName, device.color, catalogImages, device.device_images])

  // Active selected image (defaults to exact catalog image in normal flow)
  const [selectedImage, setSelectedImage] = useState<StoryImageOption>(defaultImage)

  // Keep selectedImage in sync when resolved default changes
  useEffect(() => {
    setSelectedImage(defaultImage)
  }, [defaultImage])

  // Check native file sharing support
  useEffect(() => {
    if (typeof window !== 'undefined' && typeof navigator !== 'undefined' && 'canShare' in navigator && 'share' in navigator) {
      try {
        const testFile = new File([''], 'test.png', { type: 'image/png' })
        if (navigator.canShare({ files: [testFile] })) {
          setCanShareFiles(true)
        }
      } catch {
        setCanShareFiles(false)
      }
    }
  }, [])

  // Auto-fill template badge preset
  const activeBadgeText =
    customBadge.trim() || TEMPLATE_PRESETS.find(t => t.id === template)?.badge || '¡DISPONIBLE AHORA!'

  // Effective price computation
  const parsedCustomPrice = customPrice.trim() ? parseFloat(customPrice.replace(',', '.')) : null
  const effectivePrice = parsedCustomPrice ?? (device.discount_price ?? device.listing_price)

  // Canvas re-render trigger
  const updateCanvas = useCallback(async () => {
    if (!canvasRef.current) return
    setIsRendering(true)

    const renderOpts: StoryRenderOptions = {
      template,
      modelName,
      storage: device.storage,
      color: device.color,
      condition: device.condition,
      batteryHealth: device.battery_health,
      batteryCycles: device.battery_cycles,
      hasBox: device.has_box,
      hasCable: device.has_cable,
      hasInvoice: device.has_invoice,
      fullyFunctional: device.fully_functional === true,
      warrantyUntil: device.warranty_until,
      listingPrice: device.listing_price,
      // Do not invent a discount if not available on the device
      discountPrice: device.discount_price ?? null,
      customBadgeText: activeBadgeText,
      customPriceOverride: parsedCustomPrice,
      activeImage: selectedImage
    }

    try {
      await renderStoryToCanvas(canvasRef.current, renderOpts)
      setPreviewDataUrl(canvasRef.current.toDataURL('image/png'))
    } catch (err) {
      console.error('Error rendering canvas story:', err)
    } finally {
      setIsRendering(false)
    }
  }, [
    template,
    modelName,
    device.storage,
    device.color,
    device.condition,
    device.battery_health,
    device.battery_cycles,
    device.has_box,
    device.has_cable,
    device.has_invoice,
    device.fully_functional,
    device.warranty_until,
    device.listing_price,
    device.discount_price,
    activeBadgeText,
    parsedCustomPrice,
    selectedImage
  ])

  // Re-render when open or inputs change
  useEffect(() => {
    if (isOpen) {
      updateCanvas()
    }
  }, [isOpen, updateCanvas])

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  // Filename generator: kevphones-{model}-{color}.png
  const getExportFilename = useCallback(() => {
    const sanitizedModel = modelName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
    const sanitizedColor = (device.color || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
    if (sanitizedColor) {
      return `kevphones-${sanitizedModel}-${sanitizedColor}.png`
    }
    return `kevphones-${sanitizedModel || 'device'}.png`
  }, [modelName, device.color])

  const handleDownloadBlob = useCallback((blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [])

  // Download Handler
  const handleDownload = async () => {
    if (!canvasRef.current) return
    setIsExporting(true)
    try {
      const blob = await new Promise<Blob | null>(res =>
        canvasRef.current!.toBlob(res, 'image/png')
      )
      if (!blob) throw new Error('No se pudo generar el PNG')
      handleDownloadBlob(blob, getExportFilename())
    } catch (err) {
      console.error('Download error:', err)
      setShareFeedback('Error al descargar la imagen')
      setTimeout(() => setShareFeedback(null), 3000)
    } finally {
      setIsExporting(false)
    }
  }

  // Web Share API Handler with native PNG file sharing
  const handleShare = async () => {
    if (!canvasRef.current) return
    setIsExporting(true)
    setShareFeedback(null)

    try {
      const blob = await new Promise<Blob | null>(res =>
        canvasRef.current!.toBlob(res, 'image/png')
      )
      if (!blob) throw new Error('No se pudo preparar la imagen para compartir')

      const filename = getExportFilename()
      const file = new File([blob], filename, { type: 'image/png' })

      if (typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file]
        })
      } else {
        handleDownloadBlob(blob, filename)
        setShareFeedback('La función de compartir no está disponible. Descargando PNG...')
        setTimeout(() => setShareFeedback(null), 3000)
      }
    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        console.error('Share error:', err)
        setShareFeedback('No se pudo compartir. Descargando imagen...')
        try {
          const blob = await new Promise<Blob | null>(res =>
            canvasRef.current!.toBlob(res, 'image/png')
          )
          if (blob) handleDownloadBlob(blob, getExportFilename())
        } catch {
          // ignore
        }
        setTimeout(() => setShareFeedback(null), 4000)
      }
    } finally {
      setIsExporting(false)
    }
  }

  // Concise publication text using only public, non-confidential device specs
  const generatePublicationText = useCallback(() => {
    const lines: string[] = []

    const formattedStorage = device.storage
      ? device.storage.replace(/(\d+)\s*(GB|TB)/i, '$1 $2')
      : null

    const titleParts = [
      modelName,
      formattedStorage,
      device.color || null
    ].filter(Boolean)

    if (titleParts.length > 0) {
      lines.push(titleParts.join(' '))
    }

    if (device.condition) {
      const conditionMap: Record<string, string> = {
        sealed: 'Precintado',
        like_new: 'Como nuevo',
        good: 'Buen estado',
        marked: 'Con marcas'
      }
      lines.push(`Estado: ${conditionMap[device.condition] || device.condition}`)
    }

    if (device.battery_health != null && Number.isFinite(device.battery_health)) {
      lines.push(`Batería: ${device.battery_health}%`)
    }

    if (device.has_box && device.has_cable) {
      lines.push('Con caja y cable')
    } else if (device.has_box) {
      lines.push('Con caja')
    } else if (device.has_cable) {
      lines.push('Con cable')
    }

    if (device.warranty_until) {
      const d = new Date(device.warranty_until)
      if (!isNaN(d.getTime()) && d > new Date()) {
        const formattedDate = d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
        lines.push(`Garantía hasta ${formattedDate}`)
      }
    }

    if (effectivePrice != null && Number.isFinite(effectivePrice)) {
      lines.push(`${effectivePrice} €`)
    }

    lines.push('')
    lines.push('Disponible en KevPhones.es')

    return lines.join('\n')
  }, [
    modelName,
    device.storage,
    device.color,
    device.condition,
    device.battery_health,
    device.has_box,
    device.has_cable,
    device.warranty_until,
    effectivePrice
  ])

  // Copy publication text to clipboard
  const handleCopyText = async () => {
    try {
      const text = generatePublicationText()
      await navigator.clipboard.writeText(text)
      setCopiedText(true)
      setShareFeedback('Texto copiado')
      setTimeout(() => {
        setCopiedText(false)
        setShareFeedback(null)
      }, 2500)
    } catch (err) {
      console.error('Clipboard copy error:', err)
      setShareFeedback('No se pudo copiar el texto al portapapeles')
      setTimeout(() => setShareFeedback(null), 3000)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 md:p-6 bg-black/90 backdrop-blur-md overflow-y-auto">
      {/* Hidden 1080x1920 high-res rendering canvas */}
      <canvas
        ref={canvasRef}
        width={1080}
        height={1920}
        className="hidden"
        aria-hidden="true"
      />

      <div className="relative w-full max-w-5xl bg-[#0c0c11] border border-[#23232f] rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[94vh]">
        {/* Modal Top Header with KevPhones Branding */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1c1c26] bg-[#111118]">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[24px] text-[#c084fc]">auto_awesome</span>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                Generador de Story KevPhones
                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-[#7a32d4]/20 text-[#d7baff] border border-[#7a32d4]/30">
                  1080 × 1920 PNG
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                {modelName} · {device.storage || ''} · {device.color || ''}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Cerrar (Esc)"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Modal Body: Responsive Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-6 p-5 sm:p-6 overflow-y-auto">
          {/* LEFT: Live Story Preview */}
          <div className="flex flex-col items-center justify-center bg-[#060608] border border-[#181822] rounded-xl p-4 relative min-h-[460px]">
            {isRendering && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/65 backdrop-blur-xs rounded-xl text-white gap-2">
                <span className="material-symbols-outlined text-3xl animate-spin text-[#c084fc]">
                  progress_activity
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                  Generando imagen 1080×1920...
                </span>
              </div>
            )}

            {previewDataUrl ? (
              <div className="relative aspect-[9/16] w-auto max-h-[66vh] max-w-full rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10">
                <img
                  src={previewDataUrl}
                  alt="Previsualización de Story"
                  className="w-full h-full object-contain"
                />
                <div className="absolute top-2.5 right-2.5 px-2 py-1 rounded-md bg-black/75 backdrop-blur-md text-[10px] font-bold text-zinc-300 pointer-events-none">
                  1080 × 1920 PNG
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-zinc-500 py-20">
                <span className="material-symbols-outlined text-5xl mb-2">smart_display</span>
                <p className="text-sm">Preparando diseño...</p>
              </div>
            )}
          </div>

          {/* RIGHT: Controls & Settings */}
          <div className="flex flex-col gap-5">
            {/* 1. Template Selector (Disponible / Oferta) */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-[#c084fc]">palette</span>
                Plantilla de publicación
              </label>
              <div className="grid grid-cols-2 gap-3">
                {TEMPLATE_PRESETS.map(t => {
                  const isSelected = template === t.id
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        setTemplate(t.id)
                        setCustomBadge('')
                      }}
                      className={`flex flex-col items-start gap-1 p-3.5 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'bg-[#7a32d4]/20 border-[#a855f7] text-white shadow-md shadow-[#7a32d4]/25'
                          : 'bg-[#13131a] border-[#20202c] text-zinc-400 hover:text-white hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`material-symbols-outlined text-[20px] ${isSelected ? 'text-[#c084fc]' : 'text-zinc-500'}`}>
                          {t.icon}
                        </span>
                        <span className="text-sm font-bold text-white">{t.label}</span>
                      </div>
                      <span className="text-[11px] text-zinc-400 leading-snug">
                        {t.desc}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* 2. Image Source Status & Fallback Behavior */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-[#c084fc]">image</span>
                Imagen del producto
              </label>

              {/* Normal Flow: Exact Catalog Image Loaded Automatically (Hidden Selector) */}
              {hasExactCatalogImage ? (
                <div className="bg-[#13131a] border border-[#20202c] rounded-xl px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[20px] text-[#22c55e]">check_circle</span>
                    <div>
                      <p className="text-xs font-bold text-white">
                        Catálogo oficial ({device.color || 'Modelo'})
                      </p>
                      <p className="text-[11px] text-zinc-400">
                        Cargada automáticamente para {modelName}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#22c55e]/15 text-[#4ade80] border border-[#22c55e]/30">
                    Exacta
                  </span>
                </div>
              ) : (
                /* Fallback Flow: Only shown when exact catalog image is missing */
                <div className="flex flex-col gap-2">
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 flex items-start gap-2.5">
                    <span className="material-symbols-outlined text-[18px] text-amber-400 flex-shrink-0 mt-0.5">warning</span>
                    <div className="text-xs">
                      <p className="font-bold text-amber-300">Sin foto de catálogo para este color</p>
                      <p className="text-[11px] text-amber-200/70 mt-0.5">
                        Usando respaldo automático. Puedes elegir una de las opciones disponibles:
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    {imageCandidates.map(c => {
                      const isSelected = selectedImage.type === c.type
                      return (
                        <button
                          key={c.type}
                          type="button"
                          onClick={() => setSelectedImage(c)}
                          className={`flex items-center justify-between px-3 py-2.5 rounded-xl border text-left transition-all ${
                            isSelected
                              ? 'bg-[#7a32d4]/15 border-[#a855f7]/60 text-white'
                              : 'bg-[#13131a] border-[#20202c] text-zinc-400 hover:text-white hover:border-zinc-700'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="material-symbols-outlined text-[18px] text-[#d7baff]">
                              {c.type === 'catalog_exact' || c.type === 'catalog_default' ? 'verified' : c.type === 'real_photo' ? 'photo_camera' : 'crop_original'}
                            </span>
                            <div className="min-w-0">
                              <p className="text-xs font-bold truncate text-white">{c.label}</p>
                              <p className="text-[10px] text-zinc-500 truncate">
                                {c.sourceName} · Respaldo {c.priority}
                              </p>
                            </div>
                          </div>
                          <span className={`material-symbols-outlined text-[18px] ${isSelected ? 'text-[#a855f7]' : 'text-zinc-600'}`}>
                            {isSelected ? 'radio_button_checked' : 'radio_button_unchecked'}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* 3. Badge Text Customization */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-[#c084fc]">label</span>
                Texto del distintivo superior
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customBadge}
                  onChange={e => setCustomBadge(e.target.value)}
                  placeholder={TEMPLATE_PRESETS.find(t => t.id === template)?.badge}
                  className="flex-1 bg-[#13131a] border border-[#20202c] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#a855f7]"
                />
                {customBadge && (
                  <button
                    type="button"
                    onClick={() => setCustomBadge('')}
                    className="px-3 py-2 text-xs font-semibold text-zinc-400 hover:text-white bg-[#13131a] border border-[#20202c] rounded-xl"
                  >
                    Restablecer
                  </button>
                )}
              </div>
            </div>

            {/* 4. Price & Specs Summary Card */}
            <div className="bg-[#13131a] border border-[#20202c] rounded-xl p-3.5 flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400 font-semibold">Precio en la historia:</span>
                <span className="text-white font-bold text-sm">
                  {effectivePrice} €
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-zinc-500 border-t border-[#1c1c26] pt-2">
                <span>Estado: <strong className="text-zinc-300">{device.condition === 'sealed' ? 'Precintado' : 'Como nuevo'}</strong></span>
                <span>Batería: <strong className="text-zinc-300">{device.condition === 'sealed' ? 'Precintado (100%)' : (device.battery_health ? `${device.battery_health}%` : 'Revisada')}</strong></span>
              </div>
            </div>

            {/* Feedback notification toast */}
            {shareFeedback && (
              <div className="bg-[#7a32d4]/15 border border-[#a855f7]/40 rounded-xl p-3 text-xs text-[#d7baff] font-semibold flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">info</span>
                {shareFeedback}
              </div>
            )}

            {/* 5. Main Action Buttons */}
            <div className="flex flex-col sm:flex-row flex-wrap gap-2.5 pt-2 mt-auto">
              {canShareFiles ? (
                <>
                  <button
                    type="button"
                    onClick={handleShare}
                    disabled={isRendering || isExporting}
                    className="flex-1 min-w-[160px] bg-gradient-to-r from-[#7a32d4] via-[#9333ea] to-[#a855f7] hover:from-[#6d28d9] hover:to-[#9333ea] text-white font-bold text-sm py-3.5 px-4 rounded-xl transition-all shadow-lg shadow-[#7a32d4]/25 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-[20px]">share</span>
                    <span>{isExporting ? 'Preparando...' : 'Compartir Story'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownload}
                    disabled={isRendering || isExporting}
                    className="bg-[#1b1b24] hover:bg-[#252532] border border-[#2a2a3a] text-white font-bold text-sm py-3.5 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    title="Descargar PNG (1080×1920)"
                  >
                    <span className="material-symbols-outlined text-[20px]">download</span>
                    <span>Descargar PNG</span>
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={handleDownload}
                  disabled={isRendering || isExporting}
                  className="flex-1 min-w-[160px] bg-gradient-to-r from-[#7a32d4] via-[#9333ea] to-[#a855f7] hover:from-[#6d28d9] hover:to-[#9333ea] text-white font-bold text-sm py-3.5 px-4 rounded-xl transition-all shadow-lg shadow-[#7a32d4]/25 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[20px]">download</span>
                  <span>{isExporting ? 'Descargando...' : 'Descargar PNG'}</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleCopyText}
                className="bg-[#1b1b24] hover:bg-[#252532] border border-[#2a2a3a] text-white font-bold text-sm py-3.5 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
                title="Copiar texto de publicación"
              >
                <span className="material-symbols-outlined text-[20px]">{copiedText ? 'check' : 'content_copy'}</span>
                <span>{copiedText ? 'Texto copiado' : 'Copiar texto'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
