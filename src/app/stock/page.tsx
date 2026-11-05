import type { Metadata } from 'next'
import { PublicHeader } from '@/components/public/PublicHeader'
import { PublicFooter } from '@/components/public/footer/PublicFooter'
import { PublicStockSection } from '@/components/public/stock/PublicStockSection'
import { getPublicStockData } from '@/components/public/stock/get-public-stock'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'iPhone disponibles en Gran Canaria',
  description: 'Consulta los iPhone y dispositivos disponibles en KevPhonesGC. Stock actualizado para compra en Gran Canaria.',
  alternates: {
    canonical: '/stock',
  },
  openGraph: {
    type: 'website',
    locale: 'es_ES',
    url: 'https://kevphones.es/stock',
    siteName: 'KevPhonesGC',
    title: 'iPhone disponibles en Gran Canaria | KevPhonesGC',
    description: 'Consulta los iPhone y dispositivos disponibles en KevPhonesGC. Stock actualizado para compra en Gran Canaria.',
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
    description: 'Consulta los iPhone y dispositivos disponibles en KevPhonesGC. Stock actualizado para compra en Gran Canaria.',
    images: ['/opengraph-image'],
  },
}

export default async function StockPage() {
  const {
    devices,
    whatsappPhone,
    contactEnabled,
    instagramUrl,
    tiktokUrl,
    wallapopUrl,
  } = await getPublicStockData()

  return (
    <div className="kevphones-stock-page flex flex-col min-h-screen bg-black">
      <PublicHeader />
      <main className="flex-1 w-full bg-[#050506]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 md:pt-12 pb-4">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white mb-3">
            iPhone y dispositivos disponibles en Gran Canaria
          </h1>
          <p className="text-base sm:text-lg text-zinc-400 max-w-2xl">
            Consulta los iPhone y dispositivos disponibles en KevPhonesGC. Stock actualizado para compra con trato directo y entrega en Gran Canaria.
          </p>
        </div>

        <PublicStockSection 
          devices={devices}
          whatsappPhone={whatsappPhone}
          contactEnabled={contactEnabled}
        />
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

