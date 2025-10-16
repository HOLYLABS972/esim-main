'use client';

import React from 'react';
import Link from 'next/link';

export default function ReturnPolicy() {
  const currentDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Return & Refund Policy</h1>
          <p className="text-gray-600">RoamJet by Holylabs Ltd</p>
          <p className="text-sm text-gray-500 mt-2">Last updated: {currentDate}</p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-sm p-8 space-y-8">
          
          {/* Overview */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Overview</h2>
            <div className="space-y-4 text-gray-700 leading-relaxed">
              <p>
                At RoamJet, we strive to provide the best eSIM services to our customers. This Return & Refund Policy explains the conditions under which refunds may be issued for eSIM purchases.
              </p>
            </div>
          </section>

          {/* Refund Eligibility */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Refund Eligibility</h2>
            <div className="space-y-4 text-gray-700 leading-relaxed">
              <p>
                Due to the digital nature of eSIM products, refunds are only available under specific circumstances:
              </p>
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 my-4">
                <h3 className="font-semibold text-gray-900 mb-3">✓ Refunds ARE Available:</h3>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <span className="text-green-600 mr-2">•</span>
                    <span>The eSIM has not been activated or installed on any device</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-600 mr-2">•</span>
                    <span>No data has been consumed from the plan</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-600 mr-2">•</span>
                    <span>Request is made within 7 days of purchase</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-600 mr-2">•</span>
                    <span>Technical issues on our end prevent eSIM activation (with proof)</span>
                  </li>
                </ul>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-6 my-4">
                <h3 className="font-semibold text-gray-900 mb-3">✗ Refunds NOT Available:</h3>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <span className="text-red-600 mr-2">•</span>
                    <span>The eSIM has been installed or activated on a device</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-red-600 mr-2">•</span>
                    <span>Any data has been consumed from the plan</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-red-600 mr-2">•</span>
                    <span>The eSIM was removed from device after installation</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-red-600 mr-2">•</span>
                    <span>Request is made after 7 days from purchase</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-red-600 mr-2">•</span>
                    <span>Unused data remaining in an activated plan</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-red-600 mr-2">•</span>
                    <span>Device incompatibility (users must verify compatibility before purchase)</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-red-600 mr-2">•</span>
                    <span>Incorrect activation by user (not following provided instructions)</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* How to Request */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">How to Request a Refund</h2>
            <div className="space-y-4 text-gray-700 leading-relaxed">
              <p>
                If you meet the eligibility criteria above, you can request a refund by:
              </p>
              <ol className="list-decimal pl-6 space-y-2">
                <li>Contacting our support team at <a href="mailto:support@roamjet.net" className="text-blue-600 hover:underline">support@roamjet.net</a></li>
                <li>Providing your order number and email address used for purchase</li>
                <li>Explaining the reason for your refund request</li>
              </ol>
              <p>
                Our team will review your request and respond within 2-3 business days. If approved, refunds will be processed to the original payment method within 5-10 business days.
              </p>
            </div>
          </section>

          {/* Important Notes */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Important Notes</h2>
            <div className="space-y-4 text-gray-700 leading-relaxed">
              <ul className="space-y-3">
                <li className="flex items-start">
                  <span className="font-semibold mr-2">•</span>
                  <span>Before purchasing, please verify your device supports eSIM using our <Link href="/device-compatibility" className="text-blue-600 hover:underline">Device Compatibility</Link> page.</span>
                </li>
                <li className="flex items-start">
                  <span className="font-semibold mr-2">•</span>
                  <span>Ensure your device is carrier-unlocked before purchase.</span>
                </li>
                <li className="flex items-start">
                  <span className="font-semibold mr-2">•</span>
                  <span>Follow activation instructions carefully to avoid issues.</span>
                </li>
                <li className="flex items-start">
                  <span className="font-semibold mr-2">•</span>
                  <span>Do not delete the eSIM from your device after installation if you may need a refund.</span>
                </li>
                <li className="flex items-start">
                  <span className="font-semibold mr-2">•</span>
                  <span>Refund processing fees may apply depending on your payment method.</span>
                </li>
              </ul>
            </div>
          </section>

          {/* Contact */}
          <section className="bg-blue-50 p-6 rounded-lg">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Questions?</h2>
            <div className="space-y-2 text-gray-700">
              <p>
                If you have questions about our return policy or need assistance with a refund request, please contact us:
              </p>
              <div className="mt-4">
                <p className="font-semibold">Email: <a href="mailto:support@roamjet.net" className="text-blue-600 hover:underline">support@roamjet.net</a></p>
                <p className="text-sm text-gray-600 mt-2">
                  Holylabs Ltd<br />
                  Registered in United Kingdom
                </p>
              </div>
            </div>
          </section>

          {/* Back to Home */}
          <div className="pt-8 border-t border-gray-200">
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
