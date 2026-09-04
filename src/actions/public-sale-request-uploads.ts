'use server'

import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import crypto from 'crypto'

export type CreateSessionInput = {
  customerPhone: string
  category: string
}

export type UploadTarget = {
  photoType: string
  path: string
  token: string
}

export type CreateSessionResponse = {
  success: boolean
  sessionId?: string
  expiresInSeconds?: number
  requiredUploads?: UploadTarget[]
  optionalUploads?: UploadTarget[]
  error?: string
}

export async function createSaleRequestUploadSessionAction(
  input: CreateSessionInput
): Promise<CreateSessionResponse> {
  const { customerPhone, category } = input

  if (!customerPhone || typeof customerPhone !== 'string') {
    return { success: false, error: 'Teléfono no válido.' }
  }

  const normalizedPhone = customerPhone.trim().replace(/[\s\-()]/g, '')
  if (!/^\+?[0-9]{6,15}$/.test(normalizedPhone)) {
    return { success: false, error: 'Teléfono no válido.' }
  }

  if (!category || typeof category !== 'string') {
    return { success: false, error: 'Categoría no válida.' }
  }

  const validCategories = ['iphone', 'ps5', 'nintendo_switch']
  if (!validCategories.includes(category)) {
    return { success: false, error: 'Categoría no válida.' }
  }

  // Current category support limitation
  if (category === 'ps5' || category === 'nintendo_switch') {
    return {
      success: false,
      error: 'La subida guiada de fotos para esta categoría todavía no está disponible.'
    }
  }

  try {
    const adminClient = createSupabaseAdminClient()

    // Create temporary session via RPC
    const { data: sessionId, error: rpcError } = await adminClient.rpc(
      'create_sale_request_upload_session',
      {
        p_customer_phone: normalizedPhone,
        p_category: category,
      }
    )

  if (rpcError || !sessionId) {
    if (rpcError?.message?.includes('reciente con este teléfono')) {
      return {
        success: false,
        error: 'Ya existe una sesión reciente. Espera un momento antes de intentarlo de nuevo.',
      }
    }
    return {
      success: false,
      error: 'No se pudo preparar la subida de fotos. Inténtalo de nuevo.',
    }
  }

  const bucket = 'sale-request-images'

  const requiredPhotoTypes = [
    'front_off',
    'front_on',
    'back',
    'right_side',
    'left_side',
    'top',
    'bottom'
  ]

  const requiredUploads: UploadTarget[] = []
  const optionalUploads: UploadTarget[] = []

  let hasError = false

  // Generate required targets
  for (const photoType of requiredPhotoTypes) {
    const path = `${sessionId}/${photoType}/${crypto.randomUUID()}`
    const { data, error } = await adminClient.storage
      .from(bucket)
      .createSignedUploadUrl(path)

    if (error || !data) {
      hasError = true
      break
    }

    requiredUploads.push({
      photoType,
      path: data.path,
      token: data.token,
    })
  }

  // Generate optional extra targets
  if (!hasError) {
    for (let i = 0; i < 3; i++) {
      const path = `${sessionId}/extra/${crypto.randomUUID()}`
      const { data, error } = await adminClient.storage
        .from(bucket)
        .createSignedUploadUrl(path)

      if (error || !data) {
        hasError = true
        break
      }

      optionalUploads.push({
        photoType: 'extra',
        path: data.path,
        token: data.token,
      })
    }
  }

    // If any generation failed, abort and return generic error
    if (hasError) {
      // Storage objects don't actually exist until uploaded, so no bucket cleanup needed here.
      return {
        success: false,
        error: 'No se pudo preparar la subida de fotos. Inténtalo de nuevo.',
      }
    }

    return {
      success: true,
      sessionId,
      expiresInSeconds: 7200, // 2 hours
      requiredUploads,
      optionalUploads,
    }
  } catch (err) {
    return {
      success: false,
      error: 'No se pudo preparar la subida de fotos. Inténtalo de nuevo.',
    }
  }
}
