'use client'

import React, { useEffect, useRef, useState } from 'react'

export const RECEIPT_MAX_BYTES = 10 * 1024 * 1024

const EXTENSION_MIME: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  heic: 'image/heic',
  heif: 'image/heif',
}

const ALLOWED_MIME = new Set(Object.values(EXTENSION_MIME))

/**
 * Resolves the content type to declare for the upload. Some browsers report an
 * empty type for HEIC/HEIF, so the extension is used as a fallback. The server
 * re-validates the real bytes regardless of this value.
 */
export function getReceiptContentType(file: File): string | null {
  const declared = (file.type || '').toLowerCase()
  if (ALLOWED_MIME.has(declared)) return declared
  if (declared && declared !== 'application/octet-stream') return null
  const ext = file.name.split('.').pop()?.toLowerCase() || ''
  return EXTENSION_MIME[ext] || null
}

export function validateReceiptFile(file: File): string | null {
  if (!getReceiptContentType(file)) {
    return 'Formato no válido. Usa una imagen JPG, PNG, WebP o HEIC.'
  }
  if (file.size <= 0) {
    return 'La imagen está vacía o dañada.'
  }
  if (file.size > RECEIPT_MAX_BYTES) {
    return 'La imagen supera el tamaño máximo de 10 MB.'
  }
  return null
}

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

type Props = {
  file: File | null
  error: string | null
  disabled?: boolean
  onChange: (file: File | null) => void
  onError: (error: string | null) => void
}

export function WithdrawalReceiptField({ file, error, disabled, onChange, onError }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewFailed, setPreviewFailed] = useState(false)

  useEffect(() => {
    setPreviewFailed(false)
    if (!file) {
      setPreviewUrl(null)
      return
    }
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  const openPicker = () => inputRef.current?.click()

  const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] || null
    // Reset so selecting the same file again still triggers onChange.
    e.target.value = ''
    if (!selected) return

    const validationError = validateReceiptFile(selected)
    if (validationError) {
      onError(validationError)
      return
    }
    onError(null)
    onChange(selected)
  }

  const handleRemove = () => {
    onError(null)
    onChange(null)
  }

  return (
    <div className="flex flex-col">
      <span className="block text-[13px] font-semibold text-zinc-400 mb-1.5">Justificante (opcional)</span>
      <p className="text-zinc-500 text-[12px] font-medium mb-2.5">Adjunta una foto del ticket o factura de esta retirada.</p>

      {/* No name attribute: the image is never sent inside the movement FormData. */}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.heic,.heif"
        className="hidden"
        onChange={handleSelect}
        disabled={disabled}
      />

      {file ? (
        <div className="flex items-center gap-3 bg-[#121217] border border-[#1F1F24] rounded-xl p-3">
          <div className="w-14 h-14 shrink-0 rounded-lg overflow-hidden bg-[#0B0B0E] border border-[#1F1F24] flex items-center justify-center">
            {previewUrl && !previewFailed ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewUrl}
                alt="Vista previa del justificante"
                className="w-full h-full object-cover"
                onError={() => setPreviewFailed(true)}
              />
            ) : (
              <span className="material-symbols-outlined text-[22px] text-zinc-500" title="Vista previa no disponible">receipt_long</span>
            )}
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-[13px] font-bold text-white truncate" title={file.name}>{file.name}</span>
            <span className="text-[12px] font-medium text-zinc-500">{formatSize(file.size)}</span>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              type="button"
              onClick={openPicker}
              disabled={disabled}
              className="w-8 h-8 flex items-center justify-center bg-[#0B0B0E] hover:bg-[#1F1F24] border border-[#1F1F24] text-zinc-400 hover:text-white rounded-lg transition-colors disabled:opacity-50"
              title="Cambiar imagen"
              aria-label="Cambiar imagen"
            >
              <span className="material-symbols-outlined text-[16px]">swap_horiz</span>
            </button>
            <button
              type="button"
              onClick={handleRemove}
              disabled={disabled}
              className="w-8 h-8 flex items-center justify-center bg-[#0B0B0E] hover:bg-red-500/10 border border-[#1F1F24] hover:border-red-500/30 text-zinc-400 hover:text-red-400 rounded-lg transition-colors disabled:opacity-50"
              title="Quitar imagen"
              aria-label="Quitar imagen"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={openPicker}
          disabled={disabled}
          className="w-full px-4 py-2.5 bg-[#121217] hover:bg-[#1F1F24] border border-dashed border-[#1F1F24] hover:border-[#7a32d4]/40 text-zinc-300 font-bold text-[13px] rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-[18px] text-zinc-500">add_photo_alternate</span>
          Seleccionar imagen
        </button>
      )}

      {error && (
        <p className="text-red-400 text-[12px] font-bold mt-1.5" role="alert">{error}</p>
      )}
    </div>
  )
}
