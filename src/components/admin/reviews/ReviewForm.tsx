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

  const inputClass = "w-full bg-[#121217] border border-[#1F1F24] rounded-xl text-white px-4 py-2.5 text-[14px] focus:outline-none focus:border-[#7a32d4]/50 focus:ring-1 focus:ring-[#7a32d4]/50 transition-all placeholder:text-zinc-500"
  const labelClass = "block text-[13px] font-semibold text-zinc-400 mb-1.5"

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#0B0B0E] border border-[#1F1F24] rounded-2xl w-full max-w-xl shadow-2xl my-auto flex flex-col relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-[#7a32d4]"></div>
        <div className="flex justify-between items-center p-5 border-b border-[#1F1F24]">
          <h2 className="text-[16px] font-bold text-white tracking-tight pl-2">
            {initialData ? 'Editar reseña' : 'Nueva reseña'}
          </h2>
          <button 
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center bg-[#121217] hover:bg-[#1F1F24] border border-[#1F1F24] rounded-lg text-zinc-400 hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col">
              <label className={labelClass}>Nombre</label>
              <input 
                type="text" 
                value={authorName}
                onChange={e => setAuthorName(e.target.value)}
                maxLength={100}
                required
                className={inputClass} 
              />
            </div>
            
            <div className="flex flex-col">
              <label className={labelClass}>Reseña</label>
              <textarea 
                value={reviewText}
                onChange={e => setReviewText(e.target.value)}
                maxLength={1000}
                required
                rows={4}
                className={inputClass} 
              />
              <div className="text-right text-[12px] font-medium text-zinc-500 mt-1">
                {reviewText.length}/1000
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col">
                <label className={labelClass}>Origen</label>
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
              
              <div className="flex flex-col">
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
              <div className="flex flex-col">
                <label className={labelClass}>Fecha de la reseña</label>
                <input 
                  type="date" 
                  value={reviewDate}
                  onChange={e => setReviewDate(e.target.value)}
                  className={`${inputClass} [color-scheme:dark]`} 
                />
              </div>
              <div className="flex flex-col">
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

            <div className="flex flex-wrap gap-6 pt-2">
              <label className="flex items-center gap-2 cursor-pointer group">
                <div className="relative">
                  <input 
                    type="checkbox" 
                    checked={featured}
                    onChange={e => setFeatured(e.target.checked)}
                    className="sr-only" 
                  />
                  <div className={`block w-10 h-6 rounded-full transition-colors ${featured ? 'bg-[#7a32d4]' : 'bg-[#1F1F24] group-hover:bg-[#2a2a30]'}`}></div>
                  <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${featured ? 'translate-x-4' : 'translate-x-0'}`}></div>
                </div>
                <span className="text-[13px] font-semibold text-white">Destacada</span>
              </label>
              
              <label className="flex items-center gap-2 cursor-pointer group">
                <div className="relative">
                  <input 
                    type="checkbox" 
                    checked={active}
                    onChange={e => setActive(e.target.checked)}
                    className="sr-only" 
                  />
                  <div className={`block w-10 h-6 rounded-full transition-colors ${active ? 'bg-[#7a32d4]' : 'bg-[#1F1F24] group-hover:bg-[#2a2a30]'}`}></div>
                  <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${active ? 'translate-x-4' : 'translate-x-0'}`}></div>
                </div>
                <span className="text-[13px] font-semibold text-white">Activa</span>
              </label>
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-[13px] font-bold text-center">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-[#7a32d4]/10 border border-[#7a32d4]/20 text-[#d7baff] p-3 rounded-xl text-[13px] font-bold text-center">
              {success}
            </div>
          )}

          <div className="flex gap-3 justify-end pt-4 border-t border-[#1F1F24]">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-5 py-2.5 bg-[#121217] hover:bg-[#1F1F24] border border-[#1F1F24] text-white rounded-xl text-[14px] font-bold transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-5 py-2.5 bg-[#7a32d4]/10 hover:bg-[#7a32d4]/20 border border-[#7a32d4]/30 text-[#d7baff] font-bold text-[14px] rounded-xl transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {isPending && <span className="material-symbols-outlined animate-spin text-[16px]">sync</span>}
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
