import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const ADMIN_ID = '76320352-4c29-42ad-a105-345e0b5928dd'
const DEFAULT_TRANSCRIPTION_MODEL = 'gpt-transcribe'
// Conservative: Vercel request bodies are capped at ~4.5 MB.
const MAX_AUDIO_BYTES = 4 * 1024 * 1024
const MAX_TRANSCRIPT_LENGTH = 6000

export const maxDuration = 60

// Declared MIME (without codec parameters) -> file name sent to OpenAI (it infers the format from the extension).
const ALLOWED_AUDIO: Record<string, string> = {
  'audio/webm': 'audio.webm',
  'audio/mp4': 'audio.mp4',
  'audio/m4a': 'audio.m4a',
  'audio/x-m4a': 'audio.m4a',
  'audio/wav': 'audio.wav',
  'audio/x-wav': 'audio.wav',
  'audio/wave': 'audio.wav',
}

const json = (body: Record<string, unknown>, status = 200) =>
  NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } })

/**
 * Admin-only audio transcription. The audio is kept in memory just for the OpenAI request:
 * it is never stored, and neither the audio nor secrets are logged.
 */
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.id !== ADMIN_ID) return json({ error: 'No autorizado' }, 401)

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return json({ error: 'La IA no está configurada: falta la variable de entorno OPENAI_API_KEY.' }, 500)
  }
  const model = process.env.OPENAI_TRANSCRIPTION_MODEL || DEFAULT_TRANSCRIPTION_MODEL

  let audio: FormDataEntryValue | null
  try {
    audio = (await request.formData()).get('audio')
  } catch {
    return json({ error: 'No se pudo leer el audio enviado.' }, 400)
  }

  if (!(audio instanceof File) || audio.size === 0) return json({ error: 'No se recibió ningún audio.' }, 400)
  if (audio.size > MAX_AUDIO_BYTES) {
    return json({ error: 'El audio es demasiado grande (máx. 4 MB). Graba un audio más corto.' }, 413)
  }

  const baseType = audio.type.split(';')[0].trim().toLowerCase()
  const fileName = ALLOWED_AUDIO[baseType]
  if (!fileName) {
    return json({ error: 'Formato de audio no admitido. Usa WEBM, MP4/M4A o WAV.' }, 415)
  }

  try {
    const body = new FormData()
    body.append('file', new File([await audio.arrayBuffer()], fileName, { type: baseType }))
    body.append('model', model)
    body.append('language', 'es')
    body.append('response_format', 'json')
    body.append(
      'prompt',
      'Descripción de uno o varios iPhone en venta: modelo, capacidad, color, batería, ciclos, estado, precios en euros.'
    )

    const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body,
      signal: AbortSignal.timeout(55000),
      cache: 'no-store',
    })

    if (!res.ok) {
      let err: { message?: string; type?: string; code?: string } | null = null
      try {
        const j = await res.json()
        if (j?.error && typeof j.error === 'object') {
          err = {
            message: typeof j.error.message === 'string' ? j.error.message : undefined,
            type: typeof j.error.type === 'string' ? j.error.type : undefined,
            code: typeof j.error.code === 'string' ? j.error.code : undefined,
          }
        }
      } catch {
        // Non-JSON error body
      }
      // Only status/type/code/message: never keys, headers or audio.
      console.error('OpenAI transcription error', { status: res.status, type: err?.type, code: err?.code, message: err?.message })

      if (res.status === 401) return json({ error: 'La clave de OpenAI no es válida o no tiene acceso al proyecto.' }, 502)
      const quota =
        res.status === 429 ||
        err?.code === 'insufficient_quota' ||
        err?.type === 'insufficient_quota' ||
        /quota|credit|billing/i.test(err?.message ?? '')
      if (quota) return json({ error: 'La API de OpenAI ha alcanzado un límite de saldo o uso.' }, 502)
      if (res.status === 400) {
        const safe = (err?.message ?? 'parámetros incompatibles.').replace(/sk-[a-zA-Z0-9_-]+/g, '[REDACTED]').slice(0, 200)
        return json({ error: `OpenAI rechazó la transcripción: ${safe}` }, 502)
      }
      return json({ error: `OpenAI ha devuelto un error (${res.status}).` }, 502)
    }

    const data = await res.json()
    const text = typeof data?.text === 'string' ? data.text.trim().slice(0, MAX_TRANSCRIPT_LENGTH) : ''
    if (!text) return json({ error: 'No se detectó voz en el audio. Inténtalo de nuevo.' }, 422)
    return json({ text })
  } catch (e: any) {
    if (e?.name === 'TimeoutError' || e?.name === 'AbortError') {
      return json({ error: 'Tiempo de espera agotado al transcribir el audio.' }, 504)
    }
    console.error('OpenAI transcription failure', e instanceof Error ? e.message : 'Error desconocido')
    return json({ error: 'No se pudo transcribir el audio. Inténtalo de nuevo.' }, 500)
  }
}
