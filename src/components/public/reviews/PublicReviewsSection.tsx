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
      <span role="img" aria-label={`${rating} de 5 estrellas`} className="kevphones-reviews__stars">
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
    <section className="kevphones-lower-section kevphones-reviews" aria-labelledby="reviews-title">
      <div className="kevphones-lower-heading">
        <h2 id="reviews-title" className="kevphones-lower-title">Valoraciones reales</h2>
        <p>Opiniones de personas con las que hemos realizado operaciones.</p>
      </div>

      <div className="kevphones-reviews__grid">
        {reviews.map(review => (
          <article key={review.id} className="kevphones-reviews__item" data-featured={review.featured}>
            <div className="kevphones-reviews__author">
              <h3>{review.author_name}</h3>
              {review.rating !== null && renderStars(review.rating)}
            </div>
            <blockquote>{review.review_text}</blockquote>
            <div className="kevphones-reviews__source">
              <span>{getSourceLabel(review.source)}</span>
              {review.review_date && <time dateTime={review.review_date}>{formatLocalDate(review.review_date)}</time>}
            </div>
          </article>
        ))}
      </div>

      {wallapopUrl && (
        <a href={wallapopUrl} target="_blank" rel="noopener noreferrer" className="kevphones-reviews__link">
          Ver todas las valoraciones en Wallapop
        </a>
      )}
    </section>
  )
}
