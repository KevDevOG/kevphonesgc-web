'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

const ADMIN_UUID = '76320352-4c29-42ad-a105-345e0b5928dd'

export async function updateSaleRequestStatusAction(requestId: string, status: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.id !== ADMIN_UUID) {
    return { error: 'No autorizado' }
  }

  if (status === 'purchased') {
    return { error: 'El estado Comprado solo puede asignarse al convertir la solicitud en una compra.' }
  }

  if (!['new', 'in_progress', 'discarded'].includes(status)) {
    return { error: 'Estado inválido' }
  }

  const { error } = await supabase
    .from('sale_requests')
    .update({ status })
    .eq('id', requestId)

  if (error) {
    console.error('Error updating sale request status:', error)
    return { error: 'No se pudo actualizar el estado de la solicitud. Inténtalo de nuevo.' }
  }

  revalidatePath('/admin/solicitudes')
  revalidatePath(`/admin/solicitudes/${requestId}`)

  return { success: true }
}
