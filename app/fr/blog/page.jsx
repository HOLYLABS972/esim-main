import Blog from '../../../src/components/Blog';

export const metadata = {
  title: 'Blog eSIM - Perspectives et guides technologie eSIM | RoamJet',
  description: 'Découvrez les dernières tendances, guides et perspectives en technologie eSIM et solutions de connectivité mondiale.',
  openGraph: {
    title: 'Blog eSIM - Perspectives et guides technologie eSIM | RoamJet',
    description: 'Découvrez les dernières tendances, guides et perspectives en technologie eSIM et solutions de connectivité mondiale.',
    type: 'website',
    locale: 'fr_FR',
    url: '/fr/blog',
  },
  alternates: {
    canonical: '/fr/blog',
  },
}

export default function FrenchBlogPage() {
  return <Blog />;
}
