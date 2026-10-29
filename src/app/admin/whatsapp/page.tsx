import { requireAdmin } from '@/lib/auth/admin'
import { AdminPageShell } from '@/components/admin/layout/AdminPageShell'
import { AdminPageHeader } from '@/components/admin/layout/AdminPageHeader'
import { WhatsAppSimulator } from '@/components/admin/whatsapp/WhatsAppSimulator'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Asistente WhatsApp - KevPhonesGC Admin',
}

export default async function AdminWhatsAppSimulatorPage() {
  await requireAdmin()

  return (
    <AdminPageShell>
      <div className="w-full max-w-4xl mx-auto pb-12 flex flex-col gap-6">
        <AdminPageHeader
          title="Asistente WhatsApp"
          subtitle="Prueba cómo respondería el asistente de KevPhonesGC antes de conectarlo a WhatsApp."
        />
        <WhatsAppSimulator />
      </div>
    </AdminPageShell>
  )
}
