'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'

export function PublicHeader() {
  const pathname = usePathname()

  const isHome = pathname === '/'
  const isVender = pathname === '/vender'
  const isCotizar = pathname === '/cotizar'

  const catalogHref = isHome ? '#stock' : '/#stock'

  const activeClass = "text-purple-300 bg-purple-900/20 border border-purple-800/50"
  const inactiveClass = "text-zinc-400 hover:text-white border border-transparent hover:bg-zinc-800/50"
  const baseClass = "text-sm font-medium px-5 py-2 rounded-full transition-all duration-200"

  const mobileActiveText = "text-purple-400"
  const mobileInactiveText = "text-zinc-400 hover:text-white"

  return (
    <>
      {/* Desktop Header */}
      <header className="hidden md:flex items-center justify-between px-8 py-4 border-b border-[#1F1F24] bg-[#050506]/80 backdrop-blur-md sticky top-0 z-50">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative w-10 h-10 transition-transform duration-300 group-hover:scale-105">
            <Image
              src="/brand/kevphonesgc-logo.PNG"
              alt="KevPhonesGC Logo"
              fill
              className="object-contain"
              sizes="40px"
              priority
            />
          </div>
          <span className="text-xl font-bold text-white tracking-tight" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
            KevPhonesGC
          </span>
        </Link>
        <nav className="flex items-center gap-1 bg-[#0B0B0E]/80 rounded-full p-1 border border-[#1F1F24] shadow-sm">
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
        <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-400 bg-[#0B0B0E]/80 px-3 py-1.5 rounded-full border border-[#1F1F24]">
          <svg className="w-4 h-4 text-purple-500/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Canarias
        </div>
      </header>

      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between px-5 py-4 border-b border-[#1F1F24] bg-[#050506]/80 backdrop-blur-md sticky top-0 z-50">
        <Link href="/" className="flex items-center gap-2">
          <div className="relative w-8 h-8">
            <Image
              src="/brand/kevphonesgc-logo.PNG"
              alt="KevPhonesGC Logo"
              fill
              className="object-contain"
              sizes="32px"
              priority
            />
          </div>
          <span className="text-lg font-bold text-white tracking-tight" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
            KevPhonesGC
          </span>
        </Link>
        <div className="flex items-center gap-1.5 text-[10px] font-medium text-zinc-400 bg-[#0B0B0E]/80 px-2.5 py-1 rounded-full border border-[#1F1F24]">
          <svg className="w-3 h-3 text-purple-500/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Canarias
        </div>
      </header>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#050506]/90 backdrop-blur-md border-t border-[#1F1F24] flex items-center justify-around p-3 z-50 pb-[env(safe-area-inset-bottom)]">
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
