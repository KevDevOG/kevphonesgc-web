'use client'

import { Analytics } from '@vercel/analytics/next'

export function VercelAnalytics() {
  return (
    <Analytics
      beforeSend={(event) => {
        try {
          const url = new URL(event.url, 'http://localhost')
          if (url.pathname.startsWith('/admin')) {
            return null
          }
        } catch {
          if (event.url.includes('/admin')) {
            return null
          }
        }
        return event
      }}
    />
  )
}

