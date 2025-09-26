'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { MapPin, Mail, Phone, Facebook, Twitter, Instagram, Linkedin, Youtube } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useI18n } from '../contexts/I18nContext';

const Footer = () => {
  const pathname = usePathname();
  const { t } = useI18n();
  const currentYear = new Date().getFullYear();
  // Hardcoded contact information
  const contactInfo = {
    email: 'support@roamjet.net',
    phone: '+447366891452',
    address: 'Holylabs Ltd, 275 New North Road Islington # 1432, London, N1 7AA, United Kingdom'
  };
  
  // Hardcoded social media links
  const socialMedia = {
    instagram: 'https://www.instagram.com/roam.jet',
    facebook: 'https://www.facebook.com/profile.php?id=61581184673040',
    linkedin: 'https://www.linkedin.com/showcase/roamjet/'
  };
  
  
  const loading = false;

  // Check if we're on a language-specific page
  const isLanguagePage = ['/hebrew', '/arabic', '/russian', '/german', '/french', '/spanish'].includes(pathname);
  
  // Use translations only on language-specific pages, otherwise use English
  const getText = (key, englishText) => {
    return isLanguagePage ? t(key, englishText) : englishText;
  };

  const quickLinks = [
    { name: getText('footer.home', 'Home'), path: '/' },
    { name: getText('footer.blog', 'Blog'), path: '/blog' },
    { name: getText('footer.jobs', 'Jobs'), path: '/jobs' },
    { name: getText('footer.contactUs', 'Contact Us'), path: '/contact' }
  ];

  const usefulLinks = [
    { name: getText('footer.privacyPolicy', 'Privacy Policy'), path: '/privacy-policy' },
    { name: getText('footer.termsOfService', 'Terms of Service'), path: '/terms-of-service' },
    { name: getText('footer.cookiePolicy', 'Cookie Policy'), path: '/cookie-policy' },
    { name: getText('footer.affiliateProgram', 'Affiliate Program'), path: '/affiliate' }
  ];

  // Create social links array with only non-empty URLs
  const socialLinks = [
    { icon: Facebook, url: socialMedia.facebook, name: 'Facebook' },
    { icon: Twitter, url: socialMedia.twitter, name: 'Twitter' },
    { icon: Instagram, url: socialMedia.instagram, name: 'Instagram' },
    { icon: Linkedin, url: socialMedia.linkedin, name: 'LinkedIn' },
    { icon: Youtube, url: socialMedia.youtube, name: 'YouTube' }
  ].filter(link => link.url && link.url.trim() !== '');

  return (
    <footer className="footer-area relative bg-eerie-black text-eerie-black overflow-hidden">
      <div className="bg-white rounded-2xl p-8 mt-2 mb-2 mx-2">
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
                <span className="text-2xl font-bold text-eerie-black ml-2">{getText('footer.brandName', 'RoamJet')}</span>
              </Link>
              <p className="footer-item__desc text-eerie-black mb-6 leading-relaxed">
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
              <h5 className="footer-item__title text-xl font-semibold mb-6">{getText('footer.quickLinks', 'Quick Links')}</h5>
              <ul className="footer-menu space-y-3">
                {quickLinks.map((link, index) => (
                  <li key={index} className="footer-menu__item">
                    <Link 
                      href={link.path} 
                      className="footer-menu__link text-eerie-black hover:text-cobalt-blue transition-colors duration-200"
                    >
                      {link.name}
                    </Link>
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
              <h5 className="footer-item__title text-xl font-semibold mb-6">{getText('footer.usefulLinks', 'Useful Links')}</h5>
              <ul className="footer-menu space-y-3">
                {usefulLinks.map((link, index) => (
                  <li key={index} className="footer-menu__item">
                    <Link 
                      href={link.path} 
                      className="footer-menu__link text-eerie-black hover:text-cobalt-blue transition-colors duration-200"
                    >
                      {link.name}
                    </Link>
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
              <h5 className="footer-item__title text-xl font-semibold mb-6">{getText('footer.contactUs', 'Contact Us')}</h5>
              <ul className="footer-contact-menu space-y-4">
                {/* Address - only show if address is provided */}
                {contactInfo.address && contactInfo.address.trim() !== '' && (
                  <li className="footer-contact-menu__item flex items-center space-x-3">
                    <div className="footer-contact-menu__item-icon w-10 h-10 bg-cobalt-blue rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <MapPin className="w-5 h-5" color="white" />
                    </div>
                    <div className="footer-contact-menu__item-content">
                      <p className="footer-contact__desc text-eerie-black">
                        {contactInfo.address}
                      </p>
                    </div>
                  </li>
                )}
                
                {/* Email - only show if email is provided */}
                {contactInfo.email && contactInfo.email.trim() !== '' && (
                  <li className="footer-contact-menu__item flex items-center space-x-3">
                    <div className="footer-contact-menu__item-icon w-10 h-10 bg-cobalt-blue rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <Mail className="w-5 h-5" color="white" />
                    </div>
                    <div className="footer-contact-menu__item-content">
                      <a 
                        className="footer-contact__desc text-eerie-black hover:text-cobalt-blue transition-colors duration-200" 
                        href={`mailto:${contactInfo.email}`}
                      >
                        {contactInfo.email}
                      </a>
                    </div>
                  </li>
                )}
                
                {/* Phone - only show if phone is provided */}
                {contactInfo.phone && contactInfo.phone.trim() !== '' && (
                  <li className="footer-contact-menu__item flex items-center space-x-3">
                    <div className="footer-contact-menu__item-icon w-10 h-10 bg-cobalt-blue rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <Phone className="w-5 h-5" color="white" />
                    </div>
                    <div className="footer-contact-menu__item-content">
                      <a 
                        className="footer-contact__desc text-eerie-black hover:text-cobalt-blue transition-colors duration-200" 
                        href="https://t.me/theholylabs"
                      >
                        {contactInfo.phone}
                      </a>
                    </div>
                  </li>
                )}
                
                {/* Show message if no contact info is available */}
                {!contactInfo.address && !contactInfo.email && !contactInfo.phone && !loading && (
                  <li className="footer-contact-menu__item">
                    <p className="footer-contact__desc text-gray-500 italic">
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
      <div className="bottom-footer py-6 border-t border-eerie-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="bottom-footer-text text-eerie-black">
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
