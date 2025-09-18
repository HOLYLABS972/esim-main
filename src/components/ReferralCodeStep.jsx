'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Gift, CheckCircle, X } from 'lucide-react';
import { isValidReferralCode, hasUserUsedReferralCode } from '../services/referralService';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const ReferralCodeStep = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { completeGoogleSignup, currentUser } = useAuth();
  const [referralCode, setReferralCode] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [isValid, setIsValid] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasUsedReferral, setHasUsedReferral] = useState(false);
  const [isCheckingReferralStatus, setIsCheckingReferralStatus] = useState(false);

  // Get user data from URL params (passed from registration)
  const email = searchParams.get('email');
  const name = searchParams.get('name');
  const isGoogleSignup = searchParams.get('google') === 'true';

  useEffect(() => {
    // If no email/name, redirect to register
    if (!email || !name) {
      router.push('/register');
    }
  }, [email, name, router]);

  // Check if user has already used a referral code
  useEffect(() => {
    const checkReferralStatus = async () => {
      if (currentUser) {
        setIsCheckingReferralStatus(true);
        try {
          const hasUsed = await hasUserUsedReferralCode(currentUser.uid);
          setHasUsedReferral(hasUsed);
        } catch (error) {
          console.error('Error checking referral status:', error);
        } finally {
          setIsCheckingReferralStatus(false);
        }
      }
    };

    checkReferralStatus();
  }, [currentUser]);

  const validateReferralCode = async (code) => {
    if (!code.trim()) {
      setIsValid(false);
      setValidationError('');
      return;
    }

    setIsValidating(true);
    setValidationError('');

    try {
      const isValidCode = await isValidReferralCode(code.trim().toUpperCase());
      setIsValid(isValidCode);
      
      if (!isValidCode) {
        setValidationError('Invalid or expired referral code');
      }
    } catch (error) {
      console.error('Error validating referral code:', error);
      setIsValid(false);
      setValidationError('Error validating referral code');
    } finally {
      setIsValidating(false);
    }
  };

  const handleCodeChange = (e) => {
    const value = e.target.value.toUpperCase();
    setReferralCode(value);
    
    // Clear previous validation
    setIsValid(false);
    setValidationError('');
    
    // Validate after a short delay
    if (value.length >= 3) {
      const timeoutId = setTimeout(() => {
        validateReferralCode(value);
      }, 500);
      
      return () => clearTimeout(timeoutId);
    }
  };

  const handleSkip = async () => {
    // Store user data and proceed to email verification
    const userData = {
      email,
      name,
      referralCode: null,
      isGoogleSignup
    };
    
    localStorage.setItem('pendingUserData', JSON.stringify(userData));
    
    if (isGoogleSignup) {
      // For Google signup, complete the signup process
      try {
        await completeGoogleSignup();
        router.push('/dashboard');
      } catch (error) {
        console.error('Error completing Google signup:', error);
        toast.error('Failed to complete signup');
      }
    } else {
      // For regular signup, go to email verification
      router.push(`/verify-email?email=${encodeURIComponent(email)}&name=${encodeURIComponent(name)}`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!referralCode.trim()) {
      toast.error('Please enter a referral code or skip this step');
      return;
    }

    if (!isValid) {
      toast.error('Please enter a valid referral code');
      return;
    }

    setIsSubmitting(true);

    try {
      // Store user data with referral code
      const userData = {
        email,
        name,
        referralCode: referralCode.trim().toUpperCase(),
        isGoogleSignup
      };
      
      localStorage.setItem('pendingUserData', JSON.stringify(userData));
      
      toast.success('Referral code applied successfully!');
      
      if (isGoogleSignup) {
        // For Google signup, complete the signup process
        try {
          await completeGoogleSignup();
          router.push(`/hot-deals?email=${encodeURIComponent(email)}&name=${encodeURIComponent(name)}&referralCode=${encodeURIComponent(referralCode.trim().toUpperCase())}`);
        } catch (error) {
          console.error('Error completing Google signup:', error);
          toast.error('Failed to complete signup');
        }
      } else {
        // For regular signup, go to email verification
        router.push(`/verify-email?email=${encodeURIComponent(email)}&name=${encodeURIComponent(name)}&referralCode=${encodeURIComponent(referralCode.trim().toUpperCase())}`);
      }
    } catch (error) {
      console.error('Error applying referral code:', error);
      toast.error('Failed to apply referral code');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Referral Code</h1>
              <p className="text-sm text-gray-600">Optional step</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-md mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg p-6"
        >
          <div className="text-center mb-6">
            <div className="bg-blue-100 p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
              <Gift className="w-10 h-10 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Got a Referral Code?</h2>
            <p className="text-gray-600">
              Enter a referral code from a friend to get started with special benefits
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Referral Code
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={referralCode}
                  onChange={handleCodeChange}
                  placeholder="Enter referral code"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-lg font-mono tracking-wider"
                  maxLength={8}
                  disabled={hasUsedReferral}
                />
                {isValidating && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                  </div>
                )}
                {isValid && !isValidating && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                )}
                {validationError && !isValidating && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <X className="w-5 h-5 text-red-600" />
                  </div>
                )}
              </div>
              
              {validationError && (
                <p className="text-red-600 text-sm mt-2">{validationError}</p>
              )}
              
              {isValid && (
                <p className="text-green-600 text-sm mt-2">✓ Valid referral code!</p>
              )}
            </div>

            <div className="space-y-3">
              {!hasUsedReferral && (
                <button
                  type="submit"
                  disabled={isSubmitting || isValidating || (referralCode && !isValid)}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-3 rounded-lg text-white font-medium transition-colors"
                >
                  {isSubmitting ? 'Applying...' : 'Apply Referral Code'}
                </button>
              )}
              
              <button
                type="button"
                onClick={handleSkip}
                className="w-full text-gray-600 hover:text-gray-800 text-sm underline transition-colors"
              >
                Skip this step
              </button>
            </div>
          </form>

        </motion.div>
      </div>
    </div>
  );
};

export default ReferralCodeStep;
