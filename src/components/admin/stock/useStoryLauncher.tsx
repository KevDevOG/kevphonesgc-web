'use client'

import { useState } from 'react'
import { loadStoryDataAction } from '@/actions/story'
import { StoryGeneratorModal } from '@/components/admin/stock/StoryGeneratorModal'
import type { StoryData } from '@/lib/story/story-data'
import type { StoryTemplate } from '@/lib/story/story-renderer'

/**
 * Loads Story data for a device and opens the existing StoryGeneratorModal.
 * Render `modal` somewhere in the component tree.
 */
export function useStoryLauncher() {
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [data, setData] = useState<StoryData | null>(null)
  const [initialTemplate, setInitialTemplate] = useState<StoryTemplate>('disponible')

  const open = async (deviceId: string, defaultTemplate: StoryTemplate = 'disponible') => {
    if (loadingId) return
    setLoadingId(deviceId)
    setInitialTemplate(defaultTemplate)
    setError('')
    try {
      const result = await loadStoryDataAction(deviceId)
      if (result.error !== undefined) {
        setError(result.error)
        return
      }
      setData(result.data)
    } catch {
      setError('No se pudo preparar el Story. Inténtalo de nuevo.')
    } finally {
      setLoadingId(null)
    }
  }

  const modal = data ? (
    <StoryGeneratorModal
      key={data.device.id}
      device={data.device}
      catalogImages={data.catalogImages}
      defaultTemplate={initialTemplate}
      isOpen
      onClose={() => setData(null)}
    />
  ) : null

  return { open, loadingId, error, modal }
}
