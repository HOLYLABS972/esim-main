import { Suspense } from 'react';
import Script from 'next/script';
import Blog from '../../../src/components/Blog';
import Loading from '../../../src/components/Loading';

export const metadata = {
  title: 'eSIM Blog - Einblicke und Leitfäden zur eSIM-Technologie | RoamJet',
  description: 'Entdecke die neuesten Trends, Leitfäden und Einblicke in die eSIM-Technologie und globale Konnektivitätslösungen.',
  openGraph: {
    title: 'eSIM Blog - Einblicke und Leitfäden zur eSIM-Technologie | RoamJet',
    description: 'Entdecke die neuesten Trends, Leitfäden und Einblicke in die eSIM-Technologie und globale Konnektivitätslösungen.',
    type: 'website',
    locale: 'de_DE',
    url: '/de/blog',
  },
  alternates: {
    canonical: '/de/blog',
  },
}

export default function GermanBlogPage() {
  return (
    <>
      <Suspense fallback={<Loading />}>
        <Blog />
      </Suspense>
    </>
  );
}


