'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

const ADMIN_UUID = '76320352-4c29-42ad-a105-345e0b5928dd'

export type ReviewSource = 'wallapop' | 'whatsapp' | 'other'

export type ReviewInput = {
  authorName: string
  reviewText: string
  source: ReviewSource
  rating?: number | null
  reviewDate?: string | null
  featured: boolean
  active: boolean
  sortOrder: number
}

// ----------------------------------------------------------------------
// SHARED HELPERS
// ----------------------------------------------------------------------

async function checkAdminAuth(supabase: any) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.id !== ADMIN_UUID) {
    return false
  }
  return true
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function isValidUUID(uuid: string): boolean {
  return UUID_REGEX.test(uuid)
}

function isValidDateString(dateString: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/
  if (!regex.test(dateString)) return false
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return false
  return date.toISOString().slice(0, 10) === dateString
}

function validateReviewInput(input: ReviewInput) {
  if (!input || typeof input !== 'object') {
    return { error: 'Datos de entrada no válidos.' }
  }

  const authorName = (input.authorName || '').trim()
  if (!authorName) return { error: 'El nombre del cliente es obligatorio.' }
  if (authorName.length > 100) return { error: 'El nombre no puede superar los 100 caracteres.' }

  const reviewText = (input.reviewText || '').trim()
  if (!reviewText) return { error: 'El texto de la reseña es obligatorio.' }
  if (reviewText.length > 1000) return { error: 'La reseña no puede superar los 1000 caracteres.' }

  if (!['wallapop', 'whatsapp', 'other'].includes(input.source)) {
    return { error: 'El origen de la reseña no es válido.' }
  }

  let rating = input.rating === undefined ? null : input.rating
  if (rating !== null) {
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return { error: 'La valoración debe estar entre 1 y 5.' }
    }
  }

  let reviewDate = (input.reviewDate || '').trim() || null
  if (reviewDate !== null) {
    if (!isValidDateString(reviewDate)) {
      return { error: 'La fecha de la reseña no es válida.' }
    }
  }

  if (typeof input.featured !== 'boolean') return { error: 'El estado destacado no es válido.' }
  if (typeof input.active !== 'boolean') return { error: 'El estado activo no es válido.' }

  if (!Number.isInteger(input.sortOrder) || input.sortOrder < 0) {
    return { error: 'El orden no es válido.' }
  }

  return {
    data: {
      author_name: authorName,
      review_text: reviewText,
      source: input.source,
      rating,
      review_date: reviewDate,
      featured: input.featured,
      active: input.active,
      sort_order: input.sortOrder
    }
  }
}

function triggerRevalidation() {
  revalidatePath('/admin/resenas')
  revalidatePath('/')
}

// ----------------------------------------------------------------------
// ACTIONS
// ----------------------------------------------------------------------

export async function createReviewAction(input: ReviewInput) {
  try {
    const supabase = await createClient()

    if (!(await checkAdminAuth(supabase))) {
      return { success: false, error: 'No autorizado' }
    }

    const validation = validateReviewInput(input)
    if (validation.error) {
      return { success: false, error: validation.error }
    }

    const { data, error } = await supabase
      .from('reviews')
      .insert(validation.data!)
      .select('id')
      .single()

    if (error) {
      console.error('Error creating review:', error)
      return { success: false, error: 'No se pudo crear la reseña. Inténtalo de nuevo.' }
    }

    triggerRevalidation()
    return { success: true, reviewId: data.id }
  } catch (err) {
    console.error('Unhandled error in createReviewAction:', err)
    return { success: false, error: 'No se pudo crear la reseña. Inténtalo de nuevo.' }
  }
}

export async function updateReviewAction(reviewId: string, input: ReviewInput) {
  try {
    if (!reviewId || !isValidUUID(reviewId)) {
      return { success: false, error: 'ID de reseña no válido.' }
    }

    const supabase = await createClient()

    if (!(await checkAdminAuth(supabase))) {
      return { success: false, error: 'No autorizado' }
    }

    const validation = validateReviewInput(input)
    if (validation.error) {
      return { success: false, error: validation.error }
    }

    const { data, error } = await supabase
      .from('reviews')
      .update(validation.data!)
      .eq('id', reviewId)
      .select('id')
      .maybeSingle()

    if (error) {
      console.error('Error updating review:', error)
      return { success: false, error: 'No se pudo guardar la reseña. Inténtalo de nuevo.' }
    }

    if (!data) {
      return { success: false, error: 'No se encontró la reseña.' }
    }

    triggerRevalidation()
    return { success: true }
  } catch (err) {
    console.error('Unhandled error in updateReviewAction:', err)
    return { success: false, error: 'No se pudo guardar la reseña. Inténtalo de nuevo.' }
  }
}

export async function deleteReviewAction(reviewId: string) {
  try {
    if (!reviewId || !isValidUUID(reviewId)) {
      return { success: false, error: 'ID de reseña no válido.' }
    }

    const supabase = await createClient()

    if (!(await checkAdminAuth(supabase))) {
      return { success: false, error: 'No autorizado' }
    }

    const { data, error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', reviewId)
      .select('id')
      .maybeSingle()

    if (error) {
      console.error('Error deleting review:', error)
      return { success: false, error: 'No se pudo eliminar la reseña. Inténtalo de nuevo.' }
    }

    if (!data) {
      return { success: false, error: 'No se encontró la reseña.' }
    }

    triggerRevalidation()
    return { success: true }
  } catch (err) {
    console.error('Unhandled error in deleteReviewAction:', err)
    return { success: false, error: 'No se pudo eliminar la reseña. Inténtalo de nuevo.' }
  }
}

export async function toggleReviewActiveAction(reviewId: string, active: boolean) {
  try {
    if (!reviewId || !isValidUUID(reviewId)) {
      return { success: false, error: 'ID de reseña no válido.' }
    }
    if (typeof active !== 'boolean') {
      return { success: false, error: 'El estado activo no es válido.' }
    }

    const supabase = await createClient()

    if (!(await checkAdminAuth(supabase))) {
      return { success: false, error: 'No autorizado' }
    }

    const { data, error } = await supabase
      .from('reviews')
      .update({ active })
      .eq('id', reviewId)
      .select('id')
      .maybeSingle()

    if (error) {
      console.error('Error toggling review active:', error)
      return { success: false, error: 'No se pudo actualizar la reseña. Inténtalo de nuevo.' }
    }

    if (!data) {
      return { success: false, error: 'No se encontró la reseña.' }
    }

    triggerRevalidation()
    return { success: true }
  } catch (err) {
    console.error('Unhandled error in toggleReviewActiveAction:', err)
    return { success: false, error: 'No se pudo actualizar la reseña. Inténtalo de nuevo.' }
  }
}

export async function toggleReviewFeaturedAction(reviewId: string, featured: boolean) {
  try {
    if (!reviewId || !isValidUUID(reviewId)) {
      return { success: false, error: 'ID de reseña no válido.' }
    }
    if (typeof featured !== 'boolean') {
      return { success: false, error: 'El estado destacado no es válido.' }
    }

    const supabase = await createClient()

    if (!(await checkAdminAuth(supabase))) {
      return { success: false, error: 'No autorizado' }
    }

    const { data, error } = await supabase
      .from('reviews')
      .update({ featured })
      .eq('id', reviewId)
      .select('id')
      .maybeSingle()

    if (error) {
      console.error('Error toggling review featured:', error)
      return { success: false, error: 'No se pudo actualizar la reseña. Inténtalo de nuevo.' }
    }

    if (!data) {
      return { success: false, error: 'No se encontró la reseña.' }
    }

    triggerRevalidation()
    return { success: true }
  } catch (err) {
    console.error('Unhandled error in toggleReviewFeaturedAction:', err)
    return { success: false, error: 'No se pudo actualizar la reseña. Inténtalo de nuevo.' }
  }
}
