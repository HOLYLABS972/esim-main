"use client";

import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  Phone, 
  MapPin, 
  Clock, 
  Send, 
  User, 
  MessageSquare,
  Building,
  Globe,
  ChevronDown, 
  ChevronUp,
  Smartphone,
  CreditCard,
  Wifi,
  Settings
} from 'lucide-react';
import { useI18n } from '../contexts/I18nContext';
import { createContactRequest } from '../services/contactService';
import { getLanguageDirection, detectLanguageFromPath } from '../utils/languageUtils';
import { usePathname } from 'next/navigation';
import toast from 'react-hot-toast';

const Contact = () => {
  const { t, locale } = useI18n();
  const pathname = usePathname();
  
  // Get current language for RTL detection
  const getCurrentLanguage = () => {
    if (locale) return locale;
    if (typeof window !== 'undefined') {
      const savedLanguage = localStorage.getItem('roamjet-language');
      if (savedLanguage) return savedLanguage;
    }
    return detectLanguageFromPath(pathname);
  };

  const currentLanguage = getCurrentLanguage();
  const isRTL = getLanguageDirection(currentLanguage) === 'rtl';
  
  // Debug logging
  console.log('Contact component - Current locale:', locale, 'Language:', currentLanguage, 'Is RTL:', isRTL);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);
  // Hardcoded contact information
  const contactInfo = {
    email: 'support@roamjet.net',
    phone: '+447366891452',
    address: '275 New North Road Islington # 1432, London, N1 7AA, United Kingdom',
    companyName: 'Holylabs Ltd'
  };
  
  const businessHours = {
    monday: { open: '9:00 AM', close: '6:00 PM', closed: false },
    tuesday: { open: '9:00 AM', close: '6:00 PM', closed: false },
    wednesday: { open: '9:00 AM', close: '6:00 PM', closed: false },
    thursday: { open: '9:00 AM', close: '6:00 PM', closed: false },
    friday: { open: '9:00 AM', close: '5:00 PM', closed: false },
    saturday: { open: '10:00 AM', close: '4:00 PM', closed: false },
    sunday: { open: '10:00 AM', close: '4:00 PM', closed: false }
  };
  
  const loading = false;

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await createContactRequest(formData);
      toast.success(t('contact.messageSuccess', 'Your message has been sent successfully! We\'ll get back to you soon.'));
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        message: ''
      });
    } catch (error) {
      console.error('Error submitting contact request:', error);
      toast.error(t('contact.messageFailed', 'Failed to send message. Please try again.'));
    } finally {
      setIsSubmitting(false);
    }
  };


  // Create dynamic contact info array based on available data
  const getContactInfoArray = () => {
    console.log('Getting contact info array, contactInfo:', contactInfo);
    const info = [];
    
    if (contactInfo.email && contactInfo.email.trim() !== '') {
      console.log('Adding email:', contactInfo.email);
      info.push({
        icon: Mail,
        title: t('contact.emailUs', 'Email Us'),
        content: contactInfo.email,
        description: t('contact.emailDescription', 'Send us an email anytime'),
        link: `mailto:${contactInfo.email}`
      });
    }
    
    if (contactInfo.phone && contactInfo.phone.trim() !== '') {
      console.log('Adding phone:', contactInfo.phone);
      info.push({
        icon: Phone,
        title: t('contact.telegramUs', 'Telegram Us'),
        content: contactInfo.phone,
        description: t('contact.telegramDescription', 'Contact us via Telegram'),
        link: `https://t.me/theholylabs`
      });
    }
    
    console.log('Final contact info array:', info);
    return info;
  };

  // Create office location data from contact info
  const getOfficeLocation = () => {
    console.log('Getting office location, contactInfo:', contactInfo);
    
    // Check if we have any contact information
    const hasAddress = contactInfo.address && contactInfo.address.trim() !== '';
    const hasEmail = contactInfo.email && contactInfo.email.trim() !== '';
    const hasPhone = contactInfo.phone && contactInfo.phone.trim() !== '';
    
    console.log('Has address:', hasAddress, 'Has email:', hasEmail, 'Has phone:', hasPhone);
    
    if (!hasAddress && !hasEmail && !hasPhone) {
      console.log('No office information available');
      return null;
    }
    
    return {
      address: contactInfo.address || '',
      email: contactInfo.email || '',
      phone: contactInfo.phone || '',
      companyName: contactInfo.companyName || 'Our Office'
    };
  };

  const faqCategories = [
    {
      icon: Smartphone,
      title: t('contact.faq.gettingStarted', 'Getting Started'),
      faqs: [
        {
          question: t('contact.faq.whatIsEsim', 'What is an eSIM and how does it work?'),
          answer: t('contact.faq.whatIsEsimAnswer', "An eSIM (embedded SIM) is a digital SIM card that's built into your device. Instead of inserting a physical SIM card, you can download and activate a cellular plan directly onto your device. This allows you to switch between carriers and plans without needing to swap physical cards.")
        },
        {
          question: t('contact.faq.deviceSupport', 'Which devices support eSIM?'),
          answer: t('contact.faq.deviceSupportAnswer', 'Most modern smartphones support eSIM, including iPhone XS and newer, Google Pixel 3 and newer, Samsung Galaxy S20 and newer, and many others. Check your device settings or contact us to confirm compatibility.')
        },
        {
          question: t('contact.faq.howToActivate', 'How do I activate my eSIM?'),
          answer: t('contact.faq.howToActivateAnswer', "After purchase, you'll receive a QR code via email. Simply scan this code with your device's camera in the cellular settings, and your eSIM will be activated automatically. Detailed instructions are provided for each device type.")
        }
      ]
    },
    {
      icon: CreditCard,
      title: t('contact.faq.billingPlans', 'Billing & Plans'),
      faqs: [
        {
          question: t('contact.faq.paymentMethods', 'What payment methods do you accept?'),
          answer: t('contact.faq.paymentMethodsAnswer', 'We accept all major credit cards (Visa, Mastercard, American Express), PayPal, Apple Pay, Google Pay, and various local payment methods depending on your region.')
        },
        {
          question: t('contact.faq.refundPolicy', "Can I get a refund if I'm not satisfied?"),
          answer: t('contact.faq.refundPolicyAnswer', "Yes, we offer a 7-day money-back guarantee for unused data plans. If you haven't activated your eSIM or used any data, you can request a full refund within 7 days of purchase.")
        },
        {
          question: t('contact.faq.unlimitedData', 'Do your plans include unlimited data?'),
          answer: t('contact.faq.unlimitedDataAnswer', 'We offer both limited and unlimited data plans. Unlimited plans may have fair usage policies or speed throttling after certain thresholds, which are clearly stated in the plan details.')
        }
      ]
    },
    {
      icon: Wifi,
      title: t('contact.faq.connectivityIssues', 'Connectivity Issues'),
      faqs: [
        {
          question: t('contact.faq.notConnecting', "My eSIM isn't connecting to the network. What should I do?"),
          answer: t('contact.faq.notConnectingAnswer', "First, ensure you're in an area with network coverage. Try restarting your device, toggling airplane mode on/off, or manually selecting the network in your cellular settings. If issues persist, contact our support team.")
        },
        {
          question: t('contact.faq.slowSpeed', 'Why is my data speed slower than expected?'),
          answer: t('contact.faq.slowSpeedAnswer', 'Data speeds can vary based on network congestion, your location, device capabilities, and plan type. Some plans may have speed limitations or throttling after certain usage thresholds.')
        },
        {
          question: t('contact.faq.callsSms', 'Can I use my eSIM for calls and SMS?'),
          answer: t('contact.faq.callsSmsAnswer', 'Our eSIM plans are primarily data-only. However, you can use VoIP services like WhatsApp, Skype, or FaceTime for calls and messaging over your data connection.')
        }
      ]
    },
    {
      icon: Settings,
      title: t('contact.faq.accountManagement', 'Account Management'),
      faqs: [
        {
          question: t('contact.faq.checkUsage', 'How do I check my data usage?'),
          answer: t('contact.faq.checkUsageAnswer', "You can monitor your data usage through your device's settings or our mobile app. We also send notifications when you're approaching your data limit.")
        },
        {
          question: t('contact.faq.deleteEsim', 'How do I delete an eSIM from my device?'),
          answer: t('contact.faq.deleteEsimAnswer', "Go to your device's cellular settings, select the eSIM plan you want to remove, and choose 'Delete eSIM' or 'Remove Plan'. This will permanently delete the eSIM from your device.")
        }
      ]
    }
  ];

  const toggleFaq = (categoryIndex, faqIndex) => {
    const key = `${categoryIndex}-${faqIndex}`;
    setOpenFaq(openFaq === key ? null : key);
  };

  return (
    <div className="min-h-screen bg-white py-24" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header Section */}
      <section className="bg-white">
        <div className="mx-auto max-w-2xl px-6 lg:max-w-7xl lg:px-8">
          <div className="text-center">
            <h2 className="text-center text-xl font-semibold text-tufts-blue">
              <span>{'{ '}</span>
              {t('contact.title', 'Get in touch')}
              <span>{' }'}</span>
            </h2>
            <p className="mx-auto mt-12 max-w-4xl text-center text-4xl font-semibold tracking-tight text-eerie-black sm:text-5xl">
              {t('contact.subtitle', "We're here to help with all your eSIM needs")}
            </p>
            <p className="mx-auto mt-6 max-w-2xl text-center text-lg text-cool-black mb-5">
              {t('contact.description', 'Get in touch with our team for support, questions, or partnerships. We\'re here to help with all your connectivity needs.')}
            </p>
          </div>
        </div>
      </section>

      {/* Contact Form and Office Info */}
      <section className="bg-white">
        <div className="mx-auto max-w-2xl px-6 lg:max-w-7xl lg:px-8">
          <div className="grid lg:grid-cols-2 gap-6" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
            {/* Contact Form */}
            <div className="relative">
              <div className="absolute inset-px rounded-xl bg-white"></div>
              <div className="relative flex h-full flex-col overflow-hidden rounded-xl">
                <div className="px-8 pt-8 pb-8">
                  <h2 
                    className="text-2xl font-medium tracking-tight text-eerie-black mb-6"
                    style={{ textAlign: isRTL ? 'right' : 'left' }}
                  >
                    {t('contact.sendMessage', 'Send us a Message')}
                  </h2>
                  <form onSubmit={handleSubmit} className="space-y-6 contact-form">
                    <div>
                      <label 
                        htmlFor="name" 
                        className="block text-sm font-medium text-cool-black mb-2"
                        style={{ textAlign: isRTL ? 'right' : 'left' }}
                      >
                        {t('contact.fullName', 'Full Name')}
                      </label>
                      <div className="relative">
                        <User className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-3 w-5 h-5 text-gray-400`} />
                        <input
                          type="text"
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          required
                          className={`input-field w-full py-3 ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'}`}
                          style={{ 
                            textAlign: isRTL ? 'right' : 'left',
                            direction: isRTL ? 'rtl' : 'ltr'
                          }}
                          placeholder={t('contact.fullNamePlaceholder', 'Enter your full name')}
                          dir={isRTL ? 'rtl' : 'ltr'}
                        />
                      </div>
                    </div>

                    <div>
                      <label 
                        htmlFor="email" 
                        className="block text-sm font-medium text-cool-black mb-2"
                        style={{ textAlign: isRTL ? 'right' : 'left' }}
                      >
                        {t('contact.emailAddress', 'Email Address')}
                      </label>
                      <div className="relative">
                        <Mail className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-3 w-5 h-5 text-gray-400`} />
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          required
                          className={`input-field w-full py-3 ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'}`}
                          style={{ 
                            textAlign: isRTL ? 'right' : 'left',
                            direction: isRTL ? 'rtl' : 'ltr'
                          }}
                          placeholder={t('contact.emailPlaceholder', 'Enter your email address')}
                          dir={isRTL ? 'rtl' : 'ltr'}
                        />
                      </div>
                    </div>


                    <div>
                      <label 
                        htmlFor="message" 
                        className="block text-sm font-medium text-cool-black mb-2"
                        style={{ textAlign: isRTL ? 'right' : 'left' }}
                      >
                        {t('contact.message', 'Message')}
                      </label>
                      <div className="relative">
                        <MessageSquare className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-3 w-5 h-5 text-gray-400`} />
                        <textarea
                          id="message"
                          name="message"
                          value={formData.message}
                          onChange={handleInputChange}
                          required
                          rows={5}
                          className={`input-field w-full py-3 resize-none ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'}`}
                          style={{ 
                            textAlign: isRTL ? 'right' : 'left',
                            direction: isRTL ? 'rtl' : 'ltr'
                          }}
                          placeholder={t('contact.messagePlaceholder', 'Tell us how we can help you...')}
                          dir={isRTL ? 'rtl' : 'ltr'}
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="btn-primary w-full py-3 px-6 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                          {t('contact.sending', 'Sending...')}
                        </>
                      ) : (
                        <>
                          <Send className="w-5 h-5 mr-2" />
                          {t('contact.sendButton', 'Send Message')}
                        </>
                      )}
                    </button>
                  </form>
                </div>
              </div>
              <div className="pointer-events-none absolute inset-px rounded-xl shadow-sm ring-1 ring-black/5"></div>
            </div>


            {/* Office Information */}
            <div className="space-y-8">
              <div className="relative">
                <div className="absolute inset-px rounded-xl bg-white"></div>
                <div className="relative flex h-full flex-col overflow-hidden rounded-xl">
                  <div className="px-8 pt-8 pb-8">
                    <div className={`flex items-center mb-6 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <Building className={`w-8 h-8 text-tufts-blue ${isRTL ? 'ml-3' : 'mr-3'}`} />
                      <h2 className={`text-2xl font-medium tracking-tight text-eerie-black ${isRTL ? 'text-right' : 'text-left'}`}>{t('contact.ourOffice', 'Our Office')}</h2>
                    </div>
                
                    {(() => {
                      const office = getOfficeLocation();
                      if (!office) {
                        return null; // Don't show anything if no office info
                      }
                      
                      return (
                        <div className="space-y-4">
                          <div>
                            <h3 className={`text-lg font-medium text-eerie-black mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                              {office.companyName}
                            </h3>
                            <div className="space-y-2 text-cool-black">
                              {office.address && office.address.trim() !== '' && (
                                <p className={`flex items-start ${isRTL ? 'flex-row-reverse text-right' : 'text-left'}`}>
                                  <MapPin className={`w-5 h-5 mt-0.5 text-tufts-blue flex-shrink-0 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                                  <span>{office.address}</span>
                                </p>
                              )}
                              {office.phone && office.phone.trim() !== '' && (
                                <p className={`flex items-center ${isRTL ? 'flex-row-reverse text-right' : 'text-left'}`}>
                                  <Phone className={`w-5 h-5 text-tufts-blue ${isRTL ? 'ml-2' : 'mr-2'}`} />
                                  <a href="https://t.me/theholylabs" className="text-tufts-blue hover:text-cobalt-blue transition-colors duration-200">
                                    {office.phone}
                                  </a>
                                </p>
                              )}
                              {office.email && office.email.trim() !== '' && (
                                <p className={`flex items-center ${isRTL ? 'flex-row-reverse text-right' : 'text-left'}`}>
                                  <Mail className={`w-5 h-5 text-tufts-blue ${isRTL ? 'ml-2' : 'mr-2'}`} />
                                  <a href={`mailto:${office.email}`} className="text-tufts-blue hover:text-cobalt-blue transition-colors duration-200">
                                    {office.email}
                                  </a>
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
                <div className="pointer-events-none absolute inset-px rounded-xl shadow-sm ring-1 ring-black/5"></div>
              </div>

              {/* Business Hours */}
              <div className="relative">
                <div className="absolute inset-px rounded-xl bg-white"></div>
                <div className="relative flex h-full flex-col overflow-hidden rounded-xl">
                  <div className="px-8 pt-8 pb-8">
                    <div className={`flex items-center mb-6 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <Clock className={`w-8 h-8 text-tufts-blue ${isRTL ? 'ml-3' : 'mr-3'}`} />
                      <h3 className={`text-xl font-medium tracking-tight text-eerie-black ${isRTL ? 'text-right' : 'text-left'}`}>{t('contact.businessHours', 'Business Hours')}</h3>
                    </div>
                    <div className="space-y-3 text-cool-black">
                      {Object.entries(businessHours).map(([day, hours]) => {
                        const dayName = day.charAt(0).toUpperCase() + day.slice(1);
                        const isClosed = hours.closed;
                        const timeDisplay = isClosed ? 'Closed' : `${hours.open || '--'} - ${hours.close || '--'}`;
                        
                        return (
                          <div key={day} className={`flex justify-between ${isRTL ? 'text-right' : 'text-left'}`}>
                            <span>{dayName}</span>
                            <span className={`font-medium ${isClosed ? 'text-gray-500' : 'text-eerie-black'}`}>
                              {timeDisplay}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
                <div className="pointer-events-none absolute inset-px rounded-xl shadow-sm ring-1 ring-black/5"></div>
              </div>

              
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-2xl px-6 lg:max-w-7xl lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-center text-xl font-semibold text-tufts-blue">
              <span>{'{ '}</span>
              {t('contact.helpCenter', 'Help Center')}
              <span>{' }'}</span>
            </h2>
            <p className="mx-auto mt-6 max-w-4xl text-center text-3xl font-semibold tracking-tight text-eerie-black sm:text-4xl">
              {t('contact.faqTitle', 'Frequently Asked Questions')}
            </p>
            <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-cool-black">
              {t('contact.faqDescription', 'Find quick answers to common questions about our eSIM services')}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
            {faqCategories.map((category, categoryIndex) => {
              const CategoryIcon = category.icon;
              return (
                <div
                  key={categoryIndex}
                  className="relative"
                >
                  <div className="absolute inset-px rounded-xl bg-white"></div>
                  <div className="relative flex h-full flex-col overflow-hidden rounded-xl">
                    <div className="px-8 pt-8 pb-8">
                      <div className={`flex items-center mb-6 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <div className={`w-12 h-12 bg-tufts-blue/10 rounded-xl flex items-center justify-center ${isRTL ? 'ml-4' : 'mr-4'}`}>
                          <CategoryIcon className="w-6 h-6 text-tufts-blue" />
                        </div>
                        <h3 className={`text-xl font-medium tracking-tight text-eerie-black ${isRTL ? 'text-right' : 'text-left'}`}>{category.title}</h3>
                      </div>
                      
                      <div className="space-y-3">
                        {category.faqs.map((faq, faqIndex) => {
                          const isOpen = openFaq === `${categoryIndex}-${faqIndex}`;
                          return (
                            <div key={faqIndex} className="bg-alice-blue/50 rounded-lg border border-tufts-blue/10">
                              <button
                                onClick={() => toggleFaq(categoryIndex, faqIndex)}
                                className={`w-full px-4 py-3 flex items-center justify-between hover:bg-tufts-blue/5 transition-colors duration-200 rounded-lg ${isRTL ? 'text-right' : 'text-left'}`}
                              >
                                <span className={`font-medium text-eerie-black text-sm ${isRTL ? 'text-right' : 'text-left'}`}>{faq.question}</span>
                                {isOpen ? (
                                  <ChevronUp className="w-4 h-4 text-tufts-blue flex-shrink-0" />
                                ) : (
                                  <ChevronDown className="w-4 h-4 text-tufts-blue flex-shrink-0" />
                                )}
                              </button>
                              {isOpen && (
                                <div className="px-4 pb-3">
                                  <p className={`text-cool-black leading-relaxed text-sm ${isRTL ? 'text-right' : 'text-left'}`}>{faq.answer}</p>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  <div className="pointer-events-none absolute inset-px rounded-xl shadow-sm ring-1 ring-black/5"></div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;
