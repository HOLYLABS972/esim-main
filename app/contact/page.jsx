'use client';

import React from 'react';
import Link from 'next/link';

export default function Contact() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Contact Us</h1>
          <p className="text-gray-600">We're here to help with all your eSIM needs</p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-sm p-8">
          
          {/* Contact Info */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Get in Touch</h2>
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="w-6 h-6 text-tufts-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">Email</h3>
                  <a href="mailto:support@roamjet.net" className="text-tufts-blue hover:underline">
                    support@roamjet.net
                  </a>
                  <p className="text-sm text-gray-500 mt-1">We typically respond within 24 hours</p>
                </div>
              </div>

              <div className="flex items-start mt-6">
                <div className="flex-shrink-0">
                  <svg className="w-6 h-6 text-tufts-blue" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">TikTok</h3>
                  <a href="https://www.tiktok.com/@roamjet" target="_blank" rel="noopener noreferrer" className="text-tufts-blue hover:underline">
                    @roamjet
                  </a>
                  <p className="text-sm text-gray-500 mt-1">Follow us for travel tips and eSIM guides</p>
                </div>
              </div>
            </div>
          </div>

          {/* FAQ Link */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Looking for quick answers?</h3>
            <p className="text-gray-600 mb-4">Check out our comprehensive FAQ section for instant answers to common questions.</p>
            <Link href="/faq" className="inline-block bg-tufts-blue text-white font-semibold px-6 py-3 rounded-lg hover:bg-cobalt-blue transition-colors">
              Visit FAQ →
            </Link>
          </div>

          {/* Back to Home */}
          <div className="pt-8 border-t border-gray-200 mt-8">
            <Link 
              href="/" 
              className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
