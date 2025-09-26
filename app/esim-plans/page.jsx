'use client';

import React from 'react';
import EsimPlans from '../../src/components/EsimPlans';

export const metadata = {
  title: 'eSIM Plans - Global Data Plans for Backpackers & Hostel Travelers | RoamJet',
  description: 'Browse our complete selection of eSIM data plans for 200+ countries. Perfect for backpackers and hostel travelers. Better than Airalo with instant QR activation and budget-friendly rates.',
  keywords: [
    'eSIM plans',
    'global data plans',
    'backpacker eSIM',
    'hostel wifi alternative',
    'travel data plans',
    'international eSIM',
    'RoamJet vs Airalo',
    'budget travel internet',
    'instant eSIM activation',
    'traveler mobile data',
    'cheap eSIM plans',
    'hostel internet solution',
    'backpacking data plans',
    'travel connectivity',
    'global roaming eSIM'
  ],
  authors: [{ name: 'RoamJet Team' }],
  creator: 'RoamJet',
  publisher: 'RoamJet',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://esimplans.com'),
  alternates: {
    canonical: '/esim-plans',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/esim-plans',
    title: 'eSIM Plans - Global Data Plans for Backpackers & Hostel Travelers',
    description: 'Browse our complete selection of eSIM data plans for 200+ countries. Perfect for backpackers and hostel travelers. Better than Airalo with instant QR activation.',
    siteName: 'RoamJet',
    images: [
      {
        url: '/images/og-esim-plans.jpg',
        width: 1200,
        height: 630,
        alt: 'eSIM Plans for Backpackers and Hostel Travelers',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'eSIM Plans - Global Data Plans for Backpackers & Hostel Travelers',
    description: 'Browse our complete selection of eSIM data plans for 200+ countries. Perfect for backpackers and hostel travelers.',
    images: ['/images/twitter-esim-plans.jpg'],
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
}

export default function EsimPlansPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            "name": "eSIM Data Plans",
            "description": "Global eSIM data plans for travelers, backpackers, and hostel guests. Instant activation in 200+ countries.",
            "brand": {
              "@type": "Brand",
              "name": "RoamJet"
            },
            "offers": {
              "@type": "AggregateOffer",
              "priceRange": "$5-$50",
              "availability": "https://schema.org/InStock",
              "seller": {
                "@type": "Organization",
                "name": "RoamJet"
              }
            },
            "category": "Telecommunications",
            "audience": {
              "@type": "Audience",
              "audienceType": "Backpackers, Hostel Travelers, International Travelers"
            }
          })
        }}
      />
      
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your eSIM Plan
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Browse our complete selection of eSIM data plans for 200+ countries. 
            Real-time pricing with instant activation.
          </p>
        </div>
        
        <EsimPlans />
      </div>
    </div>
  );
}
