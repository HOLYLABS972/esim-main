"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Calendar, User, Clock, ArrowLeft, Share2 } from 'lucide-react';
import blogService from '../services/blogService';

const BlogPost = ({ slug }) => {
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadBlogPost();
  }, [slug]);

  const loadBlogPost = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!slug) {
        setError('No blog post specified');
        return;
      }

      const postData = await blogService.getPostBySlug(slug);
      
      if (postData) {
        setPost(postData);
        // Increment view count
        await blogService.incrementViews(postData.id);
      } else {
        setError('Blog post not found');
      }
    } catch (err) {
      console.error('Error loading blog post:', err);
      setError('Error loading blog post');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white py-24 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading blog post...</p>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-white py-24 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-medium tracking-tight text-eerie-black mb-4">Post Not Found</h1>
          <p className="text-cool-black mb-8">{error || 'The blog post you\'re looking for doesn\'t exist.'}</p>
          <Link 
            href="/blog" 
            className="btn-primary px-6 py-3"
          >
            Back to Blog
          </Link>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-white py-24">
      {/* Header */}
      <section className="bg-white">
        <div className="mx-auto max-w-2xl px-6 lg:max-w-7xl lg:px-8">
          <div className="relative">
            <div className="absolute inset-px rounded-xl bg-white"></div>
            <div className="relative flex h-full flex-col overflow-hidden rounded-xl">
              <div className="px-8 pt-8 pb-8">
                <Link 
                  href="/blog" 
                  className="inline-flex items-center text-tufts-blue hover:text-cobalt-blue mb-6 font-medium transition-colors duration-200"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Blog
                </Link>
                
                <div className="mb-4">
                  <span className="bg-tufts-blue/10 text-tufts-blue px-3 py-1 rounded-full text-sm font-medium">
                    {post.category}
                  </span>
                </div>
                
                <h1 className="text-4xl md:text-5xl font-medium tracking-tight text-eerie-black mb-6 leading-tight">
                  {post.title}
                </h1>
                
                <div className="flex items-center justify-between text-cool-black mb-8">
                  <div className="flex items-center space-x-6">
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4" />
                      <span>{post.author}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4" />
                      <span>{post.date}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4" />
                      <span>{post.readTime}</span>
                    </div>
                  </div>
                  
                  <button className="flex items-center space-x-2 text-cool-black hover:text-eerie-black transition-colors duration-200">
                    <Share2 className="w-4 h-4" />
                    <span>Share</span>
                  </button>
                </div>
              </div>
            </div>
            <div className="pointer-events-none absolute inset-px rounded-xl shadow-sm ring-1 ring-black/5"></div>
          </div>
        </div>
      </section>

      {/* Featured Image */}
      <section className="bg-white">
        <div className="mx-auto max-w-2xl px-6 lg:max-w-7xl lg:px-8 mt-6">
          <div className="relative">
            <div className="absolute inset-px rounded-xl bg-white"></div>
            <div className="relative flex h-full flex-col overflow-hidden rounded-xl">
              <img
                src={post.image}
                alt={post.title}
                className="w-full h-64 md:h-96 object-cover"
              />
            </div>
            <div className="pointer-events-none absolute inset-px rounded-xl shadow-sm ring-1 ring-black/5"></div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-2xl px-6 lg:max-w-7xl lg:px-8">
          <div className="relative">
            <div className="absolute inset-px rounded-xl bg-white"></div>
            <div className="relative flex h-full flex-col overflow-hidden rounded-xl">
              <div className="px-8 pt-8 pb-8">
                <div
                  className="prose prose-lg max-w-none text-cool-black"
                  dangerouslySetInnerHTML={{ __html: post.content }}
                />
              </div>
            </div>
            <div className="pointer-events-none absolute inset-px rounded-xl shadow-sm ring-1 ring-black/5"></div>
          </div>
        </div>
      </section>


    </div>
  );
};

export default BlogPost;
