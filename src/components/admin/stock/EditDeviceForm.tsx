'use client'

import { useState, useRef, useEffect } from 'react'
import { updateDeviceAction } from '@/actions/devices'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
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
  discount_price?: number | null
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

type CatalogImage = {
  model_id: string
  color: string
  storage_path: string
}

type EditDeviceFormProps = {
  device: Device
  models: Model[]
  variants: Variant[]
  catalogImages?: CatalogImage[]
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

export function EditDeviceForm({ device, models, variants, catalogImages = [] }: EditDeviceFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  
  const [category, setCategory] = useState<string>(device.device_models.category)
  const [modelId, setModelId] = useState<string>(device.model_id)
  const [storage, setStorage] = useState<string>(device.storage || '')
  const [color, setColor] = useState<string>(device.color || '')
  const [condition, setCondition] = useState<string>(device.condition)
  const [batteryHealth, setBatteryHealth] = useState<string>(device.battery_health?.toString() || '')
  const [batteryCycles, setBatteryCycles] = useState<string>(device.battery_cycles?.toString() || '')
  
  const [listingPrice, setListingPrice] = useState<string>(device.listing_price.toString())
  const [discountPrice, setDiscountPrice] = useState<string>(device.discount_price ? device.discount_price.toString() : '')
  const [isOfferActive, setIsOfferActive] = useState<boolean>(!!device.discount_price)

  const [images, setImages] = useState<ImageItem[]>([])
  
  const [uploading, setUploading] = useState(false)
  const [formState, setFormState] = useState(initialState)
  const [isTradeInReceived, setIsTradeInReceived] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    async function checkTradeIn() {
      const { data } = await supabase
        .from('trade_in_operations')
        .select('id')
        .eq('received_device_id', device.id)
        .maybeSingle()
      if (data) {
        setIsTradeInReceived(true)
      }
    }
    checkTradeIn()
  }, [device.id, supabase])

  useEffect(() => {
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
  const selectedCatalogImage = modelId && color
    ? catalogImages.find(ci => ci.model_id === modelId && ci.color === color)
    : null
  
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
    
    // Client-side validation for discount
    const lp = parseFloat(listingPrice)
    if (isOfferActive) {
      const dp = parseFloat(discountPrice)
      if (isNaN(dp) || dp <= 0 || dp >= lp) {
        setFormState({ error: 'El precio en oferta debe ser menor que el precio habitual.', success: false })
        return
      }
    }

    setUploading(true)
    setFormState(initialState)
    
    try {
      const formData = new FormData(e.currentTarget)
      
      if (!isOfferActive) {
        formData.set('discount_price', '')
      }
      
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

  const inputClass = "w-full bg-[#121217] border border-[#1F1F24] rounded-xl px-4 py-3 text-[14px] text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#7a32d4]/50 focus:ring-1 focus:ring-[#7a32d4]/50 transition-all"
  const labelClass = "text-[13px] font-semibold text-zinc-400"
  const sectionClass = "bg-[#0B0B0E] border border-[#1F1F24] rounded-2xl p-6 flex flex-col gap-6"
  const sectionTitleClass = "text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2"

  let discountPercentage: number | null = null
  const lpVal = parseFloat(listingPrice)
  const dpVal = parseFloat(discountPrice)
  if (isOfferActive && !isNaN(lpVal) && !isNaN(dpVal) && lpVal > 0 && dpVal < lpVal && dpVal > 0) {
    discountPercentage = Math.round(((lpVal - dpVal) / lpVal) * 100)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 lg:gap-8 pb-12">
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
                        onChange={(e) => handleCategoryChange(e.target.value)}
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
                <select name="model_id" value={modelId} onChange={e => handleModelChange(e.target.value)} required className={inputClass}>
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
                <input type="text" name="imei_serial" placeholder="Introduce IMEI o Serie" defaultValue={device.imei_serial || ''} className={inputClass} />
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
                      <input type="number" name="battery_cycles" min="0" value={batteryCycles} onChange={e => setBatteryCycles(e.target.value)} required className={inputClass} />
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
                { name: 'has_box', label: 'Tiene caja', defaultChecked: device.has_box },
                { name: 'has_cable', label: 'Tiene cable', defaultChecked: device.has_cable },
                { name: 'has_invoice', label: 'Tiene factura', defaultChecked: device.has_invoice },
                { name: 'original_parts', label: 'Piezas originales', defaultChecked: device.original_parts },
                { name: 'fully_functional', label: 'Funcionamiento completo', defaultChecked: device.fully_functional }
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
                <input type="date" name="warranty_until" defaultValue={device.warranty_until || ''} className={`${inputClass} [color-scheme:dark]`} />
              </div>
            </div>
          </section>

        </div>

        {/* RIGHT COLUMN */}
        <div className="flex flex-col gap-6 lg:gap-8">
          
          {/* PRECIOS Y COMPRA */}
          <section className={sectionClass}>
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <h3 className={sectionTitleClass}>
                  <span className="material-symbols-outlined text-[16px]">payments</span> Compra y Precios
                </h3>
              </div>

              {isTradeInReceived && (
                <div className="bg-[#B98AFF]/10 border border-[#B98AFF]/30 p-3.5 rounded-xl flex items-start gap-3">
                  <span className="material-symbols-outlined text-[#B98AFF] text-[20px] mt-0.5">info</span>
                  <p className="text-sm text-[#d7baff] font-medium">
                    Estos datos pertenecen a una parte de pago. Modifícalos desde «Editar operación».
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5 relative">
                  <label className={labelClass}>Precio de compra</label>
                  <span className="absolute left-4 top-[35px] text-zinc-500">€</span>
                  <input type="number" step="0.01" min="0" name="purchase_price" defaultValue={device.purchase_price} required disabled={isTradeInReceived} className={`${inputClass} pl-8 disabled:opacity-50 disabled:cursor-not-allowed`} />
                </div>
                <div className="flex flex-col gap-1.5 relative">
                  <label className={labelClass}>Precio de publicación</label>
                  <span className="absolute left-4 top-[35px] text-zinc-500">€</span>
                  <input type="number" step="0.01" min="0" name="listing_price" value={listingPrice} onChange={e => setListingPrice(e.target.value)} required className={`${inputClass} pl-8 font-bold text-[#d7baff] border-[#7a32d4]/30 bg-[#7a32d4]/5`} />
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className={labelClass}>Fecha de compra</label>
                  <input type="date" name="purchased_at" required defaultValue={device.purchased_at} disabled={isTradeInReceived} className={`${inputClass} [color-scheme:dark] disabled:opacity-50 disabled:cursor-not-allowed`} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className={labelClass}>Lugar de compra (Opcional)</label>
                  <input type="text" name="purchase_location" defaultValue={device.purchase_location || ''} disabled={isTradeInReceived} className={`${inputClass} disabled:opacity-50 disabled:cursor-not-allowed`} placeholder="Ej. Tienda física" />
                </div>
              </div>
              
              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>Notas internas (Opcional)</label>
                <textarea name="internal_notes" rows={3} defaultValue={device.internal_notes || ''} className={`${inputClass} resize-none`} placeholder="Notas visibles solo para administradores."></textarea>
              </div>
            </div>
          </section>

          {/* OFERTA */}
          <section className={sectionClass}>
            <div className="flex justify-between items-center">
              <h3 className={sectionTitleClass}>
                <span className="material-symbols-outlined text-[16px]">local_offer</span> Oferta
              </h3>
              {isOfferActive ? (
                <button
                  type="button"
                  onClick={() => {
                    setIsOfferActive(false)
                    setDiscountPrice('')
                  }}
                  className="text-xs font-semibold text-red-400 hover:text-red-300 bg-red-400/10 hover:bg-red-400/20 px-3 py-1 rounded-full transition-colors"
                >
                  Quitar oferta
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsOfferActive(true)}
                  className="text-xs font-semibold text-[#d7baff] hover:text-white bg-[#7a32d4]/10 hover:bg-[#7a32d4]/20 px-3 py-1 rounded-full transition-colors"
                >
                  Activar oferta
                </button>
              )}
            </div>
            
            <p className="text-sm text-zinc-400 -mt-2">
              Aplica un precio rebajado temporalmente a este dispositivo.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>Precio habitual</label>
                <div className="bg-[#121217] border border-[#1F1F24] rounded-xl px-4 py-3 text-[14px] text-zinc-400">
                  {listingPrice || '0'} €
                </div>
              </div>
              
              {isOfferActive && (
                <div className="flex flex-col gap-1.5 relative">
                  <div className="flex justify-between">
                    <label className={labelClass}>Precio en oferta</label>
                    {discountPercentage !== null && (
                      <span className="text-xs font-bold text-green-400 bg-green-400/10 px-2 rounded-md">
                        -{discountPercentage}%
                      </span>
                    )}
                  </div>
                  <span className="absolute left-4 top-[35px] text-zinc-500">€</span>
                  <input 
                    type="number" 
                    step="0.01" 
                    min="0" 
                    name="discount_price" 
                    value={discountPrice}
                    onChange={(e) => setDiscountPrice(e.target.value)}
                    required={isOfferActive} 
                    className={`${inputClass} pl-8 font-bold text-green-400 border-green-400/30 bg-green-400/5`} 
                  />
                </div>
              )}
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
                  <input type="text" name="seller_name" required defaultValue={device.clients?.name || ''} className={inputClass} placeholder="Ej. Juan Pérez" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className={labelClass}>Teléfono *</label>
                  <input type="text" name="seller_phone" required defaultValue={device.clients?.phone || ''} className={inputClass} placeholder="Ej. 600 000 000" />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>Ubicación (Opcional)</label>
                <input type="text" name="seller_location" defaultValue={device.clients?.location || ''} className={inputClass} placeholder="Ej. Las Palmas" />
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

          {images.map((img, idx) => (
            <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-[#1F1F24] group bg-[#121217]">
              <img src={img.isNew ? img.preview : img.publicUrl} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
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
            'Guardando...'
          ) : (
            <>
              <span className="material-symbols-outlined text-[18px]">save</span>
              Guardar cambios
            </>
          )}
        </button>
      </div>
    </form>
  )
}
