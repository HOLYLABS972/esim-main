'use client';

import React from 'react';
import Link from 'next/link';

export default function TermsOfService() {
  const currentDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Terms of Use</h1>
          <p className="text-gray-600">RoamJet by Holylabs Ltd</p>
          <p className="text-sm text-gray-500 mt-2">Last updated: {currentDate}</p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-sm p-8 space-y-8">
          
          {/* Introduction */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Introduction</h2>
            <div className="space-y-4 text-gray-700 leading-relaxed">
              <p>
                RoamJet is a product of Holylabs Ltd ("Holylabs"). Holylabs, its employees, managers and owners are pleased that you have chosen to use RoamJet.
              </p>
              <p>
                By using RoamJet (including any use of the APP, website (roamjet.net), data, texts, images, videos, design styles, computer code and mobile code of RoamJet, or any use of the services offered on RoamJet, including, but not limited to, using an eSIM) ("RoamJet") you agree to be bound by these terms of use ("TOU"). If you do not agree to the TOU, do not use RoamJet.
              </p>
              <p>
                Please read the terms of use carefully, since using RoamJet or using any of its components indicates an acceptance and unconditional approval of all the TOU.
              </p>
              <p className="font-semibold">
                This TOU affects your legal rights and obligations. If you do not agree to be bound by all of the TOU, do not access or use RoamJet.
              </p>
            </div>
          </section>

          {/* Main Operation Guidelines */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Main Operation Guidelines and Refund Policy</h2>
            <div className="space-y-3 text-gray-700">
              <div className="flex">
                <span className="font-semibold mr-2">1.</span>
                <p>When installing and activating the eSIM, you must act exactly according to the instructions in the APP and on the website. No refund will be given for a package that was not activated due to non-compliance with the instructions.</p>
              </div>
              <div className="flex">
                <span className="font-semibold mr-2">2.</span>
                <p>Do not delete/remove the eSIM from the device after it has been installed. No credit/refund will be given if the eSIM is removed.</p>
              </div>
              <div className="flex">
                <span className="font-semibold mr-2">3.</span>
                <p>There is no refund for unused data.</p>
              </div>
              <div className="flex">
                <span className="font-semibold mr-2">4.</span>
                <p>Before the purchase, the user must make sure that the device supports and is unlocked from the use of an eSIM.</p>
              </div>
              <div className="flex">
                <span className="font-semibold mr-2">5.</span>
                <p>It is the user's responsibility to ensure that they are not using cellular data and/or calls and SMS from their home cell operator/supplier. RoamJet is not responsible for bills and costs from the home cell operator/supplier due to incorrect use.</p>
              </div>
              <div className="flex">
                <span className="font-semibold mr-2">6.</span>
                <p>The list of cellular operators in each country appears in the application. If the user is outside the range of cellular networks, there may be difficulties in browsing and using the data package.</p>
              </div>
              <div className="flex">
                <span className="font-semibold mr-2">7.</span>
                <p>It is the user's responsibility to ensure that there are no apps running in the background of their cellphone with high cellular data consumption (such as iCloud backup). RoamJet is not responsible for the data consumption from the user's cellular device.</p>
              </div>
              <div className="flex">
                <span className="font-semibold mr-2">8.</span>
                <p>The validity of the package starts with the consumption of the first KB of data in the destination country. The package expires when the amount of data in the package is used, or after the validity days of the package have passed, whichever is earlier.</p>
              </div>
            </div>
          </section>

          {/* Using RoamJet */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Using RoamJet</h2>
            <div className="space-y-4 text-gray-700 leading-relaxed">
              <p>
                The app, service, content, data and information shown in or sent by RoamJet are given "As-Is", "As Available" and "With all faults" basis. You, as a user, will not have any demand, legal claim or other claim about the data quality, errors in the data, misstatement (including misstatement considering the available eSIMs, the level of the service in a specific country, videos, pricing etc.), or any mistake of any kind whatsoever. It is clarified that you will not raise any argument or claim against Holylabs in respect of any such error, mistake or deception. The presence of certain data in RoamJet does not indicate its reliability or that it is up to date. Note that the images shown are for impression purposes only, and will not be used for any demand or claim against Holylabs.
              </p>
              <p>
                We at Holylabs will do our best to provide you with high-quality services. However, Holylabs does not and cannot guarantee that the eSIM services will have no downtime, will not be interrupted, or be fault-free.
              </p>
              <p>
                The service operates by computer code and by using the internet. You will not have any demand or claim about any failure or problem, any harm of user experience, or any damage of any kind, related to the computer code, the internet, or any other technological factor.
              </p>
              <p>
                It should be noted that RoamJet may not be available with respect to all devices and/or all regions.
              </p>
              <p>
                Holylabs reserves the rights to change, cancel or delete any service, content and/or data, including closing all the services and closing of RoamJet, at any time. You will not have any demand or claim against Holylabs related to any change made in RoamJet. You may cancel your account with us in accordance with applicable consumer protection regulations.
              </p>
              <p>
                Holylabs reserves the right to block users, delete user's data, and to make any change regarding a user, including preventing them from using RoamJet.
              </p>
              <p>
                Using RoamJet by children under the age of 18 is subject to approval of parents or legal guardian. If you are under 18 years, you must ask your parent or legal guardian for permission. If a user under 18 has decided to use RoamJet – it will be considered for all purposes that they had received permission from parents or legal guardian.
              </p>
              <p>
                Using RoamJet by non-manual way (for example: by using API, Bots, Robots etc.) is forbidden. Holylabs may block users and companies who are using RoamJet in a way that a normal human being is not capable of.
              </p>
            </div>
          </section>

          {/* Referral & Rewards Program */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Referral & Rewards Program Terms</h2>
            <div className="space-y-4 text-gray-700 leading-relaxed">
              <p>
                RoamJet offers its users benefits in the form of credits and rewards which can be used in the app only.
              </p>
              <p>
                Credits and rewards can be received, among other reasons, for friend referrals, or with respect to purchasing via the app by the user.
              </p>
              
              <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Friend Referral</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Users can earn rewards for referring their friends using their personal unique referral code.</li>
                <li>The referred user must use the code on checkout and will receive a discount for their first purchase with RoamJet.</li>
                <li>After the successful transaction of the referred user, the referring user will receive rewards to their account.</li>
                <li>The specific reward amounts are determined at Holylabs' sole discretion and may change from time to time.</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">General Terms</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Rewards can only be used for purchasing eSIMs in the RoamJet app and are not convertible to any other form of credit, and cannot be used outside the app.</li>
                <li>RoamJet reserves the right to change, update or cancel the rewards program at any point and for any reason.</li>
                <li>Only referrals that will be done by activating the unique referral code by the referred client will award its referral with the benefits. The user will have no claim with respect to unrecognized or unlisted referrals.</li>
                <li>Users can only use one coupon code for a single purchase.</li>
                <li>Rewards cannot be transferred from one account to another.</li>
                <li>It's the user's responsibility to make sure they use their rewards for a purchase. Refunds won't be given to users who didn't utilize their balance (however, the balance will be carried forward to future purchases).</li>
                <li>In case of cancellation of a purchase for any reason, the granted rewards will be revoked.</li>
              </ul>
            </div>
          </section>

          {/* Affiliate Program */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Affiliate Program Terms</h2>
            <div className="space-y-4 text-gray-700 leading-relaxed">
              <p>
                RoamJet offers an affiliate program that allows users to earn commissions by promoting RoamJet services.
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Affiliate commission rates and payment terms are set at Holylabs' sole discretion and may change at any time.</li>
                <li>Affiliates must comply with all applicable laws and regulations in their promotional activities.</li>
                <li>Holylabs reserves the right to terminate any affiliate account at any time without notice.</li>
                <li>Commissions are only valid for legitimate referrals and purchases. Fraudulent activity will result in immediate termination and forfeiture of all pending commissions.</li>
                <li>Minimum withdrawal amounts and payment methods are determined by Holylabs.</li>
              </ul>
            </div>
          </section>

          {/* Intellectual Property */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Intellectual Property and Copyrights</h2>
            <div className="space-y-4 text-gray-700 leading-relaxed">
              <p>
                All the intellectual property and copyrights regarding RoamJet, including the APP, design, the computer code, the graphic, pictures, the application, site and code structure, and any other component in RoamJet belong only to Holylabs. It is forbidden to copy, distribute, reproduce, publicly display or disclose to third parties any part of this protected material, without prior consent in writing from Holylabs.
              </p>
              <p>
                Holylabs reserves the right to sue anyone for violation of its rights, including for copying snippets of code, copy of the application/site structure, copying styles and any copy or use of Holylabs intellectual property or copyright whether listed or non-listed, including trademarks, whether listed or non-listed.
              </p>
              <p>
                You, the user, must not do anything that will violate Holylabs intellectual property or copyrights, including reverse engineering, de-compile, disassemble, make a similar application or site, make a work or application based on RoamJet or to change or use the application in any other way.
              </p>
              <p>
                The user hereby gives Holylabs full, free, and unlimited-timed license for any content that will be uploaded to Holylabs servers, including text, pictures, videos, reviews and any other content. The user will have no claim about any use made by Holylabs in this intellectual property or information.
              </p>
            </div>
          </section>

          {/* Communication */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Communication</h2>
            <div className="space-y-4 text-gray-700 leading-relaxed">
              <p>
                Holylabs may send you Push Messages, Emails, Chat Messages etc.
              </p>
              <p>
                If you do not wish to receive push messages, you may terminate this option from your device settings.
              </p>
            </div>
          </section>

          {/* General Terms */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">General</h2>
            <div className="space-y-4 text-gray-700 leading-relaxed">
              <p>
                Holylabs reserves the right to sue any user for any damage, harm, loss, or future loss of profits. For example, such damages can be made by fictitious use of the app, attacking or overloading the servers, copying data and/or information from RoamJet for commercial use or any other unpermitted use.
              </p>
              <p>
                The user will compensate Holylabs for any loss, expense, future loss of profits or a payment that Holylabs will have due to a use that is not according to these TOU.
              </p>
              <p>
                These TOU shall be governed by the laws of England and Wales. Any litigation between the user and Holylabs will be held at the competent courts in London, United Kingdom.
              </p>
              <p>
                If any part of these TOU will be held to be unlawful, void, or for any reason unenforceable during arbitration or by a court of competent jurisdiction, then that provision will be deemed severable from these TOU and will not affect the validity and enforceability of any remaining parts.
              </p>
              <p>
                Anywhere these TOU are in masculine – also in feminine, and vice versa. Anywhere written singular – also plural, and vice versa, all as applicable. If there are 2 or more conflicting provisions they shall be read cumulatively, so the more restrictive provisions shall apply to the user.
              </p>
              <p>
                Holylabs reserves the right to change these Terms of Use at any time and without advance notice. The user takes the responsibility to review the terms of use periodically to be familiar with any changes and to check if they still wish to use RoamJet.
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


