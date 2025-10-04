import React from 'react';
import { ArrowLeft, RefreshCw, Clock, Shield, AlertTriangle, FileText } from 'lucide-react';
import Link from 'next/link';

const ReturnPolicy = () => {
  const sections = [
    {
      icon: Clock,
      title: "Return & Refund Eligibility",
      content: [
        "Digital eSIM products are generally non-refundable once activated due to their nature as digital goods",
        "Refunds may be considered within 24 hours of purchase if the eSIM has not been activated",
        "Refunds are not available for data plans that have been partially or fully consumed",
        "Service issues caused by network provider problems may qualify for credit or replacement",
        "Refunds are processed within 5-10 business days to the original payment method"
      ]
    },
    {
      icon: AlertTriangle,
      title: "Non-Refundable Circumstances",
      content: [
        "eSIM plans that have been activated and connected to a device",
        "Data plans where usage has exceeded 10% of the total data allowance",
        "Plans that have been used for more than 24 hours from activation",
        "Refunds requested due to customer's device incompatibility (customer responsibility to verify compatibility)",
        "Refunds requested due to customer's travel plans changing or cancellation",
        "Plans purchased during promotional periods may have different refund terms"
      ]
    },
    {
      icon: Shield,
      title: "Refund Process",
      content: [
        "Submit a refund request through our customer support within the eligible timeframe",
        "Provide order number, email address, and reason for refund request",
        "Our team will review the request within 2-3 business days",
        "Approved refunds will be processed to the original payment method",
        "Credit card refunds may take 5-10 business days to appear on your statement",
        "Digital wallet refunds (PayPal, Apple Pay, Google Pay) may take 3-5 business days"
      ]
    },
    {
      icon: RefreshCw,
      title: "Service Credits & Replacements",
      content: [
        "If service issues are due to our error or network provider problems, we may offer service credits",
        "Service credits are valid for 90 days from the issue date",
        "Credits can be used towards future eSIM purchases on our platform",
        "Defective or non-working eSIMs may be replaced at no additional cost",
        "Replacement requests must be submitted within 48 hours of activation",
        "We reserve the right to investigate usage patterns before approving replacements"
      ]
    },
    {
      icon: FileText,
      title: "Dispute Resolution",
      content: [
        "If you disagree with a refund decision, you may request a review by our management team",
        "All disputes must be submitted in writing with supporting documentation",
        "We will respond to dispute requests within 5 business days",
        "For payment disputes, customers may contact their payment provider directly",
        "We comply with all applicable consumer protection laws and regulations",
        "This policy is subject to local laws and regulations in your jurisdiction"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center space-x-4">
            <Link 
              href="/"
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm font-medium">Back to Home</span>
            </Link>
          </div>
          <div className="mt-4">
            <h1 className="text-3xl font-bold text-gray-900">Return Policy</h1>
            <p className="text-gray-600 mt-2">
              Information about returns, refunds, and exchanges for eSIM services
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Introduction */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Policy Overview</h2>
          </div>
          <p className="text-gray-700 leading-relaxed">
            This Return Policy outlines the terms and conditions for returns, refunds, and exchanges 
            of our eSIM services. Please read this policy carefully before making a purchase. 
            By purchasing our eSIM products, you agree to the terms outlined in this policy.
          </p>
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800 text-sm">
              <strong>Important:</strong> Due to the digital nature of eSIM products, 
              most purchases are final once activated. Please ensure your device is compatible 
              and your travel plans are confirmed before purchasing.
            </p>
          </div>
        </div>

        {/* Policy Sections */}
        <div className="space-y-6">
          {sections.map((section, index) => {
            const Icon = section.icon;
            return (
              <div key={index} className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Icon className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">{section.title}</h3>
                </div>
                <ul className="space-y-3">
                  {section.content.map((item, itemIndex) => (
                    <li key={itemIndex} className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* Contact Information */}
        <div className="bg-white rounded-xl shadow-lg p-6 mt-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <Shield className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900">Need Help?</h3>
          </div>
          <p className="text-gray-700 mb-4">
            If you have questions about our return policy or need to request a refund, 
            please contact our customer support team.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Customer Support</h4>
              <p className="text-gray-600">Email: support@esimplans.com</p>
              <p className="text-gray-600">Response Time: Within 24 hours</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Business Hours</h4>
              <p className="text-gray-600">Monday - Friday: 9 AM - 6 PM (GMT)</p>
              <p className="text-gray-600">Weekend: 10 AM - 4 PM (GMT)</p>
            </div>
          </div>
        </div>

        {/* Last Updated */}
        <div className="text-center mt-8">
          <p className="text-gray-500 text-sm">
            Last updated: {new Date().toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ReturnPolicy;
