'use client';

import React from 'react';
import { AlertCircle } from 'lucide-react';
import Link from 'next/link';

const Checkout = ({ plan }) => {
  return (
    <div className="max-w-md mx-auto p-6">
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
        <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Payments Temporarily Unavailable
        </h3>
        <p className="text-gray-600 mb-4">
          We&apos;re updating our payment system. Please check back soon or contact us for assistance.
        </p>
        {plan && (
          <div className="bg-white rounded-lg p-4 mb-4">
            <p className="text-sm text-gray-500">Selected Plan</p>
            <p className="font-medium">{plan.name}</p>
            <p className="text-blue-600 font-bold">${plan.price}</p>
          </div>
        )}
        <Link
          href="/"
          className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          Back to Plans
        </Link>
      </div>
    </div>
  );
};

export default Checkout;
