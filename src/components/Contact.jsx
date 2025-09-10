"use client";

import React, { useState } from 'react';
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

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [openFaq, setOpenFaq] = useState(null);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle form submission here
    console.log('Form submitted:', formData);
    // Reset form
    setFormData({
      name: '',
      email: '',
      subject: '',
      message: ''
    });
  };

  const contactInfo = [
    {
      icon: Mail,
      title: "Email Us",
      content: "support@theholylabs.com",
      description: "Send us an email anytime",
      link: "mailto:support@theholylabs.com"
    },
    {
      icon: Phone,
      title: "Call Us",
      content: "+972 51 547 3526",
      description: "Mon-Fri 9AM-6PM GMT",
      link: "tel:+972515473526"
    },
    
   
  ];

  const officeLocations = [
    {
      city: "London",
      country: "United Kingdom",
      address: "275 New North Road Islington # 1432",
      postal: "London, N1 7AA",
      phone: "+972 51 547 3526",
      email: "support@theholylabs.com"
    }
  ];

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
            <p className="mx-auto mt-6 max-w-2xl text-center text-lg text-cool-black">
              Get in touch with our team for support, questions, or partnerships. 
              We provide 24/7 assistance for all your connectivity needs.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Information Cards */}
      <section className="bg-white">
        <div className="mx-auto max-w-2xl px-6 lg:max-w-7xl lg:px-8 mt-6">
          <div className="grid grid-cols-2 gap-6 mb-16">
            {contactInfo.map((info, index) => {
              const IconComponent = info.icon;
              return (
                <div
                  key={index}
                  className="relative"
                >
                  <div className="absolute inset-px rounded-xl bg-white"></div>
                  <div className="relative flex h-full flex-col overflow-hidden rounded-xl">
                    <div className="px-8 pt-8 pb-6 text-center flex flex-col items-center justify-center h-full">
                      <div className="w-16 h-16 bg-tufts-blue/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <IconComponent className="w-8 h-8 text-tufts-blue" />
                      </div>
                      <h3 className="text-lg font-medium tracking-tight text-eerie-black mb-2">{info.title}</h3>
                      <p className="text-sm text-cool-black mb-3">{info.description}</p>
                      {info.link ? (
                        <a 
                          href={info.link}
                          className="text-tufts-blue hover:text-cobalt-blue font-medium break-words transition-colors duration-200"
                        >
                          {info.content}
                        </a>
                      ) : (
                        <p className="text-eerie-black font-medium">{info.content}</p>
                      )}
                    </div>
                  </div>
                  <div className="pointer-events-none absolute inset-px rounded-xl shadow-sm ring-1 ring-black/5"></div>
                </div>
              );
            })}
          </div>

          {/* Contact Form and Office Info */}
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
                      <label htmlFor="subject" className="block text-sm font-medium text-cool-black mb-2">
                        Subject
                      </label>
                      <input
                        type="text"
                        id="subject"
                        name="subject"
                        value={formData.subject}
                        onChange={handleInputChange}
                        required
                        className="input-field w-full px-4 py-3"
                        placeholder="What is this regarding?"
                      />
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
                      className="btn-primary w-full py-3 px-6 flex items-center justify-center"
                    >
                      <Send className="w-5 h-5 mr-2" />
                      Send Message
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
                
                    {officeLocations.map((office, index) => (
                      <div key={index} className="space-y-4">
                        <div>
                          <h3 className="text-lg font-medium text-eerie-black mb-2">
                            Holylabs Ltd - {office.city}
                          </h3>
                          <div className="space-y-2 text-cool-black">
                            <p className="flex items-start">
                              <MapPin className="w-5 h-5 mr-2 mt-0.5 text-tufts-blue flex-shrink-0" />
                              <span>
                                {office.address}<br />
                                {office.postal}<br />
                                {office.country}
                              </span>
                            </p>
                            <p className="flex items-center">
                              <Phone className="w-5 h-5 mr-2 text-tufts-blue" />
                              <a href={`tel:${office.phone.replace(/\s/g, '')}`} className="text-tufts-blue hover:text-cobalt-blue transition-colors duration-200">
                                {office.phone}
                              </a>
                            </p>
                            <p className="flex items-center">
                              <Mail className="w-5 h-5 mr-2 text-tufts-blue" />
                              <a href={`mailto:${office.email}`} className="text-tufts-blue hover:text-cobalt-blue transition-colors duration-200">
                                {office.email}
                              </a>
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
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
                      <div className="flex justify-between">
                        <span>Monday - Friday</span>
                        <span className="font-medium text-eerie-black">9:00 AM - 6:00 PM GMT</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Saturday</span>
                        <span className="font-medium text-eerie-black">10:00 AM - 4:00 PM GMT</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Sunday</span>
                        <span className="font-medium text-eerie-black">Closed</span>
                      </div>
                    </div>
                    <div className="mt-6 p-4 bg-tufts-blue/10 rounded-lg">
                      <p className="text-sm text-cool-black">
                        <strong className="text-eerie-black">24/7 Support:</strong> Our online support and live chat are available around the clock for urgent issues.
                      </p>
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
