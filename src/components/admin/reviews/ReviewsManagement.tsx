'use client'

import { useState, useTransition } from 'react'
import { AdminReview, ReviewForm } from './ReviewForm'
import { toggleReviewActiveAction, toggleReviewFeaturedAction, deleteReviewAction } from '@/actions/reviews'
import { useRouter } from 'next/navigation'
import { AdminPageHeader } from '@/components/admin/layout/AdminPageHeader'

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
    <div className="flex flex-col gap-6 lg:gap-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <AdminPageHeader 
          title="Reseñas" 
          subtitle="Gestiona las valoraciones que se muestran en la web." 
        />
        <div className="flex shrink-0">
          <button 
            onClick={handleCreate}
            className="w-full sm:w-auto bg-[#7a32d4]/10 hover:bg-[#7a32d4]/20 border border-[#7a32d4]/30 text-[#d7baff] px-5 py-2.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Nueva reseña
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-[#0B0B0E] border border-[#1F1F24] p-5 rounded-2xl flex flex-col justify-between">
          <span className="text-[12px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Total</span>
          <p className="text-3xl font-extrabold text-white tracking-tight">{reviews.length}</p>
        </div>
        <div className="bg-[#0B0B0E] border border-[#1F1F24] p-5 rounded-2xl flex flex-col justify-between">
          <span className="text-[12px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Activas</span>
          <p className="text-3xl font-extrabold text-green-400 tracking-tight">{activeCount}</p>
        </div>
        <div className="bg-[#7a32d4]/5 border border-[#7a32d4]/30 p-5 rounded-2xl flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-[#7a32d4]"></div>
          <span className="text-[12px] font-bold text-[#d7baff] uppercase tracking-wider mb-2">Destacadas</span>
          <p className="text-3xl font-extrabold text-white tracking-tight">{featuredCount}</p>
        </div>
      </div>

      {reviews.length === 0 ? (
        <div className="bg-[#0B0B0E] border border-[#1F1F24] rounded-2xl p-10 flex flex-col items-center justify-center text-center gap-4">
          <span className="material-symbols-outlined text-[48px] text-zinc-700">reviews</span>
          <div className="flex flex-col gap-1 max-w-sm">
            <h3 className="text-[15px] font-bold text-white">Aún no hay reseñas</h3>
            <p className="text-[13px] font-medium text-zinc-500">Puedes añadir valoraciones reales de operaciones para mostrarlas en la web.</p>
          </div>
          <button 
            onClick={handleCreate}
            className="mt-2 bg-[#121217] hover:bg-[#1F1F24] border border-[#1F1F24] text-white px-5 py-2.5 rounded-xl text-[14px] font-bold transition-colors"
          >
            Añadir primera reseña
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {reviews.map(review => (
            <div key={review.id} className="bg-[#0B0B0E] border border-[#1F1F24] rounded-2xl flex flex-col md:flex-row gap-4 p-4 md:p-5 relative overflow-hidden">
              {review.featured && (
                <div className="absolute top-0 left-0 w-1.5 h-full bg-[#7a32d4]"></div>
              )}
              
              <div className="flex-1 flex flex-col gap-3 min-w-0">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex flex-col min-w-0">
                    <h3 className="font-bold text-white text-[15px] truncate">{review.author_name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[12px] font-bold text-zinc-400 bg-[#121217] px-2 py-0.5 rounded-md border border-[#1F1F24]">
                        {sourceLabels[review.source] || review.source}
                      </span>
                      {review.rating && (
                        <div className="flex gap-0.5 text-[#d7baff]">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <span key={i} className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: i < review.rating! ? "'FILL' 1" : "'FILL' 0" }}>star</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                      review.active ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                    }`}>
                      {review.active ? 'Activa' : 'Inactiva'}
                    </span>
                    {review.featured && (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider bg-[#7a32d4]/10 text-[#d7baff] border border-[#7a32d4]/20">
                        Destacada
                      </span>
                    )}
                  </div>
                </div>
                
                <p className="text-zinc-400 text-[13px] font-medium italic line-clamp-3 leading-relaxed">
                  "{review.review_text}"
                </p>
                
                <div className="flex items-center gap-3 mt-auto pt-1">
                  {review.review_date && (
                    <span className="text-[12px] font-medium text-zinc-500 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                      {new Date(review.review_date).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' })}
                    </span>
                  )}
                  <span className="text-[12px] font-medium text-zinc-500 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[14px]">sort</span>
                    Orden: {review.sort_order}
                  </span>
                </div>
              </div>
              
              <div className="flex flex-row md:flex-col items-center md:items-end justify-end gap-2 shrink-0 pt-3 md:pt-0 border-t border-[#1F1F24] md:border-0 md:pl-4 md:border-l">
                <div className="flex gap-2 w-full md:w-auto">
                  <button 
                    onClick={() => handleToggleActive(review.id, review.active)}
                    disabled={isPending}
                    className="flex-1 md:flex-none w-10 h-10 flex items-center justify-center bg-[#121217] hover:bg-[#1F1F24] border border-[#1F1F24] text-zinc-400 hover:text-white rounded-xl transition-colors disabled:opacity-50"
                    title={review.active ? 'Desactivar' : 'Activar'}
                  >
                    <span className="material-symbols-outlined text-[18px]">{review.active ? 'visibility_off' : 'visibility'}</span>
                  </button>
                  <button 
                    onClick={() => handleToggleFeatured(review.id, review.featured)}
                    disabled={isPending}
                    className={`flex-1 md:flex-none w-10 h-10 flex items-center justify-center border rounded-xl transition-colors disabled:opacity-50 ${review.featured ? 'bg-[#7a32d4]/10 border-[#7a32d4]/30 text-[#d7baff] hover:bg-[#7a32d4]/20' : 'bg-[#121217] border-[#1F1F24] text-zinc-400 hover:text-white hover:bg-[#1F1F24]'}`}
                    title={review.featured ? 'Quitar destacado' : 'Destacar'}
                  >
                    <span className="material-symbols-outlined text-[18px]">verified</span>
                  </button>
                  <button 
                    onClick={() => handleEdit(review)}
                    disabled={isPending}
                    className="flex-1 md:flex-none w-10 h-10 flex items-center justify-center bg-[#121217] hover:bg-[#1F1F24] border border-[#1F1F24] text-zinc-400 hover:text-[#d7baff] rounded-xl transition-colors disabled:opacity-50"
                    title="Editar"
                  >
                    <span className="material-symbols-outlined text-[18px]">edit</span>
                  </button>
                  <button 
                    onClick={() => setDeletingId(review.id)}
                    disabled={isPending}
                    className="flex-1 md:flex-none w-10 h-10 flex items-center justify-center bg-[#121217] hover:bg-red-500/10 border border-[#1F1F24] hover:border-red-500/30 text-zinc-400 hover:text-red-400 rounded-xl transition-colors disabled:opacity-50"
                    title="Eliminar"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </div>
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
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
