'use client'

import React, { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'

const groups = [
  { label: 'Operaciones', items: [
    { href: '/admin', icon: 'dashboard', label: 'Inicio' },
    { href: '/admin/stock', icon: 'inventory_2', label: 'Stock' },
    { href: '/admin/stock/rapido', icon: 'add_box', label: 'Entrada rápida' },
    { href: '/admin/solicitudes', icon: 'inbox', label: 'Solicitudes' },
    { href: '/admin/clientes', icon: 'group', label: 'Clientes' },
  ] },
  { label: 'Contabilidad', items: [
    { href: '/admin/finanzas', icon: 'account_balance', label: 'Finanzas' },
    { href: '/admin/estadisticas', icon: 'analytics', label: 'Estadísticas' },
    { href: '/admin/gastos', icon: 'receipt_long', label: 'Gastos' },
    { href: '/admin/movimientos', icon: 'sync_alt', label: 'Movimientos' },
    { href: '/admin/actividad', icon: 'history', label: 'Actividad' },
  ] },
  { label: 'Catálogo y sistema', items: [
    { href: '/admin/cotizador', icon: 'calculate', label: 'Cotizador' },
    { href: '/admin/modelos', icon: 'devices', label: 'Modelos' },
    { href: '/admin/resenas', icon: 'reviews', label: 'Reseñas' },
    { href: '/admin/whatsapp', icon: 'chat', label: 'WhatsApp' },
    { href: '/admin/configuracion', icon: 'settings', label: 'Configuración' },
  ] },
]
const items = groups.flatMap(group => group.items)
const primary = ['/admin', '/admin/stock', '/admin/solicitudes', '/admin/finanzas'].map(href => items.find(item => item.href === href)!)

type Item = typeof items[number]
function Icon({ name }: { name: string }) {
  return <span aria-hidden="true" className="material-symbols-outlined">{name}</span>
}

export function AdminBottomNav() {
  const pathname = usePathname()
  const [openPath, setOpenPath] = useState<string | null>(null)
  const showMoreMenu = openPath !== null && openPath === pathname
  const panelRef = useRef<HTMLDivElement>(null)
  const moreRef = useRef<HTMLButtonElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!showMoreMenu) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus({ preventScroll: true })
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpenPath(null)
      if (event.key !== 'Tab' || !panelRef.current) return
      const controls = panelRef.current.querySelectorAll<HTMLElement>('button, a[href]')
      const first = controls[0]
      const last = controls[controls.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last?.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first?.focus()
      }
    }
    const desktop = window.matchMedia('(min-width: 1024px)')
    const closeOnDesktop = () => { if (desktop.matches) setOpenPath(null) }
    desktop.addEventListener('change', closeOnDesktop)
    window.addEventListener('keydown', handleKey)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKey)
      desktop.removeEventListener('change', closeOnDesktop)
      moreRef.current?.focus({ preventScroll: true })
    }
  }, [showMoreMenu])

  if (!pathname || pathname === '/admin/login') return null

  // Prefer the most specific route: Entrada rápida must not also select Stock.
  const activeHref = items.filter(item => pathname === item.href || (item.href !== '/admin' && pathname.startsWith(`${item.href}/`)))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href
  const isMoreActive = showMoreMenu || (!!activeHref && !primary.some(item => item.href === activeHref))
  const renderItem = (item: Item, mobile = false) => (
    <Link key={item.href} href={item.href} onClick={() => setOpenPath(null)}
      aria-current={activeHref === item.href ? 'page' : undefined}
      className={mobile ? 'admin-nav__mobile-item' : 'admin-nav__item'}>
      <Icon name={item.icon} /><span>{item.label}</span>
    </Link>
  )

  return (
    <>
      <aside className="admin-nav__sidebar">
        <Link href="/admin" className="admin-nav__brand">
          <img src="/brand/kevphonesgc-logo.PNG" alt="" width={36} height={36} />
          <span>KevPhonesGC<small>Administración</small></span>
        </Link>
        <nav aria-label="Navegación de administración">
          {groups.map(group => <section key={group.label} className="admin-nav__group">
            <h2>{group.label}</h2>{group.items.map(item => renderItem(item))}
          </section>)}
          <Link href="/" className="admin-nav__utility"><Icon name="open_in_browser" /><span>Ver web</span></Link>
        </nav>
      </aside>

      {showMoreMenu && <div className="admin-nav__overlay" onClick={() => setOpenPath(null)}>
        <div ref={panelRef} id="admin-more-menu" className="admin-nav__sheet" role="dialog" aria-modal="true" aria-labelledby="admin-more-title" onClick={event => event.stopPropagation()}>
          <div className="admin-nav__sheet-header">
            <h2 id="admin-more-title">Más opciones</h2>
            <button ref={closeRef} type="button" aria-label="Cerrar menú" onClick={() => setOpenPath(null)}><Icon name="close" /></button>
          </div>
          <nav aria-label="Más destinos de administración">
            {groups.map(group => {
              const secondary = group.items.filter(item => !primary.some(link => link.href === item.href))
              return <section key={group.label} className="admin-nav__group"><h3>{group.label}</h3>{secondary.map(item => renderItem(item))}</section>
            })}
            <Link href="/" className="admin-nav__utility" onClick={() => setOpenPath(null)}><Icon name="open_in_browser" /><span>Ver web</span></Link>
          </nav>
        </div>
      </div>}

      <nav aria-label="Navegación principal móvil de administración" className="admin-nav__bottom">
        {primary.map(item => renderItem(item, true))}
        <button ref={moreRef} type="button" className="admin-nav__mobile-item" data-active={isMoreActive} aria-expanded={showMoreMenu} aria-controls={showMoreMenu ? 'admin-more-menu' : undefined} onClick={() => setOpenPath(showMoreMenu ? null : pathname)}>
          <Icon name="more_horiz" /><span>Más</span>
        </button>
      </nav>
    </>
  )
}
