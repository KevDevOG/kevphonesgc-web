'use client'

export type PublicReview = {
  id: string
  author_name: string
  review_text: string
  source: 'wallapop' | 'whatsapp' | 'other'
  rating: number | null
  review_date: string | null
  featured: boolean
  sort_order: number
  created_at: string
}

interface PublicReviewsSectionProps {
  reviews: PublicReview[]
  wallapopUrl: string | null
}

export function PublicReviewsSection({ reviews, wallapopUrl }: PublicReviewsSectionProps) {
  if (reviews.length === 0) return null

  const formatLocalDate = (dateStr: string) => {
    // Prevent timezone shift by parsing YYYY-MM-DD explicitly
    const [year, month, day] = dateStr.split('-').map(Number)
    if (!year || !month || !day) return dateStr
    
    const d = new Date(year, month - 1, day)
    return d.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })
  }

  const renderStars = (rating: number) => {
    const filled = '★'.repeat(rating)
    const unfilled = '☆'.repeat(5 - rating)
    return (
      <span aria-label={`${rating} de 5 estrellas`} className="text-[#9867db] text-lg tracking-widest drop-shadow-sm">
        {filled}{unfilled}
      </span>
    )
  }

  const getSourceLabel = (source: string) => {
    switch (source) {
      case 'wallapop': return 'Wallapop'
      case 'whatsapp': return 'WhatsApp'
      default: return 'Cliente'
    }
  }

  return (
    <section className="w-full max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 py-20 md:py-32">
      <div className="flex flex-col items-center text-center mb-16">
        <div className="inline-flex items-center justify-center px-3 py-1 rounded-full border border-zinc-800 bg-[#0B0B0E] mb-6">
          <span className="text-[10px] sm:text-xs font-semibold text-zinc-400 tracking-widest uppercase">5 estrellas en Wallapop</span>
        </div>
        <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight mb-4">
          Valoraciones reales
        </h2>
        <p className="text-lg text-zinc-400 max-w-2xl font-light">
          Opiniones de personas con las que hemos realizado operaciones.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
        {reviews.map(review => (
          <div 
            key={review.id} 
            className={`bg-[#0B0B0E] p-6 sm:p-8 rounded-[20px] flex flex-col transition-all duration-300 hover:-translate-y-1 ${
              review.featured ? 'border border-purple-500/20 shadow-[0_0_30px_rgba(147,51,234,0.05)]' : 'border border-[#1F1F24]'
            }`}
          >
            <div className="flex justify-between items-start mb-5">
              <div className="flex flex-col gap-1">
                <h3 className="text-white font-semibold text-lg flex items-center gap-2">
                  {review.author_name}
                  {review.featured && (
                    <span className="text-[9px] uppercase tracking-wider bg-purple-900/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full font-bold">
                      Destacada
                    </span>
                  )}
                </h3>
              </div>
              {review.rating !== null && renderStars(review.rating)}
            </div>
            
            <p className="text-zinc-300 flex-1 mb-8 leading-relaxed font-light">"{review.review_text}"</p>
            
            <div className="mt-auto pt-4 border-t border-[#1F1F24]/50 flex justify-between items-center">
              <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">
                {getSourceLabel(review.source)}
              </span>
              {review.review_date && (
                <span className="text-[11px] text-zinc-500 font-medium">
                  {formatLocalDate(review.review_date)}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {wallapopUrl && (
        <div className="mt-16 flex justify-center">
          <a 
            href={wallapopUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="group inline-flex items-center justify-center gap-3 px-8 py-3.5 bg-transparent border border-[#1F1F24] text-white hover:border-zinc-700 hover:bg-[#0B0B0E] rounded-full font-medium transition-all duration-200 active:scale-[0.98]"
          >
            Ver todas las valoraciones en Wallapop
            <svg className="w-4 h-4 text-zinc-400 group-hover:text-white transition-all duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </a>
        </div>
      )}
    </section>
  )
}
