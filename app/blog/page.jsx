import Link from 'next/link';
import Image from 'next/image';
import { getBlogPosts } from '../../src/services/blogService';

// Metadata for SEO
export const metadata = {
  title: 'Travel Tips & eSIM Guides | Roamjet Blog',
  description: 'Discover travel tips, destination guides, and stay connected worldwide with Roamjet eSIM. Read our latest articles about digital nomad travel and international connectivity.',
  keywords: ['travel tips', 'eSIM guides', 'digital nomad', 'international travel', 'mobile connectivity', 'travel blog'],
  openGraph: {
    title: 'Travel Tips & eSIM Guides | Roamjet Blog',
    description: 'Discover travel tips, destination guides, and stay connected worldwide with Roamjet eSIM.',
    url: 'https://roamjet.net/blog',
    siteName: 'Roamjet',
    images: [
      {
        url: 'https://roamjet.net/og-blog.jpg',
        width: 1200,
        height: 630,
        alt: 'Roamjet Blog - Travel Tips & eSIM Guides',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Travel Tips & eSIM Guides | Roamjet Blog',
    description: 'Discover travel tips, destination guides, and stay connected worldwide with Roamjet eSIM.',
    images: ['https://roamjet.net/og-blog.jpg'],
  },
  alternates: {
    canonical: 'https://roamjet.net/blog',
  },
};

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
  let posts = [];
  let error = null;

  try {
    posts = await getBlogPosts();
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
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:mx-0">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
              Travel Tips & Guides
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Discover amazing destinations, travel hacks, and stay connected worldwide with our travel guides and eSIM tips.
            </p>
          </div>
        </div>
      </div>

      {/* Blog Posts Grid */}
      <div className="mx-auto max-w-7xl px-6 lg:px-8 py-24 sm:py-32">
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
          <div className="mx-auto grid max-w-2xl grid-cols-1 gap-x-8 gap-y-20 lg:mx-0 lg:max-w-none lg:grid-cols-3">
            {posts.map((post) => (
              <article key={post.id} className="flex flex-col items-start">
                <div className="relative w-full">
                  <Image
                    src={post.coverImage || '/blog-placeholder.jpg'}
                    alt={post.title}
                    width={400}
                    height={250}
                    className="aspect-[16/9] w-full rounded-2xl bg-gray-100 object-cover sm:aspect-[2/1] lg:aspect-[3/2]"
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
                      <Link href={`/blog/${post.slug}`}>
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

      {/* CTA Section */}
      <div className="bg-blue-600">
        <div className="px-6 py-24 sm:px-6 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Ready to Travel?
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-blue-100">
              Get reliable international connectivity with Roamjet eSIM. Plans starting from just $4.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link
                href="/"
                className="rounded-md bg-white px-3.5 py-2.5 text-sm font-semibold text-blue-600 shadow-sm hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Browse eSIM Plans
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}