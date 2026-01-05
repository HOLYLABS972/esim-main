'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { submitAffiliateApplication } from '../../src/services/affiliateService';
import Navbar from '../../src/components/Navbar';
import Footer from '../../src/components/Footer';
import { TrendingUp, Users, DollarSign, CheckCircle } from 'lucide-react';

export default function AffiliatePage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { register, handleSubmit, formState: { errors }, reset } = useForm();

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      await submitAffiliateApplication(data);
      setIsSubmitted(true);
      toast.success('Application submitted successfully! We\'ll review it and get back to you soon.');
      reset();
    } catch (error) {
      if (error.message.includes('already have an application')) {
        toast.error('You already have an application in progress or approved.');
      } else {
        toast.error('Failed to submit application. Please try again.');
      }
      console.error('Error submitting application:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <Navbar />

      <main className="pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Join the RoamJet Affiliate Program
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Earn money by promoting our eSIM plans to travelers worldwide.
              Get competitive commissions and exclusive partner benefits.
            </p>
          </motion.div>

          {/* Benefits Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="bg-white p-6 rounded-lg shadow-md"
            >
              <div className="w-12 h-12 bg-tufts-blue rounded-lg flex items-center justify-center mb-4">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Earn Competitive Commissions</h3>
              <p className="text-gray-600">
                Get paid for every successful referral. Our commission structure rewards your efforts.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-white p-6 rounded-lg shadow-md"
            >
              <div className="w-12 h-12 bg-tufts-blue rounded-lg flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Marketing Support</h3>
              <p className="text-gray-600">
                Access our marketing materials, banners, and promotional content to boost your success.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="bg-white p-6 rounded-lg shadow-md"
            >
              <div className="w-12 h-12 bg-tufts-blue rounded-lg flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Real-time Tracking</h3>
              <p className="text-gray-600">
                Monitor your performance with our dashboard. Track clicks, conversions, and earnings.
              </p>
            </motion.div>
          </div>

          {/* Application Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="max-w-3xl mx-auto bg-white rounded-lg shadow-lg p-8"
          >
            {isSubmitted ? (
              <div className="text-center py-12">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Application Submitted!
                </h2>
                <p className="text-gray-600 mb-6">
                  Thank you for applying to our affiliate program. We'll review your application
                  and get back to you within 2-3 business days.
                </p>
                <button
                  onClick={() => setIsSubmitted(false)}
                  className="px-6 py-3 bg-tufts-blue text-white rounded-lg hover:bg-cobalt-blue transition-colors"
                >
                  Submit Another Application
                </button>
              </div>
            ) : (
              <>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Affiliate Application Form
                </h2>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  {/* Full Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      {...register('fullName', { required: 'Full name is required' })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-tufts-blue focus:border-transparent"
                      placeholder="John Doe"
                    />
                    {errors.fullName && (
                      <p className="mt-1 text-sm text-red-600">{errors.fullName.message}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      {...register('email', {
                        required: 'Email is required',
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: 'Invalid email address'
                        }
                      })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-tufts-blue focus:border-transparent"
                      placeholder="john@example.com"
                    />
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                    )}
                  </div>

                  {/* Website/Platform */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Website or Social Media Profile *
                    </label>
                    <input
                      type="url"
                      {...register('website', {
                        required: 'Website or social media profile is required',
                        pattern: {
                          value: /^https?:\/\/.+/i,
                          message: 'Please enter a valid URL (starting with http:// or https://)'
                        }
                      })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-tufts-blue focus:border-transparent"
                      placeholder="https://yourwebsite.com or https://instagram.com/youraccount"
                    />
                    {errors.website && (
                      <p className="mt-1 text-sm text-red-600">{errors.website.message}</p>
                    )}
                  </div>

                  {/* Traffic Source */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Where will you bring traffic from? *
                    </label>
                    <textarea
                      {...register('trafficSource', {
                        required: 'Please describe your traffic sources',
                        minLength: {
                          value: 20,
                          message: 'Please provide more details (at least 20 characters)'
                        }
                      })}
                      rows="4"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-tufts-blue focus:border-transparent"
                      placeholder="Describe your traffic sources (e.g., travel blog, Instagram, YouTube channel, email list, etc.)"
                    />
                    {errors.trafficSource && (
                      <p className="mt-1 text-sm text-red-600">{errors.trafficSource.message}</p>
                    )}
                  </div>

                  {/* Why Join */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Why do you want to join our affiliate program? *
                    </label>
                    <textarea
                      {...register('whyJoin', {
                        required: 'Please tell us why you want to join',
                        minLength: {
                          value: 20,
                          message: 'Please provide more details (at least 20 characters)'
                        }
                      })}
                      rows="4"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-tufts-blue focus:border-transparent"
                      placeholder="Tell us about your interest in our program and how you plan to promote our eSIM products"
                    />
                    {errors.whyJoin && (
                      <p className="mt-1 text-sm text-red-600">{errors.whyJoin.message}</p>
                    )}
                  </div>

                  {/* Experience */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Do you have experience with affiliate marketing?
                    </label>
                    <select
                      {...register('experience')}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-tufts-blue focus:border-transparent"
                    >
                      <option value="none">No experience</option>
                      <option value="beginner">Beginner (less than 1 year)</option>
                      <option value="intermediate">Intermediate (1-3 years)</option>
                      <option value="advanced">Advanced (3+ years)</option>
                    </select>
                  </div>

                  {/* Monthly Visitors */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Estimated monthly visitors/followers *
                    </label>
                    <select
                      {...register('monthlyVisitors', { required: 'Please select a range' })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-tufts-blue focus:border-transparent"
                    >
                      <option value="">Select a range</option>
                      <option value="0-1000">0 - 1,000</option>
                      <option value="1000-5000">1,000 - 5,000</option>
                      <option value="5000-10000">5,000 - 10,000</option>
                      <option value="10000-50000">10,000 - 50,000</option>
                      <option value="50000+">50,000+</option>
                    </select>
                    {errors.monthlyVisitors && (
                      <p className="mt-1 text-sm text-red-600">{errors.monthlyVisitors.message}</p>
                    )}
                  </div>

                  {/* Motivation */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Are you looking to make extra money selling eSIMs? *
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          {...register('motivation', { required: 'Please select an option' })}
                          value="primary-income"
                          className="mr-2"
                        />
                        <span className="text-gray-700">Yes, as a primary income source</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          {...register('motivation')}
                          value="extra-income"
                          className="mr-2"
                        />
                        <span className="text-gray-700">Yes, as extra/side income</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          {...register('motivation')}
                          value="passion"
                          className="mr-2"
                        />
                        <span className="text-gray-700">No, I'm more interested in sharing useful products</span>
                      </label>
                    </div>
                    {errors.motivation && (
                      <p className="mt-1 text-sm text-red-600">{errors.motivation.message}</p>
                    )}
                  </div>

                  {/* Additional Notes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Additional Information (Optional)
                    </label>
                    <textarea
                      {...register('additionalNotes')}
                      rows="3"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-tufts-blue focus:border-transparent"
                      placeholder="Any other information you'd like to share with us"
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-8 py-3 bg-tufts-blue text-white font-semibold rounded-lg hover:bg-cobalt-blue transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? 'Submitting...' : 'Submit Application'}
                    </button>
                  </div>
                </form>
              </>
            )}
          </motion.div>

          {/* FAQ Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="max-w-3xl mx-auto mt-16"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
              Frequently Asked Questions
            </h2>
            <div className="space-y-4">
              <details className="bg-white rounded-lg shadow-md p-6">
                <summary className="font-semibold text-gray-900 cursor-pointer">
                  How much can I earn?
                </summary>
                <p className="mt-2 text-gray-600">
                  Commissions vary based on the plan sold and your performance tier.
                  Top affiliates can earn significant income promoting our eSIM plans.
                </p>
              </details>

              <details className="bg-white rounded-lg shadow-md p-6">
                <summary className="font-semibold text-gray-900 cursor-pointer">
                  When do I get paid?
                </summary>
                <p className="mt-2 text-gray-600">
                  Payments are processed monthly, typically within 30 days after the end
                  of each month, once you reach the minimum payout threshold.
                </p>
              </details>

              <details className="bg-white rounded-lg shadow-md p-6">
                <summary className="font-semibold text-gray-900 cursor-pointer">
                  What marketing materials do you provide?
                </summary>
                <p className="mt-2 text-gray-600">
                  We provide banners, text links, product images, email templates, and
                  promotional content. You'll get access to our affiliate dashboard with
                  all materials once approved.
                </p>
              </details>

              <details className="bg-white rounded-lg shadow-md p-6">
                <summary className="font-semibold text-gray-900 cursor-pointer">
                  How long does the approval process take?
                </summary>
                <p className="mt-2 text-gray-600">
                  We typically review applications within 2-3 business days. You'll receive
                  an email notification once your application has been reviewed.
                </p>
              </details>
            </div>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
