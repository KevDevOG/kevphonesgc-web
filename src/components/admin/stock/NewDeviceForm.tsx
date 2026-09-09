'use client'

import { useState, useRef, useEffect } from 'react'
import { createDeviceAction } from '@/actions/devices'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

type Model = {
  id: string
  category: string
  name: string
  supports_battery_health: boolean
  supports_cycles: boolean
}

type Variant = {
  id: string
  model_id: string
  variant_type: string
  value: string
}

type CatalogImage = {
  model_id: string
  color: string
  storage_path: string
}

type Props = {
  models: Model[]
  variants: Variant[]
  catalogImages?: CatalogImage[]
}

const initialState = { error: '', success: false }

export function NewDeviceForm({ models, variants, catalogImages = [] }: Props) {
  const [category, setCategory] = useState<string>('iphone')
  const [modelId, setModelId] = useState<string>('')
  const [storage, setStorage] = useState<string>('')
  const [color, setColor] = useState<string>('')
  const [condition, setCondition] = useState<string>('like_new')
  const [batteryHealth, setBatteryHealth] = useState<string>('')
  
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  
  const [uploading, setUploading] = useState(false)
  const [formState, setFormState] = useState(initialState)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const formRef = useRef<HTMLFormElement>(null)

  const selectedModel = models.find(m => m.id === modelId)
  
  const availableModels = models.filter(m => m.category === category)
  const availableStorage = selectedModel ? variants.filter(v => v.model_id === modelId && v.variant_type === 'storage') : []
  const availableColors = selectedModel ? variants.filter(v => v.model_id === modelId && v.variant_type === 'color') : []
  
  const selectedCatalogImage = modelId && color
    ? catalogImages.find(ci => ci.model_id === modelId && ci.color === color)
    : null

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''

  useEffect(() => {
    setModelId('')
  }, [category])

  useEffect(() => {
    setStorage('')
    setColor('')
    setBatteryHealth('')
  }, [modelId])

  const showBatteryHealth = selectedModel?.supports_battery_health && condition !== 'sealed'
  const showBatteryCycles = selectedModel?.supports_cycles && condition !== 'sealed' && batteryHealth === '100'

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files)
      
      const validFiles = filesArray.filter(file => {
        const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
        const validSize = file.size <= 8 * 1024 * 1024
        return validTypes.includes(file.type) && validSize
      })

      if (validFiles.length !== filesArray.length) {
        alert("Algunos archivos fueron ignorados (tipo no soportado o tamaño mayor a 8MB).")
      }

      setImageFiles(prev => [...prev, ...validFiles])
      
      const newPreviews = validFiles.map(file => URL.createObjectURL(file))
      setImagePreviews(prev => [...prev, ...newPreviews])
    }
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const removeImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index))
    setImagePreviews(prev => {
      URL.revokeObjectURL(prev[index])
      return prev.filter((_, i) => i !== index)
    })
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setUploading(true)
    setFormState(initialState)
    
    try {
      const formData = new FormData(e.currentTarget)
      const deviceUuid = crypto.randomUUID()
      formData.set('device_uuid', deviceUuid)
      
      const supabase = createClient()
      const uploadedPaths: string[] = []
      
      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i]
        const fileExt = file.name.split('.').pop()
        const fileName = `${crypto.randomUUID()}.${fileExt}`
        const storagePath = `${deviceUuid}/${fileName}`
        
        const { error: uploadError } = await supabase.storage
          .from('device-images')
          .upload(storagePath, file)
          
        if (uploadError) {
          throw new Error('Error al subir las imágenes. Inténtalo de nuevo.')
        }
        uploadedPaths.push(storagePath)
      }
      
      formData.set('image_paths', JSON.stringify(uploadedPaths))
      
      if (!formData.has('has_box')) formData.set('has_box', 'off')
      if (!formData.has('has_cable')) formData.set('has_cable', 'off')
      if (!formData.has('has_invoice')) formData.set('has_invoice', 'off')
      if (!formData.has('original_parts')) formData.set('original_parts', 'off')
      if (!formData.has('fully_functional')) formData.set('fully_functional', 'off')
      
      const result = await createDeviceAction(null, formData)
      
      if (result.error) {
        setFormState({ error: result.error, success: false })
      } else if (result.success) {
        setFormState({ error: '', success: true })
        formRef.current?.reset()
        setCategory('iphone')
        setModelId('')
        setImageFiles([])
        setImagePreviews(prev => {
          prev.forEach(p => URL.revokeObjectURL(p))
          return []
        })
      }
    } catch (error: any) {
      setFormState({ error: error.message || 'Error inesperado.', success: false })
    } finally {
      setUploading(false)
    }
  }

  const inputClass = "w-full bg-[#121217] border border-[#1F1F24] rounded-xl px-4 py-3 text-[14px] text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#7a32d4]/50 focus:ring-1 focus:ring-[#7a32d4]/50 transition-all"
  const labelClass = "text-[13px] font-semibold text-zinc-400"
  const sectionClass = "bg-[#0B0B0E] border border-[#1F1F24] rounded-2xl p-6 flex flex-col gap-6"
  const sectionTitleClass = "text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2"

  if (formState.success) {
    return (
      <div className="bg-[#0B0B0E] border border-[#22c55e]/20 p-8 rounded-2xl flex flex-col items-center justify-center text-center gap-4">
        <span className="material-symbols-outlined text-[#22c55e] text-5xl">check_circle</span>
        <h3 className="text-xl font-bold text-white">Dispositivo guardado correctamente.</h3>
        <p className="text-sm text-zinc-400 font-medium max-w-sm mt-1">
          Puedes añadir las fotos y publicarlo más tarde desde Stock.
        </p>
        <button 
          onClick={() => setFormState(initialState)}
          className="mt-2 bg-[#121217] hover:bg-[#1F1F24] border border-[#1F1F24] text-white font-semibold py-3 px-6 rounded-xl transition-colors"
        >
          Añadir otro dispositivo
        </button>
      </div>
    )
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-6 lg:gap-8 pb-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-start">
        
        {/* LEFT COLUMN */}
        <div className="flex flex-col gap-6 lg:gap-8">
          
          {/* DISPOSITIVO */}
          <section className={sectionClass}>
            <h3 className={sectionTitleClass}>
              <span className="material-symbols-outlined text-[16px]">smartphone</span> Dispositivo
            </h3>
            
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>Categoría</label>
                <div className="flex p-1 bg-[#121217] rounded-xl border border-[#1F1F24]">
                  {[{ id: 'iphone', label: 'iPhone' }, { id: 'ps5', label: 'PlayStation' }, { id: 'nintendo_switch', label: 'Nintendo Switch' }].map(c => (
                    <label key={c.id} className="flex-1 text-center cursor-pointer relative">
                      <input 
                        type="radio" 
                        name="category" 
                        value={c.id} 
                        checked={category === c.id}
                        onChange={(e) => setCategory(e.target.value)}
                        className="peer sr-only" 
                      />
                      <div className="py-2.5 rounded-lg peer-checked:bg-[#7a32d4]/10 peer-checked:text-[#d7baff] peer-checked:font-bold text-zinc-400 text-[13px] font-semibold transition-colors">
                        {c.label}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>Modelo</label>
                <select name="model_id" value={modelId} onChange={e => setModelId(e.target.value)} required className={inputClass}>
                  <option value="">Selecciona un modelo...</option>
                  {availableModels.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className={labelClass}>Capacidad</label>
                  <select name="storage" value={storage} onChange={e => setStorage(e.target.value)} required={availableStorage.length > 0} className={inputClass} disabled={availableStorage.length === 0}>
                    <option value="">{availableStorage.length > 0 ? "Selecciona..." : "N/A"}</option>
                    {availableStorage.map(v => <option key={v.id} value={v.value}>{v.value}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className={labelClass}>Color</label>
                  <select name="color" value={color} onChange={e => setColor(e.target.value)} required={availableColors.length > 0} className={inputClass} disabled={availableColors.length === 0}>
                    <option value="">{availableColors.length > 0 ? "Selecciona..." : "N/A"}</option>
                    {availableColors.map(v => <option key={v.id} value={v.value}>{v.value}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>IMEI / Número de serie (Opcional)</label>
                <input type="text" name="imei_serial" placeholder="Introduce IMEI o Serie" className={inputClass} />
              </div>
            </div>
          </section>

          {/* ESTADO / BATERIA */}
          <section className={sectionClass}>
            <h3 className={sectionTitleClass}>
              <span className="material-symbols-outlined text-[16px]">health_and_safety</span> Estado y Batería
            </h3>
            
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>Estado físico</label>
                <select name="condition" value={condition} onChange={e => setCondition(e.target.value)} required className={inputClass}>
                  <option value="sealed">Precintado</option>
                  <option value="like_new">Como nuevo</option>
                  <option value="good">Buen estado</option>
                  <option value="marked">Con marcas</option>
                </select>
              </div>
              
              {(showBatteryHealth || showBatteryCycles) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {showBatteryHealth && (
                    <div className="flex flex-col gap-1.5">
                      <label className={labelClass}>Salud de batería (%)</label>
                      <input type="number" name="battery_health" min="0" max="100" value={batteryHealth} onChange={e => setBatteryHealth(e.target.value)} required className={inputClass} />
                    </div>
                  )}
                  {showBatteryCycles && (
                    <div className="flex flex-col gap-1.5">
                      <label className={labelClass}>Ciclos de carga</label>
                      <input type="number" name="battery_cycles" min="0" required className={inputClass} />
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* ACCESORIOS */}
          <section className={sectionClass}>
            <h3 className={sectionTitleClass}>
              <span className="material-symbols-outlined text-[16px]">inventory_2</span> Accesorios
            </h3>
            <div className="flex flex-col gap-3">
              {[
                { name: 'has_box', label: 'Tiene caja', defaultChecked: false },
                { name: 'has_cable', label: 'Tiene cable', defaultChecked: false },
                { name: 'has_invoice', label: 'Tiene factura', defaultChecked: false },
                { name: 'original_parts', label: 'Piezas originales', defaultChecked: true },
                { name: 'fully_functional', label: 'Funcionamiento completo', defaultChecked: true }
              ].map(field => (
                <div key={field.name} className="flex justify-between items-center py-2.5 border-b border-[#1F1F24] last:border-0">
                  <span className="text-zinc-300 text-[14px] font-medium">{field.label}</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" name={field.name} defaultChecked={field.defaultChecked} className="sr-only peer" />
                    <div className="w-11 h-6 bg-[#1F1F24] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all transition-colors peer-checked:bg-[#7a32d4]"></div>
                  </label>
                </div>
              ))}
              
              <div className="flex flex-col gap-1.5 mt-2">
                <label className={labelClass}>Garantía oficial hasta (Opcional)</label>
                <input type="date" name="warranty_until" className={`${inputClass} [color-scheme:dark]`} />
              </div>
            </div>
          </section>

        </div>

        {/* RIGHT COLUMN */}
        <div className="flex flex-col gap-6 lg:gap-8">
          
          {/* PRECIOS Y COMPRA */}
          <section className={sectionClass}>
            <h3 className={sectionTitleClass}>
              <span className="material-symbols-outlined text-[16px]">payments</span> Compra y Precios
            </h3>
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5 relative">
                  <label className={labelClass}>Precio de compra</label>
                  <span className="absolute left-4 top-[35px] text-zinc-500">€</span>
                  <input type="number" step="0.01" min="0" name="purchase_price" required className={`${inputClass} pl-8`} />
                </div>
                <div className="flex flex-col gap-1.5 relative">
                  <label className={labelClass}>Precio de publicación</label>
                  <span className="absolute left-4 top-[35px] text-zinc-500">€</span>
                  <input type="number" step="0.01" min="0" name="listing_price" required className={`${inputClass} pl-8 font-bold text-[#d7baff] border-[#7a32d4]/30 bg-[#7a32d4]/5`} />
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className={labelClass}>Fecha de compra</label>
                  <input type="date" name="purchased_at" required defaultValue={new Date().toISOString().split('T')[0]} className={`${inputClass} [color-scheme:dark]`} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className={labelClass}>Lugar de compra (Opcional)</label>
                  <input type="text" name="purchase_location" className={inputClass} placeholder="Ej. Tienda física" />
                </div>
              </div>
              
              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>Notas internas (Opcional)</label>
                <textarea name="internal_notes" rows={3} className={`${inputClass} resize-none`} placeholder="Notas visibles solo para administradores."></textarea>
              </div>
            </div>
          </section>

          {/* VENDEDOR */}
          <section className={sectionClass}>
            <h3 className={sectionTitleClass}>
              <span className="material-symbols-outlined text-[16px]">person</span> Vendedor
            </h3>
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className={labelClass}>Nombre *</label>
                  <input type="text" name="seller_name" required className={inputClass} placeholder="Ej. Juan Pérez" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className={labelClass}>Teléfono *</label>
                  <input type="text" name="seller_phone" required className={inputClass} placeholder="Ej. 600 000 000" />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>Ubicación (Opcional)</label>
                <input type="text" name="seller_location" className={inputClass} placeholder="Ej. Las Palmas" />
              </div>
            </div>
          </section>

          {/* IMAGEN DE CATÁLOGO */}
          {modelId && color && (
            <section className={sectionClass}>
              <h3 className={sectionTitleClass}>
                <span className="material-symbols-outlined text-[16px]">image</span> Imagen de catálogo
              </h3>
              
              {selectedCatalogImage ? (
                <div className="flex items-center gap-4 bg-[#121217] p-4 rounded-xl border border-[#1F1F24]">
                  <div className="w-16 h-16 shrink-0 bg-white rounded-lg flex items-center justify-center p-1">
                    <img 
                      src={`${supabaseUrl}/storage/v1/object/public/model-images/${selectedCatalogImage.storage_path}`} 
                      alt="Catálogo"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-white">Imagen asignada</span>
                    <span className="text-xs text-zinc-400">Visible en la tienda pública.</span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-4 bg-[#121217] p-4 rounded-xl border border-[#1F1F24]">
                  <div className="w-16 h-16 shrink-0 bg-[#1F1F24] rounded-lg flex items-center justify-center text-zinc-600">
                    <span className="material-symbols-outlined">image_not_supported</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-semibold text-white">Sin imagen asignada</span>
                    <Link href="/admin/modelos" target="_blank" className="text-xs font-semibold text-[#d7baff] hover:underline">
                      Gestionar en Modelos
                    </Link>
                  </div>
                </div>
              )}
            </section>
          )}

        </div>
      </div>

      {/* FULL WIDTH BOTTOM: FOTOS Y SUBMIT */}
      <section className={sectionClass}>
        <div className="flex justify-between items-end mb-2">
          <h3 className={sectionTitleClass}>
            <span className="material-symbols-outlined text-[16px]">photo_camera</span> Fotos reales
          </h3>
          <span className="text-[11px] text-zinc-500 font-semibold uppercase">Máx 8MB/foto</span>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
          <button 
            type="button" 
            onClick={() => fileInputRef.current?.click()}
            className="aspect-square flex flex-col items-center justify-center bg-[#121217] border-2 border-dashed border-[#2a2a30] rounded-xl text-zinc-500 hover:text-[#d7baff] hover:border-[#d7baff]/50 transition-colors hover:bg-[#7a32d4]/5"
          >
            <span className="material-symbols-outlined text-2xl mb-1">add_photo_alternate</span>
            <span className="text-[11px] font-semibold">Añadir foto</span>
          </button>
          
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            multiple 
            accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
            className="hidden" 
          />

          {imagePreviews.map((preview, idx) => (
            <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-[#1F1F24] group bg-[#121217]">
              <img src={preview} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
              <button 
                type="button" 
                onClick={() => removeImage(idx)}
                className="absolute top-1.5 right-1.5 bg-black/70 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:text-white"
                title="Eliminar foto"
              >
                <span className="material-symbols-outlined text-[14px]">close</span>
              </button>
            </div>
          ))}
        </div>
      </section>

      {formState.error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm font-semibold text-center">
          {formState.error}
        </div>
      )}

      <div className="flex justify-end pt-2">
        <button 
          type="submit" 
          disabled={uploading}
          className="w-full lg:w-auto bg-[#7a32d4]/10 hover:bg-[#7a32d4]/20 border border-[#7a32d4]/30 text-[#d7baff] font-bold text-sm py-4 px-10 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {uploading ? (
            'Procesando...'
          ) : (
            <>
              <span className="material-symbols-outlined text-[18px]">cloud_upload</span>
              Guardar dispositivo
            </>
          )}
        </button>
      </div>
    </form>
  )
}
