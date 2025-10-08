import Blog from '../../../src/components/Blog';

export const metadata = {
  title: 'eSIM Блог - Обзоры и Руководства по Технологии eSIM | RoamJet',
  description: 'Откройте для себя последние тенденции, руководства и обзоры технологий eSIM и решений глобальной связи.',
  openGraph: {
    title: 'eSIM Блог - Обзоры и Руководства по Технологии eSIM | RoamJet',
    description: 'Откройте для себя последние тенденции, руководства и обзоры технологий eSIM и решений глобальной связи.',
    type: 'website',
    locale: 'ru_RU',
    url: '/ru/blog',
  },
  alternates: {
    canonical: '/ru/blog',
  },
}

export default function RussianBlogPage() {
  return <Blog />;
}


