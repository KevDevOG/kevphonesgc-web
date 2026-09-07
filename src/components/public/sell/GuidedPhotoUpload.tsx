'use client'

import React, { useState, useEffect, useRef } from 'react'

export type PhotoSlotId = 'front_off' | 'front_on' | 'back' | 'right_side' | 'left_side' | 'top' | 'bottom' | 'extra'

export interface SelectedPhoto {
  file: File
  previewUrl: string
}

export interface GuidedPhotoUploadProps {
  requiredPhotos: Record<string, SelectedPhoto | null>
  extraPhotos: SelectedPhoto[]
  onRequiredChange: (slot: string, photo: SelectedPhoto | null) => void
  onExtraAdd: (photo: SelectedPhoto) => void
  onExtraRemove: (index: number) => void
  disabled?: boolean
}

const REQUIRED_SLOTS = [
  { id: 'front_off', label: 'Frontal apagada', help: 'Pantalla completa, apagada y sin funda.' },
  { id: 'front_on', label: 'Frontal encendida', help: 'Pantalla encendida y completamente visible.' },
  { id: 'back', label: 'Trasera', help: 'Parte trasera completa y sin funda.' },
  { id: 'right_side', label: 'Lado derecho', help: 'Muestra todo el lateral.' },
  { id: 'left_side', label: 'Lado izquierdo', help: 'Muestra todo el lateral.' },
  { id: 'top', label: 'Parte superior', help: 'Muestra el borde superior.' },
  { id: 'bottom', label: 'Parte inferior', help: 'Muestra conectores, altavoces y borde inferior.' }
]

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
const MAX_SIZE = 8 * 1024 * 1024 // 8MB

export function GuidedPhotoUpload({
  requiredPhotos,
  extraPhotos,
  onRequiredChange,
  onExtraAdd,
  onExtraRemove,
  disabled
}: GuidedPhotoUploadProps) {
  const [error, setError] = useState<string | null>(null)

  const reqPhotosRef = useRef(requiredPhotos)
  const extPhotosRef = useRef(extraPhotos)

  useEffect(() => {
    reqPhotosRef.current = requiredPhotos
    extPhotosRef.current = extraPhotos
  }, [requiredPhotos, extraPhotos])

  useEffect(() => {
    return () => {
      // Cleanup all active object URLs on unmount
      Object.values(reqPhotosRef.current).forEach(p => {
        if (p?.previewUrl) URL.revokeObjectURL(p.previewUrl)
      })
      extPhotosRef.current.forEach(p => {
        if (p?.previewUrl) URL.revokeObjectURL(p.previewUrl)
      })
    }
  }, [])

  const handleFile = (file: File | undefined, callback: (photo: SelectedPhoto) => void) => {
    setError(null)
    if (!file) return

    const lowerName = file.name.toLowerCase()
    const isHeicHeif = lowerName.endsWith('.heic') || lowerName.endsWith('.heif')

    if (!ACCEPTED_TYPES.includes(file.type) && !isHeicHeif) {
      setError('Formato no soportado. Usa JPEG, PNG, WEBP o HEIC.')
      return
    }

    if (file.size > MAX_SIZE) {
      setError('El archivo es demasiado grande. Máximo 8 MB.')
      return
    }

    const previewUrl = URL.createObjectURL(file)
    callback({ file, previewUrl })
  }

  const requiredCount = REQUIRED_SLOTS.filter(s => requiredPhotos[s.id]).length

  return (
    <div className="space-y-10">
      <div>
        <div className="flex items-center gap-4 mb-6">
          <div className="text-sm font-semibold tracking-wide text-purple-400 bg-purple-900/20 px-3 py-1 rounded-full border border-purple-500/30">
            {requiredCount}/7 obligatorias
          </div>
          {requiredCount === 7 && (
            <div className="text-sm text-emerald-400 flex items-center gap-1.5 font-medium animate-in fade-in">
              <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Completado
            </div>
          )}
        </div>
        
        {error && (
          <div className="p-4 bg-red-900/10 border border-red-500/20 text-red-400 text-sm rounded-[14px] mb-6 font-medium animate-in fade-in">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
          {REQUIRED_SLOTS.map(slot => {
            const current = requiredPhotos[slot.id]
            const isHeic = current?.file.name.toLowerCase().endsWith('.heic') || current?.file.name.toLowerCase().endsWith('.heif')
            
            return (
              <div key={slot.id} className={`bg-[#0B0B0E] border rounded-[20px] p-5 flex flex-col relative overflow-hidden transition-colors ${current ? 'border-purple-500/30' : 'border-[#1F1F24]'}`}>
                <div className="flex justify-between items-start mb-4">
                  <div className="pr-2">
                    <h3 className="font-medium text-white text-sm">{slot.label}</h3>
                    <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{slot.help}</p>
                  </div>
                  {!current && (
                    <span className="text-[10px] uppercase tracking-wider font-semibold bg-[#1F1F24] text-zinc-400 px-2 py-1 rounded">Requerida</span>
                  )}
                  {current && (
                    <span className="text-[10px] uppercase tracking-wider font-semibold bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded border border-emerald-500/20">Ok</span>
                  )}
                </div>

                <div className="mt-auto flex flex-col justify-end">
                  {current ? (
                    <div className="space-y-3">
                      <div className="aspect-[4/3] bg-[#050506] rounded-xl overflow-hidden border border-[#1F1F24] flex items-center justify-center relative shadow-inner">
                        {isHeic ? (
                          <div className="text-zinc-500 text-xs flex flex-col items-center">
                            <svg className="w-6 h-6 mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="text-white font-medium mb-1">Foto seleccionada</span>
                            <span className="truncate max-w-[150px] opacity-70">{current.file.name}</span>
                          </div>
                        ) : (
                          <img src={current.previewUrl} alt={slot.label} className="w-full h-full object-contain" />
                        )}
                      </div>
                      <label className="block w-full text-center text-xs font-semibold py-2.5 rounded-lg bg-[#1F1F24] hover:bg-zinc-700 text-white cursor-pointer transition-colors">
                        Cambiar
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,.heic,.heif"
                          className="hidden"
                          disabled={disabled}
                          onChange={(e) => handleFile(e.target.files?.[0], (p) => {
                            if (current) URL.revokeObjectURL(current.previewUrl)
                            onRequiredChange(slot.id, p)
                          })}
                        />
                      </label>
                    </div>
                  ) : (
                    <label className="block w-full text-center text-sm py-8 border-2 border-dashed border-[#1F1F24] hover:border-purple-500/50 hover:bg-purple-500/5 rounded-xl text-purple-400 cursor-pointer transition-all">
                      <svg className="w-6 h-6 mx-auto mb-2 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="font-medium text-xs">Añadir foto</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,.heic,.heif"
                        className="hidden"
                        disabled={disabled}
                        onChange={(e) => handleFile(e.target.files?.[0], (p) => onRequiredChange(slot.id, p))}
                      />
                    </label>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="pt-8 border-t border-[#1F1F24]">
        <h2 className="text-lg font-bold text-white mb-1">Fotos extra (opcionales)</h2>
        <p className="text-zinc-400 text-sm mb-6">
          Añade fotos de golpes, caja, factura o cualquier detalle.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-4">
          {extraPhotos.map((photo, i) => {
            const isHeic = photo.file.name.toLowerCase().endsWith('.heic') || photo.file.name.toLowerCase().endsWith('.heif')
            return (
              <div key={i} className="bg-[#0B0B0E] border border-purple-500/30 rounded-[16px] p-2 relative">
                <div className="aspect-[4/3] bg-[#050506] rounded-xl overflow-hidden border border-[#1F1F24] flex items-center justify-center relative">
                  {isHeic ? (
                    <div className="text-zinc-500 text-xs flex flex-col items-center">
                      <svg className="w-5 h-5 mb-1 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-white font-medium">Extra</span>
                    </div>
                  ) : (
                    <img src={photo.previewUrl} alt={`Extra ${i + 1}`} className="w-full h-full object-contain" />
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      URL.revokeObjectURL(photo.previewUrl)
                      onExtraRemove(i)
                    }}
                    disabled={disabled}
                    className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/70 backdrop-blur-sm rounded-full text-white text-xs flex items-center justify-center hover:bg-red-500 transition-colors"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )
          })}
          
          {extraPhotos.length < 3 && (
            <label className="aspect-[4/3] bg-[#0B0B0E] border-2 border-dashed border-[#1F1F24] hover:border-purple-500/50 rounded-[16px] flex flex-col items-center justify-center text-purple-400 cursor-pointer transition-colors opacity-70 hover:opacity-100 hover:bg-purple-500/5">
              <svg className="w-5 h-5 mb-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="text-xs font-medium">Añadir extra</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,.heic,.heif"
                className="hidden"
                disabled={disabled}
                onChange={(e) => handleFile(e.target.files?.[0], (p) => onExtraAdd(p))}
              />
            </label>
          )}
        </div>
      </div>
    </div>
  )
}
