import { getBlogPosts } from '../src/services/blogService';

const SUPPORTED_BLOG_LOCALES = ['en', 'ar', 'de', 'es', 'fr', 'he', 'ru', 'pt', 'tr', 'ja', 'zh', 'id', 'uk', 'vi'];

export default async function sitemap() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://roamjet.net';
  const now = new Date();

  const staticPages = [
    '',
    '/affiliate',
    '/blog',
    '/esim-plans',
    '/privacy-policy',
    '/terms-of-service',
    '/refund-policy',
    '/device-compatibility',
    '/faq',
  ].map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: now,
    changeFrequency: path === '' ? 'daily' : 'weekly',
    priority: path === '' ? 1 : path === '/blog' || path === '/esim-plans' ? 0.9 : 0.7,
  }));

  const blogEntries = [];

  for (const locale of SUPPORTED_BLOG_LOCALES) {
    try {
      const posts = await getBlogPosts(locale);
      posts.forEach((post) => {
        const localizedPath = locale === 'en' ? `/blog/${post.slug}` : `/${locale}/blog/${post.slug}`;
        blogEntries.push({
          url: `${baseUrl}${localizedPath}`,
          lastModified: post.publishedAt || now,
          changeFrequency: 'monthly',
          priority: 0.8,
        });
      });
    } catch (error) {
      console.error(`Sitemap blog fetch failed for locale ${locale}:`, error);
    }
  }

  const deduped = new Map();
  [...staticPages, ...blogEntries].forEach((entry) => {
    deduped.set(entry.url, entry);
  });

  return Array.from(deduped.values());
}
