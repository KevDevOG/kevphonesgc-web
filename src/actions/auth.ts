'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function signInAction(prevState: any, formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Correo o contraseña incorrectos.' }
  }

  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    // Never expose raw Supabase errors
    return { error: 'Correo o contraseña incorrectos.' }
  }

  if (data.user?.id !== '76320352-4c29-42ad-a105-345e0b5928dd') {
    await supabase.auth.signOut()
    return { error: 'Correo o contraseña incorrectos.' }
  }

  // Redirect on success
  redirect('/admin')
}
