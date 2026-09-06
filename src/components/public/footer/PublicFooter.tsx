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
    <footer className="w-full bg-[#050506] border-t border-[#1F1F24] pt-24 pb-12 px-5 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 mb-20">
        
        {/* Brand Block */}
        <div className="lg:col-span-2">
          <div className="mb-6 relative w-48 h-10">
            <Image
              src="/brand/kevphonesgc-logo.PNG"
              alt="KevPhonesGC Logo"
              fill
              className="object-contain object-left"
              priority
            />
          </div>
          <p className="text-zinc-400 mb-3 max-w-sm font-light text-lg">
            Compra, venta y tasación de dispositivos en Canarias.
          </p>
          <p className="text-zinc-500 text-sm max-w-sm font-light">
            Stock real, trato directo y dispositivos revisados.
          </p>
        </div>

        {/* Navigation Block */}
        <div>
          <h3 className="text-white font-medium mb-8">Enlaces</h3>
          <ul className="space-y-5">
            <li>
              <a href="/#stock" className="text-zinc-400 hover:text-white transition-colors duration-200">Ver stock</a>
            </li>
            <li>
              <Link href="/cotizar" className="text-zinc-400 hover:text-white transition-colors duration-200">Cotizar mi iPhone</Link>
            </li>
            <li>
              <Link href="/vender" className="text-zinc-400 hover:text-white transition-colors duration-200">Vender mi iPhone</Link>
            </li>
          </ul>
        </div>

        {/* Contact & Social Block */}
        <div>
          <h3 className="text-white font-medium mb-8">Contacto</h3>
          <ul className="space-y-5 mb-10">
            {showWhatsApp && (
              <li>
                <a 
                  href={`https://wa.me/${whatsappPhone}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-zinc-400 hover:text-white transition-colors duration-200 flex items-center gap-2"
                >
                  Hablar por WhatsApp
                </a>
              </li>
            )}
          </ul>

          {(instagramUrl || tiktokUrl || wallapopUrl) && (
            <>
              <h3 className="text-white font-medium mb-8">Síguenos</h3>
              <ul className="space-y-5">
                {instagramUrl && (
                  <li>
                    <a 
                      href={instagramUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-zinc-400 hover:text-white transition-colors duration-200 flex items-center gap-2"
                    >
                      Instagram
                    </a>
                  </li>
                )}
                {tiktokUrl && (
                  <li>
                    <a 
                      href={tiktokUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-zinc-400 hover:text-white transition-colors duration-200 flex items-center gap-2"
                    >
                      TikTok
                    </a>
                  </li>
                )}
                {wallapopUrl && (
                  <li>
                    <a 
                      href={wallapopUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-zinc-400 hover:text-white transition-colors duration-200 flex items-center gap-2"
                    >
                      Wallapop
                    </a>
                  </li>
                )}
              </ul>
            </>
          )}
        </div>
      </div>

      {/* Bottom Row */}
      <div className="max-w-7xl mx-auto pt-8 border-t border-[#1F1F24] flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-8">
          <p className="text-sm text-zinc-500">© 2026 KevPhonesGC. Todos los derechos reservados.</p>
          <div className="flex items-center gap-6">
            <Link href="/aviso-legal" className="text-sm text-zinc-500 hover:text-white transition-colors duration-200">Aviso legal</Link>
            <Link href="/privacidad" className="text-sm text-zinc-500 hover:text-white transition-colors duration-200">Privacidad</Link>
            <Link href="/cookies" className="text-sm text-zinc-500 hover:text-white transition-colors duration-200">Cookies</Link>
          </div>
        </div>
        <p className="text-sm text-zinc-500 font-medium">Canarias</p>
      </div>
    </footer>
  )
}
