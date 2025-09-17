import React from 'react';
import { FileText, Users, CreditCard, Shield, AlertTriangle, Scale } from 'lucide-react';

const TermsOfService = () => {
  const sections = [
    {
      icon: Users,
      title: "Acceptance of Terms",
      content: [
        "By accessing and using our eSIM services, you accept and agree to be bound by these Terms of Service",
        "If you do not agree to these terms, you may not use our services",
        "We reserve the right to modify these terms at any time with notice to users",
        "Continued use of our services after changes constitutes acceptance of new terms"
      ]
    },
    {
      icon: CreditCard,
      title: "Service Description & Payments",
      content: [
        "We provide eSIM data plans for mobile connectivity in various countries and regions",
        "All prices are displayed in the applicable currency and include applicable taxes",
        "Payment is required before service activation and is processed securely",
        "Refunds may be available according to our refund policy within specified timeframes",
        "We reserve the right to modify pricing with advance notice to customers"
      ]
    },
    {
      icon: Shield,
      title: "User Responsibilities",
      content: [
        "You must provide accurate and complete information when creating an account",
        "You are responsible for maintaining the confidentiality of your account credentials",
        "You agree to use our services only for lawful purposes and in compliance with local laws",
        "You must not attempt to circumvent security measures or access unauthorized areas",
        "Any misuse of our services may result in account suspension or termination"
      ]
    },
    {
      icon: AlertTriangle,
      title: "Service Limitations & Disclaimers",
      content: [
        "Service availability depends on network coverage and may vary by location",
        "Data speeds and quality may be affected by network conditions and device compatibility",
        "We do not guarantee uninterrupted or error-free service at all times",
        "Emergency services may not be available through our eSIM services",
        "You acknowledge that mobile services have inherent technical limitations"
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
              Legal Terms
              <span>{' }'}</span>
            </h2>
            <p className="mx-auto mt-12 max-w-4xl text-center text-4xl font-semibold tracking-tight text-eerie-black sm:text-5xl">
              Terms of Service Agreement
            </p>
            <p className="mx-auto mt-6 max-w-2xl text-center text-lg text-cool-black">
              Please read these terms carefully before using our eSIM services. 
              These terms govern your use of our platform and services.
            </p>
            <div className="flex items-center justify-center mt-8">
              <FileText className="w-8 h-8 text-tufts-blue mr-2" />
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
                <h2 className="text-2xl font-medium tracking-tight text-eerie-black mb-4">Agreement Overview</h2>
                <p className="text-cool-black leading-relaxed mb-4">
                  These Terms of Service ("Terms") govern your use of the eSIM services provided by 
                  Holylabs Ltd ("Company," "we," "our," or "us"). These Terms constitute a legally 
                  binding agreement between you and Holylabs Ltd.
                </p>
                <p className="text-cool-black leading-relaxed">
                  Our services include the provision of eSIM data plans, mobile connectivity solutions, 
                  and related digital services accessible through our website and mobile applications.
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

          {/* Intellectual Property */}
          <div className="relative mb-8">
            <div className="absolute inset-px rounded-xl bg-white"></div>
            <div className="relative flex h-full flex-col overflow-hidden rounded-xl">
              <div className="px-8 pt-8 pb-8">
                <h2 className="text-2xl font-medium tracking-tight text-eerie-black mb-4">Intellectual Property Rights</h2>
                <p className="text-cool-black leading-relaxed mb-4">
                  All content, features, and functionality of our services, including but not limited to 
                  text, graphics, logos, images, and software, are owned by Holylabs Ltd or our licensors 
                  and are protected by copyright, trademark, and other intellectual property laws.
                </p>
                <ul className="space-y-2 text-cool-black">
                  <li>• You may not reproduce, distribute, or create derivative works without permission</li>
                  <li>• Our trademarks and service marks may not be used without prior written consent</li>
                  <li>• Any feedback or suggestions you provide may be used by us without compensation</li>
                </ul>
              </div>
            </div>
            <div className="pointer-events-none absolute inset-px rounded-xl shadow-sm ring-1 ring-black/5"></div>
          </div>

          {/* Limitation of Liability */}
          <div className="relative mb-8">
            <div className="absolute inset-px rounded-xl bg-white"></div>
            <div className="relative flex h-full flex-col overflow-hidden rounded-xl">
              <div className="px-8 pt-8 pb-8">
                <div className="flex items-center mb-4">
                  <Scale className="w-8 h-8 text-tufts-blue mr-3" />
                  <h2 className="text-2xl font-medium tracking-tight text-eerie-black">Limitation of Liability</h2>
                </div>
                <p className="text-cool-black leading-relaxed mb-4">
                  To the maximum extent permitted by law, Holylabs Ltd shall not be liable for any 
                  indirect, incidental, special, consequential, or punitive damages, including but 
                  not limited to loss of profits, data, or business opportunities.
                </p>
                <div className="bg-tufts-blue/10 border-l-4 border-tufts-blue p-4 rounded-lg">
                  <p className="text-eerie-black text-sm">
                    <strong>Important:</strong> Our total liability for any claims related to our services 
                    shall not exceed the amount paid by you for the specific service in question during 
                    the twelve months preceding the claim.
                  </p>
                </div>
              </div>
            </div>
            <div className="pointer-events-none absolute inset-px rounded-xl shadow-sm ring-1 ring-black/5"></div>
          </div>

          {/* Governing Law */}
          <div className="relative mb-8">
            <div className="absolute inset-px rounded-xl bg-white"></div>
            <div className="relative flex h-full flex-col overflow-hidden rounded-xl">
              <div className="px-8 pt-8 pb-8">
                <h2 className="text-2xl font-medium tracking-tight text-eerie-black mb-4">Governing Law & Dispute Resolution</h2>
                <div className="space-y-4 text-cool-black">
                  <p>
                    These Terms shall be governed by and construed in accordance with the laws of 
                    England and Wales, without regard to conflict of law principles.
                  </p>
                  <p>
                    Any disputes arising from these Terms or our services shall be resolved through 
                    binding arbitration in London, United Kingdom, except where prohibited by local law.
                  </p>
                  <p>
                    You agree to first attempt to resolve any disputes through our customer support 
                    team before pursuing formal legal action.
                  </p>
                </div>
              </div>
            </div>
            <div className="pointer-events-none absolute inset-px rounded-xl shadow-sm ring-1 ring-black/5"></div>
          </div>

          {/* Contact Information */}
          <div className="relative">
            <div className="absolute inset-px rounded-xl bg-eerie-black"></div>
            <div className="relative flex h-full flex-col overflow-hidden rounded-xl">
              <div className="px-8 pt-8 pb-8">
                <h2 className="text-2xl font-medium tracking-tight text-white mb-4">Contact Information</h2>
                <p className="text-alice-blue leading-relaxed mb-4">
                  If you have any questions about these Terms of Service, please contact us:
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

export default TermsOfService;
