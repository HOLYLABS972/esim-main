import { Suspense } from 'react';
import Script from 'next/script';
import Blog from '../../../src/components/Blog';
import Loading from '../../../src/components/Loading';

export const metadata = {
  title: 'Blog eSIM - Perspectivas y Guías de Tecnología eSIM | RoamJet',
  description: 'Descubre las últimas tendencias, guías y perspectivas en tecnología eSIM y soluciones de conectividad global.',
  openGraph: {
    title: 'Blog eSIM - Perspectivas y Guías de Tecnología eSIM | RoamJet',
    description: 'Descubre las últimas tendencias, guías y perspectivas en tecnología eSIM y soluciones de conectividad global.',
    type: 'website',
    locale: 'es_ES',
    url: '/es/blog',
  },
  alternates: {
    canonical: '/es/blog',
  },
}

export default function SpanishBlogPage() {
  return (
    <>
      <Suspense fallback={<Loading />}>
        <Blog />
      </Suspense>
    </>
  );
}


