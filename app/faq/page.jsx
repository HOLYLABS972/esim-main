'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronUp } from 'lucide-react';

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const faqs = [
    {
      category: "Getting Started",
      questions: [
        {
          question: "What is an eSIM and how does it work?",
          answer: "An eSIM (embedded SIM) is a digital SIM card that's built into your device. Instead of inserting a physical SIM card, you can download and activate a cellular plan directly onto your device. This allows you to switch between carriers and plans without needing to swap physical cards."
        },
        {
          question: "Which devices support eSIM?",
          answer: "Most modern smartphones support eSIM, including iPhone XS and newer, Google Pixel 3 and newer, Samsung Galaxy S20 and newer, and many others. Check our Device Compatibility page to see if your device is supported."
        },
        {
          question: "How do I activate my eSIM?",
          answer: "After purchase, you'll receive a QR code via email. Simply scan this code with your device's camera in the cellular settings, and your eSIM will be activated automatically. Detailed instructions are provided for each device type."
        },
        {
          question: "Do I need to remove my physical SIM card?",
          answer: "No, you don't need to remove your physical SIM card. Most modern devices support dual SIM functionality, allowing you to use both your physical SIM and eSIM simultaneously."
        }
      ]
    },
    {
      category: "Billing & Plans",
      questions: [
        {
          question: "What payment methods do you accept?",
          answer: "We accept all major credit cards (Visa, Mastercard, American Express), PayPal, Apple Pay, Google Pay, and various local payment methods. All payments are securely processed through Stripe."
        },
        {
          question: "Can I get a refund if I'm not satisfied?",
          answer: "Yes, we offer a 7-day money-back guarantee for unused data plans. If you haven't activated your eSIM or used any data, you can request a full refund within 7 days of purchase."
        },
        {
          question: "Do your plans include unlimited data?",
          answer: "We offer both limited and unlimited data plans. Unlimited plans may have fair usage policies or speed throttling after certain thresholds, which are clearly stated in the plan details."
        },
        {
          question: "How long does my eSIM plan last?",
          answer: "The validity period starts when you first connect to a network in your destination country. Plans range from 7 to 30 days depending on which package you choose. The exact duration is shown on each plan."
        },
        {
          question: "Can I top up or extend my plan?",
          answer: "Yes, you can purchase additional data or extend your plan duration at any time through your dashboard. Top-ups are instant and don't require scanning a new QR code."
        }
      ]
    },
    {
      category: "Connectivity Issues",
      questions: [
        {
          question: "My eSIM isn't connecting to the network. What should I do?",
          answer: "First, ensure you're in an area with network coverage. Try restarting your device, toggling airplane mode on/off, or manually selecting the network in your cellular settings. Make sure data roaming is enabled. If issues persist, contact our support team."
        },
        {
          question: "Why is my data speed slower than expected?",
          answer: "Data speeds can vary based on network congestion, your location, device capabilities, and plan type. Some plans may have speed limitations or throttling after certain usage thresholds. Check your plan details for specific speed information."
        },
        {
          question: "Can I use my eSIM for calls and SMS?",
          answer: "Our eSIM plans are primarily data-only. However, you can use VoIP services like WhatsApp, Skype, FaceTime, or other internet-based calling apps to make calls and send messages over your data connection."
        },
        {
          question: "How do I check my data usage?",
          answer: "You can monitor your data usage through your device's settings or our mobile app dashboard. We also send notifications when you're approaching your data limit."
        },
        {
          question: "What should I do if I run out of data?",
          answer: "You can easily purchase a top-up or new plan through your dashboard. The process is instant and doesn't require a new QR code scan."
        }
      ]
    },
    {
      category: "Account Management",
      questions: [
        {
          question: "How do I delete an eSIM from my device?",
          answer: "Go to your device's cellular settings, select the eSIM plan you want to remove, and choose 'Delete eSIM' or 'Remove Plan'. This will permanently delete the eSIM from your device. Note: You won't be able to reinstall the same eSIM profile after deletion."
        },
        {
          question: "Can I use the same eSIM on multiple devices?",
          answer: "No, each eSIM is tied to a single device. If you need eSIMs for multiple devices, you'll need to purchase separate plans for each device."
        },
        {
          question: "How do I change my account details?",
          answer: "You can update your account information by logging into your dashboard and going to Account Settings. There you can change your name, email, and other personal details."
        },
        {
          question: "What happens if I lose my QR code?",
          answer: "Don't worry! You can always access your QR code by logging into your dashboard. All your purchased eSIMs and their QR codes are saved in your account."
        }
      ]
    },
    {
      category: "Coverage & Availability",
      questions: [
        {
          question: "In which countries does RoamJet work?",
          answer: "RoamJet eSIMs work in 200+ countries worldwide. You can check the specific coverage and available plans for your destination on our eSIM Plans page."
        },
        {
          question: "Can I use my eSIM in multiple countries?",
          answer: "Yes! We offer regional and global plans that work in multiple countries. These are perfect for travelers visiting several destinations on one trip."
        },
        {
          question: "Do I need to buy a new eSIM for each country?",
          answer: "It depends on your travel plans. If you're visiting multiple countries in the same region, a regional plan is more economical. For single-country trips, country-specific plans often offer the best value."
        }
      ]
    },
    {
      category: "Security & Privacy",
      questions: [
        {
          question: "Is my payment information secure?",
          answer: "Yes, absolutely. All payments are processed through Stripe, a PCI DSS compliant payment processor. We use 256-bit SSL encryption and never store your complete payment card details on our servers."
        },
        {
          question: "What data do you collect?",
          answer: "We only collect essential information needed to provide our services: your name, email, and payment information. We never sell your data to third parties. For full details, see our Privacy Policy."
        },
        {
          question: "Is using an eSIM safe?",
          answer: "Yes, eSIM technology is very secure. It uses the same encryption standards as physical SIM cards and is built into your device's hardware, making it more secure than traditional SIM cards."
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-xl text-gray-600">
            Find answers to common questions about RoamJet eSIM services
          </p>
        </div>

        {/* Quick Links */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Navigation</h2>
          <div className="flex flex-wrap gap-3">
            {faqs.map((category, index) => (
              <button
                key={index}
                onClick={() => {
                  const element = document.getElementById(`category-${index}`);
                  element?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-4 py-2 bg-blue-50 text-tufts-blue rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
              >
                {category.category}
              </button>
            ))}
          </div>
        </div>

        {/* FAQ Categories */}
        <div className="space-y-8">
          {faqs.map((category, categoryIndex) => (
            <div key={categoryIndex} id={`category-${categoryIndex}`} className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-3 border-b border-gray-200">
                {category.category}
              </h2>
              <div className="space-y-4">
                {category.questions.map((faq, faqIndex) => {
                  const index = `${categoryIndex}-${faqIndex}`;
                  const isOpen = openIndex === index;
                  
                  return (
                    <div
                      key={faqIndex}
                      className="border border-gray-200 rounded-lg overflow-hidden hover:border-blue-300 transition-colors"
                    >
                      <button
                        onClick={() => toggleFAQ(index)}
                        className="w-full px-6 py-4 text-left flex justify-between items-center bg-white hover:bg-gray-50 transition-colors"
                      >
                        <span className="font-semibold text-gray-900 pr-8">
                          {faq.question}
                        </span>
                        {isOpen ? (
                          <ChevronUp className="w-5 h-5 text-tufts-blue flex-shrink-0" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                        )}
                      </button>
                      {isOpen && (
                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                          <p className="text-gray-700 leading-relaxed">
                            {faq.answer}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Contact Support */}
        <div className="mt-12 bg-tufts-blue rounded-lg p-8 text-white text-center">
          <h3 className="text-2xl font-bold mb-4">Still have questions?</h3>
          <p className="mb-6">
            Can't find the answer you're looking for? Our support team is here to help.
          </p>
          <a
            href="mailto:support@roamjet.net"
            className="inline-block bg-white text-tufts-blue font-semibold px-8 py-3 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Contact Support
          </a>
        </div>

        {/* Back to Home */}
        <div className="mt-8 text-center">
          <Link 
            href="/" 
            className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

