'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function upsertModelCatalogImageAction(modelId: string, color: string, storagePath: string) {
  const supabase = await createClient()
  
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user || userData.user.id !== '76320352-4c29-42ad-a105-345e0b5928dd') {
    return { success: false, error: 'No autorizado.' }
  }

  if (!modelId || typeof modelId !== 'string' || !modelId.trim()) {
    return { success: false, error: 'ID de modelo inválido.' }
  }

  if (!color || typeof color !== 'string' || !color.trim()) {
    return { success: false, error: 'Color inválido.' }
  }

  if (!storagePath || typeof storagePath !== 'string' || !storagePath.trim()) {
    return { success: false, error: 'Ruta de imagen inválida.' }
  }

  const cleanModelId = modelId.trim()
  const cleanColor = color.trim()
  const cleanPath = storagePath.trim()

  // Verify model exists and active
  const { data: modelData, error: modelError } = await supabase
    .from('device_models')
    .select('id, active')
    .eq('id', cleanModelId)
    .single()

  if (modelError || !modelData || !modelData.active) {
    return { success: false, error: 'El modelo no existe o no está activo.' }
  }

  // Verify color exists and active
  const { data: colorData, error: colorError } = await supabase
    .from('device_model_variants')
    .select('value, active')
    .eq('model_id', cleanModelId)
    .eq('variant_type', 'color')
    .eq('value', cleanColor)
    .single()

  if (colorError || !colorData || !colorData.active) {
    return { success: false, error: 'El color no es válido o no está activo para este modelo.' }
  }

  // Check if mapping exists to return previous path
  const { data: existingData } = await supabase
    .from('device_model_catalog_images')
    .select('storage_path')
    .eq('model_id', cleanModelId)
    .eq('color', cleanColor)
    .maybeSingle()

  const previousPath = existingData?.storage_path || null

  // Upsert mapping
  const { error: upsertError } = await supabase
    .from('device_model_catalog_images')
    .upsert(
      {
        model_id: cleanModelId,
        color: cleanColor,
        storage_path: cleanPath
      },
      {
        onConflict: 'model_id, color'
      }
    )

  if (upsertError) {
    console.error('Error upserting model catalog image:', upsertError)
    return { success: false, error: 'No se pudo guardar la imagen del catálogo. Inténtalo de nuevo.' }
  }

  revalidatePath('/admin/modelos')

  return { 
    success: true, 
    previousPath 
  }
}

export async function deleteModelCatalogImageAction(modelId: string, color: string) {
  const supabase = await createClient()
  
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user || userData.user.id !== '76320352-4c29-42ad-a105-345e0b5928dd') {
    return { success: false, error: 'No autorizado.' }
  }

  if (!modelId || typeof modelId !== 'string' || !modelId.trim()) {
    return { success: false, error: 'ID de modelo inválido.' }
  }

  if (!color || typeof color !== 'string' || !color.trim()) {
    return { success: false, error: 'Color inválido.' }
  }

  const cleanModelId = modelId.trim()
  const cleanColor = color.trim()

  // Get current mapping
  const { data: existingData, error: selectError } = await supabase
    .from('device_model_catalog_images')
    .select('storage_path')
    .eq('model_id', cleanModelId)
    .eq('color', cleanColor)
    .single()

  if (selectError || !existingData) {
    return { success: false, error: 'La imagen no existe o ya fue eliminada.' }
  }

  // Delete mapping
  const { error: deleteError } = await supabase
    .from('device_model_catalog_images')
    .delete()
    .eq('model_id', cleanModelId)
    .eq('color', cleanColor)

  if (deleteError) {
    console.error('Error deleting model catalog image mapping:', deleteError)
    return { success: false, error: 'No se pudo eliminar el registro. Inténtalo de nuevo.' }
  }

  revalidatePath('/admin/modelos')

  return {
    success: true,
    deletedPath: existingData.storage_path
  }
}
