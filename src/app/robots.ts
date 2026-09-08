import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL

  const rules = {
    userAgent: '*',
    allow: '/',
    disallow: ['/admin/', '/admin'],
  }

  if (siteUrl) {
    return {
      rules,
      sitemap: `${siteUrl}/sitemap.xml`,
    }
  }

  return {
    rules,
  }
}
