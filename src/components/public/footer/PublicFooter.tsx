'use client'

import Link from 'next/link'

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
    <footer className="w-full bg-[#060608] border-t border-[#1F1F24] pt-16 pb-8 px-5 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
        
        {/* Brand Block */}
        <div className="lg:col-span-2">
          <h2 className="text-2xl font-bold text-white mb-4 tracking-tight" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>KevPhonesGC</h2>
          <p className="text-[#A8A8B0] mb-2 max-w-sm">Compra, venta y tasación de dispositivos en Canarias.</p>
          <p className="text-[#6E6E78] text-sm max-w-sm">Stock real, trato directo y dispositivos revisados.</p>
        </div>

        {/* Navigation Block */}
        <div>
          <h3 className="text-white font-semibold mb-6">Enlaces</h3>
          <ul className="space-y-4">
            <li>
              <a href="/#stock" className="text-[#A8A8B0] hover:text-white transition-colors text-sm">Ver stock</a>
            </li>
            <li>
              <Link href="/cotizar" className="text-[#A8A8B0] hover:text-white transition-colors text-sm">Cotizar mi iPhone</Link>
            </li>
            <li>
              <Link href="/vender" className="text-[#A8A8B0] hover:text-white transition-colors text-sm">Vender mi iPhone</Link>
            </li>
          </ul>
        </div>

        {/* Contact & Social Block */}
        <div>
          <h3 className="text-white font-semibold mb-6">Contacto</h3>
          <ul className="space-y-4 mb-8">
            {showWhatsApp && (
              <li>
                <a 
                  href={`https://wa.me/${whatsappPhone}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-[#A8A8B0] hover:text-white transition-colors text-sm flex items-center gap-2"
                >
                  Hablar por WhatsApp
                </a>
              </li>
            )}
          </ul>

          {(instagramUrl || tiktokUrl || wallapopUrl) && (
            <>
              <h3 className="text-white font-semibold mb-6">Síguenos</h3>
              <ul className="space-y-4">
                {instagramUrl && (
                  <li>
                    <a 
                      href={instagramUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-[#A8A8B0] hover:text-white transition-colors text-sm flex items-center gap-2"
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
                      className="text-[#A8A8B0] hover:text-white transition-colors text-sm flex items-center gap-2"
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
                      className="text-[#A8A8B0] hover:text-white transition-colors text-sm flex items-center gap-2"
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
      <div className="max-w-7xl mx-auto pt-8 border-t border-[#1F1F24] flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-sm text-[#6E6E78]">© 2026 KevPhonesGC. Todos los derechos reservados.</p>
        <p className="text-sm text-[#6E6E78] font-medium">Canarias</p>
      </div>
    </footer>
  )
}
