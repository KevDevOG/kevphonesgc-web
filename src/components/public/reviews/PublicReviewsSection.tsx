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
      <span aria-label={`${rating} de 5 estrellas`} className="text-[#9867db] text-lg tracking-widest">
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
    <div className="w-full max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 py-16 md:py-24">
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-zinc-800 bg-zinc-900/50 mb-6">
          <span className="text-[10px] sm:text-xs font-semibold text-zinc-300 tracking-widest uppercase">5 estrellas en Wallapop</span>
        </div>
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">Valoraciones reales</h2>
        <p className="text-[#A8A8B0] text-lg max-w-2xl mx-auto">Opiniones de personas con las que hemos realizado operaciones.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reviews.map(review => (
          <div key={review.id} className="bg-[#0B0B0D] border border-[#1F1F24] p-6 rounded-2xl flex flex-col hover:border-[#333] transition-colors relative">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-white font-bold text-lg inline-flex items-center gap-2">
                  {review.author_name}
                  {review.featured && (
                    <span className="text-[10px] uppercase tracking-wider bg-purple-900/30 text-purple-400 border border-purple-800/50 px-2 py-0.5 rounded-full">Destacada</span>
                  )}
                </h3>
              </div>
              {review.rating !== null && renderStars(review.rating)}
            </div>
            
            <p className="text-[#A8A8B0] italic flex-1 mb-6">"{review.review_text}"</p>
            
            <div className="mt-auto flex justify-between items-end">
              <span className="text-xs font-medium bg-[#1F1F24] text-[#A8A8B0] px-2 py-1 rounded">
                {getSourceLabel(review.source)}
              </span>
              {review.review_date && (
                <span className="text-xs text-[#6E6E78]">
                  {formatLocalDate(review.review_date)}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {wallapopUrl && (
        <div className="mt-12 text-center">
          <a 
            href={wallapopUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-purple-600/50 text-purple-400 hover:bg-purple-900/20 hover:border-purple-500 rounded-full font-semibold transition-all"
          >
            Ver todas las valoraciones en Wallapop
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </a>
        </div>
      )}
    </div>
  )
}
