'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createReviewAction, updateReviewAction, ReviewInput, ReviewSource } from '@/actions/reviews'

export type AdminReview = {
  id: string
  author_name: string
  review_text: string
  source: ReviewSource
  rating: number | null
  review_date: string | null
  featured: boolean
  active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

interface ReviewFormProps {
  initialData?: AdminReview
  onClose: () => void
}

export function ReviewForm({ initialData, onClose }: ReviewFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [authorName, setAuthorName] = useState(initialData?.author_name || '')
  const [reviewText, setReviewText] = useState(initialData?.review_text || '')
  const [source, setSource] = useState<ReviewSource>(initialData?.source || 'wallapop')
  const [rating, setRating] = useState<string>(initialData?.rating ? initialData.rating.toString() : '')
  const [reviewDate, setReviewDate] = useState(initialData?.review_date || '')
  const [featured, setFeatured] = useState(initialData ? initialData.featured : false)
  const [active, setActive] = useState(initialData ? initialData.active : true)
  const [sortOrder, setSortOrder] = useState(initialData?.sort_order?.toString() || '0')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    const parsedRating = rating ? parseInt(rating, 10) : null
    const parsedSortOrder = parseInt(sortOrder, 10)

    const input: ReviewInput = {
      authorName,
      reviewText,
      source,
      rating: parsedRating,
      reviewDate: reviewDate || null,
      featured,
      active,
      sortOrder: isNaN(parsedSortOrder) ? 0 : parsedSortOrder
    }

    startTransition(async () => {
      let result
      if (initialData) {
        result = await updateReviewAction(initialData.id, input)
      } else {
        result = await createReviewAction(input)
      }

      if (result.success) {
        setSuccess(initialData ? 'Reseña actualizada correctamente.' : 'Reseña creada correctamente.')
        router.refresh()
        setTimeout(() => onClose(), 1000)
      } else {
        setError(result.error || 'Error desconocido')
      }
    })
  }

  const inputClass = "w-full bg-[#131313] border border-[#1F1F24] rounded-sm text-[#F7F7F7] p-3 focus:outline-none focus:ring-2 focus:ring-[#9867db]/20 focus:border-[#9867db] transition-all"
  const labelClass = "block text-sm font-semibold text-[#A8A8B0] mb-2"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#0B0B0D] border border-[#1F1F24] rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden my-auto">
        <div className="flex justify-between items-center p-6 border-b border-[#1F1F24]">
          <h2 className="text-xl font-bold text-white">
            {initialData ? 'Editar reseña' : 'Nueva reseña'}
          </h2>
          <button 
            onClick={onClose}
            className="text-[#A8A8B0] hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Nombre del cliente *</label>
              <input 
                type="text" 
                value={authorName}
                onChange={e => setAuthorName(e.target.value)}
                maxLength={100}
                required
                className={inputClass} 
              />
            </div>
            
            <div>
              <label className={labelClass}>Reseña *</label>
              <textarea 
                value={reviewText}
                onChange={e => setReviewText(e.target.value)}
                maxLength={1000}
                required
                rows={4}
                className={inputClass} 
              />
              <div className="text-right text-xs text-[#6E6E78] mt-1">
                {reviewText.length}/1000
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Origen *</label>
                <select 
                  value={source}
                  onChange={e => setSource(e.target.value as ReviewSource)}
                  className={inputClass}
                >
                  <option value="wallapop">Wallapop</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="other">Otro</option>
                </select>
              </div>
              
              <div>
                <label className={labelClass}>Valoración</label>
                <select 
                  value={rating}
                  onChange={e => setRating(e.target.value)}
                  className={inputClass}
                >
                  <option value="">Sin valoración</option>
                  <option value="1">1 Estrella</option>
                  <option value="2">2 Estrellas</option>
                  <option value="3">3 Estrellas</option>
                  <option value="4">4 Estrellas</option>
                  <option value="5">5 Estrellas</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Fecha de la reseña</label>
                <input 
                  type="date" 
                  value={reviewDate}
                  onChange={e => setReviewDate(e.target.value)}
                  className={inputClass} 
                />
              </div>
              <div>
                <label className={labelClass}>Orden</label>
                <input 
                  type="number" 
                  min="0"
                  step="1"
                  value={sortOrder}
                  onChange={e => setSortOrder(e.target.value)}
                  className={inputClass} 
                />
              </div>
            </div>

            <div className="flex gap-6 pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={featured}
                  onChange={e => setFeatured(e.target.checked)}
                  className="rounded border-[#1F1F24] bg-[#131313] text-[#9867db] focus:ring-[#9867db]" 
                />
                <span className="text-sm font-semibold text-white">Destacada</span>
              </label>
              
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={active}
                  onChange={e => setActive(e.target.checked)}
                  className="rounded border-[#1F1F24] bg-[#131313] text-[#9867db] focus:ring-[#9867db]" 
                />
                <span className="text-sm font-semibold text-white">Activa</span>
              </label>
            </div>
          </div>

          {error && (
            <div className="bg-[#93000a]/20 border border-[#93000a] text-[#ffdad6] p-3 rounded text-sm text-center">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-[#143c1a]/20 border border-[#143c1a] text-[#a5f3ad] p-3 rounded text-sm text-center">
              {success}
            </div>
          )}

          <div className="flex gap-3 justify-end pt-4 border-t border-[#1F1F24]">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-4 py-2 text-sm font-semibold text-[#A8A8B0] hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-6 py-2 bg-[#9867db] hover:bg-[#8552c6] text-white font-bold rounded-md transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isPending && <span className="material-symbols-outlined animate-spin text-sm">sync</span>}
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
