import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ClientList } from '@/components/admin/clients/ClientList'

export const metadata = {
  title: 'Clientes - Admin KevPhonesGC'
}

export default async function ClientsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user || user.id !== '76320352-4c29-42ad-a105-345e0b5928dd') {
    redirect('/admin/login')
  }

  const { data: clients } = await supabase
    .from('clients')
    .select('id, name, phone, location, created_at')
    .order('created_at', { ascending: false })

  const { data: sales } = await supabase
    .from('sales')
    .select('buyer_client_id')
    .not('buyer_client_id', 'is', null)

  const { data: devices } = await supabase
    .from('devices')
    .select('seller_client_id')
    .not('seller_client_id', 'is', null)

  const processedClients = (clients || []).map(client => {
    const purchases_count = (sales || []).filter(s => s.buyer_client_id === client.id).length
    const sales_to_business_count = (devices || []).filter(d => d.seller_client_id === client.id).length
    return {
      ...client,
      purchases_count,
      sales_to_business_count
    }
  })

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>
      <link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800&family=Inter:wght@400;600&display=swap" rel="stylesheet"/>
      
      <div className="bg-[#131313] text-[#F7F7F7] font-body-md min-h-screen flex flex-col pb-24" style={{ fontFamily: 'Inter, sans-serif' }}>
        <header className="bg-[#131313] border-b border-[#1F1F24] w-full top-0 sticky z-50">
          <div className="flex items-center justify-between px-4 py-2 w-full max-w-[1280px] mx-auto">
            <div className="flex items-center gap-4">
              <a href="/admin" className="text-[#d7baff] hover:bg-[#353534] transition-colors rounded-full p-2 active:opacity-80 flex items-center justify-center">
                <span className="material-symbols-outlined">arrow_back</span>
              </a>
              <h1 className="text-[24px] font-bold uppercase tracking-tighter text-[#d7baff]" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>KevPhonesGC Admin</h1>
            </div>
            <div className="text-[#d7baff] flex items-center justify-center w-10 h-10 rounded-full overflow-hidden bg-[#101014] border border-[#1F1F24]">
              <span className="material-symbols-outlined text-[#cdc2d6]">person</span>
            </div>
          </div>
        </header>
        
        <main className="flex-grow px-4 py-4 flex flex-col gap-8 max-w-md mx-auto w-full">
          <section className="flex flex-col gap-1">
            <h2 className="text-[32px] font-extrabold text-[#F7F7F7] uppercase tracking-wide" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>Clientes</h2>
            <p className="text-[16px] text-[#A8A8B0]">Historial de personas que han comprado o vendido contigo.</p>
          </section>
          
          <ClientList clients={processedClients} />
        </main>
      </div>
    </>
  )
}
