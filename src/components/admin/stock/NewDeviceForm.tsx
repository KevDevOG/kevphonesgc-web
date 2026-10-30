'use client'

import { useState, useRef, useId, useEffect, useMemo } from 'react'
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

type Client = {
  id: string
  name: string
  phone: string
  location: string | null
}

type Compatibility = {
  id: string
  model_id: string
  parent_variant_type: string
  parent_value: string
  child_variant_type: string
  child_value: string
}

export type NewDeviceInitialValues = {
  model_id?: string | null
  storage?: string | null
  color?: string | null
  imei_serial?: string | null
  battery_health?: number | null
  battery_cycles?: number | null
  condition?: string | null
  has_box?: boolean | null
  has_cable?: boolean | null
  has_invoice?: boolean | null
  original_parts?: boolean | null
  fully_functional?: boolean | null
  warranty_until?: string | null
  purchase_price?: number | null
  listing_price?: number | null
  internal_notes?: string | null
  seller_client_id?: string | null
  seller_name?: string | null
  seller_phone?: string | null
  seller_location?: string | null
  purchased_at?: string | null
  purchase_location?: string | null
}

type Props = {
  models: Model[]
  variants: Variant[]
  compatibilities?: Compatibility[]
  catalogImages?: CatalogImage[]
  clients?: Client[]
  initialValues?: NewDeviceInitialValues
  mode?: 'normal' | 'quick'
  /** Batch card: hides the own submit button and shows a compact success state. */
  embedded?: boolean
  formId?: string
  onSubmitResult?: (result: NewDeviceSubmitResult) => void
}

const initialState = { error: '', success: false }

export type NewDeviceSubmitSummary = {
  modelName: string
  storage: string
  color: string
  listingPrice: number | null
}

export type NewDeviceSubmitResult = {
  success: boolean
  error?: string
  /** Set on success: ID of the device created by createDeviceAction. */
  deviceId?: string
  /** Set on success: values captured before the form resets itself. */
  summary?: NewDeviceSubmitSummary
}

export function NewDeviceForm({ models, variants, compatibilities = [], catalogImages = [], clients = [], initialValues, mode = 'normal', embedded = false, formId, onSubmitResult }: Props) {
  const [prefill, setPrefill] = useState<NewDeviceInitialValues | undefined>(initialValues)
  const [category, setCategory] = useState<string>('iphone')
  const [modelId, setModelId] = useState<string>(prefill?.model_id ?? '')
  const [chip, setChip] = useState<string>('')
  const [memory, setMemory] = useState<string>('')
  const [storage, setStorage] = useState<string>(prefill?.storage ?? '')
  const [color, setColor] = useState<string>(prefill?.color ?? '')
  const [size, setSize] = useState<string>('')
  const [connectivity, setConnectivity] = useState<string>('')
  const [caseType, setCaseType] = useState<string>('')
  const [caseMaterial, setCaseMaterial] = useState<string>('')
  const [condition, setCondition] = useState<string>(prefill?.condition ?? 'like_new')
  const [batteryHealth, setBatteryHealth] = useState<string>(prefill?.battery_health != null ? String(prefill.battery_health) : '')
  
  // Other category state
  const [productType, setProductType] = useState<string>('android_phone')
  const [customProductType, setCustomProductType] = useState<string>('')
  const [customBrand, setCustomBrand] = useState<string>('')
  const [customModelName, setCustomModelName] = useState<string>('')
  const [presetSpecs, setPresetSpecs] = useState<Record<string, string>>({})
  const [customSpecRows, setCustomSpecRows] = useState<{ id: string; name: string; value: string }[]>([])
  
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  
  const [uploading, setUploading] = useState(false)
  const [formState, setFormState] = useState(initialState)
  
  const [clientMode, setClientMode] = useState<'existing' | 'new'>(
    initialValues?.seller_client_id ? 'existing' : 'new'
  )
  const [selectedClientId, setSelectedClientId] = useState<string>(
    initialValues?.seller_client_id ?? ''
  )
  const [clientSearch, setClientSearch] = useState('')

  const fileInputRef = useRef<HTMLInputElement>(null)
  const formRef = useRef<HTMLFormElement>(null)

  const filteredClients = useMemo(() => {
    if (!clientSearch) return clients.slice(0, 5)
    const searchLower = clientSearch.toLowerCase()
    return clients.filter(c => 
      c.name.toLowerCase().includes(searchLower) || 
      c.phone.toLowerCase().includes(searchLower)
    )
  }, [clientSearch, clients])
  
  const selectedClient = clients.find(c => c.id === selectedClientId)

  const selectedModel = models.find(m => m.id === modelId)
  
  const availableModels = models.filter(m => m.category === category)
  
  const availableChips = selectedModel ? variants.filter(v => v.model_id === modelId && v.variant_type === 'chip') : []
  
  const rawMemories = selectedModel ? variants.filter(v => v.model_id === modelId && v.variant_type === 'memory') : []
  const availableMemories = chip && category === 'macbook'
    ? rawMemories.filter(m => compatibilities.some(c => c.model_id === modelId && c.parent_variant_type === 'chip' && c.parent_value === chip && c.child_variant_type === 'memory' && c.child_value === m.value))
    : rawMemories

  const rawStorages = selectedModel ? variants.filter(v => v.model_id === modelId && v.variant_type === 'storage') : []
  const availableStorage = chip && category === 'macbook'
    ? rawStorages.filter(s => compatibilities.some(c => c.model_id === modelId && c.parent_variant_type === 'chip' && c.parent_value === chip && c.child_variant_type === 'storage' && c.child_value === s.value))
    : rawStorages

  const availableColors = selectedModel ? variants.filter(v => v.model_id === modelId && v.variant_type === 'color') : []
  const availableSizes = selectedModel ? variants.filter(v => v.model_id === modelId && v.variant_type === 'size') : []
  const availableConnectivities = selectedModel ? variants.filter(v => v.model_id === modelId && v.variant_type === 'connectivity') : []
  const availableCaseTypes = selectedModel ? variants.filter(v => v.model_id === modelId && v.variant_type === 'case_type') : []
  const availableCaseMaterials = selectedModel ? variants.filter(v => v.model_id === modelId && v.variant_type === 'case_material') : []
  
  const selectedCatalogImage = modelId && color
    ? catalogImages.find(ci => ci.model_id === modelId && ci.color === color)
    : null

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''

  // Resets only run on real changes (not on mount) so prefilled values survive.
  const prevCategory = useRef(category)
  const prevModelId = useRef(modelId)
  const prevChip = useRef(chip)

  useEffect(() => {
    if (prevCategory.current === category) return
    prevCategory.current = category
    setModelId('')
    setChip('')
    setMemory('')
    setStorage('')
    setColor('')
    setSize('')
    setConnectivity('')
    setCaseType('')
    setCaseMaterial('')
    setBatteryHealth('')
    setPresetSpecs({})
    setCustomSpecRows([])
  }, [category])

  useEffect(() => {
    if (prevModelId.current === modelId) return
    prevModelId.current = modelId
    setChip('')
    setMemory('')
    setStorage('')
    setColor('')
    setSize('')
    setConnectivity('')
    setCaseType('')
    setCaseMaterial('')
    setBatteryHealth('')
  }, [modelId])

  useEffect(() => {
    if (prevChip.current === chip) return
    prevChip.current = chip
    setMemory('')
    setStorage('')
  }, [chip])

  const showBatteryHealth = selectedModel?.supports_battery_health && condition !== 'sealed'
  const showBatteryCycles = selectedModel?.supports_cycles && condition !== 'sealed'

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
      
      if (category === 'other') {
        const finalCustomSpecs: Record<string, string> = {}
        // Add preset specs
        Object.entries(presetSpecs).forEach(([k, v]) => {
          if (k.trim() && v.trim()) {
            finalCustomSpecs[k.trim()] = v.trim()
          }
        })
        // Add custom key/value rows
        customSpecRows.forEach(row => {
          if (row.name.trim() && row.value.trim()) {
            finalCustomSpecs[row.name.trim()] = row.value.trim()
          }
        })
        formData.set('custom_specs', JSON.stringify(finalCustomSpecs))
        
        const finalProdType = productType === 'other' ? (customProductType.trim() || 'other') : productType
        formData.set('custom_product_type', finalProdType)
        formData.set('custom_brand', customBrand.trim())
        formData.set('custom_model_name', customModelName.trim())
      }

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
        onSubmitResult?.({ success: false, error: result.error })
        setFormState({ error: result.error, success: false })
      } else if (result.success) {
        const priceRaw = String(formData.get('listing_price') ?? '').replace(',', '.')
        const priceNum = priceRaw.trim() ? Number(priceRaw) : NaN
        onSubmitResult?.({
          success: true,
          deviceId: result.deviceId ?? deviceUuid,
          summary: {
            modelName: models.find(m => m.id === String(formData.get('model_id') ?? ''))?.name ?? '',
            storage: String(formData.get('storage') ?? '').trim(),
            color: String(formData.get('color') ?? '').trim(),
            listingPrice: Number.isFinite(priceNum) ? priceNum : null
          }
        })
        setFormState({ error: '', success: true })
        setPrefill(undefined)
        formRef.current?.reset()
        setCategory('iphone')
        setModelId('')
        setChip('')
        setMemory('')
        setStorage('')
        setColor('')
        setSize('')
        setConnectivity('')
        setCaseType('')
        setCaseMaterial('')
        setProductType('android_phone')
        setCustomProductType('')
        setCustomBrand('')
        setCustomModelName('')
        setPresetSpecs({})
        setCustomSpecRows([])
        setImageFiles([])
        setImagePreviews(prev => {
          prev.forEach(p => URL.revokeObjectURL(p))
          return []
        })
        setClientMode('new')
        setSelectedClientId('')
        setClientSearch('')
      } else {
        onSubmitResult?.({ success: false, error: 'Respuesta inesperada del servidor.' })
      }
    } catch (error: any) {
      onSubmitResult?.({ success: false, error: error.message || 'Error inesperado.' })
      setFormState({ error: error.message || 'Error inesperado.', success: false })
    } finally {
      setUploading(false)
    }
  }

  const fieldId = useId()
  const hasStickySave = !embedded && mode === 'normal'

  const inputClass = "w-full bg-[#121217] border border-[#1F1F24] rounded-xl px-4 py-3 text-[14px] text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#7a32d4]/50 focus:ring-1 focus:ring-[#7a32d4]/50 transition-all"
  const labelClass = "admin-device-form__label"
  const sectionClass = "admin-device-form__section"
  const sectionTitleClass = "admin-device-form__section-title"

  if (formState.success) {
    if (embedded) {
      return (
        <div id={formId} className="admin-device-form admin-device-form__success admin-device-form__success--embedded">
          <span aria-hidden="true" className="material-symbols-outlined text-[#22c55e] text-3xl">check_circle</span>
          <span className="text-sm font-semibold text-white">Dispositivo guardado correctamente.</span>
        </div>
      )
    }
    return (
      <div className="admin-device-form admin-device-form__success">
        <span aria-hidden="true" className="material-symbols-outlined text-[#22c55e] text-5xl">check_circle</span>
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

  if (mode === 'quick') {
    return (
      <form id={formId} ref={formRef} onSubmit={handleSubmit} data-embedded={embedded} data-sticky-save={hasStickySave} className="admin-device-form admin-device-form--new">
        <input type="hidden" name="category" value="iphone" />

        {/* 1. SECCIÓN PRINCIPAL: DATOS ESENCIALES */}
        <section className={sectionClass}>
          <div className="flex items-center justify-between border-b border-[#1F1F24] pb-3">
            <h2 className={sectionTitleClass}>
              <span aria-hidden="true" className="material-symbols-outlined text-[18px] text-[#d7baff]">bolt</span>
              Datos esenciales del iPhone
            </h2>
            <span className="text-[11px] font-semibold text-[#d7baff] bg-[#7a32d4]/10 border border-[#7a32d4]/30 px-2.5 py-1 rounded-full">
              Revisión rápida
            </span>
          </div>

          <div className="flex flex-col gap-4">
            {/* Modelo */}
            <div className="flex flex-col gap-1.5">
              <label className={labelClass} htmlFor={`${fieldId}-model_id`}>Modelo *</label>
              <select
                name="model_id" id={`${fieldId}-model_id`}
                value={modelId}
                onChange={e => setModelId(e.target.value)}
                required
                className={inputClass}
              >
                <option value="">Selecciona un modelo...</option>
                {availableModels.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>

            {/* Capacidad y Color */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className={labelClass} htmlFor={`${fieldId}-storage`}>Capacidad *</label>
                <select
                  name="storage" id={`${fieldId}-storage`}
                  value={storage}
                  onChange={e => setStorage(e.target.value)}
                  required={availableStorage.length > 0}
                  className={inputClass}
                  disabled={availableStorage.length === 0}
                >
                  <option value="">{availableStorage.length > 0 ? "Selecciona..." : "N/A"}</option>
                  {availableStorage.map(v => <option key={v.id} value={v.value}>{v.value}</option>)}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className={labelClass} htmlFor={`${fieldId}-color`}>Color *</label>
                <select
                  name="color" id={`${fieldId}-color`}
                  value={color}
                  onChange={e => setColor(e.target.value)}
                  required={availableColors.length > 0}
                  className={inputClass}
                  disabled={availableColors.length === 0}
                >
                  <option value="">{availableColors.length > 0 ? "Selecciona..." : "N/A"}</option>
                  {availableColors.map(v => <option key={v.id} value={v.value}>{v.value}</option>)}
                </select>
              </div>
            </div>

            {/* IMEI / Serie */}
            <div className="flex flex-col gap-1.5">
              <label className={labelClass} htmlFor={`${fieldId}-imei_serial`}>IMEI / Número de serie (Opcional)</label>
              <input
                type="text"
                name="imei_serial" id={`${fieldId}-imei_serial`}
                defaultValue={prefill?.imei_serial ?? ''}
                placeholder="Introduce IMEI o Serie"
                className={inputClass}
              />
            </div>

            {/* Salud de batería y Ciclos de carga */}
            {(showBatteryHealth || showBatteryCycles) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {showBatteryHealth && (
                  <div className="flex flex-col gap-1.5">
                    <label className={labelClass} htmlFor={`${fieldId}-battery_health`}>Salud de batería (%) *</label>
                    <input
                      type="number"
                      name="battery_health" id={`${fieldId}-battery_health`}
                      min="0"
                      max="100"
                      value={batteryHealth}
                      onChange={e => setBatteryHealth(e.target.value)}
                      required
                      placeholder="Ej. 89"
                      className={inputClass}
                    />
                  </div>
                )}
                {showBatteryCycles && (
                  <div className="flex flex-col gap-1.5">
                    <label className={labelClass} htmlFor={`${fieldId}-battery_cycles`}>Ciclos de carga (Opcional)</label>
                    <input
                      type="number"
                      name="battery_cycles" id={`${fieldId}-battery_cycles`}
                      min="0"
                      defaultValue={prefill?.battery_cycles ?? ''}
                      placeholder="Ej. 317"
                      className={inputClass}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Estado físico */}
            <div className="flex flex-col gap-1.5">
              <label className={labelClass} htmlFor={`${fieldId}-condition`}>Estado físico *</label>
              <select
                name="condition" id={`${fieldId}-condition`}
                value={condition}
                onChange={e => setCondition(e.target.value)}
                required
                className={inputClass}
              >
                <option value="sealed">Precintado</option>
                <option value="like_new">Como nuevo</option>
                <option value="good">Buen estado</option>
                <option value="marked">Con marcas</option>
              </select>
            </div>

            {/* Precios: Compra y Venta */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5 relative">
                <label className={labelClass} htmlFor={`${fieldId}-purchase_price`}>Precio de compra *</label>
                <span className="absolute left-4 top-[35px] text-zinc-500">€</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  name="purchase_price" id={`${fieldId}-purchase_price`}
                  defaultValue={prefill?.purchase_price ?? ''}
                  required
                  placeholder="0.00"
                  className={`${inputClass} pl-8`}
                />
              </div>
              <div className="flex flex-col gap-1.5 relative">
                <label className={labelClass} htmlFor={`${fieldId}-listing_price`}>Precio de venta *</label>
                <span className="absolute left-4 top-[35px] text-zinc-500">€</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  name="listing_price" id={`${fieldId}-listing_price`}
                  defaultValue={prefill?.listing_price ?? ''}
                  required
                  placeholder="0.00"
                  className={`${inputClass} pl-8 font-bold text-[#d7baff] border-[#7a32d4]/30 bg-[#7a32d4]/5`}
                />
              </div>
            </div>

            {/* Controles booleanos compactos */}
            <div className="flex flex-col gap-2 pt-3 border-t border-[#1F1F24]">
              <label className={labelClass}>Accesorios y verificación</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
                {[
                  { name: 'has_box', label: 'Caja', defaultChecked: prefill?.has_box ?? false, icon: 'inventory_2' },
                  { name: 'has_cable', label: 'Cable', defaultChecked: prefill?.has_cable ?? false, icon: 'cable' },
                  { name: 'has_invoice', label: 'Factura', defaultChecked: prefill?.has_invoice ?? false, icon: 'receipt_long' },
                  { name: 'original_parts', label: 'Piezas orig.', defaultChecked: prefill?.original_parts ?? true, icon: 'verified' },
                  { name: 'fully_functional', label: 'Funciona 100%', defaultChecked: prefill?.fully_functional ?? true, icon: 'check_circle' },
                ].map(field => (
                  <label
                    key={field.name}
                    className="relative flex items-center justify-between p-3 rounded-xl border border-[#1F1F24] bg-[#121217] hover:bg-[#1a1a20] cursor-pointer transition-all select-none has-[:checked]:border-[#7a32d4]/40 has-[:checked]:bg-[#7a32d4]/10"
                  >
                    <span className="text-[13px] font-semibold text-zinc-300 flex items-center gap-1.5">
                      <span aria-hidden="true" className="material-symbols-outlined text-[16px] text-zinc-400">{field.icon}</span>
                      {field.label}
                    </span>
                    <input
                      type="checkbox"
                      name={field.name}
                      defaultChecked={field.defaultChecked}
                      className="w-4 h-4 rounded border-[#1F1F24] bg-[#0B0B0E] text-[#7a32d4] focus:ring-0 focus:ring-offset-0 cursor-pointer accent-[#7a32d4]"
                    />
                  </label>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 2. CAMPOS SECUNDARIOS */}
        <div className="admin-device-form__columns">
          {/* Vendedor */}
          <section className={sectionClass}>
            <h2 className={sectionTitleClass}>
              <span aria-hidden="true" className="material-symbols-outlined text-[16px]">person</span> Vendedor
            </h2>
            <div className="flex flex-col gap-4">
              <div className="flex p-1 bg-[#121217] rounded-xl border border-[#1F1F24] w-fit">
                <button
                  type="button"
                  onClick={() => { setClientMode('existing'); setSelectedClientId(''); setClientSearch(''); }}
                  aria-pressed={clientMode === 'existing'}
                  className={`px-4 py-2 rounded-lg text-[13px] font-semibold transition-colors ${clientMode === 'existing' ? 'bg-[#7a32d4]/10 text-[#d7baff]' : 'text-zinc-400 hover:text-white'}`}
                >
                  Cliente existente
                </button>
                <button
                  type="button"
                  onClick={() => { setClientMode('new'); setSelectedClientId(''); }}
                  aria-pressed={clientMode === 'new'}
                  className={`px-4 py-2 rounded-lg text-[13px] font-semibold transition-colors ${clientMode === 'new' ? 'bg-[#7a32d4]/10 text-[#d7baff]' : 'text-zinc-400 hover:text-white'}`}
                >
                  Nuevo cliente
                </button>
              </div>

              {clientMode === 'existing' && (
                <div className="flex flex-col gap-4">
                  {selectedClient ? (
                    <div className="bg-[#121217] border border-[#7a32d4]/30 rounded-xl p-4 flex flex-col gap-2 relative">
                      <input type="hidden" name="seller_client_id" value={selectedClient.id} />
                      <div className="flex justify-between items-start">
                        <div className="flex flex-col">
                          <span className="text-white font-bold">{selectedClient.name}</span>
                          <span className="text-zinc-400 text-sm">{selectedClient.phone}{selectedClient.location ? ` · ${selectedClient.location}` : ''}</span>
                        </div>
                        <button type="button" onClick={() => setSelectedClientId('')} aria-label="Cambiar cliente seleccionado" className="admin-device-form__clear-client text-zinc-500 hover:text-white">
                          <span aria-hidden="true" className="material-symbols-outlined text-[18px]">close</span>
                        </button>
                      </div>
                      <Link href={`/admin/clientes/${selectedClient.id}`} target="_blank" className="text-xs text-[#d7baff] hover:underline mt-1 w-fit">
                        Editar cliente
                      </Link>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <input
                        type="text"
                        required
                        value=""
                        onChange={() => {}}
                        className="sr-only pointer-events-none"
                        tabIndex={-1}
                        aria-hidden="true"
                      />
                      <div className="relative">
                        <span aria-hidden="true" className="material-symbols-outlined absolute left-3 top-3 text-zinc-500 text-[18px]">search</span>
                        <input
                          type="text"
                          aria-label="Buscar cliente por nombre o teléfono"
                          placeholder="Buscar por nombre o teléfono..."
                          value={clientSearch}
                          onChange={(e) => setClientSearch(e.target.value)}
                          className={`${inputClass} pl-10`}
                        />
                      </div>
                      {filteredClients.length > 0 && (
                        <div className="flex flex-col bg-[#121217] border border-[#1F1F24] rounded-xl overflow-hidden max-h-[200px] overflow-y-auto">
                          {filteredClients.map(client => (
                            <button
                              key={client.id}
                              type="button"
                              onClick={() => setSelectedClientId(client.id)}
                              className="flex flex-col items-start p-3 hover:bg-[#1F1F24] transition-colors border-b border-[#1F1F24] last:border-0 text-left"
                            >
                              <span className="text-white text-sm font-semibold">{client.name}</span>
                              <span className="text-zinc-400 text-xs">{client.phone}{client.location ? ` · ${client.location}` : ''}</span>
                            </button>
                          ))}
                        </div>
                      )}
                      {clientSearch && filteredClients.length === 0 && (
                        <div className="text-center p-4 text-sm text-zinc-500">
                          No se encontraron clientes.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {clientMode === 'new' && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className={labelClass} htmlFor={`${fieldId}-seller_name`}>Nombre *</label>
                      <input
                        type="text"
                        name="seller_name" id={`${fieldId}-seller_name`}
                        required
                        defaultValue={prefill?.seller_name ?? ''}
                        className={inputClass}
                        placeholder="Ej. Juan Pérez"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className={labelClass} htmlFor={`${fieldId}-seller_phone`}>Teléfono *</label>
                      <input
                        type="text"
                        name="seller_phone" id={`${fieldId}-seller_phone`}
                        required
                        defaultValue={prefill?.seller_phone ?? ''}
                        className={inputClass}
                        placeholder="Ej. 600 000 000"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className={labelClass} htmlFor={`${fieldId}-seller_location`}>Ubicación (Opcional)</label>
                    <input
                      type="text"
                      name="seller_location" id={`${fieldId}-seller_location`}
                      defaultValue={prefill?.seller_location ?? ''}
                      className={inputClass}
                      placeholder="Ej. Las Palmas"
                    />
                  </div>
                </>
              )}
            </div>
          </section>

          {/* Compra, Garantía y Notas */}
          <section className={sectionClass}>
            <h2 className={sectionTitleClass}>
              <span aria-hidden="true" className="material-symbols-outlined text-[16px]">receipt_long</span> Datos adicionales
            </h2>
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className={labelClass} htmlFor={`${fieldId}-purchased_at`}>Fecha de compra *</label>
                  <input
                    type="date"
                    name="purchased_at" id={`${fieldId}-purchased_at`}
                    required
                    defaultValue={prefill?.purchased_at ?? new Date().toISOString().split('T')[0]}
                    className={`${inputClass} [color-scheme:dark]`}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className={labelClass} htmlFor={`${fieldId}-purchase_location`}>Lugar de compra (Opcional)</label>
                  <input
                    type="text"
                    name="purchase_location" id={`${fieldId}-purchase_location`}
                    defaultValue={prefill?.purchase_location ?? ''}
                    className={inputClass}
                    placeholder="Ej. Particular"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className={labelClass} htmlFor={`${fieldId}-warranty_until`}>Garantía oficial hasta (Opcional)</label>
                <input
                  type="date"
                  name="warranty_until" id={`${fieldId}-warranty_until`}
                  defaultValue={prefill?.warranty_until ?? ''}
                  className={`${inputClass} [color-scheme:dark]`}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className={labelClass} htmlFor={`${fieldId}-internal_notes`}>Notas internas (Opcional)</label>
                <textarea
                  name="internal_notes" id={`${fieldId}-internal_notes`}
                  rows={3}
                  defaultValue={prefill?.internal_notes ?? ''}
                  className={`${inputClass} resize-none`}
                  placeholder="Notas visibles solo para administradores."
                />
              </div>
            </div>
          </section>
        </div>

        {/* Imagen de catálogo si existe */}
        {modelId && color && (
          <section className={sectionClass}>
            <h2 className={sectionTitleClass}>
              <span aria-hidden="true" className="material-symbols-outlined text-[16px]">image</span> Imagen de catálogo
            </h2>
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
                  <span className="text-xs text-zinc-400">Visible en la tienda pública (prioritaria).</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4 bg-[#121217] p-4 rounded-xl border border-[#1F1F24]">
                <div className="w-16 h-16 shrink-0 bg-[#1F1F24] rounded-lg flex items-center justify-center text-zinc-600">
                  <span aria-hidden="true" className="material-symbols-outlined">image_not_supported</span>
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

        {/* 3. FOTOS REALES (OPCIONAL) */}
        <section className={sectionClass}>
          <div className="flex justify-between items-end mb-2">
            <div className="flex items-center gap-2">
              <h2 className={sectionTitleClass}>
                <span aria-hidden="true" className="material-symbols-outlined text-[16px]">photo_camera</span> Fotos reales
              </h2>
              <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                Opcional
              </span>
            </div>
            <span className="text-[11px] text-zinc-500 font-semibold uppercase">
              Máx 8MB/foto · El catálogo prioriza la imagen oficial
            </span>
          </div>

          <div className="admin-device-form__photos">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="aspect-square flex flex-col items-center justify-center bg-[#121217] border-2 border-dashed border-[#2a2a30] rounded-xl text-zinc-500 hover:text-[#d7baff] hover:border-[#d7baff]/50 transition-colors hover:bg-[#7a32d4]/5"
            >
              <span aria-hidden="true" className="material-symbols-outlined text-2xl mb-1">add_photo_alternate</span>
              <span className="text-[11px] font-semibold">Añadir foto</span>
            </button>

            <input
              type="file"
              aria-label="Añadir fotos del dispositivo"
              ref={fileInputRef}
              onChange={handleFileChange}
              multiple
              accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
              className="hidden"
            />

            {imagePreviews.map((preview, idx) => (
              <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-[#1F1F24] group bg-[#121217]">
                <img src={preview} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  className="admin-device-form__photo-remove"
                  title="Eliminar foto"
                aria-label={`Eliminar foto ${idx + 1}`}
                >
                  <span aria-hidden="true" className="material-symbols-outlined text-[14px]">close</span>
                </button>
              </div>
            ))}
          </div>
        </section>

        <div className="admin-device-form__actions">
          {formState.error && <p className="admin-device-form__error" role="alert">{formState.error}</p>}
          {!embedded && <div className="admin-device-form__submit-row">
          <button
            type="submit"
            disabled={uploading}
            className="w-full lg:w-auto bg-[#7a32d4]/10 hover:bg-[#7a32d4]/20 border border-[#7a32d4]/30 text-[#d7baff] font-bold text-sm py-4 px-10 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {uploading ? (
              'Procesando...'
            ) : (
              <>
                <span aria-hidden="true" className="material-symbols-outlined text-[18px]">cloud_upload</span>
                Guardar dispositivo
              </>
            )}
          </button>
        </div>}
      </div>
    </form>
    )
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} data-embedded={embedded} data-sticky-save={hasStickySave} className="admin-device-form admin-device-form--new">
      <div className="admin-device-form__columns">
        
        {/* LEFT COLUMN */}
        <div className="flex flex-col gap-6 lg:gap-8">
          
          {/* DISPOSITIVO */}
          <section className={sectionClass}>
            <h2 className={sectionTitleClass}>
              <span aria-hidden="true" className="material-symbols-outlined text-[16px]">smartphone</span> Dispositivo
            </h2>
            
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>Categoría</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                  {[{ id: 'iphone', label: 'iPhone' }, { id: 'apple_watch', label: 'Apple Watch' }, { id: 'airpods', label: 'AirPods' }, { id: 'ipad', label: 'iPad' }, { id: 'macbook', label: 'MacBook' }, { id: 'ps5', label: 'PlayStation' }, { id: 'nintendo_switch', label: 'Nintendo Switch' }, { id: 'other', label: 'Otros' }].map(c => (
                    <label key={c.id} className="cursor-pointer relative h-full">
                      <input 
                        type="radio" 
                        name="category" 
                        value={c.id} 
                        checked={category === c.id}
                        onChange={(e) => setCategory(e.target.value)}
                        className="peer sr-only" 
                      />
                      <div className="h-full flex items-center justify-center p-3 text-center rounded-xl border border-[#1F1F24] bg-[#121217] hover:bg-[#1F1F24] peer-checked:bg-[#7a32d4]/10 peer-checked:border-[#7a32d4]/30 peer-checked:text-[#d7baff] peer-checked:font-bold peer-focus-visible:ring-2 peer-focus-visible:ring-[#7a32d4]/50 text-zinc-400 text-[13px] font-semibold transition-colors leading-snug">
                        {c.label}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {category === 'other' ? (
                <>
                  {/* Tipo de producto */}
                  <div className="flex flex-col gap-1.5">
                    <label className={labelClass} htmlFor={`${fieldId}-control-1`}>Tipo de producto</label>
                    <select id={`${fieldId}-control-1`}
                      value={productType}
                      onChange={(e) => {
                        setProductType(e.target.value)
                        setPresetSpecs({})
                      }}
                      className={inputClass}
                    >
                      <option value="android_phone">Móvil Android</option>
                      <option value="laptop">Portátil</option>
                      <option value="desktop_pc">PC sobremesa</option>
                      <option value="tablet">Tablet</option>
                      <option value="console">Consola</option>
                      <option value="other">Otro</option>
                    </select>
                  </div>

                  {productType === 'other' && (
                    <div className="flex flex-col gap-1.5">
                      <label className={labelClass} htmlFor={`${fieldId}-control-2`}>Tipo personalizado</label>
                      <input id={`${fieldId}-control-2`}
                        type="text"
                        value={customProductType}
                        onChange={(e) => setCustomProductType(e.target.value)}
                        placeholder="Ej: Monitor, Smartwatch Android, VR Headset..."
                        className={inputClass}
                      />
                    </div>
                  )}

                  {/* Marca y Modelo */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className={labelClass} htmlFor={`${fieldId}-control-3`}>Marca</label>
                      <input id={`${fieldId}-control-3`}
                        type="text"
                        value={customBrand}
                        onChange={(e) => setCustomBrand(e.target.value)}
                        placeholder="Ej: Samsung, Lenovo, ASUS..."
                        required
                        className={inputClass}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className={labelClass} htmlFor={`${fieldId}-control-4`}>Modelo / Nombre</label>
                      <input id={`${fieldId}-control-4`}
                        type="text"
                        value={customModelName}
                        onChange={(e) => setCustomModelName(e.target.value)}
                        placeholder="Ej: Galaxy S24 Ultra, Legion 5 Pro..."
                        required
                        className={inputClass}
                      />
                    </div>
                  </div>

                  {/* Preset Common Specs */}
                  {productType === 'android_phone' && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className={labelClass} htmlFor={`${fieldId}-control-5`}>RAM</label>
                        <input id={`${fieldId}-control-5`}
                          type="text"
                          value={presetSpecs['RAM'] || ''}
                          onChange={(e) => setPresetSpecs(prev => ({ ...prev, 'RAM': e.target.value }))}
                          placeholder="Ej: 12GB"
                          className={inputClass}
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className={labelClass} htmlFor={`${fieldId}-storage`}>Almacenamiento</label>
                        <input
                          type="text"
                          name="storage" id={`${fieldId}-storage`}
                          value={storage}
                          onChange={(e) => {
                            setStorage(e.target.value)
                            setPresetSpecs(prev => ({ ...prev, 'Almacenamiento': e.target.value }))
                          }}
                          placeholder="Ej: 256GB"
                          className={inputClass}
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className={labelClass} htmlFor={`${fieldId}-color`}>Color</label>
                        <input
                          type="text"
                          name="color" id={`${fieldId}-color`}
                          value={color}
                          onChange={(e) => {
                            setColor(e.target.value)
                            setPresetSpecs(prev => ({ ...prev, 'Color': e.target.value }))
                          }}
                          placeholder="Ej: Titanium Gray"
                          className={inputClass}
                        />
                      </div>
                    </div>
                  )}

                  {productType === 'laptop' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className={labelClass} htmlFor={`${fieldId}-control-6`}>Procesador</label>
                        <input id={`${fieldId}-control-6`}
                          type="text"
                          value={presetSpecs['Procesador'] || ''}
                          onChange={(e) => setPresetSpecs(prev => ({ ...prev, 'Procesador': e.target.value }))}
                          placeholder="Ej: Intel Core i7-13700H"
                          className={inputClass}
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className={labelClass} htmlFor={`${fieldId}-control-7`}>Gráfica</label>
                        <input id={`${fieldId}-control-7`}
                          type="text"
                          value={presetSpecs['Gráfica'] || ''}
                          onChange={(e) => setPresetSpecs(prev => ({ ...prev, 'Gráfica': e.target.value }))}
                          placeholder="Ej: NVIDIA RTX 4060"
                          className={inputClass}
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className={labelClass} htmlFor={`${fieldId}-control-8`}>RAM</label>
                        <input id={`${fieldId}-control-8`}
                          type="text"
                          value={presetSpecs['RAM'] || ''}
                          onChange={(e) => setPresetSpecs(prev => ({ ...prev, 'RAM': e.target.value }))}
                          placeholder="Ej: 16GB DDR5"
                          className={inputClass}
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className={labelClass} htmlFor={`${fieldId}-storage`}>Almacenamiento</label>
                        <input
                          type="text"
                          name="storage" id={`${fieldId}-storage`}
                          value={storage}
                          onChange={(e) => {
                            setStorage(e.target.value)
                            setPresetSpecs(prev => ({ ...prev, 'Almacenamiento': e.target.value }))
                          }}
                          placeholder="Ej: 1TB SSD NVMe"
                          className={inputClass}
                        />
                      </div>
                      <div className="flex flex-col gap-1.5 sm:col-span-2">
                        <label className={labelClass} htmlFor={`${fieldId}-control-9`}>Tamaño de pantalla</label>
                        <input id={`${fieldId}-control-9`}
                          type="text"
                          value={presetSpecs['Tamaño de pantalla'] || ''}
                          onChange={(e) => setPresetSpecs(prev => ({ ...prev, 'Tamaño de pantalla': e.target.value }))}
                          placeholder="Ej: 16 pulg 165Hz WQXGA"
                          className={inputClass}
                        />
                      </div>
                    </div>
                  )}

                  {productType === 'desktop_pc' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className={labelClass} htmlFor={`${fieldId}-control-10`}>Procesador</label>
                        <input id={`${fieldId}-control-10`}
                          type="text"
                          value={presetSpecs['Procesador'] || ''}
                          onChange={(e) => setPresetSpecs(prev => ({ ...prev, 'Procesador': e.target.value }))}
                          placeholder="Ej: AMD Ryzen 7 7800X3D"
                          className={inputClass}
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className={labelClass} htmlFor={`${fieldId}-control-11`}>Gráfica</label>
                        <input id={`${fieldId}-control-11`}
                          type="text"
                          value={presetSpecs['Gráfica'] || ''}
                          onChange={(e) => setPresetSpecs(prev => ({ ...prev, 'Gráfica': e.target.value }))}
                          placeholder="Ej: RTX 4070 Ti Super 16GB"
                          className={inputClass}
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className={labelClass} htmlFor={`${fieldId}-control-12`}>RAM</label>
                        <input id={`${fieldId}-control-12`}
                          type="text"
                          value={presetSpecs['RAM'] || ''}
                          onChange={(e) => setPresetSpecs(prev => ({ ...prev, 'RAM': e.target.value }))}
                          placeholder="Ej: 32GB (2x16GB) DDR5 6000MHz"
                          className={inputClass}
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className={labelClass} htmlFor={`${fieldId}-storage`}>Almacenamiento</label>
                        <input
                          type="text"
                          name="storage" id={`${fieldId}-storage`}
                          value={storage}
                          onChange={(e) => {
                            setStorage(e.target.value)
                            setPresetSpecs(prev => ({ ...prev, 'Almacenamiento': e.target.value }))
                          }}
                          placeholder="Ej: 2TB Kingston KC3000 PCIe 4.0"
                          className={inputClass}
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className={labelClass} htmlFor={`${fieldId}-control-13`}>Placa base</label>
                        <input id={`${fieldId}-control-13`}
                          type="text"
                          value={presetSpecs['Placa base'] || ''}
                          onChange={(e) => setPresetSpecs(prev => ({ ...prev, 'Placa base': e.target.value }))}
                          placeholder="Ej: MSI B650 Gaming Plus WiFi"
                          className={inputClass}
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className={labelClass} htmlFor={`${fieldId}-control-14`}>Fuente de alimentación</label>
                        <input id={`${fieldId}-control-14`}
                          type="text"
                          value={presetSpecs['Fuente de alimentación'] || ''}
                          onChange={(e) => setPresetSpecs(prev => ({ ...prev, 'Fuente de alimentación': e.target.value }))}
                          placeholder="Ej: Corsair RM750e 750W 80 Plus Gold"
                          className={inputClass}
                        />
                      </div>
                    </div>
                  )}

                  {productType === 'tablet' && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className={labelClass} htmlFor={`${fieldId}-control-15`}>RAM</label>
                        <input id={`${fieldId}-control-15`}
                          type="text"
                          value={presetSpecs['RAM'] || ''}
                          onChange={(e) => setPresetSpecs(prev => ({ ...prev, 'RAM': e.target.value }))}
                          placeholder="Ej: 8GB"
                          className={inputClass}
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className={labelClass} htmlFor={`${fieldId}-storage`}>Almacenamiento</label>
                        <input
                          type="text"
                          name="storage" id={`${fieldId}-storage`}
                          value={storage}
                          onChange={(e) => {
                            setStorage(e.target.value)
                            setPresetSpecs(prev => ({ ...prev, 'Almacenamiento': e.target.value }))
                          }}
                          placeholder="Ej: 128GB"
                          className={inputClass}
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className={labelClass} htmlFor={`${fieldId}-color`}>Color</label>
                        <input
                          type="text"
                          name="color" id={`${fieldId}-color`}
                          value={color}
                          onChange={(e) => {
                            setColor(e.target.value)
                            setPresetSpecs(prev => ({ ...prev, 'Color': e.target.value }))
                          }}
                          placeholder="Ej: Graphite"
                          className={inputClass}
                        />
                      </div>
                    </div>
                  )}

                  {productType === 'console' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className={labelClass} htmlFor={`${fieldId}-storage`}>Almacenamiento</label>
                        <input
                          type="text"
                          name="storage" id={`${fieldId}-storage`}
                          value={storage}
                          onChange={(e) => {
                            setStorage(e.target.value)
                            setPresetSpecs(prev => ({ ...prev, 'Almacenamiento': e.target.value }))
                          }}
                          placeholder="Ej: 512GB"
                          className={inputClass}
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className={labelClass} htmlFor={`${fieldId}-color`}>Color</label>
                        <input
                          type="text"
                          name="color" id={`${fieldId}-color`}
                          value={color}
                          onChange={(e) => {
                            setColor(e.target.value)
                            setPresetSpecs(prev => ({ ...prev, 'Color': e.target.value }))
                          }}
                          placeholder="Ej: Negro"
                          className={inputClass}
                        />
                      </div>
                    </div>
                  )}

                  {/* Custom Key/Value Specifications */}
                  <div className="flex flex-col gap-3 pt-2 border-t border-[#1F1F24]">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Especificaciones personalizadas</span>
                      <button
                        type="button"
                        onClick={() => setCustomSpecRows(prev => [...prev, { id: crypto.randomUUID(), name: '', value: '' }])}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[#d7baff] hover:text-white transition-colors"
                      >
                        <span aria-hidden="true" className="material-symbols-outlined text-[16px]">add</span>
                        + Añadir especificación
                      </button>
                    </div>

                    {customSpecRows.map((row, idx) => (
                      <div key={row.id} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={row.name}
                          onChange={(e) => {
                            const val = e.target.value
                            setCustomSpecRows(prev => prev.map((r, i) => i === idx ? { ...r, name: val } : r))
                          }}
                          placeholder="Nombre (ej: Refrigeración)"
                          className="flex-1 bg-[#121217] border border-[#1F1F24] rounded-xl px-3 py-2 text-[13px] text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#7a32d4]/50"
                        />
                        <input
                          type="text"
                          value={row.value}
                          onChange={(e) => {
                            const val = e.target.value
                            setCustomSpecRows(prev => prev.map((r, i) => i === idx ? { ...r, value: val } : r))
                          }}
                          placeholder="Valor (ej: NZXT Kraken 240)"
                          className="flex-1 bg-[#121217] border border-[#1F1F24] rounded-xl px-3 py-2 text-[13px] text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#7a32d4]/50"
                        />
                        <button
                          type="button"
                          aria-label="Eliminar especificación"
                          onClick={() => setCustomSpecRows(prev => prev.filter((_, i) => i !== idx))}
                          className="p-2 text-zinc-500 hover:text-red-400 transition-colors rounded-lg hover:bg-red-500/10"
                        >
                          <span aria-hidden="true" className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <>
              <div className="flex flex-col gap-1.5">
                <label className={labelClass} htmlFor={`${fieldId}-model_id`}>Modelo</label>
                <select name="model_id" id={`${fieldId}-model_id`} value={modelId} onChange={e => setModelId(e.target.value)} required className={inputClass}>
                  <option value="">Selecciona un modelo...</option>
                  {availableModels.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {category !== 'apple_watch' && category !== 'airpods' && (
                  <>
                    <div className="flex flex-col gap-1.5">
                      <label className={labelClass} htmlFor={`${fieldId}-storage`}>Capacidad</label>
                      <select name="storage" id={`${fieldId}-storage`} value={storage} onChange={e => setStorage(e.target.value)} required={availableStorage.length > 0} className={inputClass} disabled={availableStorage.length === 0}>
                        <option value="">{availableStorage.length > 0 ? "Selecciona..." : "N/A"}</option>
                        {availableStorage.map(v => <option key={v.id} value={v.value}>{v.value}</option>)}
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className={labelClass} htmlFor={`${fieldId}-color`}>Color</label>
                      <select name="color" id={`${fieldId}-color`} value={color} onChange={e => setColor(e.target.value)} required={availableColors.length > 0} className={inputClass} disabled={availableColors.length === 0}>
                        <option value="">{availableColors.length > 0 ? "Selecciona..." : "N/A"}</option>
                        {availableColors.map(v => <option key={v.id} value={v.value}>{v.value}</option>)}
                      </select>
                    </div>
                  </>
                )}

                {category === 'ipad' && (
                  <div className="flex flex-col gap-1.5">
                    <label className={labelClass} htmlFor={`${fieldId}-connectivity`}>Conectividad</label>
                    <select name="connectivity" id={`${fieldId}-connectivity`} value={connectivity} onChange={e => setConnectivity(e.target.value)} required={availableConnectivities.length > 0} className={inputClass} disabled={availableConnectivities.length === 0}>
                      <option value="">{availableConnectivities.length > 0 ? "Selecciona..." : "N/A"}</option>
                      {availableConnectivities.map(v => <option key={v.id} value={v.value}>{v.value}</option>)}
                    </select>
                  </div>
                )}
                
                {category === 'apple_watch' && (
                  <>
                    <div className="flex flex-col gap-1.5">
                      <label className={labelClass} htmlFor={`${fieldId}-size`}>Tamaño</label>
                      <select name="size" id={`${fieldId}-size`} value={size} onChange={e => setSize(e.target.value)} required={availableSizes.length > 0} className={inputClass} disabled={availableSizes.length === 0}>
                        <option value="">{availableSizes.length > 0 ? "Selecciona..." : "N/A"}</option>
                        {availableSizes.map(v => <option key={v.id} value={v.value}>{v.value}</option>)}
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className={labelClass} htmlFor={`${fieldId}-connectivity`}>Conectividad</label>
                      <select name="connectivity" id={`${fieldId}-connectivity`} value={connectivity} onChange={e => setConnectivity(e.target.value)} required={availableConnectivities.length > 0} className={inputClass} disabled={availableConnectivities.length === 0}>
                        <option value="">{availableConnectivities.length > 0 ? "Selecciona..." : "N/A"}</option>
                        {availableConnectivities.map(v => <option key={v.id} value={v.value}>{v.value}</option>)}
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className={labelClass} htmlFor={`${fieldId}-case_material`}>Material de caja</label>
                      <select name="case_material" id={`${fieldId}-case_material`} value={caseMaterial} onChange={e => setCaseMaterial(e.target.value)} required={availableCaseMaterials.length > 0} className={inputClass} disabled={availableCaseMaterials.length === 0}>
                        <option value="">{availableCaseMaterials.length > 0 ? "Selecciona..." : "N/A"}</option>
                        {availableCaseMaterials.map(v => <option key={v.id} value={v.value}>{v.value}</option>)}
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className={labelClass} htmlFor={`${fieldId}-color`}>Color</label>
                      <select name="color" id={`${fieldId}-color`} value={color} onChange={e => setColor(e.target.value)} required={availableColors.length > 0} className={inputClass} disabled={availableColors.length === 0}>
                        <option value="">{availableColors.length > 0 ? "Selecciona..." : "N/A"}</option>
                        {availableColors.map(v => <option key={v.id} value={v.value}>{v.value}</option>)}
                      </select>
                    </div>
                  </>
                )}
                
                {category === 'airpods' && (
                  <>
                    {availableCaseTypes.length > 0 && (
                      <div className="flex flex-col gap-1.5">
                        <label className={labelClass} htmlFor={`${fieldId}-case_type`}>Tipo de estuche</label>
                        <select name="case_type" id={`${fieldId}-case_type`} value={caseType} onChange={e => setCaseType(e.target.value)} required className={inputClass}>
                          <option value="">Selecciona...</option>
                          {availableCaseTypes.map(v => <option key={v.id} value={v.value}>{v.value}</option>)}
                        </select>
                      </div>
                    )}
                    {availableColors.length > 0 && (
                      <div className="flex flex-col gap-1.5">
                        <label className={labelClass} htmlFor={`${fieldId}-color`}>Color</label>
                        <select name="color" id={`${fieldId}-color`} value={color} onChange={e => setColor(e.target.value)} required className={inputClass}>
                          <option value="">Selecciona...</option>
                          {availableColors.map(v => <option key={v.id} value={v.value}>{v.value}</option>)}
                        </select>
                      </div>
                    )}
                  </>
                )}

                {category === 'macbook' && (
                  <>
                    <div className="flex flex-col gap-1.5">
                      <label className={labelClass} htmlFor={`${fieldId}-chip`}>Chip (Procesador)</label>
                      <select name="chip" id={`${fieldId}-chip`} value={chip} onChange={e => setChip(e.target.value)} required={availableChips.length > 0} className={inputClass} disabled={availableChips.length === 0}>
                        <option value="">{availableChips.length > 0 ? "Selecciona..." : "N/A"}</option>
                        {availableChips.map(v => <option key={v.id} value={v.value}>{v.value}</option>)}
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className={labelClass} htmlFor={`${fieldId}-memory`}>Memoria Unificada</label>
                      <select name="memory" id={`${fieldId}-memory`} value={memory} onChange={e => setMemory(e.target.value)} required={availableMemories.length > 0} className={inputClass} disabled={availableMemories.length === 0 || (!chip && availableChips.length > 0)}>
                        <option value="">{availableMemories.length > 0 ? "Selecciona..." : "N/A"}</option>
                        {availableMemories.map(v => <option key={v.id} value={v.value}>{v.value}</option>)}
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className={labelClass} htmlFor={`${fieldId}-storage`}>Almacenamiento SSD</label>
                      <select name="storage" id={`${fieldId}-storage`} value={storage} onChange={e => setStorage(e.target.value)} required={availableStorage.length > 0} className={inputClass} disabled={availableStorage.length === 0 || (!chip && availableChips.length > 0)}>
                        <option value="">{availableStorage.length > 0 ? "Selecciona..." : "N/A"}</option>
                        {availableStorage.map(v => <option key={v.id} value={v.value}>{v.value}</option>)}
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className={labelClass} htmlFor={`${fieldId}-color`}>Color</label>
                      <select name="color" id={`${fieldId}-color`} value={color} onChange={e => setColor(e.target.value)} required={availableColors.length > 0} className={inputClass} disabled={availableColors.length === 0}>
                        <option value="">{availableColors.length > 0 ? "Selecciona..." : "N/A"}</option>
                        {availableColors.map(v => <option key={v.id} value={v.value}>{v.value}</option>)}
                      </select>
                    </div>
                  </>
                )}
              </div>
                </>
              )}

              <div className="flex flex-col gap-1.5">
                <label className={labelClass} htmlFor={`${fieldId}-imei_serial`}>IMEI / Número de serie (Opcional)</label>
                <input type="text" name="imei_serial" id={`${fieldId}-imei_serial`} defaultValue={prefill?.imei_serial ?? ''} placeholder="Introduce IMEI o Serie" className={inputClass} />
              </div>
            </div>
          </section>

          {/* ESTADO / BATERIA */}
          <section className={sectionClass}>
            <h2 className={sectionTitleClass}>
              <span aria-hidden="true" className="material-symbols-outlined text-[16px]">health_and_safety</span> Estado y Batería
            </h2>
            
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className={labelClass} htmlFor={`${fieldId}-condition`}>Estado físico</label>
                <select name="condition" id={`${fieldId}-condition`} value={condition} onChange={e => setCondition(e.target.value)} required className={inputClass}>
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
                      <label className={labelClass} htmlFor={`${fieldId}-battery_health`}>Salud de batería (%)</label>
                      <input type="number" name="battery_health" id={`${fieldId}-battery_health`} min="0" max="100" value={batteryHealth} onChange={e => setBatteryHealth(e.target.value)} required className={inputClass} />
                    </div>
                  )}
                  {showBatteryCycles && (
                    <div className="flex flex-col gap-1.5">
                      <label className={labelClass} htmlFor={`${fieldId}-battery_cycles`}>Ciclos de carga</label>
                      <input type="number" name="battery_cycles" id={`${fieldId}-battery_cycles`} min="0" defaultValue={prefill?.battery_cycles ?? ''} placeholder="Ej. 317" className={inputClass} />
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* ACCESORIOS */}
          <section className={sectionClass}>
            <h2 className={sectionTitleClass}>
              <span aria-hidden="true" className="material-symbols-outlined text-[16px]">inventory_2</span> Accesorios
            </h2>
            <div className="flex flex-col gap-3">
              {[
                { name: 'has_box', label: 'Tiene caja', defaultChecked: prefill?.has_box ?? false },
                { name: 'has_cable', label: 'Tiene cable', defaultChecked: prefill?.has_cable ?? false },
                { name: 'has_invoice', label: 'Tiene factura', defaultChecked: prefill?.has_invoice ?? false },
                { name: 'original_parts', label: 'Piezas originales', defaultChecked: prefill?.original_parts ?? true },
                { name: 'fully_functional', label: 'Funcionamiento completo', defaultChecked: prefill?.fully_functional ?? true }
              ].map(field => (
                <div key={field.name} className="flex justify-between items-center py-2.5 border-b border-[#1F1F24] last:border-0">
                  <span className="text-zinc-300 text-[14px] font-medium">{field.label}</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" aria-label={field.label} name={field.name} defaultChecked={field.defaultChecked} className="sr-only peer" />
                    <div className="w-11 h-6 bg-[#1F1F24] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all transition-colors peer-checked:bg-[#7a32d4]"></div>
                  </label>
                </div>
              ))}
              
              <div className="flex flex-col gap-1.5 mt-2">
                <label className={labelClass} htmlFor={`${fieldId}-warranty_until`}>Garantía oficial hasta (Opcional)</label>
                <input type="date" name="warranty_until" id={`${fieldId}-warranty_until`} defaultValue={prefill?.warranty_until ?? ''} className={`${inputClass} [color-scheme:dark]`} />
              </div>
            </div>
          </section>

        </div>

        {/* RIGHT COLUMN */}
        <div className="flex flex-col gap-6 lg:gap-8">
          
          {/* PRECIOS Y COMPRA */}
          <section className={sectionClass}>
            <h2 className={sectionTitleClass}>
              <span aria-hidden="true" className="material-symbols-outlined text-[16px]">payments</span> Compra y Precios
            </h2>
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5 relative">
                  <label className={labelClass} htmlFor={`${fieldId}-purchase_price`}>Precio de compra</label>
                  <span className="absolute left-4 top-[35px] text-zinc-500">€</span>
                  <input type="number" step="0.01" min="0" name="purchase_price" id={`${fieldId}-purchase_price`} defaultValue={prefill?.purchase_price ?? ''} required className={`${inputClass} pl-8`} />
                </div>
                <div className="flex flex-col gap-1.5 relative">
                  <label className={labelClass} htmlFor={`${fieldId}-listing_price`}>Precio de publicación</label>
                  <span className="absolute left-4 top-[35px] text-zinc-500">€</span>
                  <input type="number" step="0.01" min="0" name="listing_price" id={`${fieldId}-listing_price`} defaultValue={prefill?.listing_price ?? ''} required className={`${inputClass} pl-8 font-bold text-[#d7baff] border-[#7a32d4]/30 bg-[#7a32d4]/5`} />
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className={labelClass} htmlFor={`${fieldId}-purchased_at`}>Fecha de compra</label>
                  <input
                    type="date"
                    name="purchased_at" id={`${fieldId}-purchased_at`}
                    required
                    defaultValue={prefill?.purchased_at ?? new Date().toISOString().split('T')[0]}
                    className={`${inputClass} [color-scheme:dark]`}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className={labelClass} htmlFor={`${fieldId}-purchase_location`}>Lugar de compra (Opcional)</label>
                  <input
                    type="text"
                    name="purchase_location" id={`${fieldId}-purchase_location`}
                    defaultValue={prefill?.purchase_location ?? ''}
                    className={inputClass}
                    placeholder="Ej. Tienda física"
                  />
                </div>
              </div>
              
              <div className="flex flex-col gap-1.5">
                <label className={labelClass} htmlFor={`${fieldId}-internal_notes`}>Notas internas (Opcional)</label>
                <textarea name="internal_notes" id={`${fieldId}-internal_notes`} rows={3} defaultValue={prefill?.internal_notes ?? ''} className={`${inputClass} resize-none`} placeholder="Notas visibles solo para administradores."></textarea>
              </div>
            </div>
          </section>

          {/* VENDEDOR */}
          <section className={sectionClass}>
            <h2 className={sectionTitleClass}>
              <span aria-hidden="true" className="material-symbols-outlined text-[16px]">person</span> Vendedor
            </h2>
            <div className="flex flex-col gap-4">
              <div className="flex p-1 bg-[#121217] rounded-xl border border-[#1F1F24] w-fit">
                <button
                  type="button"
                  onClick={() => { setClientMode('existing'); setSelectedClientId(''); setClientSearch(''); }}
                  aria-pressed={clientMode === 'existing'}
                  className={`px-4 py-2 rounded-lg text-[13px] font-semibold transition-colors ${clientMode === 'existing' ? 'bg-[#7a32d4]/10 text-[#d7baff]' : 'text-zinc-400 hover:text-white'}`}
                >
                  Cliente existente
                </button>
                <button
                  type="button"
                  onClick={() => { setClientMode('new'); setSelectedClientId(''); }}
                  aria-pressed={clientMode === 'new'}
                  className={`px-4 py-2 rounded-lg text-[13px] font-semibold transition-colors ${clientMode === 'new' ? 'bg-[#7a32d4]/10 text-[#d7baff]' : 'text-zinc-400 hover:text-white'}`}
                >
                  Nuevo cliente
                </button>
              </div>

              {clientMode === 'existing' && (
                <div className="flex flex-col gap-4">
                  {selectedClient ? (
                    <div className="bg-[#121217] border border-[#7a32d4]/30 rounded-xl p-4 flex flex-col gap-2 relative">
                      <input type="hidden" name="seller_client_id" value={selectedClient.id} />
                      <div className="flex justify-between items-start">
                        <div className="flex flex-col">
                          <span className="text-white font-bold">{selectedClient.name}</span>
                          <span className="text-zinc-400 text-sm">{selectedClient.phone}{selectedClient.location ? ` · ${selectedClient.location}` : ''}</span>
                        </div>
                        <button type="button" onClick={() => setSelectedClientId('')} aria-label="Cambiar cliente seleccionado" className="admin-device-form__clear-client text-zinc-500 hover:text-white">
                          <span aria-hidden="true" className="material-symbols-outlined text-[18px]">close</span>
                        </button>
                      </div>
                      <Link href={`/admin/clientes/${selectedClient.id}`} target="_blank" className="text-xs text-[#d7baff] hover:underline mt-1 w-fit">
                        Editar cliente
                      </Link>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <input
                        type="text"
                        required
                        value=""
                        onChange={() => {}}
                        className="sr-only pointer-events-none"
                        tabIndex={-1}
                        aria-hidden="true"
                      />
                      <div className="relative">
                        <span aria-hidden="true" className="material-symbols-outlined absolute left-3 top-3 text-zinc-500 text-[18px]">search</span>
                        <input
                          type="text"
                          aria-label="Buscar cliente por nombre o teléfono"
                          placeholder="Buscar por nombre o teléfono..."
                          value={clientSearch}
                          onChange={(e) => setClientSearch(e.target.value)}
                          className={`${inputClass} pl-10`}
                        />
                      </div>
                      {filteredClients.length > 0 && (
                        <div className="flex flex-col bg-[#121217] border border-[#1F1F24] rounded-xl overflow-hidden max-h-[200px] overflow-y-auto">
                          {filteredClients.map(client => (
                            <button
                              key={client.id}
                              type="button"
                              onClick={() => setSelectedClientId(client.id)}
                              className="flex flex-col items-start p-3 hover:bg-[#1F1F24] transition-colors border-b border-[#1F1F24] last:border-0 text-left"
                            >
                              <span className="text-white text-sm font-semibold">{client.name}</span>
                              <span className="text-zinc-400 text-xs">{client.phone}{client.location ? ` · ${client.location}` : ''}</span>
                            </button>
                          ))}
                        </div>
                      )}
                      {clientSearch && filteredClients.length === 0 && (
                        <div className="text-center p-4 text-sm text-zinc-500">
                          No se encontraron clientes.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {clientMode === 'new' && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className={labelClass} htmlFor={`${fieldId}-seller_name`}>Nombre *</label>
                      <input
                        type="text"
                        name="seller_name" id={`${fieldId}-seller_name`}
                        required
                        defaultValue={prefill?.seller_name ?? ''}
                        className={inputClass}
                        placeholder="Ej. Juan Pérez"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className={labelClass} htmlFor={`${fieldId}-seller_phone`}>Teléfono *</label>
                      <input
                        type="text"
                        name="seller_phone" id={`${fieldId}-seller_phone`}
                        required
                        defaultValue={prefill?.seller_phone ?? ''}
                        className={inputClass}
                        placeholder="Ej. 600 000 000"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className={labelClass} htmlFor={`${fieldId}-seller_location`}>Ubicación (Opcional)</label>
                    <input
                      type="text"
                      name="seller_location" id={`${fieldId}-seller_location`}
                      defaultValue={prefill?.seller_location ?? ''}
                      className={inputClass}
                      placeholder="Ej. Las Palmas"
                    />
                  </div>
                </>
              )}
            </div>
          </section>

          {/* IMAGEN DE CATÁLOGO */}
          {modelId && color && (
            <section className={sectionClass}>
              <h2 className={sectionTitleClass}>
                <span aria-hidden="true" className="material-symbols-outlined text-[16px]">image</span> Imagen de catálogo
              </h2>
              
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
                    <span aria-hidden="true" className="material-symbols-outlined">image_not_supported</span>
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
          <h2 className={sectionTitleClass}>
            <span aria-hidden="true" className="material-symbols-outlined text-[16px]">photo_camera</span> Fotos reales
          </h2>
          <span className="text-[11px] text-zinc-500 font-semibold uppercase">Máx 8MB/foto</span>
        </div>
        
        <div className="admin-device-form__photos">
          <button 
            type="button" 
            onClick={() => fileInputRef.current?.click()}
            className="aspect-square flex flex-col items-center justify-center bg-[#121217] border-2 border-dashed border-[#2a2a30] rounded-xl text-zinc-500 hover:text-[#d7baff] hover:border-[#d7baff]/50 transition-colors hover:bg-[#7a32d4]/5"
          >
            <span aria-hidden="true" className="material-symbols-outlined text-2xl mb-1">add_photo_alternate</span>
            <span className="text-[11px] font-semibold">Añadir foto</span>
          </button>
          
          <input 
            type="file" 
            aria-label="Añadir fotos del dispositivo"
            ref={fileInputRef} 
            onChange={handleFileChange} 
            multiple 
            accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
            className="hidden" 
          />

          {imagePreviews.map((preview, idx) => (
            <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-[#1F1F24] group bg-[#121217]">
              <img src={preview} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" />
              <button 
                type="button" 
                onClick={() => removeImage(idx)}
                className="admin-device-form__photo-remove"
                title="Eliminar foto"
                aria-label={`Eliminar foto ${idx + 1}`}
              >
                <span aria-hidden="true" className="material-symbols-outlined text-[14px]">close</span>
              </button>
            </div>
          ))}
        </div>
      </section>

      <div className="admin-device-form__actions">
          {formState.error && <p className="admin-device-form__error" role="alert">{formState.error}</p>}
          <div className="admin-device-form__submit-row">
        <button 
          type="submit" 
          disabled={uploading}
          className="w-full lg:w-auto bg-[#7a32d4]/10 hover:bg-[#7a32d4]/20 border border-[#7a32d4]/30 text-[#d7baff] font-bold text-sm py-4 px-10 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {uploading ? (
            'Procesando...'
          ) : (
            <>
              <span aria-hidden="true" className="material-symbols-outlined text-[18px]">cloud_upload</span>
              Guardar dispositivo
            </>
          )}
        </button>
      </div>
      </div>
    </form>
  )
}
