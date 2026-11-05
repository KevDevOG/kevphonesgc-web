import { createClient } from '@/lib/supabase/server'
import { SellDeviceForm } from '@/components/public/sell/SellDeviceForm'
import { PublicHeader } from '@/components/public/PublicHeader'
import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Vende tu iPhone y dispositivos en Gran Canaria',
  description: 'Envía los datos y fotos de tu iPhone u otros dispositivos para solicitar una revisión y propuesta de compra en Gran Canaria con KevPhonesGC.',
  alternates: {
    canonical: '/vender'
  }
}

export const dynamic = 'force-dynamic'

export default async function VenderPage() {
  const supabase = await createClient()

  const [{ data: models }, { data: variants }] = await Promise.all([
    supabase
    .from('device_models')
    .select('id, name, supports_battery_health, supports_cycles')
    .eq('active', true)
    .eq('category', 'iphone')
    .order('sort_order', { ascending: true }),
    supabase
    .from('device_model_variants')
    .select('model_id, variant_type, value')
    .eq('active', true)
    .order('sort_order', { ascending: true })
  ])

  const typedModels = models || []
  const typedVariants = variants || []

  return (
    <div className="kevphones-sell-page flex flex-col min-h-screen bg-[#050506]">
      <PublicHeader />
      <main className="kevphones-sell-page__main flex-1">
        <SellDeviceForm 
          models={typedModels} 
          variants={typedVariants} 
        />
        <aside className="max-w-2xl mx-auto px-4 py-8 text-center text-xs text-zinc-500 space-y-2">
          <p>
            Solicitud de venta de iPhone y tecnología en Gran Canaria. El envío de la solicitud no garantiza la compra inmediata ni un precio definitivo; cada propuesta se confirma tras la revisión física del dispositivo.
          </p>
          <p>
            ¿Prefieres estimar el precio primero? Puedes usar nuestro{' '}
            <Link href="/cotizar" className="text-purple-400 hover:underline">
              cotizador de iPhone
            </Link>
            .
          </p>
        </aside>
      </main>
    </div>
  )
}
