'use client'

import { useState, useTransition } from 'react'
import { AdminReview, ReviewForm } from './ReviewForm'
import { toggleReviewActiveAction, toggleReviewFeaturedAction, deleteReviewAction } from '@/actions/reviews'
import { useRouter } from 'next/navigation'

export function ReviewsManagement({ reviews }: { reviews: AdminReview[] }) {
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

  return (
    <div className="space-y-6 pb-32">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>Reseñas</h1>
          <p className="text-[#A8A8B0]">Gestiona las opiniones que se mostrarán en la web.</p>
        </div>
        <button 
          onClick={handleCreate}
          className="bg-[#9867db] hover:bg-[#8552c6] text-white px-5 py-2.5 rounded-lg font-bold transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
        >
          <span className="material-symbols-outlined">add</span>
          Nueva reseña
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-[#0B0B0D] border border-[#1F1F24] p-4 rounded-xl flex flex-col items-center justify-center">
          <div className="text-2xl font-bold text-white">{reviews.length}</div>
          <div className="text-xs text-[#A8A8B0] uppercase tracking-wider mt-1">Total</div>
        </div>
        <div className="bg-[#0B0B0D] border border-[#1F1F24] p-4 rounded-xl flex flex-col items-center justify-center">
          <div className="text-2xl font-bold text-green-400">{activeCount}</div>
          <div className="text-xs text-[#A8A8B0] uppercase tracking-wider mt-1">Activas</div>
        </div>
        <div className="bg-[#0B0B0D] border border-[#1F1F24] p-4 rounded-xl flex flex-col items-center justify-center">
          <div className="text-2xl font-bold text-[#9867db]">{featuredCount}</div>
          <div className="text-xs text-[#A8A8B0] uppercase tracking-wider mt-1">Destacadas</div>
        </div>
      </div>

      {reviews.length === 0 ? (
        <div className="bg-[#0B0B0D] border border-[#1F1F24] rounded-2xl p-10 flex flex-col items-center justify-center text-center">
          <span className="material-symbols-outlined text-6xl text-[#1F1F24] mb-4">reviews</span>
          <h3 className="text-xl font-bold text-white mb-2">Aún no hay reseñas</h3>
          <p className="text-[#A8A8B0] mb-6 max-w-sm">Añade opiniones reales de tus clientes para mostrarlas más adelante en la web.</p>
          <button 
            onClick={handleCreate}
            className="border border-[#9867db] text-[#9867db] hover:bg-[#9867db]/10 px-5 py-2.5 rounded-lg font-bold transition-colors"
          >
            Añadir primera reseña
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reviews.map(review => (
            <div key={review.id} className="bg-[#0B0B0D] border border-[#1F1F24] rounded-2xl flex flex-col overflow-hidden relative">
              {review.featured && (
                <div className="absolute top-0 left-0 w-1 h-full bg-[#9867db]"></div>
              )}
              
              <div className="p-5 flex-1">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex gap-2 items-center flex-wrap">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      review.active ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'
                    }`}>
                      {review.active ? 'Activa' : 'Inactiva'}
                    </span>
                    {review.featured && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-[#9867db]/20 text-[#d7baff]">
                        Destacada
                      </span>
                    )}
                    <span className="text-xs text-[#6E6E78]">
                      Orden: {review.sort_order}
                    </span>
                  </div>
                  <span className="text-xs bg-[#1F1F24] text-[#A8A8B0] px-2 py-1 rounded">
                    {sourceLabels[review.source] || review.source}
                  </span>
                </div>
                
                <h3 className="font-bold text-white text-lg mb-1">{review.author_name}</h3>
                
                {review.rating && (
                  <div className="flex gap-0.5 text-[#9867db] mb-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span key={i} className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: i < review.rating! ? "'FILL' 1" : "'FILL' 0" }}>star</span>
                    ))}
                  </div>
                )}
                
                <p className="text-[#A8A8B0] text-sm italic mb-4 line-clamp-4">
                  "{review.review_text}"
                </p>
                
                {review.review_date && (
                  <p className="text-xs text-[#6E6E78] mt-auto">
                    {new Date(review.review_date).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })}
                  </p>
                )}
              </div>
              
              <div className="grid grid-cols-2 border-t border-[#1F1F24] divide-x divide-[#1F1F24]">
                <button 
                  onClick={() => handleToggleActive(review.id, review.active)}
                  disabled={isPending}
                  className="py-3 text-sm text-[#A8A8B0] hover:text-white hover:bg-[#131313] transition-colors disabled:opacity-50"
                >
                  {review.active ? 'Desactivar' : 'Activar'}
                </button>
                <button 
                  onClick={() => handleToggleFeatured(review.id, review.featured)}
                  disabled={isPending}
                  className="py-3 text-sm text-[#A8A8B0] hover:text-white hover:bg-[#131313] transition-colors disabled:opacity-50"
                >
                  {review.featured ? 'Quitar destacado' : 'Destacar'}
                </button>
                <button 
                  onClick={() => handleEdit(review)}
                  disabled={isPending}
                  className="py-3 text-sm text-[#d7baff] hover:bg-[#9867db]/10 transition-colors disabled:opacity-50 border-t border-[#1F1F24]"
                >
                  Editar
                </button>
                <button 
                  onClick={() => setDeletingId(review.id)}
                  disabled={isPending}
                  className="py-3 text-sm text-red-400 hover:bg-red-900/10 transition-colors disabled:opacity-50 border-t border-[#1F1F24]"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <ReviewForm 
          initialData={editingReview} 
          onClose={() => setShowForm(false)} 
        />
      )}

      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0B0B0D] border border-[#1F1F24] rounded-2xl w-full max-w-sm p-6 shadow-2xl text-center">
            <span className="material-symbols-outlined text-4xl text-red-500 mb-2">warning</span>
            <h3 className="text-lg font-bold text-white mb-2">¿Eliminar esta reseña?</h3>
            <p className="text-[#A8A8B0] text-sm mb-6">Esta acción no se puede deshacer.</p>
            <div className="flex gap-3">
              <button 
                onClick={() => setDeletingId(null)}
                disabled={isPending}
                className="flex-1 py-2 rounded border border-[#1F1F24] text-[#A8A8B0] hover:text-white transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button 
                onClick={() => handleDelete(deletingId)}
                disabled={isPending}
                className="flex-1 py-2 rounded bg-red-600 hover:bg-red-500 text-white font-bold transition-colors disabled:opacity-50"
              >
                {isPending ? '...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
