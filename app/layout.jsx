import Providers from '../src/components/Providers'
import ConditionalNavbar from '../src/components/ConditionalNavbar'
import ConditionalFooter from '../src/components/ConditionalFooter'
import CookieConsent from '../src/components/CookieConsent'
import LanguageWrapper from '../src/components/LanguageWrapper'
import './globals.css'
import './rtl.css'

export const metadata = {
  title: {
    default: 'Roam Jet Plans - Global Data Connectivity',
    template: '%s | Roam Jet Plans'
  },
  description: 'Get affordable eSIM data plans for 200+ countries. Instant activation, no physical SIM needed. Perfect for travelers and international connectivity.',
  keywords: ['eSIM', 'data plans', 'international roaming', 'travel internet', 'global connectivity', 'mobile data'],
  authors: [{ name: 'Roam Jet Plans Team' }],
  creator: 'eSIM Plans',
  publisher: 'eSIM Plans',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://esimplans.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    title: 'Roam Jet Plans - Global Data Connectivity',
    description: 'Get affordable eSIM data plans for 200+ countries. Instant activation, no physical SIM needed.',
    siteName: 'eSIM Plans',
    images: [
      {
        url: '/images/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'eSIM Plans - Global Data Connectivity',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Roam Jet Plans - Global Data Connectivity',
    description: 'Get affordable eSIM data plans for 200+ countries. Instant activation, no physical SIM needed.',
    images: ['/images/twitter-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION,
    yandex: process.env.NEXT_PUBLIC_YANDEX_VERIFICATION,
    yahoo: process.env.NEXT_PUBLIC_YAHOO_VERIFICATION,
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* Google tag (gtag.js) */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=AW-17231669358"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'AW-17231669358');
            `,
          }}
        />
        <link rel="manifest" href="/manifest.json" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Open+Sans:ital,wght@0,300..800;1,300..800&display=swap" rel="stylesheet" />
        <meta name="theme-color" content="#468BE6" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        <Providers>
          <LanguageWrapper>
            <div className="bg-white">
              <ConditionalNavbar />
              <main className="pt-16">
                {children}
              </main>
              <ConditionalFooter />
              <CookieConsent />
            </div>
          </LanguageWrapper>
        </Providers>
      </body>
    </html>
  )
}
