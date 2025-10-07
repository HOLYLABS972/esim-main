import Blog from '../../../src/components/Blog';

export const metadata = {
  title: 'مدونة eSIM - رؤى ودلائل تقنية eSIM | RoamJet',
  description: 'اكتشف أحدث الاتجاهات والدلائل والرؤى في تقنية eSIM وحلول الاتصال العالمية.',
  openGraph: {
    title: 'مدونة eSIM - رؤى ودلائل تقنية eSIM | RoamJet',
    description: 'اكتشف أحدث الاتجاهات والدلائل والرؤى في تقنية eSIM وحلول الاتصال العالمية.',
    type: 'website',
    locale: 'ar_SA',
    url: '/ar/blog',
  },
  alternates: {
    canonical: '/ar/blog',
  },
}

export default function ArabicBlogPage() {
  return <Blog />;
}
