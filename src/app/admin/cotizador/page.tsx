import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { QuoteBasePricesAdmin } from '@/components/admin/quote/QuoteBasePricesAdmin'
import { QuoteGlobalAdjustmentsAdmin } from '@/components/admin/quote/QuoteGlobalAdjustmentsAdmin'
import { AdminPageShell } from '@/components/admin/layout/AdminPageShell'
import { AdminPageHeader } from '@/components/admin/layout/AdminPageHeader'

export const metadata = {
  title: 'Cotizador - KevPhonesGC Admin'
}

export default async function QuoteAdminPage() {
  const supabase = await createClient()
  
  const { data: user } = await supabase.auth.getUser()
  if (!user.user || user.user.id !== '76320352-4c29-42ad-a105-345e0b5928dd') {
    redirect('/admin/login')
  }

  // Fetch active iPhone models
  const { data: models } = await supabase
    .from('device_models')
    .select('id, name, sort_order')
    .eq('active', true)
    .eq('category', 'iphone')
    .order('sort_order', { ascending: true })

  const modelIds = models?.map(m => m.id) || []

  // Fetch storage variants for these models
  const { data: variants } = await supabase
    .from('device_model_variants')
    .select('id, model_id, value, sort_order')
    .eq('active', true)
    .eq('variant_type', 'storage')
    .in('model_id', modelIds.length > 0 ? modelIds : ['00000000-0000-0000-0000-000000000000'])
    .order('sort_order', { ascending: true })

  // Fetch existing base prices
  const { data: basePrices } = await supabase
    .from('iphone_quote_base_prices')
    .select('id, model_id, storage, min_price, max_price, active')

  // Sort base prices by model sort_order then variant sort_order
  const sortedBasePrices = (basePrices || []).sort((a, b) => {
    const modelA = models?.find(m => m.id === a.model_id)?.sort_order || 99
    const modelB = models?.find(m => m.id === b.model_id)?.sort_order || 99
    
    if (modelA !== modelB) return modelA - modelB

    const variantA = variants?.find(v => v.model_id === a.model_id && v.value === a.storage)?.sort_order || 99
    const variantB = variants?.find(v => v.model_id === b.model_id && v.value === b.storage)?.sort_order || 99

    return variantA - variantB
  })

  // Fetch existing global rules
  const { data: globalRules } = await supabase
    .from('iphone_quote_adjustments')
    .select('id, rule_type, rule_key, min_delta, max_delta, active, sort_order')
    .is('model_id', null)
    .order('rule_type', { ascending: true })
    .order('sort_order', { ascending: true })

  return (
    <AdminPageShell>
      <div className="flex flex-col gap-8 w-full max-w-6xl mx-auto pb-12">
        <AdminPageHeader 
          title="Cotizador" 
          subtitle="Configura los precios base y descuentos de valoración de iPhone." 
        />
        <p className="text-[14px] text-zinc-500 font-medium -mt-4">
          Los cambios afectan a nuevas valoraciones.
        </p>
        
        <QuoteBasePricesAdmin 
          models={models || []}
          variants={variants || []}
          basePrices={sortedBasePrices}
        />
        
        <QuoteGlobalAdjustmentsAdmin 
          rules={globalRules || []}
        />
      </div>
    </AdminPageShell>
  )
}
