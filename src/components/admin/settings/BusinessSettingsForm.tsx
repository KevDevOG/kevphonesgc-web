'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateBusinessSettingsAction, UpdateBusinessSettingsInput } from '@/actions/business-settings'

type BusinessSettings = {
  business_name: string
  whatsapp_phone: string | null
  instagram_url: string | null
  tiktok_url: string | null
  wallapop_url: string | null
  contact_enabled: boolean
  shipping_text: string | null
  hero_title: string | null
  hero_subtitle: string | null
}

export function BusinessSettingsForm({ settings }: { settings: BusinessSettings }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [businessName, setBusinessName] = useState(settings.business_name)
  const [whatsappPhone, setWhatsappPhone] = useState(settings.whatsapp_phone || '')
  const [contactEnabled, setContactEnabled] = useState(settings.contact_enabled)
  
  const [instagramUrl, setInstagramUrl] = useState(settings.instagram_url || '')
  const [tiktokUrl, setTiktokUrl] = useState(settings.tiktok_url || '')
  const [wallapopUrl, setWallapopUrl] = useState(settings.wallapop_url || '')
  
  const [heroTitle, setHeroTitle] = useState(settings.hero_title || '')
  const [heroSubtitle, setHeroSubtitle] = useState(settings.hero_subtitle || '')
  const [shippingText, setShippingText] = useState(settings.shipping_text || '')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    const input: UpdateBusinessSettingsInput = {
      businessName,
      whatsappPhone: whatsappPhone.trim() || null,
      contactEnabled,
      instagramUrl: instagramUrl.trim() || null,
      tiktokUrl: tiktokUrl.trim() || null,
      wallapopUrl: wallapopUrl.trim() || null,
      heroTitle: heroTitle.trim() || null,
      heroSubtitle: heroSubtitle.trim() || null,
      shippingText: shippingText.trim() || null
    }

    startTransition(async () => {
      const result = await updateBusinessSettingsAction(input)
      if (result.success) {
        setSuccess('Configuración guardada correctamente.')
        router.refresh()
      } else {
        setError(result.error || 'Error desconocido')
      }
    })
  }

  const inputClass = "w-full bg-[#101014] border border-[#1F1F24] rounded-sm text-[#F7F7F7] p-3 focus:outline-none focus:ring-2 focus:ring-[#d7baff]/20 focus:border-[#d7baff] transition-all"
  const labelClass = "block text-sm font-semibold text-[#A8A8B0] uppercase tracking-wider mb-2"

  return (
    <form onSubmit={handleSubmit} className="space-y-8 pb-32">
      <div className="flex flex-col gap-2 mb-6">
        <h1 className="text-3xl font-bold text-white" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>Configuración</h1>
        <p className="text-[#A8A8B0]">Gestiona los datos públicos y de contacto de KevPhonesGC.</p>
      </div>

      {/* SECTION 1: Negocio */}
      <section className="bg-[#0B0B0D] border border-[#1F1F24] rounded-xl p-4 md:p-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-[#7a32d4]"></div>
        <h3 className="text-sm font-semibold text-[#A8A8B0] uppercase tracking-wider mb-6 flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">store</span> Negocio
        </h3>
        
        <div>
          <label className={labelClass}>Nombre del negocio *</label>
          <input 
            type="text" 
            value={businessName}
            onChange={e => setBusinessName(e.target.value)}
            maxLength={100}
            required
            className={inputClass} 
          />
        </div>
      </section>

      {/* SECTION 2: Contacto */}
      <section className="bg-[#0B0B0D] border border-[#1F1F24] rounded-xl p-4 md:p-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-[#7a32d4]"></div>
        <h3 className="text-sm font-semibold text-[#A8A8B0] uppercase tracking-wider mb-6 flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">forum</span> Contacto
        </h3>
        
        <div className="space-y-6">
          <div>
            <label className={labelClass}>Número de WhatsApp</label>
            <input 
              type="tel" 
              value={whatsappPhone}
              onChange={e => setWhatsappPhone(e.target.value)}
              className={inputClass} 
            />
            <p className="text-xs text-[#A8A8B0] mt-2">Formato internacional, solo números. Ejemplo: 34600560853</p>
          </div>

          <div className="flex justify-between items-center py-2 border-t border-[#1F1F24] pt-4">
            <div className="flex flex-col gap-1 pr-4">
              <span className="text-[#e5e2e1] text-sm font-semibold">Contacto por WhatsApp activo</span>
              <span className="text-[#A8A8B0] text-xs">Si está desactivado, los botones públicos de contacto podrán ocultarse o deshabilitarse.</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input 
                type="checkbox" 
                checked={contactEnabled}
                onChange={e => setContactEnabled(e.target.checked)}
                className="sr-only peer toggle-checkbox" 
              />
              <div className="w-11 h-6 bg-[#353534] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all toggle-label transition-colors peer-checked:bg-[#7a32d4]"></div>
            </label>
          </div>
        </div>
      </section>

      {/* SECTION 3: Redes sociales */}
      <section className="bg-[#0B0B0D] border border-[#1F1F24] rounded-xl p-4 md:p-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-[#7a32d4]"></div>
        <h3 className="text-sm font-semibold text-[#A8A8B0] uppercase tracking-wider mb-6 flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">tag</span> Redes sociales
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className={labelClass}>Instagram</label>
            <input 
              type="url" 
              placeholder="https://instagram.com/..."
              value={instagramUrl}
              onChange={e => setInstagramUrl(e.target.value)}
              className={inputClass} 
            />
          </div>
          <div>
            <label className={labelClass}>TikTok</label>
            <input 
              type="url" 
              placeholder="https://tiktok.com/..."
              value={tiktokUrl}
              onChange={e => setTiktokUrl(e.target.value)}
              className={inputClass} 
            />
          </div>
          <div>
            <label className={labelClass}>Wallapop</label>
            <input 
              type="url" 
              placeholder="https://www.wallapop.com/user/..."
              value={wallapopUrl}
              onChange={e => setWallapopUrl(e.target.value)}
              className={inputClass} 
            />
          </div>
        </div>
      </section>

      {/* SECTION 4: Página pública */}
      <section className="bg-[#0B0B0D] border border-[#1F1F24] rounded-xl p-4 md:p-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-[#7a32d4]"></div>
        <h3 className="text-sm font-semibold text-[#A8A8B0] uppercase tracking-wider mb-6 flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">web</span> Página pública
        </h3>
        
        <p className="text-xs text-[#A8A8B0] mb-6">Nota: Si dejas estos campos vacíos, la página web podría seguir utilizando los textos por defecto actuales hasta que se aplique una futura actualización visual.</p>

        <div className="space-y-4">
          <div>
            <label className={labelClass}>Título principal</label>
            <input 
              type="text" 
              value={heroTitle}
              onChange={e => setHeroTitle(e.target.value)}
              maxLength={150}
              className={inputClass} 
            />
          </div>
          <div>
            <label className={labelClass}>Subtítulo principal</label>
            <textarea 
              value={heroSubtitle}
              onChange={e => setHeroSubtitle(e.target.value)}
              maxLength={300}
              rows={3}
              className={inputClass} 
            />
          </div>
          <div>
            <label className={labelClass}>Texto de envíos</label>
            <textarea 
              value={shippingText}
              onChange={e => setShippingText(e.target.value)}
              maxLength={500}
              rows={3}
              className={inputClass} 
            />
          </div>
        </div>
      </section>

      {error && (
        <div className="bg-[#93000a]/20 border border-[#93000a] text-[#ffdad6] p-4 rounded text-sm text-center">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-[#143c1a]/20 border border-[#143c1a] text-[#a5f3ad] p-4 rounded text-sm text-center">
          {success}
        </div>
      )}

      <button 
        type="submit" 
        disabled={isPending}
        style={{ background: 'linear-gradient(135deg, #d7baff 0%, #B98AFF 100%)' }}
        className="w-full text-[#440087] font-bold py-4 rounded transition-all hover:opacity-90 active:scale-[0.98] shadow-lg shadow-[#d7baff]/10 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? 'Guardando...' : 'Guardar configuración'}
      </button>
    </form>
  )
}
