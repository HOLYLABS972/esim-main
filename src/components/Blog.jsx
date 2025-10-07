"use client";

import React, { useState, useEffect } from 'react';
import { Calendar, User, ArrowRight, Clock, Search, Mail } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useI18n } from '../contexts/I18nContext';
import blogService from '../services/blogService';
import { subscribeToNewsletter } from '../services/newsletterService';
import { detectLanguageFromPath, getLocalizedBlogUrl } from '../utils/languageUtils';
import toast from 'react-hot-toast';

const Blog = () => {
  const pathname = usePathname();
  const { locale, t } = useI18n();
  
  // Debug logging
  console.log('Blog component - Current locale:', locale, 'pathname:', pathname);
  
  // Use locale from I18n context, fallback to URL-based detection if needed
  const detectedLanguage = locale || detectLanguageFromPath(pathname);
  
  console.log('Blog component - Detected language:', detectedLanguage);
  
  const [blogPosts, setBlogPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  // Newsletter state
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [isNewsletterSubmitting, setIsNewsletterSubmitting] = useState(false);

  // Load blog posts on component mount and when language changes
  useEffect(() => {
    loadBlogPosts();
    loadCategories();
  }, [detectedLanguage, locale]); // Add locale as dependency to ensure reload on language change

  // Filter posts when search term or category changes
  useEffect(() => {
    filterPosts();
  }, [searchTerm, selectedCategory, blogPosts]);

  const loadBlogPosts = async () => {
    try {
      setLoading(true);
      const result = await blogService.getPublishedPosts(20, null, detectedLanguage);
      setBlogPosts(result.posts);
    } catch (error) {
      console.error('Error loading blog posts:', error);
      // Fallback to empty array if there's an error
      setBlogPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const cats = await blogService.getCategories();
      setCategories(cats);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const filterPosts = () => {
    let filtered = blogPosts;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(post =>
        post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(post => post.category === selectedCategory);
    }

    setFilteredPosts(filtered);
  };

  const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleNewsletterSubmit = async (e) => {
    e.preventDefault();
    
    if (!newsletterEmail.trim()) {
      toast.error('Please enter your email address');
      return;
    }

    setIsNewsletterSubmitting(true);
    
    try {
      const result = await subscribeToNewsletter({
        email: newsletterEmail.trim(),
        name: '', // Optional for blog subscription
        source: 'blog'
      });
      
      if (result.success) {
        if (result.message === 'Email reactivated') {
          toast.success(t('blog.newsletter.reactivated', 'Welcome back! Your newsletter subscription has been reactivated.'));
        } else {
          toast.success(t('blog.newsletter.subscribeSuccess', 'Successfully subscribed to our newsletter!'));
        }
        
        // Reset form
        setNewsletterEmail('');
      } else {
        toast.error(result.message || t('blog.newsletter.subscribeError', 'Failed to subscribe to newsletter. Please try again.'));
      }
    } catch (error) {
      console.error('Error subscribing to newsletter:', error);
      toast.error(t('blog.newsletter.subscribeError', 'Failed to subscribe to newsletter. Please try again.'));
    } finally {
      setIsNewsletterSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white pt-6">
      {/* Header Section */}
      <section className="bg-white">
        <div className="mx-auto max-w-2xl px-6 lg:max-w-7xl lg:px-8">
          <div className="text-center">
            <h2 className="text-center text-xl font-semibold text-tufts-blue">
              <span>{'{ '}</span>
              {t('blog.title', 'eSIM Insights')}
              <span>{' }'}</span>
            </h2>
            <p className="mx-auto mt-12 max-w-4xl text-center text-4xl font-semibold tracking-tight text-eerie-black sm:text-5xl">
              {t('blog.subtitle', 'Stay updated with eSIM technology')}
            </p>
            <p className="mx-auto mt-6 max-w-2xl text-center text-lg text-cool-black">
              {t('blog.description', 'Discover the latest trends, guides, and insights in eSIM technology and global connectivity solutions.')}
            </p>
          </div>
        </div>
      </section>

      {/* Search and Filter Section */}
      <section className="bg-white">
        <div className="mx-auto max-w-2xl px-6 lg:max-w-7xl lg:px-8 mt-6">
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder={t('blog.searchPlaceholder', 'Search blog posts...')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border-0 shadow-lg rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="md:w-48">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-3 border-0 shadow-lg rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">{t('blog.allCategories', 'All Categories')}</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Blog Posts Grid */}
      <section className="bg-white pb-16">
        <div className="mx-auto max-w-2xl px-6 lg:max-w-7xl lg:px-8">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 shadow-lg mx-auto "></div>
              <p className="mt-4 text-gray-600">{t('blog.loadingPosts', 'Loading blog posts...')}</p>
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">
                {searchTerm || selectedCategory !== 'all' 
                  ? t('blog.noPostsFound', 'No blog posts found matching your criteria')
                  : t('blog.noPostsAvailable', 'No blog posts available yet')
                }
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2  lg:grid-cols-3 gap-6">
              {filteredPosts.map((post, index) => (
              <Link href={`/blog/${post.baseSlug || post.slug}`} key={post.id}>
                <article className="relative cursor-pointer group  transition-transform duration-200 ">
                  <div className="absolute inset-px rounded-xl bg-white shadow-lg"></div>
                  <div className="relative flex h-full flex-col overflow-hidden rounded-xl">
                  <div className="relative">
                    {post.featuredImage ? (
                      <Image
                        src={post.featuredImage}
                        alt={post.title}
                        width={400}
                        height={192}
                        className="w-full h-48 object-cover"
                      />
                    ) : (
                      <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-400 text-sm">No image</span>
                      </div>
                    )}
                    <div className="absolute top-4 left-4 flex gap-2">
                      <span className="bg-tufts-blue text-white px-2 py-1 rounded-full text-sm font-medium backdrop-blur-sm">
                        {post.category}
                      </span>
                      {post.isFallback && (
                        <span className="bg-orange-500 text-white px-2 py-1 rounded-full text-sm font-medium">
                          {post.language?.toUpperCase() || 'EN'} {post.isFallback ? 'Fallback' : 'Version'}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="px-6 pt-6 pb-6 flex-1 flex flex-col">
                    <h2 className="text-lg font-semibold tracking-tight text-eerie-black mb-3 line-clamp-2 group-hover:text-tufts-blue transition-colors duration-200">
                      {post.title}
                    </h2>
                    
                    
                    
                    <div className="flex items-center justify-between text-sm text-cool-black mb-4">
                      <div className="flex items-center space-x-4">
                        
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(post.publishedAt)}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Tags */}
                    {post.tags && post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-4 overflow-hidden">
                        {post.tags.slice(0, 3).map((tag, index) => (
                          <span
                            key={index}
                            className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs font-medium truncate max-w-20"
                          >
                            #{tag.length > 8 ? tag.substring(0, 8) + '...' : tag}
                          </span>
                        ))}
                        {post.tags.length > 3 && (
                          <span className="bg-gray-200 text-gray-600 px-2 py-1 rounded-full text-xs font-medium">
                            +{post.tags.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1 text-sm text-cool-black">
                        <Clock className="w-4 h-4" />
                        <span>{post.readTime}</span>
                      </div>
                      
                      <div className="inline-flex items-center space-x-1 text-tufts-blue group-hover:text-cobalt-blue font-medium transition-colors duration-200">
                        <span>{t('blog.readMore', 'Read More')}</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
                      </div>
                    </div>
                  </div>
                  </div>
                  <div className="pointer-events-none absolute inset-px rounded-xl"></div>
                </article>
              </Link>
            ))}
            </div>
          )}
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="bg-eerie-black text-white py-16">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-medium tracking-tight text-white mb-6">
            {t('blog.newsletter.title', 'Stay Updated with eSIM News')}
          </h2>
          <p className="text-xl text-alice-blue mb-8">
            {t('blog.newsletter.description', 'Get the latest eSIM insights, travel tips, and technology updates delivered to your inbox')}
          </p>
          <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <input
              type="email"
              placeholder={t('blog.newsletter.emailPlaceholder', 'Enter your email')}
              value={newsletterEmail}
              onChange={(e) => setNewsletterEmail(e.target.value)}
              required
              className="input-field flex-1"
            />
            <button 
              type="submit"
              disabled={isNewsletterSubmitting}
              className="btn-primary px-6 py-3 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isNewsletterSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {t('blog.newsletter.subscribing', 'Subscribing...')}
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" />
                  {t('blog.newsletter.subscribe', 'Subscribe')}
                </>
              )}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
};

export default Blog;
