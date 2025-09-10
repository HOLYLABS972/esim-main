"use client";

import React from 'react';
import { Calendar, User, ArrowRight, Clock } from 'lucide-react';
import Link from 'next/link';

const Blog = () => {
  const blogPosts = [
    {
      id: 1,
      title: "The Ultimate Guide to eSIM Technology in 2024",
      excerpt: "Discover everything you need to know about eSIM technology, from basic concepts to advanced features that are revolutionizing mobile connectivity worldwide.",
      author: "Sarah Johnson",
      date: "December 15, 2024",
      readTime: "8 min read",
      image: "/images/frontend/blog/686b70785c4a01751871608.png",
      category: "Technology"
    },
    {
      id: 2,
      title: "Top 10 Countries for eSIM Travel in 2024",
      excerpt: "Planning your next adventure? Here are the best destinations where eSIM technology offers seamless connectivity and the most affordable data plans.",
      author: "Michael Chen",
      date: "December 12, 2024",
      readTime: "6 min read",
      image: "/images/frontend/blog/686b71090c13f1751871753.png",
      category: "Travel"
    },
    {
      id: 3,
      title: "eSIM vs Physical SIM: Which is Better for Business?",
      excerpt: "A comprehensive comparison of eSIM and traditional SIM cards for business users, covering security, flexibility, and cost-effectiveness.",
      author: "Emma Rodriguez",
      date: "December 10, 2024",
      readTime: "7 min read",
      image: "/images/frontend/blog/686b713abd1031751871802.png",
      category: "Business"
    },
    {
      id: 4,
      title: "How to Set Up Your First eSIM: Step-by-Step Guide",
      excerpt: "New to eSIM? This beginner-friendly guide walks you through the entire setup process, from purchase to activation on your device.",
      author: "David Park",
      date: "December 8, 2024",
      readTime: "5 min read",
      image: "/images/frontend/blog/686b7149f37a11751871817.png",
      category: "Tutorial"
    },
    {
      id: 5,
      title: "eSIM Security: Protecting Your Digital Identity",
      excerpt: "Learn about the advanced security features of eSIM technology and how it protects your personal data better than traditional SIM cards.",
      author: "Lisa Thompson",
      date: "December 5, 2024",
      readTime: "9 min read",
      image: "/images/frontend/blog/686b716eeb7c11751871854.png",
      category: "Security"
    },
    {
      id: 6,
      title: "The Future of Mobile Connectivity: eSIM Trends 2025",
      excerpt: "Explore upcoming innovations in eSIM technology and how they will shape the future of global mobile connectivity and IoT devices.",
      author: "Alex Kumar",
      date: "December 3, 2024",
      readTime: "10 min read",
      image: "/images/frontend/blog/686b7268210a31751872104.png",
      category: "Innovation"
    }
  ];

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

      {/* Blog Posts Grid */}
      <section className="bg-white">
        <div className="mx-auto max-w-2xl px-6 lg:max-w-7xl lg:px-8 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {blogPosts.map((post, index) => (
              <article
                key={post.id}
                className="relative"
              >
                <div className="absolute inset-px rounded-xl bg-white"></div>
                <div className="relative flex h-full flex-col overflow-hidden rounded-xl">
                  <div className="relative">
                    <img
                      src={post.image}
                      alt={post.title}
                      className="w-full h-48 object-cover"
                    />
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
                          <span>{post.date}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1 text-sm text-cool-black">
                        <Clock className="w-4 h-4" />
                        <span>{post.readTime}</span>
                      </div>
                      
                      <Link
                        href={`/blog/${post.id}`}
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
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="bg-eerie-black text-white py-16">
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
                <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className="input-field flex-1"
                  />
                  <button className="btn-primary px-6 py-3">
                    Subscribe
                  </button>
                </div>
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
