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
import { createContactRequest } from '../services/contactService';
import { getSettings } from '../services/settingsService';
import toast from 'react-hot-toast';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);
  const [contactInfo, setContactInfo] = useState({});
  const [businessHours, setBusinessHours] = useState({});
  const [loading, setLoading] = useState(true);

  // Load settings data
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await getSettings();
        console.log('Loaded settings:', settings);
        console.log('Contact info:', settings.contact);
        console.log('Business hours:', settings.businessHours);
        setContactInfo(settings.contact || {});
        setBusinessHours(settings.businessHours || {});
      } catch (error) {
        console.error('Error loading settings:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

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
      toast.success('Your message has been sent successfully! We\'ll get back to you soon.');
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        message: ''
      });
    } catch (error) {
      console.error('Error submitting contact request:', error);
      toast.error('Failed to send message. Please try again.');
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
        title: "Email Us",
        content: contactInfo.email,
        description: "Send us an email anytime",
        link: `mailto:${contactInfo.email}`
      });
    }
    
    if (contactInfo.phone && contactInfo.phone.trim() !== '') {
      console.log('Adding phone:', contactInfo.phone);
      info.push({
        icon: Phone,
        title: "Call Us",
        content: contactInfo.phone,
        description: "Contact us by phone",
        link: `tel:${contactInfo.phone.replace(/\s/g, '')}`
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
      title: "Getting Started",
      faqs: [
        {
          question: "What is an eSIM and how does it work?",
          answer: "An eSIM (embedded SIM) is a digital SIM card that's built into your device. Instead of inserting a physical SIM card, you can download and activate a cellular plan directly onto your device. This allows you to switch between carriers and plans without needing to swap physical cards."
        },
        {
          question: "Which devices support eSIM?",
          answer: "Most modern smartphones support eSIM, including iPhone XS and newer, Google Pixel 3 and newer, Samsung Galaxy S20 and newer, and many others. Check your device settings or contact us to confirm compatibility."
        },
        {
          question: "How do I activate my eSIM?",
          answer: "After purchase, you'll receive a QR code via email. Simply scan this code with your device's camera in the cellular settings, and your eSIM will be activated automatically. Detailed instructions are provided for each device type."
        }
      ]
    },
    {
      icon: CreditCard,
      title: "Billing & Plans",
      faqs: [
        {
          question: "What payment methods do you accept?",
          answer: "We accept all major credit cards (Visa, Mastercard, American Express), PayPal, Apple Pay, Google Pay, and various local payment methods depending on your region."
        },
        {
          question: "Can I get a refund if I'm not satisfied?",
          answer: "Yes, we offer a 7-day money-back guarantee for unused data plans. If you haven't activated your eSIM or used any data, you can request a full refund within 7 days of purchase."
        },
        {
          question: "Do your plans include unlimited data?",
          answer: "We offer both limited and unlimited data plans. Unlimited plans may have fair usage policies or speed throttling after certain thresholds, which are clearly stated in the plan details."
        }
      ]
    },
    {
      icon: Wifi,
      title: "Connectivity Issues",
      faqs: [
        {
          question: "My eSIM isn't connecting to the network. What should I do?",
          answer: "First, ensure you're in an area with network coverage. Try restarting your device, toggling airplane mode on/off, or manually selecting the network in your cellular settings. If issues persist, contact our support team."
        },
        {
          question: "Why is my data speed slower than expected?",
          answer: "Data speeds can vary based on network congestion, your location, device capabilities, and plan type. Some plans may have speed limitations or throttling after certain usage thresholds."
        },
        {
          question: "Can I use my eSIM for calls and SMS?",
          answer: "Our eSIM plans are primarily data-only. However, you can use VoIP services like WhatsApp, Skype, or FaceTime for calls and messaging over your data connection."
        }
      ]
    },
    {
      icon: Settings,
      title: "Account Management",
      faqs: [
        {
          question: "How do I check my data usage?",
          answer: "You can monitor your data usage through your device's settings or our mobile app. We also send notifications when you're approaching your data limit."
        },
        {
          question: "How do I delete an eSIM from my device?",
          answer: "Go to your device's cellular settings, select the eSIM plan you want to remove, and choose 'Delete eSIM' or 'Remove Plan'. This will permanently delete the eSIM from your device."
        }
      ]
    }
  ];

  const toggleFaq = (categoryIndex, faqIndex) => {
    const key = `${categoryIndex}-${faqIndex}`;
    setOpenFaq(openFaq === key ? null : key);
  };

  return (
    <div className="min-h-screen bg-white py-24">
      {/* Header Section */}
      <section className="bg-white">
        <div className="mx-auto max-w-2xl px-6 lg:max-w-7xl lg:px-8">
          <div className="text-center">
            <h2 className="text-center text-xl font-semibold text-tufts-blue">
              <span>{'{ '}</span>
              Get in touch
              <span>{' }'}</span>
            </h2>
            <p className="mx-auto mt-12 max-w-4xl text-center text-4xl font-semibold tracking-tight text-eerie-black sm:text-5xl">
              We're here to help with all your eSIM needs
            </p>
            <p className="mx-auto mt-6 max-w-2xl text-center text-lg text-cool-black mb-5">
              Get in touch with our team for support, questions, or partnerships. 
              We're here to help with all your connectivity needs.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Form and Office Info */}
      <section className="bg-white">
        <div className="mx-auto max-w-2xl px-6 lg:max-w-7xl lg:px-8">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Contact Form */}
            <div className="relative">
              <div className="absolute inset-px rounded-xl bg-white"></div>
              <div className="relative flex h-full flex-col overflow-hidden rounded-xl">
                <div className="px-8 pt-8 pb-8">
                  <h2 className="text-2xl font-medium tracking-tight text-eerie-black mb-6">Send us a Message</h2>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-cool-black mb-2">
                        Full Name
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          required
                          className="input-field w-full pl-10 pr-4 py-3"
                          placeholder="Enter your full name"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-cool-black mb-2">
                        Email Address
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          required
                          className="input-field w-full pl-10 pr-4 py-3"
                          placeholder="Enter your email address"
                        />
                      </div>
                    </div>


                    <div>
                      <label htmlFor="message" className="block text-sm font-medium text-cool-black mb-2">
                        Message
                      </label>
                      <div className="relative">
                        <MessageSquare className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                        <textarea
                          id="message"
                          name="message"
                          value={formData.message}
                          onChange={handleInputChange}
                          required
                          rows={5}
                          className="input-field w-full pl-10 pr-4 py-3 resize-none"
                          placeholder="Tell us how we can help you..."
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
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="w-5 h-5 mr-2" />
                          Send Message
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
                    <div className="flex items-center mb-6">
                      <Building className="w-8 h-8 text-tufts-blue mr-3" />
                      <h2 className="text-2xl font-medium tracking-tight text-eerie-black">Our Office</h2>
                    </div>
                
                    {(() => {
                      const office = getOfficeLocation();
                      if (!office) {
                        return null; // Don't show anything if no office info
                      }
                      
                      return (
                        <div className="space-y-4">
                          <div>
                            <h3 className="text-lg font-medium text-eerie-black mb-2">
                              {office.companyName}
                            </h3>
                            <div className="space-y-2 text-cool-black">
                              {office.address && office.address.trim() !== '' && (
                                <p className="flex items-start">
                                  <MapPin className="w-5 h-5 mr-2 mt-0.5 text-tufts-blue flex-shrink-0" />
                                  <span>{office.address}</span>
                                </p>
                              )}
                              {office.phone && office.phone.trim() !== '' && (
                                <p className="flex items-center">
                                  <Phone className="w-5 h-5 mr-2 text-tufts-blue" />
                                  <a href={`tel:${office.phone.replace(/\s/g, '')}`} className="text-tufts-blue hover:text-cobalt-blue transition-colors duration-200">
                                    {office.phone}
                                  </a>
                                </p>
                              )}
                              {office.email && office.email.trim() !== '' && (
                                <p className="flex items-center">
                                  <Mail className="w-5 h-5 mr-2 text-tufts-blue" />
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
                    <div className="flex items-center mb-6">
                      <Clock className="w-8 h-8 text-tufts-blue mr-3" />
                      <h3 className="text-xl font-medium tracking-tight text-eerie-black">Business Hours</h3>
                    </div>
                    <div className="space-y-3 text-cool-black">
                      {Object.entries(businessHours).map(([day, hours]) => {
                        const dayName = day.charAt(0).toUpperCase() + day.slice(1);
                        const isClosed = hours.closed;
                        const timeDisplay = isClosed ? 'Closed' : `${hours.open || '--'} - ${hours.close || '--'}`;
                        
                        return (
                          <div key={day} className="flex justify-between">
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
              Help Center
              <span>{' }'}</span>
            </h2>
            <p className="mx-auto mt-6 max-w-4xl text-center text-3xl font-semibold tracking-tight text-eerie-black sm:text-4xl">
              Frequently Asked Questions
            </p>
            <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-cool-black">
              Find quick answers to common questions about our eSIM services
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                      <div className="flex items-center mb-6">
                        <div className="w-12 h-12 bg-tufts-blue/10 rounded-xl flex items-center justify-center mr-4">
                          <CategoryIcon className="w-6 h-6 text-tufts-blue" />
                        </div>
                        <h3 className="text-xl font-medium tracking-tight text-eerie-black">{category.title}</h3>
                      </div>
                      
                      <div className="space-y-3">
                        {category.faqs.map((faq, faqIndex) => {
                          const isOpen = openFaq === `${categoryIndex}-${faqIndex}`;
                          return (
                            <div key={faqIndex} className="bg-alice-blue/50 rounded-lg border border-tufts-blue/10">
                              <button
                                onClick={() => toggleFaq(categoryIndex, faqIndex)}
                                className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-tufts-blue/5 transition-colors duration-200 rounded-lg"
                              >
                                <span className="font-medium text-eerie-black text-sm">{faq.question}</span>
                                {isOpen ? (
                                  <ChevronUp className="w-4 h-4 text-tufts-blue flex-shrink-0" />
                                ) : (
                                  <ChevronDown className="w-4 h-4 text-tufts-blue flex-shrink-0" />
                                )}
                              </button>
                              {isOpen && (
                                <div className="px-4 pb-3">
                                  <p className="text-cool-black leading-relaxed text-sm">{faq.answer}</p>
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
