export default function robots() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://roamjet.net'

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/_next/',
          '/static/',
          '/dashboard/',
          '/admin/',
          '/verify-email/',
          '/cart/',
          '/checkout/',
          '/payment-success/',
          '/qr/',
          '/data-usage/',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: [
          '/',
          '/blog/',
          '/esim-plans',
          '/faq',
        ],
        disallow: [
          '/api/',
          '/dashboard/',
          '/admin/',
          '/verify-email/',
          '/cart/',
          '/checkout/',
          '/payment-success/',
          '/qr/',
          '/data-usage/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  }
}
