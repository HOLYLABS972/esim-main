'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Mail, Facebook, Twitter, Instagram, Youtube } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useI18n } from '../contexts/I18nContext';

const Footer = () => {
  const pathname = usePathname();
  const { t } = useI18n();
  const currentYear = new Date().getFullYear();
  // Hardcoded contact information
  const contactInfo = {
    email: 'support@roamjet.net'
  };
  
  // Hardcoded social media links
  const socialMedia = {
    instagram: 'https://www.instagram.com/esim.roamjet',
    facebook: 'https://www.facebook.com/profile.php?id=61581184673040',
    tiktok: 'https://www.tiktok.com/@roamjet'
  };
  
  
  const loading = false;

  // Check if we're on a language-specific page or blog page (which has i18n context)
  const isLanguagePage = [
    // New language-code routes
    '/he', '/ar', '/ru', '/de', '/fr', '/es',
    // Old language routes (for backward compatibility)
    '/hebrew', '/arabic', '/russian', '/german', '/french', '/spanish'
  ].includes(pathname);
  
  const isBlogPage = pathname.startsWith('/blog') || 
                    // New language-code blog routes
                    pathname.startsWith('/he/blog') || 
                    pathname.startsWith('/ar/blog') || 
                    pathname.startsWith('/ru/blog') || 
                    pathname.startsWith('/de/blog') || 
                    pathname.startsWith('/fr/blog') || 
                    pathname.startsWith('/es/blog') ||
                    // Old language blog routes (for backward compatibility)
                    pathname.startsWith('/hebrew/blog') || 
                    pathname.startsWith('/arabic/blog') || 
                    pathname.startsWith('/russian/blog') || 
                    pathname.startsWith('/german/blog') || 
                    pathname.startsWith('/french/blog') || 
                    pathname.startsWith('/spanish/blog');

  // Check for language-specific routes (e.g., /he/contact, /ru/login, etc.)
  const isLanguageSpecificPage = pathname.startsWith('/he/') || 
                                pathname.startsWith('/ar/') || 
                                pathname.startsWith('/ru/') || 
                                pathname.startsWith('/de/') || 
                                pathname.startsWith('/fr/') || 
                                pathname.startsWith('/es/') ||
                                // Old language routes (for backward compatibility)
                                pathname.startsWith('/hebrew/') || 
                                pathname.startsWith('/arabic/') || 
                                pathname.startsWith('/russian/') || 
                                pathname.startsWith('/german/') || 
                                pathname.startsWith('/french/') || 
                                pathname.startsWith('/spanish/');
  
  // Use translations on language-specific pages, blog pages, and language-specific routes
  const getText = (key, englishText) => {
    return (isLanguagePage || isBlogPage || isLanguageSpecificPage) ? t(key, englishText) : englishText;
  };

  // Helper function to get language prefix from pathname
  const getLanguagePrefix = () => {
    const languageCodes = ['ar', 'he', 'ru', 'de', 'fr', 'es'];
    for (const code of languageCodes) {
      if (pathname.startsWith(`/${code}/`) || pathname === `/${code}`) {
        return `/${code}`;
      }
    }
    return '';
  };

  const langPrefix = getLanguagePrefix();

  const quickLinks = [
    { name: getText('footer.home', 'Home'), path: '/' },
    { name: getText('footer.blog', 'Blog'), path: '/blog' },
    { name: getText('navbar.login', 'Login'), path: `${langPrefix}/login` }
  ];

  const usefulLinks = [
    { name: getText('footer.privacyPolicy', 'Privacy Policy'), path: `${langPrefix}/privacy-policy` },
    { name: getText('footer.termsOfService', 'Terms of Service'), path: `${langPrefix}/terms-of-service` },
    { name: getText('footer.affiliateProgram', 'Affiliate Program'), path: `${langPrefix}/affiliate-program` }
  ];

  // Custom TikTok Icon Component
  const TikTokIcon = ({ className }) => (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
    </svg>
  );

  // Create social links array with only non-empty URLs
  const socialLinks = [
    { icon: Facebook, url: socialMedia.facebook, name: 'Facebook' },
    { icon: Twitter, url: socialMedia.twitter, name: 'Twitter' },
    { icon: Instagram, url: socialMedia.instagram, name: 'Instagram' },
    { icon: TikTokIcon, url: socialMedia.tiktok, name: 'TikTok' },
    { icon: Youtube, url: socialMedia.youtube, name: 'YouTube' }
  ].filter(link => link.url && link.url.trim() !== '');

  return (
    <footer className="footer-area relative bg-gray-900 text-gray-100 overflow-hidden">
      <div className="bg-gray-800">
      {/* Background Decorative Elements */}
      <div className="footer-area__shape absolute inset-0 pointer-events-none">
        <div className="footer-area__shape-left absolute left-0 top-0 w-32 h-full opacity-5 bg-gradient-to-r from-eerie-black to-transparent"></div>
        <div className="footer-area__shape-right absolute right-0 top-0 w-32 h-full opacity-5 bg-gradient-to-l from-eerie-black to-transparent"></div>
      </div>

      {/* Footer Top */}
      <div className="footer-area__footer-top relative py-16">
        <div className="max-w-9xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            
            {/* Company Info */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="footer-item"
            >
              <Link href="/" className="footer-item__logo inline-block mb-4 flex items-center">
                <Image 
                  src="/images/logo_icon/logo.png" 
                  alt="RoamJet Logo" 
                  width={120}
                  height={40}
                  className="h-10 w-auto"
                />
                <span className="text-2xl font-semibold text-gray-100 ml-2">{getText('footer.brandName', 'RoamJet')}</span>
              </Link>
              <p className="footer-item__desc text-gray-300 text-sm mb-6 leading-relaxed">
                {getText('footer.companyDescription', 'Your trusted partner for global eSIM connectivity. Stay connected worldwide with our reliable data plans.')}
              </p>
              {socialLinks.length > 0 && (
                <ul className="social-list flex space-x-4">
                  {socialLinks.map((social, index) => {
                    const IconComponent = social.icon;
                    return (
                      <li key={index} className="social-list__item">
                        <a 
                          href={social.url} 
                          className="social-list__link w-10 h-10 bg-cobalt-blue hover:bg-cobalt-blue-700 rounded-full flex items-center justify-center transition-colors duration-200"
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={social.name}
                        >
                          <IconComponent className="w-5 h-5" color="white" />
                        </a>
                      </li>
                    );
                  })}
                </ul>
              )}
            </motion.div>

            {/* Quick Links */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="footer-item"
            >
              <h5 className="footer-item__title text-xl font-semibold mb-6 text-gray-100">{getText('footer.quickLinks', 'Quick Links')}</h5>
              <ul className="footer-menu space-y-3">
                {quickLinks.map((link, index) => (
                  <li key={index} className="footer-menu__item">
                    {link.external ? (
                      <a 
                        href={link.path} 
                        className="footer-menu__link text-gray-300 hover:text-blue-400 transition-colors duration-200"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {link.name}
                      </a>
                    ) : (
                      <Link 
                        href={link.path} 
                        className="footer-menu__link text-gray-300 hover:text-blue-400 transition-colors duration-200"
                      >
                        {link.name}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Useful Links */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="footer-item"
            >
              <h5 className="footer-item__title text-xl font-semibold mb-6 text-gray-100">{getText('footer.usefulLinks', 'Useful Links')}</h5>
              <ul className="footer-menu space-y-3">
                {usefulLinks.map((link, index) => (
                  <li key={index} className="footer-menu__item">
                    {link.external ? (
                      <a 
                        href={link.path} 
                        className="footer-menu__link text-gray-300 hover:text-blue-400 transition-colors duration-200"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {link.name}
                      </a>
                    ) : (
                      <Link 
                        href={link.path} 
                        className="footer-menu__link text-gray-300 hover:text-blue-400 transition-colors duration-200"
                      >
                        {link.name}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Contact Info */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="footer-item"
            >
              <h5 className="footer-item__title text-xl font-semibold mb-6 text-gray-100">{getText('footer.contactUs', 'Contact Us')}</h5>
              <ul className="footer-contact-menu space-y-4">
                {/* Email - only show if email is provided */}
                {contactInfo.email && contactInfo.email.trim() !== '' && (
                  <li className="footer-contact-menu__item flex items-center space-x-3">
                    <div className="footer-contact-menu__item-icon w-10 h-10 bg-cobalt-blue rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <Mail className="w-5 h-5" color="white" />
                    </div>
                    <div className="footer-contact-menu__item-content">
                      <a 
                        className="footer-contact__desc text-gray-300 text-sm hover:text-blue-400 transition-colors duration-200" 
                        href={`mailto:${contactInfo.email}`}
                      >
                        {contactInfo.email}
                      </a>
                      <p className="text-gray-400 text-xs mt-1">
                        {getText('contact.emailDescription', 'Send us an email anytime for support and inquiries')}
                      </p>
                    </div>
                  </li>
                )}
                
                {/* Show message if no contact info is available */}
                {!contactInfo.email && !loading && (
                  <li className="footer-contact-menu__item">
                    <p className="footer-contact__desc text-gray-400 italic">
                      {getText('footer.contactInfoNotAvailable', 'Contact information not available')}
                    </p>
                  </li>
                )}
              </ul>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="bottom-footer py-6 border-t border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="bottom-footer-text text-gray-300">
              &copy; {currentYear} <Link href="/" className="text-cobalt-blue hover:text-cobalt-blue transition-colors duration-200">{getText('footer.brandName', 'RoamJet')}</Link>. 
              {getText('footer.allRightsReserved', 'All rights reserved.')}
            </div>
          </div>
        </div>
      </div>
      </div>
    </footer>
  );
};

export default Footer;
