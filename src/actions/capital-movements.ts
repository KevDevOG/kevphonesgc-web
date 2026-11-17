'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import crypto from 'crypto'

const ADMIN_USER_ID = '76320352-4c29-42ad-a105-345e0b5928dd'

// Withdrawal receipts (documentation only, never affects accounting).
const RECEIPTS_BUCKET = 'capital-movement-receipts'
const RECEIPT_MAX_BYTES = 10 * 1024 * 1024
const RECEIPT_SIGNED_URL_TTL_SECONDS = 60
const RECEIPT_ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'])
const UPLOAD_ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
const MOVEMENT_ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>

type DetectedImage = { ext: 'jpg' | 'png' | 'webp' | 'heic' | 'heif'; mime: string }

function ascii(bytes: Uint8Array, start: number, end: number) {
  return String.fromCharCode(...bytes.subarray(start, end))
}

/** Detects the real image format from the file signature (never trusts the client MIME type). */
function detectReceiptImage(bytes: Uint8Array): DetectedImage | null {
  if (bytes.length < 12) return null

  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return { ext: 'jpg', mime: 'image/jpeg' }
  }

  const pngSignature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
  if (pngSignature.every((b, i) => bytes[i] === b)) {
    return { ext: 'png', mime: 'image/png' }
  }

  if (ascii(bytes, 0, 4) === 'RIFF' && ascii(bytes, 8, 12) === 'WEBP') {
    return { ext: 'webp', mime: 'image/webp' }
  }

  if (ascii(bytes, 4, 8) === 'ftyp') {
    const brand = ascii(bytes, 8, 12)
    if (['heic', 'heix', 'hevc', 'hevx', 'heim', 'heis'].includes(brand)) {
      return { ext: 'heic', mime: 'image/heic' }
    }
    if (brand === 'mif1' || brand === 'msf1') {
      return { ext: 'heif', mime: 'image/heif' }
    }
  }

  return null
}

async function isAdmin(supabase: SupabaseServerClient) {
  const { data: { user } } = await supabase.auth.getUser()
  return !!user && user.id === ADMIN_USER_ID
}

/**
 * Validates the temporarily uploaded receipt by its real bytes and stores it
 * under a server-generated path. The temporary object is always removed.
 */
async function storeWithdrawalReceipt(
  supabase: SupabaseServerClient,
  uploadId: string
): Promise<{ path: string } | { error: string }> {
  const bucket = supabase.storage.from(RECEIPTS_BUCKET)
  const pendingPath = `pending/${uploadId}`

  try {
    const { data: blob, error: downloadError } = await bucket.download(pendingPath)
    if (downloadError || !blob) {
      return { error: 'No se encontró el justificante subido. Selecciona la imagen de nuevo.' }
    }

    if (blob.size > RECEIPT_MAX_BYTES) {
      return { error: 'La imagen supera el tamaño máximo de 10 MB.' }
    }

    const bytes = new Uint8Array(await blob.arrayBuffer())
    const detected = detectReceiptImage(bytes)
    if (!detected) {
      return { error: 'Formato no válido. Usa una imagen JPG, PNG, WebP o HEIC.' }
    }

    const finalPath = `withdrawals/${crypto.randomUUID()}.${detected.ext}`
    const { error: uploadError } = await bucket.upload(finalPath, bytes, {
      contentType: detected.mime,
      upsert: false,
    })

    if (uploadError) {
      return { error: 'No se pudo guardar el justificante. Inténtalo de nuevo.' }
    }

    return { path: finalPath }
  } finally {
    await bucket.remove([pendingPath])
  }
}

/**
 * Issues a one-time signed upload for a withdrawal receipt. The path is
 * generated here; the client only receives an opaque upload id.
 */
export async function createWithdrawalReceiptUpload(input: { fileSize: number; fileType: string }) {
  const supabase = await createClient()

  if (!(await isAdmin(supabase))) {
    return { error: 'No autorizado' }
  }

  if (!input || typeof input !== 'object') {
    return { error: 'Imagen no válida.' }
  }

  const { fileSize, fileType } = input

  if (typeof fileSize !== 'number' || !Number.isFinite(fileSize) || fileSize <= 0) {
    return { error: 'Imagen no válida.' }
  }

  if (fileSize > RECEIPT_MAX_BYTES) {
    return { error: 'La imagen supera el tamaño máximo de 10 MB.' }
  }

  if (typeof fileType !== 'string' || !RECEIPT_ALLOWED_MIME_TYPES.has(fileType.toLowerCase())) {
    return { error: 'Formato no válido. Usa una imagen JPG, PNG, WebP o HEIC.' }
  }

  const uploadId = crypto.randomUUID()
  const { data, error } = await supabase.storage
    .from(RECEIPTS_BUCKET)
    .createSignedUploadUrl(`pending/${uploadId}`)

  if (error || !data) {
    return { error: 'No se pudo preparar la subida del justificante. Inténtalo de nuevo.' }
  }

  return { uploadId, path: data.path, token: data.token }
}

/** Returns a short-lived signed URL for a withdrawal receipt (Admin only). */
export async function getCapitalMovementReceiptUrl(movementId: string) {
  const supabase = await createClient()

  if (!(await isAdmin(supabase))) {
    return { error: 'No autorizado' }
  }

  if (typeof movementId !== 'string' || !MOVEMENT_ID_RE.test(movementId)) {
    return { error: 'Movimiento no válido.' }
  }

  const { data: movement } = await supabase
    .from('capital_movements')
    .select('id, movement_type, receipt_path')
    .eq('id', movementId)
    .maybeSingle()

  if (!movement || movement.movement_type !== 'withdrawal' || !movement.receipt_path) {
    return { error: 'Este movimiento no tiene justificante.' }
  }

  const { data, error } = await supabase.storage
    .from(RECEIPTS_BUCKET)
    .createSignedUrl(movement.receipt_path, RECEIPT_SIGNED_URL_TTL_SECONDS)

  if (error || !data?.signedUrl) {
    return { error: 'No se pudo abrir el justificante. Inténtalo de nuevo.' }
  }

  return { url: data.signedUrl }
}

export async function registerCapitalMovement(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.id !== '76320352-4c29-42ad-a105-345e0b5928dd') {
    return { error: 'No autorizado' }
  }

  const movementType = formData.get('movement_type') as string
  const amountStr = formData.get('amount') as string
  const movementDate = formData.get('movement_date') as string
  const note = (formData.get('note') as string || '').trim()

  // Optional receipt (withdrawals only). The client sends only the opaque
  // upload id; the storage path is always generated on the server.
  const receiptUploadIdRaw = formData.get('receipt_upload_id')
  const receiptUploadId = typeof receiptUploadIdRaw === 'string' ? receiptUploadIdRaw.trim() : ''
  const hasValidReceiptUpload = UPLOAD_ID_RE.test(receiptUploadId)

  // Rejects the movement and discards the temporary receipt upload, if any.
  const reject = async (message: string) => {
    if (hasValidReceiptUpload) {
      await supabase.storage.from(RECEIPTS_BUCKET).remove([`pending/${receiptUploadId}`])
    }
    return { error: message }
  }

  if (!movementType || !amountStr || !movementDate) {
    return reject('Faltan campos obligatorios.')
  }

  if (movementType !== 'contribution' && movementType !== 'withdrawal' && movementType !== 'adjustment') {
    return reject('Tipo de movimiento no válido.')
  }

  const amount = parseFloat(amountStr)
  if (isNaN(amount)) {
    return reject('El importe debe ser un número válido.')
  }

  if ((movementType === 'contribution' || movementType === 'withdrawal') && amount <= 0) {
    return reject('El importe debe ser mayor que 0 para este tipo de movimiento.')
  }

  if (movementType === 'adjustment' && amount === 0) {
    return reject('El importe del ajuste no puede ser 0.')
  }

  let receiptPath: string | null = null

  if (receiptUploadId) {
    if (!hasValidReceiptUpload) {
      return { error: 'Justificante no válido.' }
    }

    if (movementType !== 'withdrawal') {
      return reject('Solo las retiradas pueden llevar justificante.')
    }

    const stored = await storeWithdrawalReceipt(supabase, receiptUploadId)
    if ('error' in stored) {
      return { error: stored.error }
    }
    receiptPath = stored.path
  }

  const { error } = await supabase
    .from('capital_movements')
    .insert({
      movement_type: movementType,
      amount,
      movement_date: movementDate,
      note: note || null,
      ...(receiptPath ? { receipt_path: receiptPath } : {})
    })

  if (error) {
    if (receiptPath) {
      await supabase.storage.from(RECEIPTS_BUCKET).remove([receiptPath])
    }
    return { error: 'No se pudo registrar el movimiento. Inténtalo de nuevo.' }
  }

  revalidatePath('/admin/movimientos')
  revalidatePath('/admin/finanzas')
  revalidatePath('/admin')
  
  return { success: true }
}

export async function editCapitalMovement(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.id !== '76320352-4c29-42ad-a105-345e0b5928dd') {
    return { error: 'No autorizado' }
  }

  const id = formData.get('id') as string
  const movementType = formData.get('movement_type') as string
  const amountStr = formData.get('amount') as string
  const movementDate = formData.get('movement_date') as string
  const note = (formData.get('note') as string || '').trim()

  if (!id || !movementType || !amountStr || !movementDate) {
    return { error: 'Faltan campos obligatorios.' }
  }

  const { data: movement } = await supabase
    .from('capital_movements')
    .select('*')
    .eq('id', id)
    .single()

  if (!movement) {
    return { error: 'Movimiento no encontrado.' }
  }

  if (movement.receipt_path && movementType !== 'withdrawal') {
    return { error: 'Este movimiento tiene un justificante adjunto y debe seguir siendo una retirada.' }
  }

  const { data: recon } = await supabase
    .from('cash_reconciliations')
    .select('id')
    .eq('adjustment_movement_id', id)
    .single()

  if (recon) {
    return { error: 'Este movimiento pertenece a una conciliación y no puede editarse.' }
  }

  if (movementType !== 'contribution' && movementType !== 'withdrawal' && movementType !== 'adjustment') {
    return { error: 'Tipo de movimiento no válido.' }
  }

  const amount = parseFloat(amountStr)
  if (isNaN(amount)) {
    return { error: 'El importe debe ser un número válido.' }
  }

  if ((movementType === 'contribution' || movementType === 'withdrawal') && amount <= 0) {
    return { error: 'El importe debe ser mayor que 0 para este tipo de movimiento.' }
  }

  if (movementType === 'adjustment' && amount === 0) {
    return { error: 'El importe del ajuste no puede ser 0.' }
  }

  const { error } = await supabase
    .from('capital_movements')
    .update({
      movement_type: movementType,
      amount,
      movement_date: movementDate,
      note: note || null
    })
    .eq('id', id)

  if (error) {
    return { error: 'No se pudo actualizar el movimiento. Inténtalo de nuevo.' }
  }

  revalidatePath('/admin/movimientos')
  revalidatePath('/admin/finanzas')
  revalidatePath('/admin')
  
  return { success: true }
}

export async function deleteCapitalMovement(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.id !== '76320352-4c29-42ad-a105-345e0b5928dd') {
    return { error: 'No autorizado' }
  }

  const id = formData.get('id') as string

  if (!id) {
    return { error: 'ID de movimiento no proporcionado.' }
  }

  const { data: movement } = await supabase
    .from('capital_movements')
    .select('*')
    .eq('id', id)
    .single()

  if (!movement) {
    return { error: 'Movimiento no encontrado.' }
  }

  const { data: recon } = await supabase
    .from('cash_reconciliations')
    .select('id')
    .eq('adjustment_movement_id', id)
    .single()

  if (recon) {
    return { error: 'Este movimiento pertenece a una conciliación y no puede eliminarse.' }
  }

  const { error } = await supabase
    .from('capital_movements')
    .delete()
    .eq('id', id)

  if (error) {
    return { error: 'No se pudo eliminar el movimiento. Inténtalo de nuevo.' }
  }

  // Best-effort cleanup of the receipt once the movement no longer exists.
  if (movement.receipt_path) {
    await supabase.storage.from(RECEIPTS_BUCKET).remove([movement.receipt_path])
  }

  revalidatePath('/admin/movimientos')
  revalidatePath('/admin/finanzas')
  revalidatePath('/admin')
  
  return { success: true }
}
