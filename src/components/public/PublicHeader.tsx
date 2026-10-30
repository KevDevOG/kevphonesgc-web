'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

export function PublicHeader() {
  const pathname = usePathname()
  const [stockSelected, setStockSelected] = useState(false)

  useEffect(() => {
    const syncLocation = () => setStockSelected(window.location.hash === '#stock')
    syncLocation()
    window.addEventListener('hashchange', syncLocation)
    window.addEventListener('popstate', syncLocation)
    return () => {
      window.removeEventListener('hashchange', syncLocation)
      window.removeEventListener('popstate', syncLocation)
    }
  }, [pathname])

  const isHome = pathname === '/'
  const isVender = pathname === '/vender'
  const isCotizar = pathname === '/cotizar'

  const catalogHref = isHome ? '#stock' : '/#stock'

  const activeClass = "text-purple-300 border-purple-800/50"
  const inactiveClass = "text-zinc-300 border-transparent hover:text-white hover:border-zinc-600"
  const baseClass = "inline-flex min-h-11 items-center justify-center border-b-2 px-4 text-sm font-medium transition-colors"
  const mobileActiveText = "text-purple-400 bg-purple-900/20"
  const mobileInactiveText = "text-zinc-300 hover:text-white"

  return (
    <>
      <header className="kevphones-public-header sticky top-0 z-50 border-b border-[#1F1F24] bg-[#050506]">
        <div className="mx-auto flex min-h-14 md:min-h-[72px] max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <Link href="/" aria-label="KevPhonesGC, inicio" onClick={() => setStockSelected(false)} className="flex min-h-11 items-center gap-2 md:gap-3 shrink-0">
            <div className="relative h-8 w-8 md:h-10 md:w-10">
              <Image
                src="/brand/kevphonesgc-logo.PNG"
                alt=""
                fill
                className="object-contain"
                sizes="(min-width: 768px) 40px, 32px"
              />
            </div>
            <span className="text-lg md:text-xl font-bold tracking-tight text-white">KevPhonesGC</span>
          </Link>

          <nav aria-label="Navegación principal" className="hidden md:flex items-center gap-1">
            <Link href={catalogHref} onClick={() => setStockSelected(true)} aria-current={isHome && stockSelected ? 'location' : undefined} className={`${baseClass} ${isHome ? activeClass : inactiveClass}`}>
              Catálogo
            </Link>
            <Link href="/vender" aria-current={isVender ? 'page' : undefined} className={`${baseClass} ${isVender ? activeClass : inactiveClass}`}>
              Vender
            </Link>
            <Link href="/cotizar" aria-current={isCotizar ? 'page' : undefined} className={`${baseClass} ${isCotizar ? activeClass : inactiveClass}`}>
              Cotizar
            </Link>
          </nav>

          <span className="hidden lg:block text-sm text-zinc-400">Canarias</span>
          <a href={catalogHref} onClick={() => setStockSelected(true)} className="md:hidden inline-flex min-h-11 items-center justify-center px-3 text-sm font-semibold text-purple-400">
            Ver stock
          </a>
        </div>
      </header>

      {/* Mobile Bottom Navigation */}
      <nav aria-label="Navegación móvil" className="kevphones-public-bottom md:hidden fixed bottom-0 left-0 right-0 bg-[#050506] border-t border-[#1F1F24] grid grid-cols-4 gap-1 px-2 pt-1 z-50 pb-[max(4px,env(safe-area-inset-bottom))]">
        <Link href="/" onClick={() => setStockSelected(false)} aria-current={isHome && !stockSelected ? 'page' : undefined} className={`flex min-h-14 flex-col justify-center items-center rounded-lg px-1 py-2 transition-colors ${isHome && !stockSelected ? mobileActiveText : mobileInactiveText}`}>
          <svg aria-hidden="true" className="w-5 h-5 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span className="text-sm font-medium">Inicio</span>
        </Link>
        <Link href={catalogHref} onClick={() => setStockSelected(true)} aria-current={isHome && stockSelected ? 'location' : undefined} className={`flex min-h-14 flex-col justify-center items-center rounded-lg px-1 py-2 transition-colors ${isHome && stockSelected ? mobileActiveText : mobileInactiveText}`}>
          <svg aria-hidden="true" className="w-5 h-5 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
          <span className="text-sm font-medium">Stock</span>
        </Link>
        <Link href="/cotizar" aria-current={isCotizar ? 'page' : undefined} className={`flex min-h-14 flex-col justify-center items-center rounded-lg px-1 py-2 transition-colors ${isCotizar ? mobileActiveText : mobileInactiveText}`}>
          <svg aria-hidden="true" className="w-5 h-5 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          <span className="text-sm font-medium">Cotizar</span>
        </Link>
        <Link href="/vender" aria-current={isVender ? 'page' : undefined} className={`flex min-h-14 flex-col justify-center items-center rounded-lg px-1 py-2 transition-colors ${isVender ? mobileActiveText : mobileInactiveText}`}>
          <svg aria-hidden="true" className="w-5 h-5 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span className="text-sm font-medium">Vender</span>
        </Link>
      </nav>
    </>
  )
}
