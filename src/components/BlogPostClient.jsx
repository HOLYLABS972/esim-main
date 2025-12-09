"use client";

import React, { useState, useEffect } from 'react';
import { Calendar, Clock, ArrowLeft, Share2, Copy, Check } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useI18n } from '../contexts/I18nContext';
import { getLocalizedBlogListUrl } from '../utils/languageUtils';
import blogService from '../services/blogService';

const BlogPostClient = ({ initialPost, slug, language = 'en' }) => {
  const { locale, t } = useI18n();
  const router = useRouter();
  const [post, setPost] = useState(initialPost);
  const [loading, setLoading] = useState(!initialPost);
  const [linkCopied, setLinkCopied] = useState(false);
  const detectedLanguage = language || locale || 'en';

  useEffect(() => {
    // Increment views when post is viewed
    if (post?.id) {
      blogService.incrementViews(post.id).catch(err => {
        console.error('Error incrementing views:', err);
      });
    }
  }, [post?.id]);

  const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title,
          text: post.excerpt,
          url: window.location.href,
        });
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Error sharing:', err);
        }
      }
    } else {
      handleCopyLink();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-tufts-blue mx-auto mb-4"></div>
          <p className="text-gray-600">{t('blog.loadingPosts', 'Loading blog post...')}</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{t('blog.postNotFound', 'Post Not Found')}</h1>
          <p className="text-gray-600 mb-6">{t('blog.postNotFoundDescription', 'The blog post you\'re looking for doesn\'t exist.')}</p>
          <Link
            href={getLocalizedBlogListUrl(detectedLanguage)}
            className="inline-flex items-center text-tufts-blue hover:text-cobalt-blue"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('blog.backToBlog', 'Back to Blog')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Back Button */}
        <Link
          href={getLocalizedBlogListUrl(detectedLanguage)}
          className="inline-flex items-center text-gray-600 hover:text-tufts-blue mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('blog.backToBlog', 'Back to Blog')}
        </Link>

        {/* Category Badge */}
        <div className="mb-4">
          <span className="inline-block bg-tufts-blue text-white px-3 py-1 rounded-full text-sm font-medium">
            {post.category}
          </span>
        </div>

        {/* Title */}
        <h1 className="text-4xl md:text-5xl font-bold text-eerie-black mb-6 leading-tight">
          {post.title}
        </h1>

        {/* Meta Information */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-8 pb-8 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4" />
            <span>{formatDate(post.publishedAt)}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4" />
            <span>{post.readTime || '5 min read'}</span>
          </div>
          {post.author && (
            <div className="flex items-center space-x-2">
              <span>By {post.author}</span>
            </div>
          )}
        </div>

        {/* Featured Image */}
        {post.featuredImage && (
          <div className="mb-8">
            <Image
              src={post.featuredImage}
              alt={post.title}
              width={1200}
              height={630}
              className="w-full h-auto rounded-xl shadow-lg"
              priority
            />
          </div>
        )}

        {/* Content */}
        <div 
          className="prose prose-lg max-w-none mb-12"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('blog.relatedTags', 'Related Tags')}</h3>
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag, index) => (
                <span
                  key={index}
                  className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-medium"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Share Buttons */}
        <div className="flex items-center gap-4 pt-8 border-t border-gray-200">
          <button
            onClick={handleShare}
            className="inline-flex items-center space-x-2 text-gray-600 hover:text-tufts-blue transition-colors"
          >
            <Share2 className="w-5 h-5" />
            <span>{t('blog.sharePost', 'Share')}</span>
          </button>
          <button
            onClick={handleCopyLink}
            className="inline-flex items-center space-x-2 text-gray-600 hover:text-tufts-blue transition-colors"
          >
            {linkCopied ? (
              <>
                <Check className="w-5 h-5 text-green-600" />
                <span className="text-green-600">{t('blog.linkCopied', 'Link copied!')}</span>
              </>
            ) : (
              <>
                <Copy className="w-5 h-5" />
                <span>{t('blog.copyLink', 'Copy Link')}</span>
              </>
            )}
          </button>
        </div>
      </article>
    </div>
  );
};

export default BlogPostClient;
