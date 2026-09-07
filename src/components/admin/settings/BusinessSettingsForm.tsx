'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateBusinessSettingsAction, UpdateBusinessSettingsInput } from '@/actions/business-settings'
import { AdminPageHeader } from '@/components/admin/layout/AdminPageHeader'

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

  const inputClass = "w-full bg-[#121217] border border-[#1F1F24] rounded-xl text-white px-4 py-2.5 text-[14px] focus:outline-none focus:border-[#7a32d4]/50 focus:ring-1 focus:ring-[#7a32d4]/50 transition-all placeholder:text-zinc-600"
  const labelClass = "block text-[13px] font-bold text-zinc-400 mb-1.5"

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 lg:gap-8 w-full max-w-6xl mx-auto">
      <AdminPageHeader 
        title="Configuración" 
        subtitle="Gestiona los datos públicos y de contacto de KevPhonesGC." 
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        {/* LEFT COLUMN */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          
          {/* SECTION: Negocio */}
          <section className="bg-[#0B0B0E] border border-[#1F1F24] rounded-2xl p-5 md:p-6 flex flex-col gap-5">
            <h3 className="text-[16px] font-extrabold text-white tracking-tight flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-[#7a32d4]">store</span>
              Negocio
            </h3>
            
            <div className="flex flex-col gap-1">
              <label className={labelClass}>Nombre del negocio *</label>
              <input 
                type="text" 
                value={businessName}
                onChange={e => setBusinessName(e.target.value)}
                maxLength={100}
                required
                className={inputClass} 
              />
              <p className="text-[12px] font-medium text-zinc-500 mt-1 pl-1">Nombre público mostrado en la web.</p>
            </div>
          </section>

          {/* SECTION: Contacto */}
          <section className="bg-[#0B0B0E] border border-[#1F1F24] rounded-2xl p-5 md:p-6 flex flex-col gap-5">
            <h3 className="text-[16px] font-extrabold text-white tracking-tight flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-[#7a32d4]">forum</span>
              Contacto
            </h3>
            
            <div className="flex flex-col gap-1">
              <label className={labelClass}>Número de WhatsApp</label>
              <input 
                type="tel" 
                value={whatsappPhone}
                onChange={e => setWhatsappPhone(e.target.value)}
                className={inputClass} 
              />
              <p className="text-[12px] font-medium text-zinc-500 mt-1 pl-1">Formato internacional, solo números. Ejemplo: 34600560853</p>
            </div>
          </section>

          {/* SECTION: Página pública */}
          <section className="bg-[#0B0B0E] border border-[#1F1F24] rounded-2xl p-5 md:p-6 flex flex-col gap-5">
            <div className="flex flex-col gap-1 border-b border-[#1F1F24] pb-4">
              <h3 className="text-[16px] font-extrabold text-white tracking-tight flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-[#7a32d4]">web</span>
                Página pública
              </h3>
              <p className="text-[13px] font-medium text-zinc-500">Estos textos se utilizan en la web pública.</p>
            </div>

            <div className="flex flex-col gap-1">
              <label className={labelClass}>Título principal</label>
              <input 
                type="text" 
                value={heroTitle}
                onChange={e => setHeroTitle(e.target.value)}
                maxLength={150}
                className={inputClass} 
              />
              <div className="flex justify-between items-center mt-1 pl-1">
                <p className="text-[12px] font-medium text-zinc-500">Texto principal del hero.</p>
                <p className="text-[12px] font-medium text-zinc-500">{heroTitle.length} / 150</p>
              </div>
            </div>

            <div className="flex flex-col gap-1 mt-2">
              <label className={labelClass}>Subtítulo principal</label>
              <textarea 
                value={heroSubtitle}
                onChange={e => setHeroSubtitle(e.target.value)}
                maxLength={300}
                rows={3}
                className={inputClass} 
              />
              <div className="flex justify-between items-center mt-1 pl-1">
                <p className="text-[12px] font-medium text-zinc-500">Texto secundario bajo el título.</p>
                <p className="text-[12px] font-medium text-zinc-500">{heroSubtitle.length} / 300</p>
              </div>
            </div>

            <div className="flex flex-col gap-1 mt-2">
              <label className={labelClass}>Texto de envíos</label>
              <textarea 
                value={shippingText}
                onChange={e => setShippingText(e.target.value)}
                maxLength={500}
                rows={3}
                className={inputClass} 
              />
              <div className="flex justify-between items-center mt-1 pl-1">
                <p className="text-[12px] font-medium text-zinc-500">Información pública sobre entregas y envíos.</p>
                <p className="text-[12px] font-medium text-zinc-500">{shippingText.length} / 500</p>
              </div>
            </div>
          </section>

        </div>

        {/* RIGHT COLUMN */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          {/* SECTION: Redes sociales */}
          <section className="bg-[#0B0B0E] border border-[#1F1F24] rounded-2xl p-5 md:p-6 flex flex-col gap-5">
            <h3 className="text-[16px] font-extrabold text-white tracking-tight flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-[#7a32d4]">tag</span>
              Redes sociales
            </h3>
            
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className={labelClass}>Instagram</label>
                <input 
                  type="url" 
                  placeholder="https://instagram.com/..."
                  value={instagramUrl}
                  onChange={e => setInstagramUrl(e.target.value)}
                  className={inputClass} 
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className={labelClass}>TikTok</label>
                <input 
                  type="url" 
                  placeholder="https://tiktok.com/..."
                  value={tiktokUrl}
                  onChange={e => setTiktokUrl(e.target.value)}
                  className={inputClass} 
                />
              </div>
              <div className="flex flex-col gap-1">
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

          {/* SECTION: Estado del contacto */}
          <section className="bg-[#0B0B0E] border border-[#1F1F24] rounded-2xl p-5 md:p-6 flex flex-col">
            <div className="flex justify-between items-center gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-[14px] font-bold text-white">Contacto por WhatsApp activo</span>
                <span className="text-[12px] font-medium text-zinc-500">Controla si los botones públicos de contacto están disponibles.</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input 
                  type="checkbox" 
                  checked={contactEnabled}
                  onChange={e => setContactEnabled(e.target.checked)}
                  className="sr-only peer" 
                />
                <div className="w-11 h-6 bg-[#1F1F24] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-[20px] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#7a32d4]"></div>
              </label>
            </div>
          </section>

          {/* SAVE / MESSAGES */}
          <div className="flex flex-col gap-4 mt-auto">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-[13px] font-bold text-center">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-[#7a32d4]/10 border border-[#7a32d4]/20 text-[#d7baff] p-4 rounded-xl text-[13px] font-bold text-center">
                {success}
              </div>
            )}

            <button 
              type="submit" 
              disabled={isPending}
              className="w-full bg-[#7a32d4]/10 hover:bg-[#7a32d4]/20 border border-[#7a32d4]/30 text-[#d7baff] font-bold text-[15px] py-4 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isPending && <span className="material-symbols-outlined animate-spin text-[20px]">sync</span>}
              Guardar configuración
            </button>
          </div>

        </div>
      </div>
    </form>
  )
}
