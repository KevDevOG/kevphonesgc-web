'use client'

import { useState, useRef, useEffect } from 'react'
import { updateDeviceAction } from '@/actions/devices'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

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

type DeviceImage = {
  id: string
  device_id: string
  storage_path: string
  position: number
}

type Device = {
  id: string
  model_id: string
  storage: string | null
  color: string | null
  imei_serial: string
  condition: string
  battery_health: number | null
  battery_cycles: number | null
  has_box: boolean
  has_cable: boolean
  has_invoice: boolean
  warranty_until: string | null
  original_parts: boolean
  fully_functional: boolean
  purchase_price: number
  listing_price: number
  purchase_location: string | null
  purchased_at: string
  internal_notes: string | null
  device_models: {
    category: string
  }
  device_images: DeviceImage[]
  clients: {
    name: string
    phone: string
    location: string | null
  } | null
}

type EditDeviceFormProps = {
  device: Device
  models: Model[]
  variants: Variant[]
}

const initialState = { error: '', success: false }

type ExistingImage = {
  isNew: false
  storage_path: string
  publicUrl: string
}

type NewImage = {
  isNew: true
  file: File
  preview: string
}

type ImageItem = ExistingImage | NewImage

export function EditDeviceForm({ device, models, variants }: EditDeviceFormProps) {
  const router = useRouter()
  const supabase = createClient()
  
  const [category, setCategory] = useState<string>(device.device_models.category)
  const [modelId, setModelId] = useState<string>(device.model_id)
  const [storage, setStorage] = useState<string>(device.storage || '')
  const [color, setColor] = useState<string>(device.color || '')
  const [condition, setCondition] = useState<string>(device.condition)
  const [batteryHealth, setBatteryHealth] = useState<string>(device.battery_health?.toString() || '')
  const [batteryCycles, setBatteryCycles] = useState<string>(device.battery_cycles?.toString() || '')
  
  const [images, setImages] = useState<ImageItem[]>([])
  
  const [uploading, setUploading] = useState(false)
  const [formState, setFormState] = useState(initialState)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Initial images load
    const sortedExisting = [...(device.device_images || [])].sort((a, b) => a.position - b.position)
    const existingItems: ExistingImage[] = sortedExisting.map(img => {
      const { data } = supabase.storage.from('device-images').getPublicUrl(img.storage_path)
      return {
        isNew: false,
        storage_path: img.storage_path,
        publicUrl: data.publicUrl
      }
    })
    setImages(existingItems)
  }, [device.device_images, supabase.storage])

  const selectedModel = models.find(m => m.id === modelId)
  
  const availableModels = models.filter(m => m.category === category)
  const availableStorage = selectedModel ? variants.filter(v => v.model_id === modelId && v.variant_type === 'storage') : []
  const availableColors = selectedModel ? variants.filter(v => v.model_id === modelId && v.variant_type === 'color') : []

  const handleCategoryChange = (val: string) => {
    setCategory(val)
    setModelId('')
    setStorage('')
    setColor('')
    setBatteryHealth('')
    setBatteryCycles('')
  }

  const handleModelChange = (val: string) => {
    setModelId(val)
    setStorage('')
    setColor('')
    setBatteryHealth('')
    setBatteryCycles('')
  }

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

      const newItems: NewImage[] = validFiles.map(file => ({
        isNew: true,
        file,
        preview: URL.createObjectURL(file)
      }))

      setImages(prev => [...prev, ...newItems])
    }
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const removeImage = (index: number) => {
    setImages(prev => {
      const img = prev[index]
      if (img.isNew) {
        URL.revokeObjectURL(img.preview)
      }
      return prev.filter((_, i) => i !== index)
    })
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setUploading(true)
    setFormState(initialState)
    
    try {
      const formData = new FormData(e.currentTarget)
      
      const finalImagePaths: string[] = []
      
      for (let i = 0; i < images.length; i++) {
        const img = images[i]
        if (img.isNew) {
          const file = img.file
          const fileExt = file.name.split('.').pop()
          const fileName = `${crypto.randomUUID()}.${fileExt}`
          const storagePath = `${device.id}/${fileName}`
          
          const { error: uploadError } = await supabase.storage
            .from('device-images')
            .upload(storagePath, file)
            
          if (uploadError) {
            throw new Error('Error al subir las imágenes. Inténtalo de nuevo.')
          }
          finalImagePaths.push(storagePath)
        } else {
          finalImagePaths.push(img.storage_path)
        }
      }
      
      formData.set('image_paths', JSON.stringify(finalImagePaths))
      
      if (!formData.has('has_box')) formData.set('has_box', 'off')
      if (!formData.has('has_cable')) formData.set('has_cable', 'off')
      if (!formData.has('has_invoice')) formData.set('has_invoice', 'off')
      if (!formData.has('original_parts')) formData.set('original_parts', 'off')
      if (!formData.has('fully_functional')) formData.set('fully_functional', 'off')
      
      if (!showBatteryHealth || !batteryHealth) {
        formData.set('battery_health', '')
      } else {
        formData.set('battery_health', batteryHealth)
      }
      if (!showBatteryCycles || !batteryCycles) {
        formData.set('battery_cycles', '')
      } else {
        formData.set('battery_cycles', batteryCycles)
      }

      const result = await updateDeviceAction(device.id, formData)
      
      if (result.error) {
        setFormState({ error: result.error, success: false })
      } else if (result.success) {
        router.push(`/admin/stock/${device.id}`)
      }
    } catch (error: any) {
      setFormState({ error: error.message || 'Error inesperado.', success: false })
    } finally {
      setUploading(false)
    }
  }

  const inputClass = "w-full bg-[#101014] border border-[#1F1F24] rounded-sm text-[#F7F7F7] p-3 focus:outline-none focus:ring-2 focus:ring-[#d7baff]/20 focus:border-[#d7baff] transition-all"
  const labelClass = "block text-sm font-semibold text-[#A8A8B0] uppercase tracking-wider mb-2"

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      
      {/* DISPOSITIVO */}
      <section className="bg-[#0B0B0D] border border-[#1F1F24] rounded-xl p-4 md:p-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-[#7a32d4]"></div>
        <h3 className="text-sm font-semibold text-[#A8A8B0] uppercase tracking-wider mb-6 flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">smartphone</span> Dispositivo
        </h3>
        
        <div className="space-y-6">
          <div>
            <label className={labelClass}>Categoría</label>
            <div className="flex gap-2 p-1 bg-[#101014] rounded-lg border border-[#1F1F24]">
              {[{ id: 'iphone', label: 'iPhone' }, { id: 'ps5', label: 'PlayStation' }, { id: 'nintendo_switch', label: 'Nintendo Switch' }].map(c => (
                <label key={c.id} className="flex-1 text-center cursor-pointer">
                  <input 
                    type="radio" 
                    name="category" 
                    value={c.id} 
                    checked={category === c.id}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    className="peer sr-only" 
                  />
                  <div className="py-2 rounded bg-[#0B0B0D] peer-checked:bg-[#7a32d4] peer-checked:text-[#e5cfff] text-[#A8A8B0] text-sm font-semibold transition-colors">
                    {c.label}
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className={labelClass}>Modelo</label>
            <select name="model_id" value={modelId} onChange={e => handleModelChange(e.target.value)} required className={inputClass}>
              <option value="">Selecciona un modelo...</option>
              {availableModels.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Capacidad</label>
              <select name="storage" value={storage} onChange={e => setStorage(e.target.value)} required={availableStorage.length > 0} className={inputClass} disabled={availableStorage.length === 0}>
                <option value="">{availableStorage.length > 0 ? "Selecciona..." : "N/A"}</option>
                {availableStorage.map(v => <option key={v.id} value={v.value}>{v.value}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Color</label>
              <select name="color" value={color} onChange={e => setColor(e.target.value)} required={availableColors.length > 0} className={inputClass} disabled={availableColors.length === 0}>
                <option value="">{availableColors.length > 0 ? "Selecciona..." : "N/A"}</option>
                {availableColors.map(v => <option key={v.id} value={v.value}>{v.value}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className={labelClass}>IMEI / Número de serie (Opcional)</label>
            <input type="text" name="imei_serial" placeholder="Introduce IMEI o Serie" defaultValue={device.imei_serial || ''} className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>Estado</label>
            <select name="condition" value={condition} onChange={e => setCondition(e.target.value)} required className={inputClass}>
              <option value="sealed">Precintado</option>
              <option value="like_new">Como nuevo</option>
              <option value="good">Buen estado</option>
              <option value="marked">Con marcas</option>
            </select>
          </div>
          
          {(showBatteryHealth || showBatteryCycles) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-[#1F1F24]">
              {showBatteryHealth && (
                <div>
                  <label className={labelClass}>Salud de batería (%)</label>
                  <input type="number" name="battery_health" min="0" max="100" value={batteryHealth} onChange={e => setBatteryHealth(e.target.value)} required className={inputClass} />
                </div>
              )}
              {showBatteryCycles && (
                <div>
                  <label className={labelClass}>Ciclos de carga</label>
                  <input type="number" name="battery_cycles" min="0" value={batteryCycles} onChange={e => setBatteryCycles(e.target.value)} required className={inputClass} />
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ACCESORIOS */}
      <section className="bg-[#0B0B0D] border border-[#1F1F24] rounded-xl p-4 md:p-6">
        <h3 className="text-sm font-semibold text-[#A8A8B0] uppercase tracking-wider mb-6 flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">inventory_2</span> Accesorios e Info
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          {[
            { name: 'has_box', label: 'Tiene caja', defaultChecked: device.has_box },
            { name: 'has_cable', label: 'Tiene cable', defaultChecked: device.has_cable },
            { name: 'has_invoice', label: 'Tiene factura', defaultChecked: device.has_invoice },
            { name: 'original_parts', label: 'Piezas originales', defaultChecked: device.original_parts },
            { name: 'fully_functional', label: 'Funcionamiento completo', defaultChecked: device.fully_functional }
          ].map(field => (
            <div key={field.name} className="flex justify-between items-center py-2 border-b border-[#1F1F24]">
              <span className="text-[#e5e2e1] text-sm">{field.label}</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" name={field.name} defaultChecked={field.defaultChecked} className="sr-only peer toggle-checkbox" />
                <div className="w-11 h-6 bg-[#353534] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all toggle-label transition-colors peer-checked:bg-[#7a32d4]"></div>
              </label>
            </div>
          ))}
        </div>
        <div className="mt-6">
          <label className={labelClass}>Garantía oficial hasta (Opcional)</label>
          <input type="date" name="warranty_until" defaultValue={device.warranty_until || ''} className={inputClass} />
        </div>
      </section>

      {/* VENDEDOR */}
      <section className="bg-[#0B0B0D] border border-[#1F1F24] rounded-xl p-4 md:p-6">
        <h3 className="text-sm font-semibold text-[#A8A8B0] uppercase tracking-wider mb-6 flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">person</span> Vendedor
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className={labelClass}>Nombre *</label>
            <input type="text" name="seller_name" required defaultValue={device.clients?.name || ''} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Teléfono *</label>
            <input type="text" name="seller_phone" required defaultValue={device.clients?.phone || ''} className={inputClass} />
          </div>
        </div>
        <div>
          <label className={labelClass}>Ubicación (Opcional)</label>
          <input type="text" name="seller_location" defaultValue={device.clients?.location || ''} className={inputClass} />
        </div>
      </section>

      {/* PRECIOS Y COMPRA */}
      <section className="bg-[#0B0B0D] border border-[#1F1F24] rounded-xl p-4 md:p-6">
        <h3 className="text-sm font-semibold text-[#A8A8B0] uppercase tracking-wider mb-6 flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">payments</span> Compra y Venta
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="relative">
            <label className={labelClass}>Precio de compra</label>
            <span className="absolute left-3 top-[34px] text-[#A8A8B0]">€</span>
            <input type="number" step="0.01" min="0" name="purchase_price" defaultValue={device.purchase_price} required className={`${inputClass} pl-8`} />
          </div>
          <div className="relative">
            <label className={labelClass}>Precio de publicación</label>
            <span className="absolute left-3 top-[34px] text-[#A8A8B0]">€</span>
            <input type="number" step="0.01" min="0" name="listing_price" defaultValue={device.listing_price} required className={`${inputClass} pl-8`} />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className={labelClass}>Fecha de compra</label>
            <input type="date" name="purchased_at" required defaultValue={device.purchased_at} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Lugar de compra</label>
            <input type="text" name="purchase_location" defaultValue={device.purchase_location || ''} className={inputClass} />
          </div>
        </div>
        <div>
          <label className={labelClass}>Notas internas</label>
          <textarea name="internal_notes" rows={3} defaultValue={device.internal_notes || ''} className={inputClass}></textarea>
        </div>
      </section>

      {/* FOTOS */}
      <section className="bg-[#0B0B0D] border border-[#1F1F24] rounded-xl p-4 md:p-6">
        <h3 className="text-sm font-semibold text-[#A8A8B0] uppercase tracking-wider mb-6 flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">photo_camera</span> Fotos
        </h3>
        
        <div className="flex gap-4 overflow-x-auto pb-4" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          <button 
            type="button" 
            onClick={() => fileInputRef.current?.click()}
            className="flex-shrink-0 w-32 h-32 flex flex-col items-center justify-center bg-[#101014] border-2 border-dashed border-[#4b4454] rounded-lg text-[#A8A8B0] hover:text-[#d7baff] hover:border-[#d7baff] transition-colors"
          >
            <span className="material-symbols-outlined text-3xl mb-2">add_photo_alternate</span>
            <span className="text-xs">Añadir foto</span>
          </button>
          
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            multiple 
            accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
            className="hidden" 
          />

          {images.map((img, idx) => (
            <div key={idx} className="relative flex-shrink-0 w-32 h-32 rounded-lg overflow-hidden border border-[#1F1F24] group bg-[#101014]">
              <img src={img.isNew ? img.preview : img.publicUrl} alt="Preview" className="w-full h-full object-cover" />
              <button 
                type="button" 
                onClick={() => removeImage(idx)}
                className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[#ffb4ab]"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>
          ))}
        </div>
        <p className="text-xs text-[#A8A8B0] mt-2">Máx 8MB por foto. Formatos: JPG, PNG, WEBP, HEIC</p>
      </section>

      {formState.error && (
        <div className="bg-[#93000a]/20 border border-[#93000a] text-[#ffdad6] p-4 rounded text-sm text-center">
          {formState.error}
        </div>
      )}

      <button 
        type="submit" 
        disabled={uploading}
        style={{ background: 'linear-gradient(135deg, #d7baff 0%, #B98AFF 100%)' }}
        className="w-full text-[#440087] font-bold py-4 rounded transition-all hover:opacity-90 active:scale-[0.98] shadow-lg shadow-[#d7baff]/10 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {uploading ? 'Guardando...' : 'Guardar cambios'}
      </button>
    </form>
  )
}
