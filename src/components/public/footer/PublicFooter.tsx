'use client'

import Link from 'next/link'
import Image from 'next/image'

export type PublicFooterProps = {
  whatsappPhone: string | null
  contactEnabled: boolean
  instagramUrl: string | null
  tiktokUrl: string | null
  wallapopUrl: string | null
}

export function PublicFooter({
  whatsappPhone,
  contactEnabled,
  instagramUrl,
  tiktokUrl,
  wallapopUrl
}: PublicFooterProps) {
  const showWhatsApp = contactEnabled && whatsappPhone

  return (
    <footer className="kevphones-footer">
      <div className="kevphones-footer__inner">
        <div className="kevphones-footer__main">
          <div className="kevphones-footer__brand">
            <Link href="/" aria-label="KevPhonesGC, inicio" className="kevphones-footer__logo">
              <span className="kevphones-footer__logo-image">
                <Image src="/brand/kevphonesgc-logo.PNG" alt="" fill className="object-contain" sizes="36px" />
              </span>
              <span>KevPhonesGC</span>
            </Link>
            <p>Compra, venta y tasación de dispositivos en Canarias.</p>
          </div>

          <nav aria-label="Enlaces del pie de página" className="kevphones-footer__navigation">
            <h3>Enlaces</h3>
            <ul>
              <li><a href="/#stock">Ver stock</a></li>
              <li><Link href="/cotizar">Cotizar mi iPhone</Link></li>
              <li><Link href="/vender">Vender mi iPhone</Link></li>
            </ul>
          </nav>

          {(showWhatsApp || instagramUrl || tiktokUrl || wallapopUrl) && (
            <div className="kevphones-footer__contact">
              <h3>{showWhatsApp ? 'Contacto y redes' : 'Síguenos'}</h3>
              <ul>
                {showWhatsApp && <li><a href={`https://wa.me/${whatsappPhone}`} target="_blank" rel="noopener noreferrer">Hablar por WhatsApp</a></li>}
                {instagramUrl && <li><a href={instagramUrl} target="_blank" rel="noopener noreferrer">Instagram</a></li>}
                {tiktokUrl && <li><a href={tiktokUrl} target="_blank" rel="noopener noreferrer">TikTok</a></li>}
                {wallapopUrl && <li><a href={wallapopUrl} target="_blank" rel="noopener noreferrer">Wallapop</a></li>}
              </ul>
            </div>
          )}
        </div>

        <div className="kevphones-footer__bottom">
          <p>© 2026 KevPhonesGC. Todos los derechos reservados.</p>
          <nav aria-label="Información legal">
            <ul>
              <li><Link href="/aviso-legal">Aviso legal</Link></li>
              <li><Link href="/privacidad">Privacidad</Link></li>
              <li><Link href="/cookies">Cookies</Link></li>
            </ul>
          </nav>
        </div>
      </div>
    </footer>
  )
}
