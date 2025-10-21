'use client';

import React from 'react';
import Link from 'next/link';

export default function PrivacyPolicy() {
  const currentDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
          <p className="text-gray-600">Holylabs Ltd - RoamJet</p>
          <p className="text-sm text-gray-500 mt-2">Last updated: {currentDate}</p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-sm p-8 space-y-8">
          
          {/* Basic Info */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Basic Information</h2>
            <div className="space-y-4 text-gray-700 leading-relaxed">
              <p>
                Holylabs Ltd ("Holylabs", "we", "us" or "our") is a company registered in the United Kingdom that recognizes the importance of your privacy.
              </p>
              <p>
                Among its several activities, Holylabs may receive data or personal information from its clients or users. The purpose of this Privacy Policy is to explain the permitted use of this data, and to explain and give RoamJet's users and clients information regarding what kind of data Holylabs stores, and what options the users and clients have with respect to this data.
              </p>
              
              <div className="bg-blue-50 p-6 rounded-lg mt-6">
                <h3 className="font-semibold text-gray-900 mb-3">Key Points:</h3>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2">•</span>
                    <span>We are NOT processing and not storing any personal information that is not received by us directly from the subject.</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2">•</span>
                    <span>We are minimizing the personal data that is requested and stored as far as possible.</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2">•</span>
                    <span>You can always contact us and request that we share with you the data we have, and delete such data (if any).</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2">•</span>
                    <span>All of Holylabs' services are limited to the age of 18. In case of use under this age, parental consent must be obtained.</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Introduction */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Introduction</h2>
            <div className="space-y-4 text-gray-700 leading-relaxed">
              <p>
                We respect your privacy and are committed to protecting it through our compliance with this privacy policy ("Policy"). This Policy describes the types of information we may collect from you or that you may provide ("Personal Information") in the "RoamJet" mobile application and website (roamjet.net) ("Mobile Application", "Website" or "Service") and any of its related products and services (collectively, "Services"), and our practices for collecting, using, maintaining, protecting, and disclosing that Personal Information. It also describes the choices available to you regarding our use of your Personal Information and how you can access and update it.
              </p>
              <p>
                This Policy is a legally binding agreement between you ("User", "you" or "your") and Holylabs Ltd. If you are entering into this agreement on behalf of a business or other legal entity, you represent that you have the authority to bind such entity to this agreement, in which case the terms "User", "you" or "your" shall refer to such entity. If you do not have such authority, or if you do not agree with the terms of this agreement, you must not accept this agreement and may not access and use the Mobile Application, Website and Services.
              </p>
              <p>
                By accessing and using the Mobile Application, Website and Services, you acknowledge that you have read, understood, and agree to be bound by the terms of this Policy. This Policy does not apply to the practices of companies that we do not own or control, or to individuals that we do not employ or manage.
              </p>
            </div>
          </section>

          {/* Personal Information Collection */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Personal Information Due to Registration</h2>
            <div className="space-y-4 text-gray-700 leading-relaxed">
              <p>
                When you register to RoamJet services, you are requested to provide the following information:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Your name</li>
                <li>Email address</li>
                <li>Billing information</li>
              </ul>
              <p>
                We are keeping this information and use this information for operating the service, billing and internal purposes. <strong>Such information is NOT transferred to any 3rd party</strong> except for payment processing purposes through secure payment gateways.
              </p>
              <p>
                Should you have any question regarding the information we stored or regarding any privacy issue, do not hesitate to contact our team by email: <a href="mailto:support@roamjet.net" className="text-blue-600 hover:underline">support@roamjet.net</a>
              </p>
            </div>
          </section>

          {/* Automatic Collection */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Automatic Collection of Information</h2>
            <div className="space-y-4 text-gray-700 leading-relaxed">
              <p>
                When you use the Mobile Application or Website, our servers automatically record information that your device sends. This data may include information such as:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Your device's IP address and location</li>
                <li>Device name and version</li>
                <li>Operating system type and version</li>
                <li>Language preferences</li>
                <li>Information you search for in the Mobile Application or Website</li>
                <li>Access times and dates</li>
                <li>Other statistics</li>
              </ul>
              <p>
                Information collected automatically is used only to identify potential cases of abuse and establish statistical information regarding the usage of the Mobile Application, Website and Services. This statistical information is not otherwise aggregated in such a way that would identify any particular User of the system.
              </p>
            </div>
          </section>

          {/* Collection of Personal Information */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Collection of Personal Information</h2>
            <div className="space-y-4 text-gray-700 leading-relaxed">
              <p>
                You can access and use the Mobile Application, Website and Services without telling us who you are or revealing any information by which someone could identify you as a specific, identifiable individual. If, however, you wish to use some of the features offered in the Mobile Application or Website, you may be asked to provide certain Personal Information (for example, your name and email address).
              </p>
              <p>
                We receive and store any information you knowingly provide to us when you create an account, make a purchase, or fill any forms in the Mobile Application or Website. When required, this information may include the following:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Account details (such as user name, unique user ID, password, etc.)</li>
                <li>Contact information (such as email address, phone number, etc.)</li>
                <li>Basic personal information (such as name, country of residence, etc.)</li>
                <li>Payment information (such as credit card details, billing address, etc.)</li>
                <li>Geolocation data of your device (such as latitude and longitude)</li>
              </ul>
              <p>
                You can choose not to provide us with your Personal Information, but then you may not be able to take advantage of some of the features in the Mobile Application or Website. Users who are uncertain about what information is mandatory are welcome to contact us.
              </p>
            </div>
          </section>

          {/* Privacy of Children */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Privacy of Children</h2>
            <div className="space-y-4 text-gray-700 leading-relaxed">
              <p>
                We do not knowingly collect any Personal Information from children under the age of 18. If you are under the age of 18, please do not submit any Personal Information through the Mobile Application, Website and Services without parental consent. If you have reason to believe that a child under the age of 18 has provided Personal Information to us through the Mobile Application, Website and Services, please contact us to request that we delete that child's Personal Information from our Services.
              </p>
              <p>
                We encourage parents and legal guardians to monitor their children's Internet usage and to help enforce this Policy by instructing their children never to provide Personal Information through the Mobile Application, Website and Services without their permission.
              </p>
            </div>
          </section>

          {/* Use and Processing */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Use and Processing of Collected Information</h2>
            <div className="space-y-4 text-gray-700 leading-relaxed">
              <p>
                In order to make the Mobile Application, Website and Services available to you, or to meet a legal obligation, we may need to collect and use certain Personal Information. If you do not provide the information that we request, we may not be able to provide you with the requested products or services.
              </p>
              <p>
                Any of the information we collect from you may be used for the following purposes:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Create and manage user accounts</li>
                <li>Process eSIM orders and deliver services</li>
                <li>Process payments and prevent fraud</li>
                <li>Send you order confirmations and eSIM activation details</li>
                <li>Request user feedback</li>
                <li>Improve user experience</li>
                <li>Respond to customer service requests</li>
                <li>Send you marketing and promotional communications (with your consent)</li>
                <li>Run and operate the Mobile Application, Website and Services</li>
              </ul>
              <p>
                Processing your Personal Information depends on how you interact with the Mobile Application, Website and Services, where you are located in the world and if one of the following applies: (i) you have given your consent for one or more specific purposes; (ii) provision of information is necessary for the performance of an agreement with you and/or for any pre-contractual obligations thereof; (iii) processing is necessary for compliance with a legal obligation to which you are subject; (iv) processing is necessary for the purposes of the legitimate interests pursued by us or by a third party.
              </p>
            </div>
          </section>

          {/* Managing Information */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Managing Information</h2>
            <div className="space-y-4 text-gray-700 leading-relaxed">
              <p>
                You are able to delete certain Personal Information we have about you. The Personal Information you can delete may change as the Mobile Application, Website and Services change. When you delete Personal Information, however, we may maintain a copy of the unrevised Personal Information in our records for the duration necessary to comply with our obligations to our affiliates and partners, and for the purposes described below.
              </p>
              <p>
                If you would like to delete your Personal Information or permanently delete your account, you can do so on the settings page of your account in the Mobile Application or Website, or simply by contacting us at <a href="mailto:support@roamjet.net" className="text-blue-600 hover:underline">support@roamjet.net</a>.
              </p>
            </div>
          </section>

          {/* Disclosure of Information */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Disclosure of Information</h2>
            <div className="space-y-4 text-gray-700 leading-relaxed">
              <p>
                Depending on the requested Services or as necessary to complete any transaction or provide any Service you have requested, we may share your information with our affiliates, contracted companies, and service providers (collectively, "Service Providers") we rely upon to assist in the operation of the Mobile Application, Website and Services available to you and whose privacy policies are consistent with ours or who agree to abide by our policies with respect to Personal Information.
              </p>
              <p>
                We will not share any personally identifiable information with third parties and will not share any information with unaffiliated third parties, except:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Payment processors to handle billing and payments</li>
                <li>eSIM providers to deliver the eSIM services you purchased</li>
                <li>Cloud service providers for data storage and hosting</li>
                <li>Analytics services to improve our Services</li>
              </ul>
              <p>
                Service Providers are not authorized to use or disclose your information except as necessary to perform services on our behalf or comply with legal requirements.
              </p>
              <p>
                We may also disclose any Personal Information we collect, use or receive if required or permitted by law, such as to comply with a subpoena or similar legal process, and when we believe in good faith that disclosure is necessary to protect our rights, protect your safety or the safety of others, investigate fraud, or respond to a government request.
              </p>
            </div>
          </section>

          {/* Retention */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Retention of Information</h2>
            <div className="space-y-4 text-gray-700 leading-relaxed">
              <p>
                We will retain and use your Personal Information for the period necessary to comply with our legal obligations, to enforce our agreements, resolve disputes, and unless a longer retention period is required or permitted by law.
              </p>
              <p>
                We may use any aggregated data derived from or incorporating your Personal Information after you update or delete it, but not in a manner that would identify you personally. Once the retention period expires, Personal Information shall be deleted. Therefore, the right to access, the right to erasure, the right to rectification, and the right to data portability cannot be enforced after the expiration of the retention period.
              </p>
            </div>
          </section>

          {/* Data Analytics */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Data Analytics</h2>
            <div className="space-y-4 text-gray-700 leading-relaxed">
              <p>
                Our Mobile Application, Website and Services may use third-party analytics tools that use cookies, web beacons, or other similar information-gathering technologies to collect standard internet activity and usage information. The information gathered is used to compile statistical reports on User activity such as how often Users visit our Mobile Application or Website and Services, what pages they visit and for how long, etc.
              </p>
              <p>
                We use the information obtained from these analytics tools to monitor the performance and improve our Mobile Application, Website and Services. We do not use third-party analytics tools to track or to collect any personally identifiable information of our Users and we will not associate any information gathered from the statistical reports with any individual User.
              </p>
            </div>
          </section>

          {/* Push Notifications */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Push Notifications</h2>
            <div className="space-y-4 text-gray-700 leading-relaxed">
              <p>
                We offer push notifications to which you may voluntarily subscribe at any time. To make sure push notifications reach the correct devices, we use a third-party push notifications provider who relies on a device token unique to your device which is issued by the operating system of your device.
              </p>
              <p>
                While it is possible to access a list of device tokens, they will not reveal your identity, your unique device ID, or your contact information to us or our third-party push notifications provider. If, at any time, you wish to stop receiving push notifications, simply adjust your device settings accordingly.
              </p>
            </div>
          </section>

          {/* Cookies */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Cookies</h2>
            <div className="space-y-4 text-gray-700 leading-relaxed">
              <p>
                Our Website uses "cookies" to help personalize your online experience. A cookie is a text file that is placed on your hard disk by a web page server. Cookies cannot be used to run programs or deliver viruses to your computer.
              </p>
              <p>
                We use cookies to:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Keep you signed in</li>
                <li>Understand and save your preferences for future visits</li>
                <li>Compile aggregate data about site traffic and site interaction</li>
                <li>Improve our website and services</li>
              </ul>
              <p>
                You can choose to accept or decline cookies. Most web browsers automatically accept cookies, but you can usually modify your browser setting to decline cookies if you prefer. However, this may prevent you from taking full advantage of the website.
              </p>
            </div>
          </section>

          {/* Information Security */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Information Security</h2>
            <div className="space-y-4 text-gray-700 leading-relaxed">
              <p>
                We secure information you provide on computer servers in a controlled, secure environment, protected from unauthorized access, use, or disclosure. We maintain reasonable administrative, technical, and physical safeguards in an effort to protect against unauthorized access, use, modification, and disclosure of Personal Information in our control and custody.
              </p>
              <p>
                However, no data transmission over the Internet or wireless network can be guaranteed. Therefore, while we strive to protect your Personal Information, you acknowledge that (i) there are security and privacy limitations of the Internet which are beyond our control; (ii) the security, integrity, and privacy of any and all information and data exchanged between you and the Mobile Application, Website and Services cannot be guaranteed; and (iii) any such information and data may be viewed or tampered with in transit by a third party, despite best efforts.
              </p>
              <p>
                As the security of Personal Information depends in part on the security of the device you use to communicate with us and the security you use to protect your credentials, please take appropriate measures to protect this information.
              </p>
            </div>
          </section>

          {/* Data Breach */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Data Breach</h2>
            <div className="space-y-4 text-gray-700 leading-relaxed">
              <p>
                In the event we become aware that the security of the Mobile Application, Website and Services has been compromised or Users' Personal Information has been disclosed to unrelated third parties as a result of external activity, including, but not limited to, security attacks or fraud, we reserve the right to take reasonably appropriate measures, including, but not limited to, investigation and reporting, as well as notification to and cooperation with law enforcement authorities.
              </p>
              <p>
                In the event of a data breach, we will make reasonable efforts to notify affected individuals if we believe that there is a reasonable risk of harm to the User as a result of the breach or if notice is otherwise required by law. When we do, we will post a notice in the Mobile Application and Website, and send you an email.
              </p>
            </div>
          </section>

          {/* Links to Other Resources */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Links to Other Resources</h2>
            <div className="space-y-4 text-gray-700 leading-relaxed">
              <p>
                The Mobile Application, Website and Services contain links to other resources that are not owned or controlled by us. Please be aware that we are not responsible for the privacy practices of such other resources or third parties. We encourage you to be aware when you leave the Mobile Application, Website and Services and to read the privacy statements of each and every resource that may collect Personal Information.
              </p>
            </div>
          </section>

          {/* Your Rights */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Your Rights</h2>
            <div className="space-y-4 text-gray-700 leading-relaxed">
              <p>
                Depending on your location and applicable law, you may have the following rights regarding your Personal Information:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Right to access:</strong> You have the right to request copies of your personal data.</li>
                <li><strong>Right to rectification:</strong> You have the right to request that we correct any information you believe is inaccurate or complete information you believe is incomplete.</li>
                <li><strong>Right to erasure:</strong> You have the right to request that we erase your personal data, under certain conditions.</li>
                <li><strong>Right to restrict processing:</strong> You have the right to request that we restrict the processing of your personal data, under certain conditions.</li>
                <li><strong>Right to object to processing:</strong> You have the right to object to our processing of your personal data, under certain conditions.</li>
                <li><strong>Right to data portability:</strong> You have the right to request that we transfer the data that we have collected to another organization, or directly to you, under certain conditions.</li>
              </ul>
              <p>
                To exercise any of these rights, please contact us at <a href="mailto:support@roamjet.net" className="text-blue-600 hover:underline">support@roamjet.net</a>. We will respond to your request within 30 days.
              </p>
            </div>
          </section>

          {/* Changes and Amendments */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Changes and Amendments</h2>
            <div className="space-y-4 text-gray-700 leading-relaxed">
              <p>
                We reserve the right to modify this Policy or its terms related to the Mobile Application, Website and Services at any time at our discretion. When we do, we will revise the updated date at the top of this page. We may also provide notice to you in other ways at our discretion, such as through the contact information you have provided.
              </p>
              <p>
                An updated version of this Policy will be effective immediately upon the posting of the revised Policy unless otherwise specified. Your continued use of the Mobile Application, Website and Services after the effective date of the revised Policy (or such other act specified at that time) will constitute your consent to those changes. However, we will not, without your consent, use your Personal Information in a manner materially different than what was stated at the time your Personal Information was collected.
              </p>
            </div>
          </section>

          {/* Acceptance */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Acceptance of This Policy</h2>
            <div className="space-y-4 text-gray-700 leading-relaxed">
              <p>
                You acknowledge that you have read this Policy and agree to all its terms and conditions. By accessing and using the Mobile Application, Website and Services and submitting your information you agree to be bound by this Policy. If you do not agree to abide by the terms of this Policy, you are not authorized to access or use the Mobile Application, Website and Services.
              </p>
            </div>
          </section>

          {/* Back to Home */}
          <div className="pt-8 border-t border-gray-200">
            <Link 
              href="/" 
              className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

