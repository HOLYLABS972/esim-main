import React from 'react';
import { Shield, Lock, Eye, Database, UserCheck, Mail } from 'lucide-react';

const PrivacyPolicy = () => {
  const sections = [
    {
      icon: Database,
      title: "Information We Collect",
      content: [
        "Personal information you provide when creating an account (name, email, phone number)",
        "Payment information processed securely through our payment partners",
        "Device information and eSIM activation data",
        "Usage data and analytics to improve our services",
        "Communication preferences and support interactions"
      ]
    },
    {
      icon: Eye,
      title: "How We Use Your Information",
      content: [
        "Provide and maintain our eSIM services",
        "Process transactions and send service notifications",
        "Improve our products and customer experience",
        "Comply with legal obligations and prevent fraud",
        "Send marketing communications (with your consent)"
      ]
    },
    {
      icon: Lock,
      title: "Data Protection & Security",
      content: [
        "Industry-standard encryption for all data transmission",
        "Secure data centers with 24/7 monitoring",
        "Regular security audits and vulnerability assessments",
        "Limited access to personal data on a need-to-know basis",
        "Compliance with GDPR, CCPA, and other privacy regulations"
      ]
    },
    {
      icon: UserCheck,
      title: "Your Rights",
      content: [
        "Access and review your personal information",
        "Request correction of inaccurate data",
        "Delete your account and associated data",
        "Opt-out of marketing communications",
        "Data portability and export options"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-white py-24">
      {/* Header Section */}
      <section className="bg-white">
        <div className="mx-auto max-w-2xl px-6 lg:max-w-7xl lg:px-8">
          <div className="text-center">
            <h2 className="text-center text-xl font-semibold text-tufts-blue">
              <span>{'{ '}</span>
              Privacy & Security
              <span>{' }'}</span>
            </h2>
            <p className="mx-auto mt-12 max-w-4xl text-center text-4xl font-semibold tracking-tight text-eerie-black sm:text-5xl">
              Your privacy is our priority
            </p>
            <p className="mx-auto mt-6 max-w-2xl text-center text-lg text-cool-black">
              Learn how we collect, use, and protect your information. 
              We&apos;re committed to transparency and data security.
            </p>
            <div className="flex items-center justify-center mt-8">
              <Shield className="w-8 h-8 text-tufts-blue mr-2" />
              <p className="text-sm text-cool-black">
                Last updated: December 15, 2024
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="bg-white">
        <div className="mx-auto max-w-2xl px-6 lg:max-w-7xl lg:px-8 mt-6">
          
          {/* Introduction */}
          <div className="relative mb-8">
            <div className="absolute inset-px rounded-xl bg-white"></div>
            <div className="relative flex h-full flex-col overflow-hidden rounded-xl">
              <div className="px-8 pt-8 pb-8">
                <h2 className="text-2xl font-medium tracking-tight text-eerie-black mb-4">Introduction</h2>
                <p className="text-cool-black leading-relaxed mb-4">
                  At Holylabs Ltd (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;), we are committed to protecting your privacy and ensuring 
                  the security of your personal information. This Privacy Policy explains how we collect, use, 
                  disclose, and safeguard your information when you use our eSIM services and website.
                </p>
                <p className="text-cool-black leading-relaxed">
                  By using our services, you agree to the collection and use of information in accordance with 
                  this Privacy Policy. If you do not agree with our policies and practices, please do not use our services.
                </p>
              </div>
            </div>
            <div className="pointer-events-none absolute inset-px rounded-xl shadow-sm ring-1 ring-black/5"></div>
          </div>

          {/* Main Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {sections.map((section, index) => {
              const IconComponent = section.icon;
              return (
                <div
                  key={index}
                  className="relative"
                >
                  <div className="absolute inset-px rounded-xl bg-white"></div>
                  <div className="relative flex h-full flex-col overflow-hidden rounded-xl">
                    <div className="px-8 pt-8 pb-8">
                      <div className="flex items-center mb-6">
                        <div className="w-12 h-12 bg-tufts-blue/10 rounded-xl flex items-center justify-center mr-4">
                          <IconComponent className="w-6 h-6 text-tufts-blue" />
                        </div>
                        <h2 className="text-xl font-medium tracking-tight text-eerie-black">{section.title}</h2>
                      </div>
                      <ul className="space-y-3">
                        {section.content.map((item, itemIndex) => (
                          <li key={itemIndex} className="flex items-start">
                            <div className="w-2 h-2 bg-tufts-blue rounded-full mt-2 mr-3 flex-shrink-0"></div>
                            <span className="text-cool-black leading-relaxed">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <div className="pointer-events-none absolute inset-px rounded-xl shadow-sm ring-1 ring-black/5"></div>
                </div>
              );
            })}
          </div>

          {/* Data Sharing */}
          <div className="relative mb-8">
            <div className="absolute inset-px rounded-xl bg-white"></div>
            <div className="relative flex h-full flex-col overflow-hidden rounded-xl">
              <div className="px-8 pt-8 pb-8">
                <h2 className="text-2xl font-medium tracking-tight text-eerie-black mb-4">Data Sharing and Disclosure</h2>
                <p className="text-cool-black leading-relaxed mb-4">
                  We do not sell, trade, or otherwise transfer your personal information to third parties without 
                  your consent, except in the following circumstances:
                </p>
                <ul className="space-y-3 mb-4">
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-tufts-blue rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span className="text-cool-black">Service providers who assist in our operations (payment processors, cloud storage)</span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-tufts-blue rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span className="text-cool-black">Legal compliance and law enforcement requests</span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-tufts-blue rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span className="text-cool-black">Business transfers (mergers, acquisitions)</span>
                  </li>
                </ul>
              </div>
            </div>
            <div className="pointer-events-none absolute inset-px rounded-xl shadow-sm ring-1 ring-black/5"></div>
          </div>

          {/* Contact Information */}
          <div className="relative">
            <div className="absolute inset-px rounded-xl bg-eerie-black"></div>
            <div className="relative flex h-full flex-col overflow-hidden rounded-xl">
              <div className="px-8 pt-8 pb-8">
                <div className="flex items-center mb-6">
                  <Mail className="w-8 h-8 text-alice-blue mr-3" />
                  <h2 className="text-2xl font-medium tracking-tight text-white">Contact Us</h2>
                </div>
                <p className="text-alice-blue leading-relaxed mb-4">
                  If you have any questions about this Privacy Policy or our data practices, please contact us:
                </p>
                <div className="space-y-2 text-alice-blue">
                  <p><strong className="text-white">Holylabs Ltd</strong></p>
                  <p>275 New North Road Islington # 1432</p>
                  <p>London, N1 7AA, United Kingdom</p>
                  <p>Email: <a href="mailto:support@theholylabs.com" className="text-jordy-blue hover:text-white transition-colors duration-200">support@theholylabs.com</a></p>
                  <p>Phone: <a href="https://wa.me/972515473526" className="text-jordy-blue hover:text-white transition-colors duration-200">+972 51 547 3526</a></p>
                </div>
              </div>
            </div>
            <div className="pointer-events-none absolute inset-px rounded-xl shadow-sm ring-1 ring-white/10"></div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PrivacyPolicy;
