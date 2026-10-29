import 'server-only'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export const ADMIN_UUID = process.env.ADMIN_USER_ID || '76320352-4c29-42ad-a105-345e0b5928dd'

export interface AdminAuthVerification {
  isAuthorized: boolean
  user: {
    id: string
    email?: string
  } | null
}

/**
 * Server-only helper to verify admin access for Server Actions and API routes.
 * Does not throw or redirect; returns authorization state.
 */
export async function verifyAdmin(): Promise<AdminAuthVerification> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error || !user || user.id !== ADMIN_UUID) {
      return { isAuthorized: false, user: null }
    }

    return { isAuthorized: true, user }
  } catch (err) {
    console.error('[Admin Auth] Error verifying admin session:', err)
    return { isAuthorized: false, user: null }
  }
}

/**
 * Server-only helper to require admin access on Server Components / Pages.
 * Automatically redirects unauthorized visitors to /admin/login.
 */
export async function requireAdmin() {
  const { isAuthorized, user } = await verifyAdmin()

  if (!isAuthorized || !user) {
    redirect('/admin/login')
  }

  return user
}
