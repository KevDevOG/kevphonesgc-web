import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { QuoteBasePricesAdmin } from '@/components/admin/quote/QuoteBasePricesAdmin'
import { QuoteGlobalAdjustmentsAdmin } from '@/components/admin/quote/QuoteGlobalAdjustmentsAdmin'

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
    <>
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>
      <link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet"/>
      
      <div className="min-h-screen bg-[#050505] text-[#F7F7F7] pb-24 font-body-md" style={{ fontFamily: 'Inter, sans-serif' }}>
        <header className="fixed top-0 w-full z-50 bg-[#0B0B0D] border-b border-[#1F1F24] flex items-center px-4 h-14">
          <a href="/admin" aria-label="Volver" className="mr-4 text-[#d7baff] active:scale-95 duration-150 p-2 -ml-2 rounded-full hover:bg-[#1c1b1b] transition-colors">
            <span className="material-symbols-outlined text-[24px]">arrow_back</span>
          </a>
          <div>
            <h1 className="font-bold text-2xl text-[#B98AFF] uppercase tracking-tighter" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>Cotizador</h1>
          </div>
        </header>
        
        <main className="pt-24 px-4 max-w-5xl mx-auto space-y-8">
          <div>
            <h2 className="font-bold text-4xl tracking-wide mb-2" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>Cotizador de iPhone</h2>
            <p className="text-[#A8A8B0]">Configura cuánto pagarías por un iPhone en condiciones ideales.</p>
          </div>
          
          <QuoteBasePricesAdmin 
            models={models || []}
            variants={variants || []}
            basePrices={sortedBasePrices}
          />
          
          <QuoteGlobalAdjustmentsAdmin 
            rules={globalRules || []}
          />
        </main>
      </div>
    </>
  )
}
