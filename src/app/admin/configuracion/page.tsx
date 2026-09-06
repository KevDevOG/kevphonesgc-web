import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BusinessSettingsForm } from '@/components/admin/settings/BusinessSettingsForm'

export const dynamic = 'force-dynamic'

const ADMIN_UUID = '76320352-4c29-42ad-a105-345e0b5928dd'

export default async function BusinessSettingsPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.id !== ADMIN_UUID) {
    redirect('/admin/login')
  }

  const { data: settings, error } = await supabase
    .from('business_settings')
    .select('business_name, whatsapp_phone, instagram_url, tiktok_url, contact_enabled, shipping_text, hero_title, hero_subtitle, wallapop_url, updated_at')
    .eq('singleton', true)
    .maybeSingle()

  if (error || !settings) {
    return (
      <div className="min-h-screen bg-[#050505] p-4 md:p-8 flex items-center justify-center">
        <div className="bg-[#93000a]/20 border border-[#93000a] text-[#ffdad6] p-6 rounded-xl text-center max-w-md">
          <span className="material-symbols-outlined text-[48px] mb-4 text-[#ffb4ab]">error</span>
          <h2 className="text-xl font-bold mb-2">Error de configuración</h2>
          <p>No se encontró la configuración del negocio o hubo un error al cargarla. Por favor, revisa la base de datos.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#050505] text-[#F7F7F7] p-4 md:p-8 max-w-3xl mx-auto pt-8">
      <BusinessSettingsForm settings={settings} />
    </div>
  )
}
