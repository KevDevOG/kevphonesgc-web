'use server'

import { createClient } from '@/lib/supabase/server'
import { fetchStoryData, type StoryData } from '@/lib/story/story-data'

export async function loadStoryDataAction(
  deviceId: string
): Promise<{ data: StoryData; error?: undefined } | { error: string; data?: undefined }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.id !== '76320352-4c29-42ad-a105-345e0b5928dd') {
    return { error: 'No autorizado' }
  }
  if (!deviceId) return { error: 'Dispositivo no válido.' }

  const data = await fetchStoryData(deviceId)
  if (!data) return { error: 'No se pudieron cargar los datos del dispositivo.' }
  return { data }
}
