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
  title: 'Programa de Afiliados - Gana $1 por Referido | Roam Jet Plans',
  description: 'Únete a nuestro programa de afiliados y gana $1 por cada amigo que refieras a Roam Jet Plans. Comparte tu código de referido y comienza a ganar dinero hoy. Sin comisiones, pagos instantáneos.',
  keywords: [
    'programa de afiliados', 'programa de referidos', 'ganar dinero', 'comisión de referido', 
    'afiliado eSIM', 'afiliado de viajes', 'bonificación de referido', 'ganar con referidos',
    'marketing de afiliados', 'recompensas de referidos', 'programa de comisiones', 'ingresos por referidos'
  ],
  authors: [{ name: 'Equipo Roam Jet Plans' }],
  creator: 'Roam Jet Plans',
  publisher: 'Roam Jet Plans',
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://esimplans.com'),
  alternates: {
    canonical: '/spanish/affiliate-program',
  },
  openGraph: {
    type: 'website',
    locale: 'es_ES',
    url: '/spanish/affiliate-program',
    title: 'Programa de Afiliados - Gana $1 por Referido | Roam Jet Plans',
    description: 'Únete a nuestro programa de afiliados y gana $1 por cada amigo que refieras a Roam Jet Plans. Comparte tu código de referido y comienza a ganar dinero hoy.',
    siteName: 'Roam Jet Plans',
    images: [
      {
        url: '/images/affiliate-og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Programa de Afiliados Roam Jet Plans - Gana $1 por Referido',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Programa de Afiliados - Gana $1 por Referido | Roam Jet Plans',
    description: 'Únete a nuestro programa de afiliados y gana $1 por cada amigo que refieras a Roam Jet Plans.',
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
        toast.success('¡Código de referido copiado al portapapeles!');
      } catch (error) {
        console.error('Failed to copy referral code:', error);
        toast.error('Error al copiar el código de referido');
      }
    }
  };

  const shareReferralCode = async () => {
    if (referralStats.referralCode) {
      const shareText = `¡Únete a mí en RoamJet! Usa mi código de referido: ${referralStats.referralCode}`;

      if (navigator.share) {
        try {
          await navigator.share({
            title: 'Referido RoamJet',
            text: shareText,
          });
        } catch (error) {
          console.error('Error sharing:', error);
        }
      } else {
        // Fallback to copying to clipboard
        try {
          await navigator.clipboard.writeText(shareText);
          toast.success('¡Mensaje de referido copiado al portapapeles!');
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
          toast('No hay ganancias de referidos pendientes de retiro', {
            icon: 'ℹ️',
            duration: 3000,
          });
          return;
        }

        // Calculate total amount first to check minimum withdrawal
        const totalAmount = transactionsSnapshot.docs.reduce((sum, doc) => sum + (doc.data().amount || 0), 0);
        const minimumWithdrawal = 50;

        if (totalAmount < minimumWithdrawal) {
          toast.error(`Cantidad mínima de retiro: $${minimumWithdrawal}. Tienes $${totalAmount.toFixed(2)} disponible.`, {
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
          description: `Retiro de ${updatedCount} ganancias de referidos`,
          status: 'completed',
          method: 'withdrawal',
          withdrawalDate: new Date(),
          transactionCount: updatedCount,
          timestamp: new Date(),
          createdAt: new Date(),
        });
        
        toast.success(`¡Retiro exitoso de $${totalAmount.toFixed(2)} de ${updatedCount} ganancias de referidos!`);
        
        // Reload referral stats to reflect changes
        loadReferralStats();
        
      } catch (error) {
        console.error('Error processing withdrawal:', error);
        toast.error('Error al procesar el retiro');
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
    "name": "Programa de Afiliados - Roam Jet Plans",
    "description": "Únete a nuestro programa de afiliados y gana $1 por cada amigo que refieras a Roam Jet Plans",
    "url": `${process.env.NEXT_PUBLIC_BASE_URL || "https://esimplans.com"}/spanish/affiliate-program`,
    "mainEntity": {
      "@type": "ProgramMembership",
      "name": "Programa de Afiliados Roam Jet Plans",
      "description": "Gana $1 de comisión por cada referido exitoso",
      "programName": "Programa de Afiliados Roam Jet Plans",
      "member": {
        "@type": "Person",
        "name": "Miembro Afiliado"
      },
      "offers": {
        "@type": "Offer",
        "name": "Comisión de Referido",
        "description": "$1 de comisión por cada referido exitoso",
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
          "name": "Inicio",
          "item": process.env.NEXT_PUBLIC_BASE_URL || "https://esimplans.com"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Programa de Afiliados",
          "item": `${process.env.NEXT_PUBLIC_BASE_URL || "https://esimplans.com"}/spanish/affiliate-program`
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
              <h1 className="text-xl font-bold text-gray-900">Programa de Afiliados</h1>
              <p className="text-sm text-gray-600">Gana hasta 25% por compra</p>
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
            <h3 className="text-xl font-bold text-gray-900 mb-2">Tu Rendimiento</h3>
            <p className="text-gray-600">Rastrea el éxito de tus referidos</p>
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
                    {referralStats.referralCode || 'Cargando...'}
                  </p>
                  <p className="text-sm text-gray-600">Tu Código de Referido</p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={copyReferralCode}
                    disabled={!referralStats.referralCode}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-lg text-sm font-medium transition-colors text-white"
                  >
                    <Copy className="w-4 h-4 inline mr-1" />
                    Copiar
                  </button>
                  <button
                    onClick={shareReferralCode}
                    disabled={!referralStats.referralCode}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-lg text-sm font-medium transition-colors text-gray-700"
                  >
                    <Share2 className="w-4 h-4 inline mr-1" />
                    Compartir
                  </button>
                </div>
              </div>

              <div className="text-center">
                <div className="bg-gray-50 rounded-lg p-6">
                  <div className="flex items-center justify-center mb-2">
                    <Users className="w-8 h-8 text-blue-600" />
                  </div>
                  <p className="text-3xl font-bold text-gray-900">{referralStats.usageCount}</p>
                  <p className="text-sm text-gray-600">Total de Referidos</p>
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
                  <p className="text-sm text-gray-600">Ganancias Totales</p>
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
              <h3 className="text-lg font-bold text-gray-900 mb-4">Retira tus Ganancias</h3>
              <p className="text-gray-600 mb-2">
                Transfiere tus ganancias de referidos a tu cuenta bancaria
              </p>
              <p className="text-sm text-gray-500 mb-6">
                Retiro mínimo: $50.00
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
                    ? 'Verificando...' 
                    : referralStats.totalEarnings < 50 
                      ? `Necesitas $${(50 - referralStats.totalEarnings).toFixed(2)} más` 
                      : 'Retirar Fondos'
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
              <h3 className="text-lg font-bold text-gray-900 mb-4">Agregar Cuenta Bancaria</h3>
              <p className="text-gray-600 mb-6">
                Agrega los datos de tu cuenta bancaria para retirar tus ganancias
              </p>
              <button
                onClick={handleWithdrawClick}
                className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg text-white font-medium transition-colors flex items-center space-x-2 mx-auto"
              >
                <CreditCard className="w-5 h-5" />
                <span>Agregar Cuenta Bancaria</span>
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
          <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">Cómo Funciona</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="bg-blue-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl font-bold text-blue-600">1</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Comparte tu Código</h4>
              <p className="text-sm text-gray-600">Copia y comparte tu código de referido único con amigos</p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl font-bold text-green-600">2</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Tu Amigo se Registra</h4>
              <p className="text-sm text-gray-600">Tu amigo usa tu código al crear su cuenta</p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl font-bold text-purple-600">3</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Gana hasta 25%</h4>
              <p className="text-sm text-gray-600">Ganas hasta 25% de cada compra exitosa</p>
            </div>
          </div>
        </motion.div>

      </div>
      </div>
    </>
  );
};

export default AffiliateProgramPage;
