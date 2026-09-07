'use client'

import React, { useState, useMemo, useRef } from 'react'
import { AdminPageShell } from '@/components/admin/layout/AdminPageShell'
import { AdminPageHeader } from '@/components/admin/layout/AdminPageHeader'
import { createClient } from '@/lib/supabase/client'
import { upsertModelCatalogImageAction, deleteModelCatalogImageAction } from '@/actions/models'
import { useRouter } from 'next/navigation'

type Model = {
  id: string
  name: string
  brand: string
  category: string
  sort_order: number
}

type ColorVariant = {
  model_id: string
  value: string
  sort_order: number
}

type CatalogImage = {
  model_id: string
  color: string
  storage_path: string
}

type Props = {
  models: Model[]
  colorVariants: ColorVariant[]
  catalogImages: CatalogImage[]
}

const CATEGORY_LABELS: Record<string, string> = {
  'iphone': 'iPhone',
  'ps5': 'PlayStation 5',
  'nintendo_switch': 'Nintendo Switch'
}

export default function ModelManagement({ models, colorVariants, catalogImages }: Props) {
  const [searchTerm, setSearchTerm] = useState('')
  const [processing, setProcessing] = useState<string | null>(null) // '{modelId}-{color}' format
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  
  const router = useRouter()
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [activeUploadContext, setActiveUploadContext] = useState<{ modelId: string, color: string } | null>(null)

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''

  const filteredModels = useMemo(() => {
    if (!searchTerm) return models
    const lower = searchTerm.toLowerCase()
    return models.filter(m => 
      m.name.toLowerCase().includes(lower) || 
      m.brand.toLowerCase().includes(lower) || 
      m.category.toLowerCase().includes(lower)
    )
  }, [models, searchTerm])

  const groupedModels = useMemo(() => {
    const groups: Record<string, Model[]> = {}
    filteredModels.forEach(m => {
      if (!groups[m.category]) groups[m.category] = []
      groups[m.category].push(m)
    })
    return groups
  }, [filteredModels])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !activeUploadContext) return
    const file = e.target.files[0]
    const { modelId, color } = activeUploadContext
    const processKey = `${modelId}-${color}`
    
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = ''
    setActiveUploadContext(null)
    
    if (file.size > 8 * 1024 * 1024) {
      setErrorMsg('El archivo es demasiado grande (Máximo 8MB).')
      return
    }

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setErrorMsg('Formato no soportado. Usa JPEG, PNG o WebP.')
      return
    }

    setProcessing(processKey)
    setErrorMsg(null)

    try {
      const extension = file.type === 'image/jpeg' ? 'jpg' : file.type === 'image/png' ? 'png' : 'webp'
      const timestamp = Date.now()
      const uniqueId = Math.random().toString(36).substring(2, 9)
      const normalizedColor = color.toLowerCase().replace(/[^a-z0-9]/g, '-')
      const fileName = `${modelId}/${normalizedColor}/${timestamp}-${uniqueId}.${extension}`

      // Upload file
      const { error: uploadError } = await supabase.storage
        .from('model-images')
        .upload(fileName, file)

      if (uploadError) {
        throw new Error('Error subiendo imagen: ' + uploadError.message)
      }

      // Upsert DB
      const result = await upsertModelCatalogImageAction(modelId, color, fileName)
      
      if (!result.success) {
        // Rollback storage upload
        await supabase.storage.from('model-images').remove([fileName])
        throw new Error(result.error)
      }

      // Delete old file if existed
      if (result.previousPath && result.previousPath !== fileName) {
        await supabase.storage.from('model-images').remove([result.previousPath])
      }

      router.refresh()

    } catch (err: any) {
      console.error(err)
      setErrorMsg(err.message || 'Error desconocido.')
    } finally {
      setProcessing(null)
    }
  }

  const handleDelete = async (modelId: string, color: string) => {
    if (!confirm('¿Eliminar esta imagen?\n\nEste modelo y color dejarán de tener una imagen predefinida de catálogo.')) {
      return
    }

    const processKey = `${modelId}-${color}`
    setProcessing(processKey)
    setErrorMsg(null)

    try {
      const result = await deleteModelCatalogImageAction(modelId, color)
      
      if (!result.success) {
        throw new Error(result.error)
      }

      // Delete from storage
      if (result.deletedPath) {
        await supabase.storage.from('model-images').remove([result.deletedPath])
      }

      router.refresh()
    } catch (err: any) {
      console.error(err)
      setErrorMsg(err.message || 'Error eliminando imagen.')
    } finally {
      setProcessing(null)
    }
  }

  return (
    <AdminPageShell>
      <div className="flex flex-col gap-6 lg:gap-8 w-full max-w-6xl mx-auto pb-24">
        <div className="flex flex-col gap-2">
          <AdminPageHeader 
            title="Modelos" 
            subtitle="Gestiona las imágenes utilizadas en el catálogo." 
          />
          <p className="text-[14px] text-zinc-500 font-medium -mt-4">
            Cada color puede tener su propia imagen de catálogo.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center w-full">
          <div className="relative w-full max-w-[480px]">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 text-[20px]">search</span>
            <input 
              type="text" 
              placeholder="Buscar modelo..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-[#0B0B0E] text-white border border-[#1F1F24] rounded-xl pl-11 pr-4 py-3 text-[14px] font-medium outline-none focus:border-[#7a32d4]/50 focus:ring-1 focus:ring-[#7a32d4]/50 transition-all placeholder:text-zinc-600"
            />
          </div>
        </div>

        {errorMsg && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-[13px] font-bold">
            {errorMsg}
          </div>
        )}

        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/jpeg, image/png, image/webp"
          onChange={handleFileChange}
        />

        <div className="flex flex-col gap-10">
          {Object.entries(groupedModels).map(([category, catModels]) => (
            <div key={category} className="flex flex-col gap-4">
              <h3 className="text-[18px] font-extrabold text-white uppercase tracking-tight">
                {CATEGORY_LABELS[category] || category}
              </h3>
              
              <div className="flex flex-col gap-6">
                {catModels.map(model => {
                  const colors = colorVariants.filter(cv => cv.model_id === model.id)
                  const configuredCount = colors.filter(cv => catalogImages.some(ci => ci.model_id === model.id && ci.color === cv.value)).length
                  
                  return (
                    <div key={model.id} className="bg-[#0B0B0E] border border-[#1F1F24] rounded-2xl overflow-hidden flex flex-col">
                      <div className="bg-[#121217] border-b border-[#1F1F24] px-4 py-3 flex items-center justify-between">
                        <h4 className="font-bold text-[15px] text-white">{model.name}</h4>
                        {colors.length > 0 && (
                          <span className="text-[12px] font-semibold text-zinc-500">{configuredCount} de {colors.length} imágenes</span>
                        )}
                      </div>
                      
                      {colors.length === 0 ? (
                        <div className="px-4 py-4">
                          <p className="text-[13px] font-medium text-zinc-500">Este modelo no tiene colores activos configurados.</p>
                        </div>
                      ) : (
                        <div className="flex flex-col divide-y divide-[#1F1F24]">
                          {/* Desktop Header */}
                          <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-2 border-b border-[#1F1F24] bg-[#0B0B0E]">
                            <div className="col-span-3 text-[12px] font-semibold text-zinc-500 uppercase tracking-wider">Color</div>
                            <div className="col-span-3 text-[12px] font-semibold text-zinc-500 uppercase tracking-wider">Imagen</div>
                            <div className="col-span-3 text-[12px] font-semibold text-zinc-500 uppercase tracking-wider">Estado</div>
                            <div className="col-span-3 text-[12px] font-semibold text-zinc-500 uppercase tracking-wider text-right">Acción</div>
                          </div>

                          {colors.map(cv => {
                            const image = catalogImages.find(ci => ci.model_id === model.id && ci.color === cv.value)
                            const processKey = `${model.id}-${cv.value}`
                            const isProcessing = processing === processKey

                            return (
                              <div key={cv.value} className="flex flex-col md:grid md:grid-cols-12 gap-4 px-4 py-3 items-start md:items-center hover:bg-[#121217]/50 transition-colors">
                                {/* Color Name */}
                                <div className="md:col-span-3 font-bold text-white text-[14px]">
                                  {cv.value}
                                </div>
                                
                                {/* Thumbnail */}
                                <div className="md:col-span-3 w-full md:w-auto">
                                  <div className="w-16 h-16 md:w-16 md:h-16 bg-[#121217] rounded-xl border border-[#1F1F24] flex items-center justify-center overflow-hidden relative">
                                    {image ? (
                                      <img 
                                        src={`${supabaseUrl}/storage/v1/object/public/model-images/${image.storage_path}`} 
                                        alt={`${model.name} ${cv.value}`}
                                        className="w-full h-full object-contain p-2"
                                      />
                                    ) : (
                                      <span className="material-symbols-outlined text-[20px] text-zinc-700">image</span>
                                    )}
                                    {isProcessing && (
                                      <div className="absolute inset-0 bg-black/80 flex items-center justify-center backdrop-blur-sm">
                                        <span className="text-[10px] text-white font-bold uppercase tracking-wider">Subiendo...</span>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Status */}
                                <div className="md:col-span-3 flex items-center w-full md:w-auto">
                                  {image ? (
                                    <span className="text-[13px] font-bold text-[#d7baff] flex items-center gap-1.5 bg-[#7a32d4]/10 px-2.5 py-1 rounded-md border border-[#7a32d4]/20">
                                      <span className="material-symbols-outlined text-[14px]">check_circle</span>
                                      Configurada
                                    </span>
                                  ) : (
                                    <span className="text-[13px] font-semibold text-zinc-500">Sin imagen</span>
                                  )}
                                </div>
                                
                                {/* Actions */}
                                <div className="md:col-span-3 flex items-center gap-2 md:justify-end w-full md:w-auto mt-2 md:mt-0 pt-3 md:pt-0 border-t border-[#1F1F24] md:border-0">
                                  <button
                                    disabled={isProcessing}
                                    onClick={() => {
                                      setActiveUploadContext({ modelId: model.id, color: cv.value })
                                      fileInputRef.current?.click()
                                    }}
                                    className="px-4 py-1.5 bg-[#121217] hover:bg-[#1F1F24] text-white text-[13px] font-bold rounded-lg border border-[#1F1F24] transition-colors disabled:opacity-50 flex-1 md:flex-none text-center"
                                  >
                                    {image ? 'Cambiar' : 'Subir imagen'}
                                  </button>
                                  {image && (
                                    <button
                                      disabled={isProcessing}
                                      onClick={() => handleDelete(model.id, cv.value)}
                                      className="px-3 py-1.5 bg-transparent hover:bg-red-500/10 text-zinc-500 hover:text-red-400 text-[13px] font-bold rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center border border-transparent hover:border-red-500/30"
                                      title="Eliminar imagen"
                                    >
                                      <span className="material-symbols-outlined text-[18px]">delete</span>
                                      <span className="md:hidden ml-1">Eliminar</span>
                                    </button>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
          {filteredModels.length === 0 && (
            <div className="bg-[#0B0B0E] border border-[#1F1F24] rounded-2xl p-8 text-center flex flex-col items-center justify-center gap-3">
              <span className="material-symbols-outlined text-[48px] text-zinc-700">search_off</span>
              <p className="text-[14px] font-bold text-zinc-500">No se encontraron modelos.</p>
            </div>
          )}
        </div>
      </div>
    </AdminPageShell>
  )
}
