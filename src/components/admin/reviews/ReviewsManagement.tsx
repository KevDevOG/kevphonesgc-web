'use client'

import { useId, useState, useTransition } from 'react'
import { AdminReview, ReviewForm } from './ReviewForm'
import { toggleReviewActiveAction, toggleReviewFeaturedAction, deleteReviewAction } from '@/actions/reviews'
import { useRouter } from 'next/navigation'
import { AdminPageHeader } from '@/components/admin/layout/AdminPageHeader'

export function ReviewsManagement({ reviews }: { reviews: AdminReview[] }) {
  const searchId = useId()
  const [search, setSearch] = useState('')
  const [publication, setPublication] = useState('all')
  const [ratingFilter, setRatingFilter] = useState('all')
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  
  const [showForm, setShowForm] = useState(false)
  const [editingReview, setEditingReview] = useState<AdminReview | undefined>(undefined)
  
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const activeCount = reviews.filter(r => r.active).length
  const featuredCount = reviews.filter(r => r.featured).length

  const handleCreate = () => {
    setEditingReview(undefined)
    setShowForm(true)
  }

  const handleEdit = (review: AdminReview) => {
    setEditingReview(review)
    setShowForm(true)
  }

  const handleToggleActive = (id: string, currentActive: boolean) => {
    startTransition(async () => {
      await toggleReviewActiveAction(id, !currentActive)
      router.refresh()
    })
  }

  const handleToggleFeatured = (id: string, currentFeatured: boolean) => {
    startTransition(async () => {
      await toggleReviewFeaturedAction(id, !currentFeatured)
      router.refresh()
    })
  }

  const handleDelete = (id: string) => {
    startTransition(async () => {
      await deleteReviewAction(id)
      setDeletingId(null)
      router.refresh()
    })
  }

  const sourceLabels: Record<string, string> = {
    wallapop: 'Wallapop',
    whatsapp: 'WhatsApp',
    other: 'Otro'
  }

  const query = search.trim().toLocaleLowerCase('es')
  const filteredReviews = reviews.filter(review => {
    if (publication === 'active' && !review.active) return false
    if (publication === 'hidden' && review.active) return false
    if (ratingFilter === 'none' && review.rating !== null) return false
    if (ratingFilter !== 'all' && ratingFilter !== 'none' && review.rating !== Number(ratingFilter)) return false
    return !query || [review.author_name, review.review_text].join(' ').toLocaleLowerCase('es').includes(query)
  })
  const hasFilters = Boolean(query) || publication !== 'all' || ratingFilter !== 'all'
  const resetFilters = () => {
    setSearch('')
    setPublication('all')
    setRatingFilter('all')
  }

  return (
    <div className="admin-reviews">
      <AdminPageHeader
        title="Reseñas"
        subtitle="Gestiona las valoraciones que se muestran en la web."
        action={<button type="button" className="admin-reviews__create" onClick={handleCreate}><span aria-hidden="true" className="material-symbols-outlined">add</span>Nueva reseña</button>}
      />
      <dl className="admin-reviews__summary" aria-label="Resumen de reseñas">
        <div><dt>Total</dt><dd>{reviews.length}</dd></div>
        <div><dt>Publicadas</dt><dd>{activeCount}</dd></div>
        <div><dt>Destacadas</dt><dd>{featuredCount}</dd></div>
      </dl>

      <div className="admin-reviews__toolbar">
        <div className="admin-reviews__search">
          <label htmlFor={searchId} className="sr-only">Buscar reseña por autor o texto</label>
          <span aria-hidden="true" className="material-symbols-outlined">search</span>
          <input id={searchId} type="search" placeholder="Buscar reseña..." value={search} onChange={event => setSearch(event.target.value)} />
        </div>
        <label className="admin-reviews__filter">Publicación
          <select value={publication} onChange={event => setPublication(event.target.value)}><option value="all">Todas</option><option value="active">Publicadas</option><option value="hidden">Ocultas</option></select>
        </label>
        <label className="admin-reviews__filter">Valoración
          <select value={ratingFilter} onChange={event => setRatingFilter(event.target.value)}>
            <option value="all">Todas</option>{[5, 4, 3, 2, 1].map(rating => <option key={rating} value={rating}>{rating} {rating === 1 ? 'estrella' : 'estrellas'}</option>)}<option value="none">Sin valoración</option>
          </select>
        </label>
        {hasFilters && <button type="button" className="admin-reviews__reset" onClick={resetFilters}>Limpiar filtros</button>}
      </div>
      <p className="admin-reviews__results" role="status" aria-live="polite">{filteredReviews.length} {filteredReviews.length === 1 ? 'reseña' : 'reseñas'}</p>

      {filteredReviews.length === 0 ? <div className="admin-reviews__empty">
        <h3>{reviews.length === 0 ? 'Aún no hay reseñas.' : 'No hay reseñas que coincidan con los filtros.'}</h3>
        {reviews.length === 0 ? <><p>Puedes añadir valoraciones reales de operaciones para mostrarlas en la web.</p><button type="button" onClick={handleCreate}>Añadir primera reseña</button></> : <button type="button" onClick={resetFilters}>Limpiar filtros</button>}
      </div> : <table role="table" className="admin-reviews__table">
        <caption className="sr-only">Gestión de reseñas</caption>
        <thead><tr><th scope="col">Autor</th><th scope="col">Reseña</th><th scope="col">Valoración</th><th scope="col">Estado</th><th scope="col">Creada</th><th scope="col"><span className="sr-only">Acciones</span></th></tr></thead>
        <tbody>{filteredReviews.map(review => <tr key={review.id} className="admin-reviews__row">
          <td className="admin-reviews__author"><strong>{review.author_name}</strong><span>{sourceLabels[review.source] || review.source}</span></td>
          <td className="admin-reviews__text"><p title={review.review_text}>{review.review_text}</p><div className="admin-reviews__metadata">{review.review_date && <span>Reseña: <time dateTime={review.review_date}>{formatReviewDate(review.review_date)}</time></span>}<span>Orden: {review.sort_order}</span></div></td>
          <td className="admin-reviews__rating-cell"><ReviewRating rating={review.rating} /></td>
          <td className="admin-reviews__state"><span data-active={review.active}>{review.active ? 'Publicada' : 'Oculta'}</span>{review.featured && <span className="admin-reviews__featured">Destacada</span>}</td>
          <td className="admin-reviews__date"><span>Creada </span><time dateTime={review.created_at}>{formatReviewDate(review.created_at)}</time></td>
          <td className="admin-reviews__actions"><div>
            <button type="button" onClick={() => handleEdit(review)} disabled={isPending} title="Editar" aria-label={`Editar reseña de ${review.author_name}`}><span aria-hidden="true" className="material-symbols-outlined">edit</span></button>
            <button type="button" onClick={() => handleToggleActive(review.id, review.active)} disabled={isPending} title={review.active ? 'Ocultar' : 'Publicar'} aria-label={`${review.active ? 'Ocultar' : 'Publicar'} reseña de ${review.author_name}`}><span aria-hidden="true" className="material-symbols-outlined">{review.active ? 'visibility_off' : 'visibility'}</span></button>
            <button type="button" onClick={() => handleToggleFeatured(review.id, review.featured)} disabled={isPending} title={review.featured ? 'Quitar destacado' : 'Destacar'} aria-label={review.featured ? 'Quitar destacado' : 'Destacar'} aria-pressed={review.featured}><span aria-hidden="true" className="material-symbols-outlined">verified</span></button>
            <button type="button" className="admin-reviews__delete" onClick={() => setDeletingId(review.id)} disabled={isPending} title="Eliminar" aria-label={`Eliminar reseña de ${review.author_name}`}><span aria-hidden="true" className="material-symbols-outlined">delete</span></button>
          </div></td>
        </tr>)}</tbody>
      </table>}

      {showForm && (
        <ReviewForm 
          initialData={editingReview} 
          onClose={() => setShowForm(false)} 
        />
      )}

      {deletingId && (
        <div role="dialog" aria-modal="true" aria-label="Eliminar reseña" className="admin-reviews__confirmation fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0B0B0E] border border-red-500/30 rounded-2xl w-full max-w-sm p-6 shadow-2xl relative overflow-hidden flex flex-col gap-4">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-red-500/50"></div>
            
            <h3 className="text-[16px] font-bold text-red-400 border-b border-red-500/20 pb-3">¿Eliminar esta reseña?</h3>
            <p className="text-[14px] font-medium text-zinc-400">Esta acción no se puede deshacer.</p>
            
            <div className="flex gap-3 justify-end mt-2 pt-4 border-t border-[#1F1F24]">
              <button 
                onClick={() => setDeletingId(null)}
                disabled={isPending}
                className="px-5 py-2.5 bg-[#121217] hover:bg-[#1F1F24] border border-[#1F1F24] text-white rounded-xl text-[14px] font-bold transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button 
                onClick={() => handleDelete(deletingId)}
                disabled={isPending}
                className="px-5 py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 font-bold text-[14px] rounded-xl transition-all disabled:opacity-50"
              >
                {isPending ? 'Eliminando...' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function formatReviewDate(value: string) {
  return new Date(value).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' })
}

function ReviewRating({ rating }: { rating: number | null }) {
  return rating !== null ? <span className="admin-reviews__rating" role="img" aria-label={`${rating} de 5 estrellas`}>
    <span aria-hidden="true" className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span><span aria-hidden="true">{rating}/5</span>
  </span> : <span className="admin-reviews__unrated">Sin valoración</span>
}
