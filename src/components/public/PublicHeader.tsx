'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function PublicHeader() {
  const pathname = usePathname()

  const isHome = pathname === '/'
  const isVender = pathname === '/vender'
  const isCotizar = pathname === '/cotizar'

  const catalogHref = isHome ? '#stock' : '/#stock'

  const activeClass = "text-purple-300 bg-purple-900/20 border border-purple-800/50"
  const inactiveClass = "text-zinc-400 hover:text-white border border-transparent"
  const baseClass = "text-sm font-medium px-5 py-2 rounded-full transition-colors"

  const mobileActiveText = "text-purple-400"
  const mobileInactiveText = "text-zinc-400 hover:text-white"

  return (
    <>
      {/* Desktop Header */}
      <header className="hidden md:flex items-center justify-between px-8 py-4 border-b border-zinc-900 bg-black/90 backdrop-blur-md sticky top-0 z-50">
        <Link href="/" className="text-xl font-bold text-white tracking-tight">
          KevPhonesGC
        </Link>
        <nav className="flex items-center gap-1 bg-zinc-900/50 rounded-full p-1 border border-zinc-800">
          <Link href={catalogHref} className={`${baseClass} ${isHome ? activeClass : inactiveClass}`}>
            Catálogo
          </Link>
          <Link href="/vender" className={`${baseClass} ${isVender ? activeClass : inactiveClass}`}>
            Vender
          </Link>
          <Link href="/cotizar" className={`${baseClass} ${isCotizar ? activeClass : inactiveClass}`}>
            Cotizar
          </Link>
        </nav>
        <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-400 bg-zinc-900/50 px-3 py-1.5 rounded-full border border-zinc-800">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Canarias
        </div>
      </header>

      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between px-5 py-4 border-b border-zinc-900 bg-black/90 backdrop-blur-md sticky top-0 z-50">
        <Link href="/" className="text-lg font-bold text-white tracking-tight">
          KevPhonesGC
        </Link>
        <div className="flex items-center gap-1.5 text-[10px] font-medium text-zinc-400 bg-zinc-900/50 px-2.5 py-1 rounded-full border border-zinc-800">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Canarias
        </div>
      </header>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-zinc-950/90 backdrop-blur-md border-t border-zinc-900 flex items-center justify-around p-3 z-50">
        <Link href="/" className={`flex flex-col items-center p-2 transition-colors ${isHome ? mobileActiveText : mobileInactiveText}`}>
          <svg className="w-6 h-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span className="text-[10px] font-medium">Inicio</span>
        </Link>
        <Link href={catalogHref} className={`flex flex-col items-center p-2 transition-colors ${mobileInactiveText}`}>
          <svg className="w-6 h-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
          <span className="text-[10px] font-medium">Stock</span>
        </Link>
        <Link href="/cotizar" className={`flex flex-col items-center p-2 transition-colors ${isCotizar ? mobileActiveText : mobileInactiveText}`}>
          <svg className="w-6 h-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          <span className="text-[10px] font-medium">Cotizar</span>
        </Link>
        <Link href="/vender" className={`flex flex-col items-center p-2 transition-colors ${isVender ? mobileActiveText : mobileInactiveText}`}>
          <svg className="w-6 h-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span className="text-[10px] font-medium">Vender</span>
        </Link>
      </nav>
    </>
  )
}
