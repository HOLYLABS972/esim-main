"use client";

import React, { useState, useEffect } from 'react';
import { Calendar, User, ArrowRight, Clock, Search, Mail } from 'lucide-react';
import Link from 'next/link';
import blogService from '../services/blogService';
import { subscribeToNewsletter } from '../services/newsletterService';
import toast from 'react-hot-toast';

const Blog = () => {
  const [blogPosts, setBlogPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  // Newsletter state
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [isNewsletterSubmitting, setIsNewsletterSubmitting] = useState(false);

  // Load blog posts on component mount
  useEffect(() => {
    loadBlogPosts();
    loadCategories();
  }, []);

  // Filter posts when search term or category changes
  useEffect(() => {
    filterPosts();
  }, [searchTerm, selectedCategory, blogPosts]);

  const loadBlogPosts = async () => {
    try {
      setLoading(true);
      const result = await blogService.getPublishedPosts(20);
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
          toast.success('Welcome back! Your newsletter subscription has been reactivated.');
        } else {
          toast.success('Successfully subscribed to our newsletter!');
        }
        
        // Reset form
        setNewsletterEmail('');
      } else {
        toast.error(result.message || 'Failed to subscribe to newsletter');
      }
    } catch (error) {
      console.error('Error subscribing to newsletter:', error);
      toast.error('Failed to subscribe to newsletter. Please try again.');
    } finally {
      setIsNewsletterSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white py-24">
      {/* Header Section */}
      <section className="bg-white">
        <div className="mx-auto max-w-2xl px-6 lg:max-w-7xl lg:px-8">
          <div className="text-center">
            <h2 className="text-center text-xl font-semibold text-tufts-blue">
              <span>{'{ '}</span>
              eSIM Insights
              <span>{' }'}</span>
            </h2>
            <p className="mx-auto mt-12 max-w-4xl text-center text-4xl font-semibold tracking-tight text-eerie-black sm:text-5xl">
              Stay updated with eSIM technology
            </p>
            <p className="mx-auto mt-6 max-w-2xl text-center text-lg text-cool-black">
              Discover the latest trends, guides, and insights in eSIM technology 
              and global connectivity solutions.
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
                placeholder="Search blog posts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="md:w-48">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Blog Posts Grid */}
      <section className="bg-white">
        <div className="mx-auto max-w-2xl px-6 lg:max-w-7xl lg:px-8">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading blog posts...</p>
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">
                {searchTerm || selectedCategory !== 'all' 
                  ? 'No blog posts found matching your criteria' 
                  : 'No blog posts available yet'
                }
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPosts.map((post, index) => (
              <article
                key={post.id}
                className="relative"
              >
                <div className="absolute inset-px rounded-xl bg-white"></div>
                <div className="relative flex h-full flex-col overflow-hidden rounded-xl">
                  <div className="relative">
                    {post.featuredImage ? (
                      <img
                        src={post.featuredImage}
                        alt={post.title}
                        className="w-full h-48 object-cover"
                      />
                    ) : (
                      <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-400 text-sm">No image</span>
                      </div>
                    )}
                    <div className="absolute top-4 left-4">
                      <span className="bg-tufts-blue text-white px-3 py-1 rounded-full text-sm font-medium">
                        {post.category}
                      </span>
                    </div>
                  </div>
                  
                  <div className="px-6 pt-6 pb-6 flex-1 flex flex-col">
                    <h2 className="text-xl font-medium tracking-tight text-eerie-black mb-3 line-clamp-2">
                      {post.title}
                    </h2>
                    
                    <p className="text-cool-black mb-4 line-clamp-3 flex-1">
                      {post.excerpt}
                    </p>
                    
                    <div className="flex items-center justify-between text-sm text-cool-black mb-4">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1">
                          <User className="w-4 h-4" />
                          <span>{post.author}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(post.publishedAt)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1 text-sm text-cool-black">
                        <Clock className="w-4 h-4" />
                        <span>{post.readTime}</span>
                      </div>
                      
                      <Link
                        href={`/blog/${post.slug}`}
                        className="inline-flex items-center space-x-1 text-tufts-blue hover:text-cobalt-blue font-medium transition-colors duration-200"
                      >
                        <span>Read More</span>
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </div>
                <div className="pointer-events-none absolute inset-px rounded-xl shadow-sm ring-1 ring-black/5"></div>
              </article>
            ))}
            </div>
          )}
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="bg-eerie-black text-white py-16 mt-[50px]">
        <div className="mx-auto max-w-2xl px-6 lg:max-w-7xl lg:px-8">
          <div className="relative">
            <div className="absolute inset-px rounded-xl bg-eerie-black"></div>
            <div className="relative flex h-full flex-col overflow-hidden rounded-xl">
              <div className="px-8 pt-8 pb-8 text-center">
                <h2 className="text-3xl md:text-4xl font-medium tracking-tight text-white mb-6">
                  Stay Updated with eSIM News
                </h2>
                <p className="text-xl text-alice-blue mb-8">
                  Get the latest eSIM insights, travel tips, and technology updates delivered to your inbox
                </p>
                <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                  <input
                    type="email"
                    placeholder="Enter your email"
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
                        Subscribing...
                      </>
                    ) : (
                      <>
                        <Mail className="w-4 h-4 mr-2" />
                        Subscribe
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
            <div className="pointer-events-none absolute inset-px rounded-xl shadow-sm ring-1 ring-white/10"></div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Blog;
