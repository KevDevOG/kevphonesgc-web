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
      <AdminPageHeader 
        title="Modelos" 
        subtitle="Gestiona las imágenes utilizadas en el catálogo." 
      />

      <div className="mt-6 mb-4 px-4 sm:px-6">
        <input 
          type="text" 
          placeholder="Buscar modelo..." 
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full bg-[#1c1b1b] text-white border border-[#333] rounded-xl px-4 py-3 outline-none focus:border-[#d7baff] transition-colors"
        />
        {errorMsg && (
          <div className="mt-4 p-4 bg-red-900/50 border border-red-500 rounded-xl text-red-200 text-sm">
            {errorMsg}
          </div>
        )}
      </div>

      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept="image/jpeg, image/png, image/webp"
        onChange={handleFileChange}
      />

      <div className="px-4 sm:px-6 pb-28 space-y-10">
        {Object.entries(groupedModels).map(([category, catModels]) => (
          <div key={category}>
            <h3 className="text-xl font-bold text-white mb-4 capitalize">{category.toLowerCase()}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {catModels.map(model => {
                const colors = colorVariants.filter(cv => cv.model_id === model.id)
                
                return (
                  <div key={model.id} className="bg-[#1c1b1b] border border-[#2A2A2A] rounded-2xl p-5 shadow-lg">
                    <h4 className="text-lg font-semibold text-[#F7F7F7] mb-4">{model.name}</h4>
                    
                    {colors.length === 0 ? (
                      <p className="text-sm text-[#A8A8B0]">Este modelo no tiene colores activos configurados.</p>
                    ) : (
                      <div className="space-y-4">
                        {colors.map(cv => {
                          const image = catalogImages.find(ci => ci.model_id === model.id && ci.color === cv.value)
                          const processKey = `${model.id}-${cv.value}`
                          const isProcessing = processing === processKey

                          return (
                            <div key={cv.value} className="flex flex-col bg-[#131313] rounded-xl p-3 border border-[#2A2A2A]">
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-medium text-[#F7F7F7]">{cv.value}</span>
                              </div>
                              
                              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                                <div className="w-24 h-24 bg-[#0a0a0a] rounded-lg border border-[#2A2A2A] flex items-center justify-center overflow-hidden shrink-0 relative">
                                  {image ? (
                                    <img 
                                      src={`${supabaseUrl}/storage/v1/object/public/model-images/${image.storage_path}`} 
                                      alt={`${model.name} ${cv.value}`}
                                      className="w-full h-full object-contain p-2"
                                    />
                                  ) : (
                                    <span className="text-xs text-[#A8A8B0] text-center px-2">Sin imagen</span>
                                  )}
                                  {isProcessing && (
                                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                      <span className="text-xs text-white font-medium">Subiendo...</span>
                                    </div>
                                  )}
                                </div>
                                
                                <div className="flex flex-col gap-2 w-full">
                                  <button
                                    disabled={isProcessing}
                                    onClick={() => {
                                      setActiveUploadContext({ modelId: model.id, color: cv.value })
                                      fileInputRef.current?.click()
                                    }}
                                    className="bg-[#2A2A2A] hover:bg-[#333] text-white text-xs font-semibold py-2 px-3 rounded-lg transition-colors w-full text-center disabled:opacity-50"
                                  >
                                    {image ? 'Cambiar' : 'Subir imagen'}
                                  </button>
                                  {image && (
                                    <button
                                      disabled={isProcessing}
                                      onClick={() => handleDelete(model.id, cv.value)}
                                      className="bg-transparent hover:bg-red-900/30 text-red-400 text-xs font-semibold py-2 px-3 rounded-lg border border-red-900/50 hover:border-red-500/50 transition-colors w-full text-center disabled:opacity-50"
                                    >
                                      Eliminar
                                    </button>
                                  )}
                                </div>
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
          <p className="text-center text-[#A8A8B0] mt-10">No se encontraron modelos.</p>
        )}
      </div>
    </AdminPageShell>
  )
}
