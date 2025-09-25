'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Copy, Share2, Users, CreditCard, Wallet } from 'lucide-react';
import { useAuth } from '../../../src/contexts/AuthContext';
import { getReferralStats, createReferralCode } from '../../../src/services/referralService';
import { doc, getDoc, collection, query, where, getDocs, writeBatch, setDoc } from 'firebase/firestore';
import { db } from '../../../src/firebase/config';
import toast from 'react-hot-toast';

export const metadata = {
  title: 'Partnerprogramm - Verdienen Sie $1 pro Empfehlung | Roam Jet Plans',
  description: 'Treten Sie unserem Partnerprogramm bei und verdienen Sie $1 für jeden Freund, den Sie an Roam Jet Plans weiterleiten. Teilen Sie Ihren Empfehlungscode und verdienen Sie noch heute Geld. Keine Gebühren, sofortige Auszahlungen.',
  keywords: [
    'Partnerprogramm', 'Empfehlungsprogramm', 'Geld verdienen', 'Empfehlungsprovision', 
    'eSIM Partner', 'Reise Partner', 'Empfehlungsbonus', 'Verdienen durch Empfehlungen',
    'Affiliate Marketing', 'Empfehlungsbelohnungen', 'Provisionprogramm', 'Empfehlungseinkommen'
  ],
  authors: [{ name: 'Roam Jet Plans Team' }],
  creator: 'Roam Jet Plans',
  publisher: 'Roam Jet Plans',
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://esimplans.com'),
  alternates: {
    canonical: '/german/affiliate-program',
  },
  openGraph: {
    type: 'website',
    locale: 'de_DE',
    url: '/german/affiliate-program',
    title: 'Partnerprogramm - Verdienen Sie $1 pro Empfehlung | Roam Jet Plans',
    description: 'Treten Sie unserem Partnerprogramm bei und verdienen Sie $1 für jeden Freund, den Sie an Roam Jet Plans weiterleiten. Teilen Sie Ihren Empfehlungscode und verdienen Sie noch heute Geld.',
    siteName: 'Roam Jet Plans',
    images: [
      {
        url: '/images/affiliate-og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Roam Jet Plans Partnerprogramm - Verdienen Sie $1 pro Empfehlung',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Partnerprogramm - Verdienen Sie $1 pro Empfehlung | Roam Jet Plans',
    description: 'Treten Sie unserem Partnerprogramm bei und verdienen Sie $1 für jeden Freund, den Sie an Roam Jet Plans weiterleiten.',
    images: ['/images/affiliate-twitter-image.jpg'],
    creator: '@roamjetplans',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

const AffiliateProgramPage = () => {
  const router = useRouter();
  const { currentUser } = useAuth();
  const [referralStats, setReferralStats] = useState({
    referralCode: null,
    usageCount: 0,
    totalEarnings: 0,
    isActive: false
  });
  const [loadingReferralStats, setLoadingReferralStats] = useState(false);
  const [hasBankAccount, setHasBankAccount] = useState(false);
  const [checkingBankAccount, setCheckingBankAccount] = useState(false);

  const loadReferralStats = useCallback(async () => {
    if (!currentUser) return;

    try {
      setLoadingReferralStats(true);
      const stats = await getReferralStats(currentUser.uid);

      if (stats.referralCode) {
        setReferralStats(stats);
      } else {
        // Create referral code if user doesn't have one
        const result = await createReferralCode(currentUser.uid, currentUser.email);
        if (result.success) {
          // Reload stats after creating code
          const newStats = await getReferralStats(currentUser.uid);
          setReferralStats(newStats);
        }
      }
    } catch (error) {
      console.error('Error loading referral stats:', error);
    } finally {
      setLoadingReferralStats(false);
    }
  }, [currentUser]);

  const checkBankAccount = useCallback(async () => {
    if (!currentUser) return;

    try {
      setCheckingBankAccount(true);
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      const userData = userDoc.data();
      
      if (userData?.bankAccount) {
        setHasBankAccount(true);
      } else {
        setHasBankAccount(false);
      }
    } catch (error) {
      console.error('Error checking bank account:', error);
      setHasBankAccount(false);
    } finally {
      setCheckingBankAccount(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      loadReferralStats();
      checkBankAccount();
    }
  }, [currentUser, loadReferralStats, checkBankAccount]);

  const copyReferralCode = async () => {
    if (referralStats.referralCode) {
      try {
        await navigator.clipboard.writeText(referralStats.referralCode);
        toast.success('Empfehlungscode in die Zwischenablage kopiert!');
      } catch (error) {
        console.error('Failed to copy referral code:', error);
        toast.error('Fehler beim Kopieren des Empfehlungscodes');
      }
    }
  };

  const shareReferralCode = async () => {
    if (referralStats.referralCode) {
      const shareText = `Treten Sie mir bei RoamJet bei! Verwenden Sie meinen Empfehlungscode: ${referralStats.referralCode}`;

      if (navigator.share) {
        try {
          await navigator.share({
            title: 'RoamJet Empfehlung',
            text: shareText,
          });
        } catch (error) {
          console.error('Error sharing:', error);
        }
      } else {
        // Fallback to copying to clipboard
        try {
          await navigator.clipboard.writeText(shareText);
          toast.success('Empfehlungsnachricht in die Zwischenablage kopiert!');
        } catch (error) {
          console.error('Failed to copy referral message:', error);
        }
      }
    }
  };

  const handleWithdrawClick = async () => {
    if (hasBankAccount) {
      // User has bank account - mark their referral transactions as paid
      try {
        // Get user's unpaid referral transactions
        const transactionsSnapshot = await getDocs(
          query(
            collection(db, 'users', currentUser.uid, 'transactions'),
            where('type', '==', 'deposit'),
            where('method', '==', 'referral_commission'),
            where('status', '==', 'completed')
          )
        );

        if (transactionsSnapshot.empty) {
          toast('Keine ausstehenden Empfehlungseinnahmen zum Abheben', {
            icon: 'ℹ️',
            duration: 3000,
          });
          return;
        }

        // Calculate total amount first to check minimum withdrawal
        const totalAmount = transactionsSnapshot.docs.reduce((sum, doc) => sum + (doc.data().amount || 0), 0);
        const minimumWithdrawal = 50;

        if (totalAmount < minimumWithdrawal) {
          toast.error(`Mindestabhebungsbetrag ist $${minimumWithdrawal}. Sie haben $${totalAmount.toFixed(2)} verfügbar.`, {
            duration: 5000,
          });
          return;
        }

        // Update transactions to mark as paid
        const batch = writeBatch(db);
        let updatedCount = 0;

        transactionsSnapshot.docs.forEach((transactionDoc) => {
          const transactionRef = doc(db, 'users', currentUser.uid, 'transactions', transactionDoc.id);
          batch.update(transactionRef, {
            status: 'paid',
            paidAt: new Date(),
            paidBy: 'user_request'
          });
          updatedCount++;
        });

        await batch.commit();
        
        // Create a withdrawal record
        const withdrawalRef = doc(collection(db, 'users', currentUser.uid, 'transactions'));
        
        await setDoc(withdrawalRef, {
          type: 'purchase', // Withdrawal is a purchase/expense
          amount: totalAmount,
          description: `Abhebung von ${updatedCount} Empfehlungseinnahmen`,
          status: 'completed',
          method: 'withdrawal',
          withdrawalDate: new Date(),
          transactionCount: updatedCount,
          timestamp: new Date(),
          createdAt: new Date(),
        });
        
        toast.success(`Erfolgreich $${totalAmount.toFixed(2)} von ${updatedCount} Empfehlungseinnahmen abgehoben!`);
        
        // Reload referral stats to reflect changes
        loadReferralStats();
        
      } catch (error) {
        console.error('Error processing withdrawal:', error);
        toast.error('Fehler beim Verarbeiten der Abhebung');
      }
    } else {
      // User doesn't have bank account - redirect to add bank account
      router.push('/add-bank-account');
    }
  };

  const handleEarningsClick = () => {
    router.push('/transactions');
  };


  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Partnerprogramm - Roam Jet Plans",
    "description": "Treten Sie unserem Partnerprogramm bei und verdienen Sie $1 für jeden Freund, den Sie an Roam Jet Plans weiterleiten",
    "url": `${process.env.NEXT_PUBLIC_BASE_URL || "https://esimplans.com"}/german/affiliate-program`,
    "mainEntity": {
      "@type": "ProgramMembership",
      "name": "Roam Jet Plans Partnerprogramm",
      "description": "Verdienen Sie $1 Provision für jede erfolgreiche Empfehlung",
      "programName": "Roam Jet Plans Partnerprogramm",
      "member": {
        "@type": "Person",
        "name": "Partner Mitglied"
      },
      "offers": {
        "@type": "Offer",
        "name": "Empfehlungsprovision",
        "description": "$1 Provision pro erfolgreiche Empfehlung",
        "price": "1.00",
        "priceCurrency": "USD"
      }
    },
    "breadcrumb": {
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Startseite",
          "item": process.env.NEXT_PUBLIC_BASE_URL || "https://esimplans.com"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Partnerprogramm",
          "item": `${process.env.NEXT_PUBLIC_BASE_URL || "https://esimplans.com"}/german/affiliate-program`
        }
      ]
    }
  };

  return (
    <>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData)
        }}
      />
      
      <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Partnerprogramm</h1>
              <p className="text-sm text-gray-600">Verdienen Sie Geld durch Empfehlungen von Freunden</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-lg p-6 mb-8"
        >
          <div className="text-center mb-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Ihre Leistung</h3>
            <p className="text-gray-600">Verfolgen Sie Ihren Empfehlungserfolg</p>
          </div>

          {loadingReferralStats ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="bg-gray-50 rounded-lg p-6 mb-4">
                  <p className="text-3xl font-bold font-mono text-gray-900">
                    {referralStats.referralCode || 'Laden...'}
                  </p>
                  <p className="text-sm text-gray-600">Ihr Empfehlungscode</p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={copyReferralCode}
                    disabled={!referralStats.referralCode}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-lg text-sm font-medium transition-colors text-white"
                  >
                    <Copy className="w-4 h-4 inline mr-1" />
                    Kopieren
                  </button>
                  <button
                    onClick={shareReferralCode}
                    disabled={!referralStats.referralCode}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-lg text-sm font-medium transition-colors text-gray-700"
                  >
                    <Share2 className="w-4 h-4 inline mr-1" />
                    Teilen
                  </button>
                </div>
              </div>

              <div className="text-center">
                <div className="bg-gray-50 rounded-lg p-6">
                  <div className="flex items-center justify-center mb-2">
                    <Users className="w-8 h-8 text-blue-600" />
                  </div>
                  <p className="text-3xl font-bold text-gray-900">{referralStats.usageCount}</p>
                  <p className="text-sm text-gray-600">Gesamte Empfehlungen</p>
                </div>
              </div>

              <div className="text-center">
                <div className="bg-gray-50 rounded-lg p-6">
                  <div className="flex items-center justify-center mb-2">
                    <Wallet className="w-8 h-8 text-green-600" />
                  </div>
                  <button
                    onClick={handleEarningsClick}
                    className="text-3xl font-bold text-green-600 hover:text-green-700 transition-colors cursor-pointer"
                  >
                    ${referralStats.totalEarnings.toFixed(2)}
                  </button>
                  <p className="text-sm text-gray-600">Gesamteinnahmen</p>
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Withdraw Button */}
        {/* Only show withdrawal section if user has a bank account */}
        {hasBankAccount && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white rounded-xl shadow-lg p-6 mb-8"
          >
            <div className="text-center">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Heben Sie Ihre Einnahmen ab</h3>
              <p className="text-gray-600 mb-2">
                Übertragen Sie Ihre Empfehlungseinnahmen auf Ihr Bankkonto
              </p>
              <p className="text-sm text-gray-500 mb-6">
                Mindestabhebung: $50.00
              </p>
              <button
                onClick={handleWithdrawClick}
                disabled={checkingBankAccount || referralStats.totalEarnings < 50}
                className={`${
                  referralStats.totalEarnings < 50 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-green-600 hover:bg-green-700'
                } disabled:opacity-50 disabled:cursor-not-allowed px-6 py-3 rounded-lg text-white font-medium transition-colors flex items-center space-x-2 mx-auto`}
              >
                <CreditCard className="w-5 h-5" />
                <span>
                  {checkingBankAccount 
                    ? 'Überprüfen...' 
                    : referralStats.totalEarnings < 50 
                      ? `Noch $${(50 - referralStats.totalEarnings).toFixed(2)} benötigt` 
                      : 'Geld abheben'
                  }
                </span>
              </button>
            </div>
          </motion.div>
        )}

        {/* Show add bank account section if user doesn't have a bank account */}
        {!hasBankAccount && !checkingBankAccount && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white rounded-xl shadow-lg p-6 mb-8"
          >
            <div className="text-center">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Bankkonto hinzufügen</h3>
              <p className="text-gray-600 mb-6">
                Fügen Sie Ihre Bankkontodaten hinzu, um Ihre Einnahmen abzuheben
              </p>
              <button
                onClick={handleWithdrawClick}
                className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg text-white font-medium transition-colors flex items-center space-x-2 mx-auto"
              >
                <CreditCard className="w-5 h-5" />
                <span>Bankkonto hinzufügen</span>
              </button>
            </div>
          </motion.div>
        )}

        {/* How It Works */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-lg p-6 mb-8"
        >
          <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">So funktioniert es</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="bg-blue-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl font-bold text-blue-600">1</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Teilen Sie Ihren Code</h4>
              <p className="text-sm text-gray-600">Kopieren und teilen Sie Ihren eindeutigen Empfehlungscode mit Freunden</p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl font-bold text-green-600">2</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Freund meldet sich an</h4>
              <p className="text-sm text-gray-600">Ihr Freund verwendet Ihren Code bei der Erstellung seines Kontos</p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl font-bold text-purple-600">3</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Verdienen Sie $1</h4>
              <p className="text-sm text-gray-600">Sie verdienen sofort $1 für jede erfolgreiche Empfehlung</p>
            </div>
          </div>
        </motion.div>

      </div>
      </div>
    </>
  );
};

export default AffiliateProgramPage;
