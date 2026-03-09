"use client";

import React from 'react';
import Link from 'next/link';

export default function RefundPolicy() {
  const currentDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Refund Policy</h1>
          <p className="text-gray-600">Last updated: {currentDate}</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-8 space-y-6">
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Overview</h2>
            <p className="text-gray-700 leading-relaxed">
              Our goal is to ensure you are satisfied with your purchase. You may request a full refund within <strong>14 days</strong> of your purchase date. This Refund Policy states the refund window and how to request a refund.
            </p>
          </section>

          <section>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Refund Window</h3>
            <p className="text-gray-700 leading-relaxed">
              The refund window is <strong>14 days</strong> from the date of purchase. You must submit your refund request within these 14 days to be eligible.
            </p>
          </section>

          <section>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Eligibility Within the 14-Day Window</h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Refunds are available for unused data plans when the eSIM has not been activated and no data has been consumed.</li>
              <li>To request a refund, contact dima@holylabs.net with your order number and reason for the request. Approved refunds are processed to the original payment method within 7 business days.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Non-Refundable After Use or After the 14-Day Window</h3>
            <p className="text-gray-700 leading-relaxed">
              eSIM plans that have been activated, used (including any amount of data consumption), or expired are non-refundable. Activation is determined by the first byte of data consumed or explicit activation recorded in our systems. Refunds are not available after the 14-day window from the purchase date.
            </p>
            <p className="text-gray-700 leading-relaxed">
              If you have scanned the QR code, installed the eSIM profile on your device, consumed any data, or if the plan&apos;s validity period has ended, we will not issue a refund for that purchase. Please ensure your device is compatible and that you follow the activation instructions carefully before purchasing. If you are unsure, contact support at dima@holylabs.net prior to purchase.
            </p>
          </section>

          <section>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Contact</h3>
            <p className="text-gray-700 leading-relaxed">For refund requests or questions, please contact: <a href="mailto:dima@holylabs.net" className="text-blue-600">dima@holylabs.net</a></p>
          </section>

          <div className="pt-8 border-t border-gray-200">
            <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium">← Back to Home</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
