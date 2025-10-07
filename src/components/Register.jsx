"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { detectLanguageFromPath } from '../utils/languageUtils';

const Register = () => {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [referralCode, setReferralCode] = useState('');
  const { signup } = useAuth();
  const { t, locale } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // Get current language for localized URLs
  const getCurrentLanguage = () => {
    if (locale) return locale;
    if (typeof window !== 'undefined') {
      const savedLanguage = localStorage.getItem('roamjet-language');
      if (savedLanguage) return savedLanguage;
    }
    return detectLanguageFromPath(pathname);
  };

  const currentLanguage = getCurrentLanguage();

  const getLocalizedUrl = (path) => {
    if (currentLanguage === 'en') {
      return path;
    }
    return `/${currentLanguage}${path}`;
  };

  // Check for referral code in URL
  useEffect(() => {
    const refCode = searchParams.get('ref');
    if (refCode) {
      setReferralCode(refCode.toUpperCase());
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!displayName || !email || !password) {
      toast.error(t('auth.register.fillAllFields', 'Please fill in all fields'));
      return;
    }

    if (password.length < 6) {
      toast.error(t('auth.register.passwordTooShort', 'Password must be at least 6 characters'));
      return;
    }

    try {
      setLoading(true);
      const result = await signup(email, password, displayName, referralCode);
      
      if (result.pending) {
        toast.success(t('auth.register.accountCreated', 'Account created! Please check your email for verification code.'));
        router.push(`/verify-email?email=${encodeURIComponent(email)}&name=${encodeURIComponent(displayName)}`);
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast.error(error.message || t('auth.register.registrationFailed', 'Failed to send verification code'));
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen flex">
      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-4 lg:px-16 xl:px-16">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="max-w-sm w-full"
        >
          <div>
            <h2 className="text-center text-3xl font-semibold text-eerie-black" style={{ fontFamily: 'Open Sans, sans-serif' }}>
              {t('auth.register.title', 'Create your account')}
            </h2>
            <p className="mt-2 text-center text-sm text-cool-black">
              {t('auth.register.subtitle', 'Or')}{' '}
              <Link
                href={getLocalizedUrl('/login')}
                className="font-semibold text-tufts-blue hover:text-cobalt-blue transition-colors"
              >
                {t('auth.register.signInExisting', 'sign in to your existing account')}
              </Link>
            </p>
          </div>
          
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="displayName" className="form-label">
                  {t('auth.register.fullNameLabel', 'Full Name')}
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-cool-black opacity-60" />
                  </div>
                  <input
                    id="displayName"
                    name="displayName"
                    type="text"
                    autoComplete="name"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="input-field pl-12"
                    placeholder={t('auth.register.fullNamePlaceholder', 'Enter your full name')}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="form-label">
                  {t('auth.register.emailLabel', 'Email address')}
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-cool-black opacity-60" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-field pl-12"
                    placeholder={t('auth.register.emailPlaceholder', 'Enter your email')}
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="password" className="form-label">
                  {t('auth.register.passwordLabel', 'Password')}
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-cool-black opacity-60" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field pl-12 pr-12"
                    placeholder={t('auth.register.passwordPlaceholder', 'Enter your password')}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-4 flex items-center hover:bg-gray-50 rounded-r-lg transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-cool-black opacity-60" />
                    ) : (
                      <Eye className="h-5 w-5 text-cool-black opacity-60" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  t('auth.register.createAccountButton', 'Create Account')
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>

      {/* Right side - Image/Branding */}
      <div className="hidden lg:block relative w-0 flex-1">
        <div className="absolute inset-0">
          <img
            className="absolute inset-0 h-full w-full object-cover mix-blend-multiply"
            src=" /images/logo_icon/vwvw.avif"
            alt="Travel background"
          />
        </div>
      </div>
    </div>
  );
};

export default Register;
