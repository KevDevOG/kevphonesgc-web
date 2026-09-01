'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function registerDeviceSaleAction(
  deviceId: string,
  formData: FormData
) {
  const supabase = await createClient()

  // Verify auth
  const { data: user } = await supabase.auth.getUser()
  if (!user.user || user.user.id !== '76320352-4c29-42ad-a105-345e0b5928dd') {
    return { success: false, error: 'No autorizado' }
  }

  // Extract form data
  const buyerName = formData.get('buyerName')?.toString().trim()
  const buyerPhone = formData.get('buyerPhone')?.toString().trim()
  const buyerLocation = formData.get('buyerLocation')?.toString().trim() || null
  
  const finalPriceStr = formData.get('finalPrice')?.toString()
  const saleDateStr = formData.get('saleDate')?.toString()
  const saleLocation = formData.get('saleLocation')?.toString().trim() || null
  const observations = formData.get('observations')?.toString().trim() || null

  // Validate
  if (!deviceId) return { success: false, error: 'No se pudo registrar la venta. Inténtalo de nuevo.' }
  if (!buyerName) return { success: false, error: 'No se pudo registrar la venta. Inténtalo de nuevo.' }
  if (!buyerPhone) return { success: false, error: 'No se pudo registrar la venta. Inténtalo de nuevo.' }
  if (!finalPriceStr || isNaN(Number(finalPriceStr)) || Number(finalPriceStr) < 0) {
    return { success: false, error: 'No se pudo registrar la venta. Inténtalo de nuevo.' }
  }
  if (!saleDateStr) return { success: false, error: 'No se pudo registrar la venta. Inténtalo de nuevo.' }

  // RPC Call
  const { data: saleId, error } = await supabase.rpc('register_device_sale', {
    p_device_id: deviceId,
    p_buyer_name: buyerName,
    p_buyer_phone: buyerPhone,
    p_buyer_location: buyerLocation,
    p_final_sale_price: Number(finalPriceStr),
    p_sold_at: saleDateStr,
    p_sale_location: saleLocation,
    p_observations: observations
  })

  if (error) {
    if (error.message.includes('device_not_found') || error.message.includes('device_not_available')) {
      return { success: false, error: 'Este dispositivo ya no está disponible para la venta.' }
    }
    return { success: false, error: 'No se pudo registrar la venta. Inténtalo de nuevo.' }
  }

  revalidatePath('/admin/stock')
  revalidatePath('/admin/stock/' + deviceId)
  revalidatePath('/admin')
  revalidatePath('/')

  return { success: true, deviceId, saleId }
}
