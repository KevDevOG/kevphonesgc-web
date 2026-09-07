import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ReviewsManagement } from '@/components/admin/reviews/ReviewsManagement'
import { AdminReview } from '@/components/admin/reviews/ReviewForm'
import { AdminPageShell } from '@/components/admin/layout/AdminPageShell'

export const dynamic = 'force-dynamic'

const ADMIN_UUID = '76320352-4c29-42ad-a105-345e0b5928dd'

export default async function AdminReviewsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.id !== ADMIN_UUID) {
    redirect('/admin/login')
  }

  let reviews: AdminReview[] = []
  let errorMsg: string | null = null

  try {
    const { data, error } = await supabase
      .from('reviews')
      .select(`
        id,
        author_name,
        review_text,
        source,
        rating,
        review_date,
        featured,
        active,
        sort_order,
        created_at,
        updated_at
      `)
      .order('featured', { ascending: false })
      .order('sort_order', { ascending: true })
      .order('review_date', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error loading reviews:', error)
      errorMsg = 'Ocurrió un error técnico al cargar las reseñas.'
    } else {
      reviews = data || []
    }
  } catch (err) {
    console.error('Unhandled error loading reviews:', err)
    errorMsg = 'Ocurrió un error inesperado al cargar las reseñas.'
  }

  return (
    <AdminPageShell>
      <div className="w-full max-w-6xl mx-auto pb-24">
        {errorMsg ? (
          <div className="bg-[#93000a]/20 border border-[#93000a] text-[#ffdad6] p-4 rounded-xl text-center">
            {errorMsg}
          </div>
        ) : (
          <ReviewsManagement reviews={reviews} />
        )}
      </div>
    </AdminPageShell>
  )
}
