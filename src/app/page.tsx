import { createClient } from '@/lib/supabase/server'
import { PublicStockSection } from '@/components/public/stock/PublicStockSection'
import { WantedDeviceRequest } from '@/components/public/stock/WantedDeviceRequest'
import { getPublicStockData } from '@/components/public/stock/get-public-stock'
import { PublicReviewsSection, PublicReview } from '@/components/public/reviews/PublicReviewsSection'
import { PublicFaqSection } from '@/components/public/faq/PublicFaqSection'
import { PublicFooter } from '@/components/public/footer/PublicFooter'
import { PublicHeader } from '@/components/public/PublicHeader'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'

export const metadata: Metadata = {
  alternates: {
    canonical: '/',
  },
}

export default async function Home() {
  const supabase = await createClient()

  const [stockData, reviewsResult] = await Promise.all([
    getPublicStockData(),
    supabase
      .from('reviews')
      .select('id, author_name, review_text, source, rating, review_date, featured, sort_order, created_at')
      .eq('active', true)
      .order('featured', { ascending: false })
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false })
      .limit(6),
  ])

  const publicReviews: PublicReview[] = reviewsResult.data || []
  const {
    devices: publicStock,
    whatsappPhone,
    contactEnabled,
    instagramUrl,
    tiktokUrl,
    wallapopUrl,
  } = stockData

  return (
    <div className="kevphones-home flex flex-col min-h-screen bg-black pb-20 md:pb-0">
      <PublicHeader />

      <main className="flex-1 w-full bg-[#050506] overflow-hidden relative">
        <section className="kevphones-hero" aria-labelledby="home-title">
          <div className="kevphones-hero__layout">
            <div className="kevphones-hero__content">
              <p className="m-0 text-white font-[650] leading-[1.04] md:leading-[1.02] tracking-[-0.045em] text-[clamp(38px,10.5vw,48px)] md:text-[clamp(48px,7vw,68px)] xl:text-[76px] [text-wrap:balance] [overflow-wrap:anywhere]">
                KEVPHONES
              </p>
              <h1 id="home-title" className="kevphones-hero__headline">
                Compra y vende <span>iPhone en Gran Canaria</span>
              </h1>
              <p className="kevphones-hero__support">Stock disponible de iPhone revisados, compra con trato directo en Gran Canaria y valoración orientativa para vender tu móvil.</p>
              <div className="kevphones-hero__actions">
                <a href="#stock" className="kevphones-hero__primary">
                  Ver stock
                </a>
                <Link href="/cotizar" className="kevphones-hero__secondary">
                  Cotizar el mío
                </Link>
              </div>
              <Link href="/vender" className="kevphones-hero__sell">
                <span>¿Quieres venderlo directamente?</span>
                <span>Vender mi iPhone</span>
              </Link>
            </div>

            <div className="kevphones-hero__visual">
              <div className="kevphones-hero__product">
                <Image
                  src="/iphone-14-pro-max.png"
                  alt="iPhone 14 Pro Max Deep Purple"
                  fill
                  className="object-contain"
                  loading="eager"
                  fetchPriority="high"
                  sizes="(min-width: 1280px) 632px, (min-width: 768px) 52vw, calc(100vw - 64px)"
                />
              </div>
            </div>
          </div>
        </section>

        <div className="kevphones-trust">
          <ul aria-label="Sobre KevPhonesGC">
            <li>
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                <path strokeLinecap="round" strokeLinejoin="round" d="m9 12 2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
              Dispositivos revisados
            </li>
            <li>
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h8m-8 4h5m-9 6 3-3h11a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v14Z" />
              </svg>
              Trato directo
            </li>
            <li>
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z" />
                <circle cx="12" cy="10" r="2.5" />
              </svg>
              Entrega en Gran Canaria
            </li>
          </ul>
        </div>

        <section id="stock" className="kevphones-stock-transition scroll-mt-16 md:scroll-mt-20">
          <PublicStockSection 
            devices={publicStock} 
            whatsappPhone={whatsappPhone}
            contactEnabled={contactEnabled}
          />
          <WantedDeviceRequest source="home" />
        </section>

        {publicReviews.length > 0 && (
          <section id="reviews" className="kevphones-lower-band">
            <PublicReviewsSection reviews={publicReviews} wallapopUrl={wallapopUrl} />
          </section>
        )}

        <section className="kevphones-conversion" aria-labelledby="conversion-title">
          <div className="kevphones-lower-section kevphones-conversion__inner">
            <div>
              <h2 id="conversion-title" className="kevphones-lower-title">Cotiza o vende tu iPhone</h2>
              <p>Recibe una valoración orientativa online o envía tu solicitud para vender tu iPhone u otros dispositivos en Gran Canaria.</p>
            </div>
            <div className="kevphones-conversion__actions">
              <Link href="/cotizar" className="kevphones-conversion__primary">Cotizar mi iPhone</Link>
              <Link href="/vender" className="kevphones-conversion__secondary">Vender mi dispositivo</Link>
            </div>
          </div>
        </section>

        <section id="faq" className="kevphones-lower-band">
          <PublicFaqSection />
        </section>

        <PublicFooter 
          whatsappPhone={whatsappPhone}
          contactEnabled={contactEnabled}
          instagramUrl={instagramUrl}
          tiktokUrl={tiktokUrl}
          wallapopUrl={wallapopUrl}
        />
      </main>
    </div>
  )
}
