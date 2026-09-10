import 'server-only'

export type SaleRequestEmailPayload = {
  requestId: string
  modelName: string
  storage: string | null
  color: string | null
  estimatedMin: number | null
  estimatedMax: number | null
  customerName: string
  customerLocation: string | null
}

export async function sendSaleRequestAdminNotification(payload: SaleRequestEmailPayload) {
  try {
    const resendApiKey = process.env.RESEND_API_KEY
    const toEmail = process.env.SALE_REQUEST_NOTIFICATION_EMAIL
    const fromEmail = process.env.RESEND_FROM_EMAIL
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL

    if (!resendApiKey || !toEmail || !fromEmail || !siteUrl) {
      console.error('Missing required environment variables for sale request email notification.')
      return
    }

    const formatMoney = (amount: number) =>
      new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount)

    const deviceDesc = [payload.modelName, payload.storage, payload.color].filter(Boolean).join(' · ')
    const valuation =
      payload.estimatedMin !== null && payload.estimatedMax !== null
        ? `${formatMoney(payload.estimatedMin)} – ${formatMoney(payload.estimatedMax)}`
        : 'Sin estimación'

    const customerLocationText = payload.customerLocation ? `\nUbicación: ${payload.customerLocation}` : ''
    const ctaUrl = `${siteUrl}/admin/solicitudes/${payload.requestId}`

    const textContent = `
Nueva solicitud de venta

Dispositivo: ${deviceDesc}
Cliente: ${payload.customerName}${customerLocationText}
Valoración: ${valuation}

Ver solicitud: ${ctaUrl}
`

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .container { background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px; }
            h1 { font-size: 20px; font-weight: 600; margin-top: 0; margin-bottom: 20px; color: #111827; border-bottom: 1px solid #e5e7eb; padding-bottom: 12px; }
            .field { margin-bottom: 16px; }
            .label { font-size: 13px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }
            .value { font-size: 16px; font-weight: 500; color: #111827; }
            .cta-container { margin-top: 32px; text-align: center; }
            .cta-button { display: inline-block; background-color: #7a32d4; color: #ffffff; text-decoration: none; font-weight: 600; padding: 12px 24px; border-radius: 6px; font-size: 15px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Nueva solicitud de venta</h1>
            
            <div class="field">
              <div class="label">Dispositivo</div>
              <div class="value">${deviceDesc}</div>
            </div>

            <div class="field">
              <div class="label">Cliente</div>
              <div class="value">${payload.customerName}</div>
              ${payload.customerLocation ? `<div class="value" style="font-size: 14px; color: #4b5563; margin-top: 2px;">${payload.customerLocation}</div>` : ''}
            </div>

            <div class="field">
              <div class="label">Valoración</div>
              <div class="value">${valuation}</div>
            </div>

            <div class="cta-container">
              <a href="${ctaUrl}" class="cta-button">Ver solicitud</a>
            </div>
          </div>
        </body>
      </html>
    `

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [toEmail],
        subject: `Nueva solicitud de venta — ${payload.modelName}`,
        text: textContent.trim(),
        html: htmlContent
      })
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error(`Resend API error (${response.status}):`, errText)
    }

  } catch (err) {
    console.error('Error sending sale request notification:', err)
  }
}
