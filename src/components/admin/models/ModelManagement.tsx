'use client'

import React, { useState, useMemo, useRef, useId } from 'react'
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
  'ipad': 'iPad',
  'macbook': 'MacBook',
  'apple_watch': 'Apple Watch',
  'airpods': 'AirPods',
  'ps5': 'PlayStation 5',
  'nintendo_switch': 'Nintendo Switch',
  'other': 'Otros'
}

export default function ModelManagement({ models, colorVariants, catalogImages }: Props) {
  const searchId = useId()
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [processing, setProcessing] = useState<string | null>(null) // '{modelId}-{color}' format
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  
  const router = useRouter()
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [activeUploadContext, setActiveUploadContext] = useState<{ modelId: string, color: string } | null>(null)

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''

  const filteredModels = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()
    return models.filter(model => {
      if (categoryFilter !== 'all' && model.category !== categoryFilter) return false
      if (!query) return true
      return [model.name, model.brand, model.category, CATEGORY_LABELS[model.category], ...colorVariants.filter(color => color.model_id === model.id).map(color => color.value)]
        .filter(Boolean).join(' ').toLowerCase().includes(query)
    })
  }, [models, colorVariants, searchTerm, categoryFilter])

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

  const categories = [...new Set(models.map(model => model.category))]
  const hasFilters = Boolean(searchTerm.trim()) || categoryFilter !== 'all'
  const resetFilters = () => {
    setSearchTerm('')
    setCategoryFilter('all')
  }

  const renderImageSlot = (model: Model, color: string, image: CatalogImage | undefined, isGeneral = false) => {
    const isProcessing = processing === `${model.id}-${color}`
    const label = isGeneral ? 'Imagen general del modelo' : color
    return <li key={color} className="admin-models__slot">
      <div className="admin-models__thumbnail">
        {image ? <img src={`${supabaseUrl}/storage/v1/object/public/model-images/${image.storage_path}`} alt={isGeneral ? `${model.name} Imagen general` : `${model.name} ${color}`} /> : <span aria-hidden="true" className="material-symbols-outlined">image</span>}
      </div>
      <div className="admin-models__slot-info"><strong>{label}</strong><span className="admin-models__image-state" data-configured={Boolean(image)} role={isProcessing ? 'status' : undefined}>{isProcessing ? 'Procesando...' : image ? 'Configurada' : 'Sin imagen'}</span></div>
      <div className="admin-models__slot-actions">
        <button type="button" disabled={isProcessing} onClick={() => {
          setActiveUploadContext({ modelId: model.id, color })
          fileInputRef.current?.click()
        }} aria-label={`${image ? 'Cambiar imagen' : 'Subir imagen'}: ${model.name}, ${label}`}>
          {image ? 'Cambiar' : 'Subir imagen'}
        </button>
        {image && <button type="button" disabled={isProcessing} className="admin-models__delete" onClick={() => handleDelete(model.id, color)} title="Eliminar imagen" aria-label={`Eliminar imagen: ${model.name}, ${label}`}><span aria-hidden="true" className="material-symbols-outlined">delete</span></button>}
      </div>
    </li>
  }

  return (
    <AdminPageShell>
      <div className="admin-models">
        <AdminPageHeader title="Modelos" subtitle="Gestiona las imágenes utilizadas en el catálogo." />
        <p className="admin-models__context">Modelos activos. Cada color puede tener su propia imagen de catálogo.</p>

        <div className="admin-models__toolbar">
          <div className="admin-models__search">
            <label htmlFor={searchId} className="sr-only">Buscar en catálogo por modelo, marca, categoría o color</label>
            <span aria-hidden="true" className="material-symbols-outlined">search</span>
            <input id={searchId} type="search" placeholder="Buscar en catálogo..." value={searchTerm} onChange={event => setSearchTerm(event.target.value)} />
          </div>
          <label className="admin-models__category"><span className="sr-only">Categoría</span>
            <select value={categoryFilter} onChange={event => setCategoryFilter(event.target.value)}>
              <option value="all">Todas las categorías</option>{categories.map(category => <option key={category} value={category}>{CATEGORY_LABELS[category] || category}</option>)}
            </select>
          </label>
          {hasFilters && <button type="button" className="admin-models__reset" onClick={resetFilters}>Limpiar filtros</button>}
        </div>
        <p className="admin-models__results" role="status" aria-live="polite">{filteredModels.length} {filteredModels.length === 1 ? 'modelo' : 'modelos'}</p>
        {errorMsg && <p role="alert" className="admin-models__error">{errorMsg}</p>}
        <input type="file" ref={fileInputRef} className="hidden" accept="image/jpeg, image/png, image/webp" onChange={handleFileChange} aria-label="Subir imagen de catálogo" />

        {filteredModels.length === 0 ? <div className="admin-models__empty">
          <h3>{models.length === 0 ? 'No hay modelos activos disponibles.' : 'No se encontraron modelos con estos filtros.'}</h3>
          {models.length > 0 && hasFilters && <button type="button" onClick={resetFilters}>Limpiar filtros</button>}
        </div> : <>
          <div className="admin-models__list-heading" aria-hidden="true"><span>Modelo</span><span>Categoría</span><span>Imágenes de catálogo</span><span>Gestión</span></div>
          <ul className="admin-models__list" aria-label="Modelos e imágenes de catálogo">
            {filteredModels.map(model => {
              const colors = colorVariants.filter(color => color.model_id === model.id)
              const configuredCount = colors.filter(color => catalogImages.some(image => image.model_id === model.id && image.color === color.value)).length
              const genericImage = catalogImages.find(image => image.model_id === model.id && image.color === '__default__')
              return <li key={model.id}>
                <details className="admin-models__model">
                  <summary>
                    <span className="admin-models__identity"><strong>{model.name}</strong>{model.brand && <span>{model.brand}</span>}</span>
                    <span className="admin-models__model-category">{CATEGORY_LABELS[model.category] || model.category}</span>
                    <span className="admin-models__coverage">{colors.length > 0 ? <><strong>{colors.length} {colors.length === 1 ? 'color' : 'colores'}</strong><span>{configuredCount} de {colors.length} imágenes</span></> : <><strong>Imagen general</strong><span>{genericImage ? '1 imagen general' : 'Sin imagen'}</span></>}</span>
                    <span className="admin-models__manage">Gestionar imágenes<span aria-hidden="true" className="material-symbols-outlined">expand_more</span></span>
                  </summary>
                  <div className="admin-models__expanded">
                    <ul className="admin-models__slots" aria-label={`Imágenes de ${model.name}`}>
                      {colors.length === 0 ? renderImageSlot(model, '__default__', genericImage, true) : colors.map(color => renderImageSlot(model, color.value, catalogImages.find(image => image.model_id === model.id && image.color === color.value)))}
                    </ul>
                  </div>
                </details>
              </li>
            })}
          </ul>
        </>}
      </div>
    </AdminPageShell>
  )
}
