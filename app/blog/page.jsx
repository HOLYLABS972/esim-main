import Link from 'next/link';
import Image from 'next/image';
import { headers } from 'next/headers';
import { getBlogPosts, getLocaleFromPathname } from '../../src/services/blogService';

const BLOG_COPY = {
  en: {
    title: 'Travel Tips & Guides',
    description: 'Discover amazing destinations, travel hacks, and stay connected worldwide with our travel guides and eSIM tips.',
    seoTitle: 'Travel Tips & eSIM Guides | Roamjet Blog',
    seoDescription: 'Discover travel tips, destination guides, and stay connected worldwide with Roamjet eSIM. Read our latest articles about digital nomad travel and international connectivity.',
    locale: 'en_US',
  },
  es: {
    title: 'Consejos y guias de viaje',
    description: 'Descubre destinos increibles, trucos de viaje y mantente conectado en todo el mundo con nuestras guias de viaje y consejos sobre eSIM.',
    seoTitle: 'Consejos de viaje y guias eSIM | Blog de Roamjet',
    seoDescription: 'Descubre consejos de viaje, guias de destinos y como mantenerte conectado en todo el mundo con Roamjet eSIM.',
    locale: 'es_ES',
  },
  fr: {
    title: 'Conseils et guides de voyage',
    description: 'Decouvrez des destinations incroyables, des astuces de voyage et restez connecte dans le monde entier grace a nos guides de voyage et conseils eSIM.',
    seoTitle: 'Conseils de voyage et guides eSIM | Blog Roamjet',
    seoDescription: 'Decouvrez des conseils de voyage, des guides de destinations et comment rester connecte dans le monde entier avec Roamjet eSIM.',
    locale: 'fr_FR',
  },
  de: {
    title: 'Reisetipps und Ratgeber',
    description: 'Entdecken Sie grossartige Reiseziele, clevere Reisetipps und bleiben Sie weltweit verbunden mit unseren Reiseratgebern und eSIM-Tipps.',
    seoTitle: 'Reisetipps und eSIM-Ratgeber | Roamjet Blog',
    seoDescription: 'Entdecken Sie Reisetipps, Zielort-Guides und wie Sie mit Roamjet eSIM weltweit verbunden bleiben.',
    locale: 'de_DE',
  },
  ru: {
    title: 'Sovety i gidy dlya puteshestviy',
    description: 'Otkryvayte udivitelnye napravleniya, poleznye sovety dlya puteshestviy i ostavaytes na svyazi po vsemu miru s nashimi gidami i sovetami po eSIM.',
    seoTitle: 'Sovety dlya puteshestviy i gidy po eSIM | Blog Roamjet',
    seoDescription: 'Otkryvayte sovety dlya puteshestviy, gidy po napravleniyam i sposoby ostavatsya na svyazi po vsemu miru s Roamjet eSIM.',
    locale: 'ru_RU',
  },
  he: {
    title: 'טיפים ומדריכי נסיעות',
    description: 'גלו יעדים מדהימים, טיפים חכמים לנסיעות והישארו מחוברים ברחבי העולם עם מדריכי הנסיעות וטיפי ה-eSIM שלנו.',
    seoTitle: 'טיפים לנסיעות ומדריכי eSIM | הבלוג של Roamjet',
    seoDescription: 'גלו טיפים לנסיעות, מדריכי יעדים ואיך להישאר מחוברים ברחבי העולם עם Roamjet eSIM.',
    locale: 'he_IL',
  },
  ar: {
    title: 'نصائح وادلة السفر',
    description: 'اكتشف وجهات رائعة وحيل سفر مفيدة وابق على اتصال حول العالم من خلال ادلة السفر ونصائح eSIM الخاصة بنا.',
    seoTitle: 'نصائح السفر وادلة eSIM | مدونة Roamjet',
    seoDescription: 'اكتشف نصائح السفر وادلة الوجهات وكيف تبقى متصلا حول العالم مع Roamjet eSIM.',
    locale: 'ar_SA',
  },
};

function getBlogCopy(locale) {
  return BLOG_COPY[locale] || BLOG_COPY.en;
}

export async function generateMetadata() {
  const headersList = await headers();
  const pathname = headersList.get('x-pathname') || '';
  const locale = getLocaleFromPathname(pathname);
  const copy = getBlogCopy(locale);
  const canonicalPath = locale && locale !== 'en' ? `https://roamjet.net/${locale}/blog` : 'https://roamjet.net/blog';

  return {
    title: copy.seoTitle,
    description: copy.seoDescription,
    keywords: ['travel tips', 'eSIM guides', 'digital nomad', 'international travel', 'mobile connectivity', 'travel blog'],
    openGraph: {
      title: copy.seoTitle,
      description: copy.seoDescription,
      url: canonicalPath,
      siteName: 'Roamjet',
      images: [
        {
          url: 'https://roamjet.net/og-blog.jpg',
          width: 1200,
          height: 630,
          alt: 'Roamjet Blog',
        },
      ],
      locale: copy.locale,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: copy.seoTitle,
      description: copy.seoDescription,
      images: ['https://roamjet.net/og-blog.jpg'],
    },
    alternates: {
      canonical: canonicalPath,
    },
  };
}

// Function to format date
function formatDate(date) {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

// Function to get reading time estimate
function getReadingTime(content) {
  if (!content) return '5 min read';
  const wordsPerMinute = 200;
  const words = content.split(' ').length;
  const minutes = Math.ceil(words / wordsPerMinute);
  return `${minutes} min read`;
}

export default async function BlogPage() {
  const headersList = await headers();
  const pathname = headersList.get('x-pathname') || '';
  const locale = getLocaleFromPathname(pathname);
  const copy = getBlogCopy(locale);

  let posts = [];
  let error = null;

  try {
    posts = await getBlogPosts(locale);
  } catch (err) {
    console.error('Failed to fetch blog posts:', err);
    error = 'Unable to load blog posts. Please try again later.';
  }

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <div className="relative isolate overflow-hidden bg-gradient-to-b from-indigo-100/20 py-24 sm:py-32">
        <div
          aria-hidden="true"
          className="absolute inset-y-0 right-1/2 -z-10 -mr-96 w-[200%] origin-top-right skew-x-[-30deg] bg-white shadow-xl shadow-indigo-600/10 ring-1 ring-indigo-50 sm:-mr-80 lg:-mr-96"
        />
        <div className="mx-auto max-w-[1600px] px-6 sm:px-8 lg:px-12">
          <div className="max-w-2xl">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
              {copy.title}
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              {copy.description}
            </p>
          </div>
        </div>
      </div>

      {/* Blog Posts Grid */}
      <div className="mx-auto max-w-[1600px] px-6 sm:px-8 lg:px-12 py-12 sm:py-16">
        {error ? (
          <div className="text-center py-12">
            <div className="rounded-md bg-red-50 p-4 max-w-lg mx-auto">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Error Loading Posts
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{error}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="mt-2 text-sm font-semibold text-gray-900">No blog posts</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating your first blog post.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {posts.map((post) => (
              <article key={post.id} className="flex flex-col items-start rounded-2xl bg-gray-50 p-4 ring-1 ring-gray-200">
                <div className="relative w-full">
                  <Image
                    src={post.coverImage || '/blog-placeholder.jpg'}
                    alt={post.title}
                    width={400}
                    height={250}
                    className="aspect-[16/9] w-full rounded-xl bg-gray-100 object-cover sm:aspect-[2/1] lg:aspect-[3/2]"
                    placeholder="blur"
                    blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
                  />
                  <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-gray-900/10" />
                </div>
                <div className="max-w-xl">
                  <div className="mt-8 flex items-center gap-x-4 text-xs">
                    <time dateTime={post.publishedAt?.toISOString()} className="text-gray-500">
                      {formatDate(post.publishedAt)}
                    </time>
                    <span className="text-gray-400">•</span>
                    <span className="text-gray-500">{getReadingTime(post.content)}</span>
                    {post.tags && post.tags.length > 0 && (
                      <>
                        <span className="text-gray-400">•</span>
                        <span className="relative z-10 rounded-full bg-blue-50 px-3 py-1.5 font-medium text-blue-600 hover:bg-blue-100">
                          {post.tags[0]}
                        </span>
                      </>
                    )}
                  </div>
                  <div className="group relative">
                    <h3 className="mt-3 text-lg font-semibold leading-6 text-gray-900 group-hover:text-gray-600">
                      <Link href={locale && locale !== 'en' ? `/${locale}/blog/${post.slug}` : `/blog/${post.slug}`}>
                        <span className="absolute inset-0" />
                        {post.title}
                      </Link>
                    </h3>
                    <p className="mt-5 line-clamp-3 text-sm leading-6 text-gray-600">
                      {post.excerpt}
                    </p>
                  </div>
                  <div className="relative mt-8 flex items-center gap-x-4">
                    <div className="text-sm leading-6">
                      <p className="font-semibold text-gray-900">
                        {post.author || 'Roamjet Team'}
                      </p>
                      <p className="text-gray-600">Travel Expert</p>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
