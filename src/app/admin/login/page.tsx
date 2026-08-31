import { AdminLoginForm } from '@/components/admin/auth/AdminLoginForm'

export const metadata = {
  title: 'KevPhonesGC - Panel de administración',
}

export default function AdminLoginPage() {
  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      <link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800&family=Inter:wght@400;600&display=swap" rel="stylesheet" />
      
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#050505] text-[#e5e2e1] relative overflow-hidden" style={{ fontFamily: 'Inter, sans-serif' }}>
        {/* Decorative background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#7a32d4] rounded-full blur-[150px] opacity-10 pointer-events-none"></div>

        {/* Top AppBar (Brand Anchor) */}
        <header className="absolute flex justify-between items-center px-4 py-4 w-full top-0 border-b border-[#1F1F24] bg-[#131313] z-10">
          <div className="flex items-center gap-2 text-[#d7baff]">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
              security
            </span>
            <span className="font-bold text-xl tracking-tighter uppercase cursor-pointer hover:text-[#B98AFF] transition-colors" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
              KevPhonesGC Admin
            </span>
          </div>
        </header>

        {/* Main Content */}
        <main className="w-full flex-grow flex items-center justify-center px-4 z-10 pt-16">
          <AdminLoginForm />
        </main>
      </div>
    </>
  )
}
