import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BusinessSettingsForm } from '@/components/admin/settings/BusinessSettingsForm'
import { AdminPageShell } from '@/components/admin/layout/AdminPageShell'

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
      <AdminPageShell>
        <div className="flex items-center justify-center p-8 pb-32">
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-6 rounded-2xl text-center max-w-md">
            <span className="material-symbols-outlined text-[48px] mb-4">error</span>
            <h2 className="text-xl font-bold mb-2 tracking-tight">Error de configuración</h2>
            <p className="text-[14px] font-medium text-red-400/80">No se encontró la configuración del negocio o hubo un error al cargarla. Por favor, revisa la base de datos.</p>
          </div>
        </div>
      </AdminPageShell>
    )
  }

  return (
    <AdminPageShell>
      <div className="w-full max-w-6xl mx-auto pb-24">
        <BusinessSettingsForm settings={settings} />
      </div>
    </AdminPageShell>
  )
}
