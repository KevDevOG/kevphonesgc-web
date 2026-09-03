'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateClientAction(clientId: string, formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.id !== '76320352-4c29-42ad-a105-345e0b5928dd') {
    return { success: false, error: 'No autorizado' }
  }

  if (!clientId) {
    return { success: false, error: 'Falta el ID del cliente.' }
  }

  const name = (formData.get('name') as string || '').trim()
  const phone = (formData.get('phone') as string || '').trim()
  const location = (formData.get('location') as string || '').trim()

  if (!name || !phone) {
    return { success: false, error: 'Nombre y teléfono son obligatorios.' }
  }

  // Check if phone already exists in ANOTHER client
  const { data: existingClient, error: checkError } = await supabase
    .from('clients')
    .select('id')
    .eq('phone', phone)
    .neq('id', clientId)
    .maybeSingle()

  if (existingClient) {
    return { success: false, error: 'Ya existe otro cliente con ese teléfono.' }
  }

  const { error: updateError } = await supabase
    .from('clients')
    .update({
      name,
      phone,
      location: location || null
    })
    .eq('id', clientId)

  if (updateError) {
    return { success: false, error: 'No se pudo actualizar el cliente. Inténtalo de nuevo.' }
  }

  revalidatePath('/admin/clientes')
  revalidatePath(`/admin/clientes/${clientId}`)
  revalidatePath('/admin/stock')

  return { success: true }
}

export async function deleteClientAction(clientId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.id !== '76320352-4c29-42ad-a105-345e0b5928dd') {
    return { success: false, error: 'No autorizado' }
  }

  if (!clientId) {
    return { success: false, error: 'Falta el ID del cliente.' }
  }

  // Check for associated sales
  const { data: sales, error: salesError } = await supabase
    .from('sales')
    .select('id')
    .eq('buyer_client_id', clientId)
    .limit(1)

  if (sales && sales.length > 0) {
    return { success: false, error: 'No se puede eliminar este cliente porque tiene operaciones asociadas.' }
  }

  // Check for associated purchases (device.seller_client_id)
  const { data: devices, error: devicesError } = await supabase
    .from('devices')
    .select('id')
    .eq('seller_client_id', clientId)
    .limit(1)

  if (devices && devices.length > 0) {
    return { success: false, error: 'No se puede eliminar este cliente porque tiene operaciones asociadas.' }
  }

  const { error: deleteError } = await supabase
    .from('clients')
    .delete()
    .eq('id', clientId)

  if (deleteError) {
    return { success: false, error: 'No se pudo eliminar el cliente. Inténtalo de nuevo.' }
  }

  revalidatePath('/admin/clientes')
  revalidatePath('/admin')

  return { success: true }
}
