import { getBlogPosts } from '../src/services/blogService';

// Only include locales that actually have blog content in the database.
// Adding a locale here without content creates ghost URLs that return 404,
// which wastes crawl budget and hurts SEO.
const BLOG_LOCALES_WITH_CONTENT = ['en', 'ar', 'de', 'es', 'fr', 'he', 'ru', 'pt', 'tr', 'ja', 'zh', 'id', 'uk', 'vi'];

// Locales that have translated static pages (non-blog) and blog listings
const STATIC_PAGE_LOCALES = ['ar', 'de', 'es', 'fr', 'he', 'ru', 'pt', 'tr', 'ja', 'zh', 'id', 'uk', 'vi'];

export default async function sitemap() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://roamjet.net';
  const now = new Date();

  // English static pages
  const staticPaths = [
    '',
    '/affiliate',
    '/blog',
    '/esim-plans',
    '/privacy-policy',
    '/terms-of-service',
    '/refund-policy',
    '/device-compatibility',
    '/faq',
  ];

  const staticPages = staticPaths.map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: now,
    changeFrequency: path === '' ? 'daily' : 'weekly',
    priority: path === '' ? 1 : path === '/blog' || path === '/esim-plans' ? 0.9 : 0.7,
  }));

  // Localized static pages (blog listing per locale)
  for (const locale of STATIC_PAGE_LOCALES) {
    staticPages.push({
      url: `${baseUrl}/${locale}/blog`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    });
  }

  // Blog post entries — only for locales with actual content
  const blogEntries = [];
  const seenUrls = new Set();

  for (const locale of BLOG_LOCALES_WITH_CONTENT) {
    try {
      const posts = await getBlogPosts(locale);
      posts.forEach((post) => {
        const localizedPath = locale === 'en' ? `/blog/${post.slug}` : `/${locale}/blog/${post.slug}`;
        const url = `${baseUrl}${localizedPath}`;

        // Skip duplicate URLs (e.g. duplicate slugs in the database)
        if (seenUrls.has(url)) return;
        seenUrls.add(url);

        blogEntries.push({
          url,
          lastModified: post.publishedAt || now,
          changeFrequency: 'monthly',
          priority: 0.8,
        });
      });
    } catch (error) {
      console.error(`Sitemap blog fetch failed for locale ${locale}:`, error);
    }
  }

  return [...staticPages, ...blogEntries];
}
