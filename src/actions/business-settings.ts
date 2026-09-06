'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

const ADMIN_UUID = '76320352-4c29-42ad-a105-345e0b5928dd'

export type UpdateBusinessSettingsInput = {
  businessName: string
  whatsappPhone?: string | null
  instagramUrl?: string | null
  tiktokUrl?: string | null
  wallapopUrl?: string | null
  contactEnabled: boolean
  shippingText?: string | null
  heroTitle?: string | null
  heroSubtitle?: string | null
}

export async function updateBusinessSettingsAction(input: UpdateBusinessSettingsInput) {
  try {
    const supabase = await createClient()

    // 1. AUTH
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.id !== ADMIN_UUID) {
      return { success: false, error: 'No autorizado' }
    }

    if (!input || typeof input !== 'object') {
      return { success: false, error: 'Datos de configuración no válidos.' }
    }

    // 2. VALIDATION
    const trimNull = (v: any) => (typeof v === 'string' && v.trim() !== '') ? v.trim() : null

    const businessName = trimNull(input.businessName)
    if (!businessName) {
      return { success: false, error: 'El nombre del negocio es obligatorio.' }
    }
    if (businessName.length > 100) {
      return { success: false, error: 'El nombre del negocio no puede exceder 100 caracteres.' }
    }

    const whatsappPhone = trimNull(input.whatsappPhone)
    if (whatsappPhone) {
      if (!/^\d+$/.test(whatsappPhone)) {
        return { success: false, error: 'El número de WhatsApp no es válido.' }
      }
      if (whatsappPhone.length < 8 || whatsappPhone.length > 15) {
        return { success: false, error: 'El número de WhatsApp no es válido.' }
      }
    }

    const instagramUrl = trimNull(input.instagramUrl)
    if (instagramUrl) {
      try {
        new URL(instagramUrl)
        if (!/^https?:\/\//i.test(instagramUrl)) {
          return { success: false, error: 'La URL de Instagram no es válida.' }
        }
      } catch (e) {
        return { success: false, error: 'La URL de Instagram no es válida.' }
      }
    }

    const tiktokUrl = trimNull(input.tiktokUrl)
    if (tiktokUrl) {
      try {
        new URL(tiktokUrl)
        if (!/^https?:\/\//i.test(tiktokUrl)) {
          return { success: false, error: 'La URL de TikTok no es válida.' }
        }
      } catch (e) {
        return { success: false, error: 'La URL de TikTok no es válida.' }
      }
    }

    const wallapopUrl = trimNull(input.wallapopUrl)
    if (wallapopUrl) {
      try {
        new URL(wallapopUrl)
        if (!/^https?:\/\//i.test(wallapopUrl)) {
          return { success: false, error: 'La URL de Wallapop no es válida.' }
        }
        if (wallapopUrl.length > 500) {
          return { success: false, error: 'La URL de Wallapop no puede exceder 500 caracteres.' }
        }
      } catch (e) {
        return { success: false, error: 'La URL de Wallapop no es válida.' }
      }
    }

    if (typeof input.contactEnabled !== 'boolean') {
      return { success: false, error: 'El estado de contacto debe ser verdadero o falso.' }
    }

    const shippingText = trimNull(input.shippingText)
    if (shippingText && shippingText.length > 500) {
      return { success: false, error: 'El texto de envíos no puede exceder 500 caracteres.' }
    }

    const heroTitle = trimNull(input.heroTitle)
    if (heroTitle && heroTitle.length > 150) {
      return { success: false, error: 'El título principal no puede exceder 150 caracteres.' }
    }

    const heroSubtitle = trimNull(input.heroSubtitle)
    if (heroSubtitle && heroSubtitle.length > 300) {
      return { success: false, error: 'El subtítulo principal no puede exceder 300 caracteres.' }
    }

    // 3. DATABASE UPDATE
    const { data, error } = await supabase
      .from('business_settings')
      .update({
        business_name: businessName,
        whatsapp_phone: whatsappPhone,
        instagram_url: instagramUrl,
        tiktok_url: tiktokUrl,
        wallapop_url: wallapopUrl,
        contact_enabled: input.contactEnabled,
        shipping_text: shippingText,
        hero_title: heroTitle,
        hero_subtitle: heroSubtitle
      })
      .eq('singleton', true)
      .select()

    if (error) {
      console.error('Error updating business_settings:', error)
      return { success: false, error: 'No se pudo guardar la configuración. Inténtalo de nuevo.' }
    }

    if (!data || data.length === 0) {
      return { success: false, error: 'No se encontró la configuración del negocio.' }
    }

    // 4. REVALIDATION
    revalidatePath('/admin/configuracion')
    revalidatePath('/')

    return { success: true }
  } catch (err) {
    console.error('Unhandled error in updateBusinessSettingsAction:', err)
    return { success: false, error: 'No se pudo guardar la configuración. Inténtalo de nuevo.' }
  }
}
