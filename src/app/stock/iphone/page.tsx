import type { Metadata } from 'next'
import Link from 'next/link'
import { PublicHeader } from '@/components/public/PublicHeader'
import { PublicFooter } from '@/components/public/footer/PublicFooter'
import { PublicStockSection } from '@/components/public/stock/PublicStockSection'
import { WantedDeviceRequest } from '@/components/public/stock/WantedDeviceRequest'
import { getPublicStockData } from '@/components/public/stock/get-public-stock'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'iPhone disponibles en Gran Canaria | KevPhonesGC',
  description: 'Consulta los iPhone disponibles actualmente en KevPhonesGC. Encuentra iPhone en stock para compra en Gran Canaria.',
  alternates: {
    canonical: '/stock/iphone',
  },
  openGraph: {
    type: 'website',
    locale: 'es_ES',
    url: 'https://kevphones.es/stock/iphone',
    siteName: 'KevPhonesGC',
    title: 'iPhone disponibles en Gran Canaria | KevPhonesGC',
    description: 'Consulta los iPhone disponibles actualmente en KevPhonesGC. Encuentra iPhone en stock para compra en Gran Canaria.',
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'KevPhonesGC - Compra y vende iPhone en Gran Canaria',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'iPhone disponibles en Gran Canaria | KevPhonesGC',
    description: 'Consulta los iPhone disponibles actualmente en KevPhonesGC. Encuentra iPhone en stock para compra en Gran Canaria.',
    images: ['/opengraph-image'],
  },
}

export default async function StockIPhonePage() {
  const {
    devices,
    whatsappPhone,
    contactEnabled,
    instagramUrl,
    tiktokUrl,
    wallapopUrl,
  } = await getPublicStockData()

  const iphoneDevices = devices.filter(device => device.category === 'iphone')

  return (
    <div className="kevphones-stock-page flex flex-col min-h-screen bg-black">
      <PublicHeader />
      <main className="flex-1 w-full bg-[#050506]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 md:pt-12 pb-4">
          <nav aria-label="Navegación de vuelta" className="mb-4">
            <Link 
              href="/stock" 
              className="inline-flex items-center text-sm text-zinc-400 hover:text-white transition-colors"
            >
              <svg aria-hidden="true" className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Ver todo el stock disponible
            </Link>
          </nav>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white mb-3">
            iPhone disponibles en Gran Canaria
          </h1>
          <p className="text-base sm:text-lg text-zinc-400 max-w-2xl">
            Consulta los iPhone disponibles actualmente en KevPhonesGC y encuentra el modelo que buscas en Gran Canaria.
          </p>
        </div>

        <PublicStockSection 
          devices={iphoneDevices}
          whatsappPhone={whatsappPhone}
          contactEnabled={contactEnabled}
          lockedCategory="iphone"
        />
        <WantedDeviceRequest source="iphone_stock" category="iphone" />
      </main>
      <PublicFooter 
        whatsappPhone={whatsappPhone}
        contactEnabled={contactEnabled}
        instagramUrl={instagramUrl}
        tiktokUrl={tiktokUrl}
        wallapopUrl={wallapopUrl}
      />
    </div>
  )
}

