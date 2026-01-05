'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { submitAffiliateApplication } from '../../src/services/affiliateService';
import Navbar from '../../src/components/Navbar';
import { TrendingUp, Users, DollarSign, CheckCircle, ArrowRight, ArrowLeft } from 'lucide-react';

export default function AffiliatePage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { register, handleSubmit, formState: { errors }, trigger, getValues, reset } = useForm({
    mode: 'onChange'
  });

  const totalSteps = 3;

  const nextStep = async () => {
    let fieldsToValidate = [];

    if (currentStep === 1) {
      fieldsToValidate = ['fullName', 'email', 'website'];
    } else if (currentStep === 2) {
      fieldsToValidate = ['trafficSource', 'monthlyVisitors', 'experience'];
    }

    const isValid = await trigger(fieldsToValidate);

    if (isValid && currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      await submitAffiliateApplication(data);
      setIsSubmitted(true);
      toast.success('Application submitted successfully! We\'ll review it and get back to you soon.');
      reset();
      setCurrentStep(1);
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

  const ProgressBar = () => (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-2">
        {[1, 2, 3].map((step) => (
          <div key={step} className="flex items-center flex-1">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all ${
              currentStep >= step
                ? 'bg-tufts-blue border-tufts-blue text-white'
                : 'bg-white border-gray-300 text-gray-400'
            }`}>
              {step}
            </div>
            {step < 3 && (
              <div className={`flex-1 h-1 mx-2 transition-all ${
                currentStep > step ? 'bg-tufts-blue' : 'bg-gray-300'
              }`} />
            )}
          </div>
        ))}
      </div>
      <div className="flex justify-between text-sm mt-2">
        <span className={currentStep >= 1 ? 'text-tufts-blue font-medium' : 'text-gray-400'}>
          Basic Info
        </span>
        <span className={currentStep >= 2 ? 'text-tufts-blue font-medium' : 'text-gray-400'}>
          Your Platform
        </span>
        <span className={currentStep >= 3 ? 'text-tufts-blue font-medium' : 'text-gray-400'}>
          Motivation
        </span>
      </div>
    </div>
  );

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

                <ProgressBar />

                <form onSubmit={handleSubmit(onSubmit)}>
                  <AnimatePresence mode="wait">
                    {/* Step 1: Basic Information */}
                    {currentStep === 1 && (
                      <motion.div
                        key="step1"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-6"
                      >
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
                      </motion.div>
                    )}

                    {/* Step 2: Your Platform */}
                    {currentStep === 2 && (
                      <motion.div
                        key="step2"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-6"
                      >
                        {/* Traffic Source */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Where will you bring traffic from? *
                          </label>
                          <textarea
                            {...register('trafficSource', {
                              required: 'Please describe your traffic sources'
                            })}
                            rows="4"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-tufts-blue focus:border-transparent"
                            placeholder="Describe your traffic sources (e.g., travel blog, Instagram, YouTube channel, email list, etc.)"
                          />
                          {errors.trafficSource && (
                            <p className="mt-1 text-sm text-red-600">{errors.trafficSource.message}</p>
                          )}
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

                        {/* Experience */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Do you have experience with affiliate marketing? *
                          </label>
                          <select
                            {...register('experience', { required: 'Please select your experience level' })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-tufts-blue focus:border-transparent"
                          >
                            <option value="">Select your experience level</option>
                            <option value="none">No experience</option>
                            <option value="beginner">Beginner (less than 1 year)</option>
                            <option value="intermediate">Intermediate (1-3 years)</option>
                            <option value="advanced">Advanced (3+ years)</option>
                          </select>
                          {errors.experience && (
                            <p className="mt-1 text-sm text-red-600">{errors.experience.message}</p>
                          )}
                        </div>
                      </motion.div>
                    )}

                    {/* Step 3: Motivation & Details */}
                    {currentStep === 3 && (
                      <motion.div
                        key="step3"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-6"
                      >
                        {/* Why Join */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Why do you want to join our affiliate program? *
                          </label>
                          <select
                            {...register('whyJoin', { required: 'Please select a reason' })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-tufts-blue focus:border-transparent"
                          >
                            <option value="">Select a reason</option>
                            <option value="earn-income">I want to earn extra income</option>
                            <option value="promote-travel">I love promoting travel products</option>
                            <option value="content-creator">I'm a content creator/blogger in the travel niche</option>
                            <option value="have-audience">I have an audience that would benefit from eSIMs</option>
                            <option value="business-opportunity">I see this as a business opportunity</option>
                            <option value="other">Other</option>
                          </select>
                          {errors.whyJoin && (
                            <p className="mt-1 text-sm text-red-600">{errors.whyJoin.message}</p>
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
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Navigation Buttons */}
                  <div className="flex justify-between mt-8">
                    <button
                      type="button"
                      onClick={prevStep}
                      className={`flex items-center px-6 py-3 rounded-lg font-semibold transition-colors ${
                        currentStep === 1
                          ? 'invisible'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Previous
                    </button>

                    {currentStep < totalSteps ? (
                      <button
                        type="button"
                        onClick={nextStep}
                        className="flex items-center px-6 py-3 bg-tufts-blue text-white font-semibold rounded-lg hover:bg-cobalt-blue transition-colors"
                      >
                        Next
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </button>
                    ) : (
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-8 py-3 bg-tufts-blue text-white font-semibold rounded-lg hover:bg-cobalt-blue transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? 'Submitting...' : 'Submit Application'}
                      </button>
                    )}
                  </div>
                </form>
              </>
            )}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
