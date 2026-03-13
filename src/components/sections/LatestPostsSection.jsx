'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { detectLanguageFromPath } from '../../utils/languageUtils';
import { supabase } from '../../supabase/config';

export default function LatestPostsSection() {
  const [posts, setPosts] = useState([]);
  const pathname = usePathname();

  const langCode = detectLanguageFromPath(pathname) || 'en';
  const langPrefix = langCode !== 'en' ? `/${langCode}` : '';

  useEffect(() => {
    async function fetchPosts() {
      const { data } = await supabase
        .from('blog_posts')
        .select('title, slug, excerpt, featured_image, author, published_at')
        .eq('status', 'published')
        .eq('brand', 'esim')
        .eq('language', langCode)
        .order('published_at', { ascending: false })
        .limit(3);
      if (data) setPosts(data);
    }
    fetchPosts();
  }, [langCode]);

  if (posts.length === 0) return null;

  return (
    <section className="bg-gray-50 py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">Latest from our Blog</h2>
          <p className="mt-3 text-lg text-gray-600">Travel tips, eSIM guides, and connectivity insights</p>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`${langPrefix}/blog/${post.slug}`}
              className="group bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden"
            >
              {post.featured_image && (
                <div className="aspect-[16/9] overflow-hidden">
                  <img
                    src={post.featured_image}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                </div>
              )}
              <div className="p-5">
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                  {post.title}
                </h3>
                {post.excerpt && (
                  <p className="mt-2 text-sm text-gray-600 line-clamp-2">{post.excerpt}</p>
                )}
                <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                  <span>{post.author}</span>
                  <span>{new Date(post.published_at).toLocaleDateString()}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link
            href={`${langPrefix}/blog`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-full transition-colors"
          >
            View all articles
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
