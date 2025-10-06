'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Copy, Share2, Users, CreditCard, Wallet, TrendingUp, Gift, Star } from 'lucide-react';
import { useAuth } from '../../src/contexts/AuthContext';
import { useI18n } from '../../src/contexts/I18nContext';
import { getReferralStats, createReferralCode } from '../../src/services/referralService';
import { doc, getDoc, collection, query, where, getDocs, writeBatch, setDoc } from 'firebase/firestore';
import { db } from '../../src/firebase/config';
import toast from 'react-hot-toast';

const AffiliateProgramPage = () => {
  const router = useRouter();
  const { currentUser } = useAuth();
  const { t } = useI18n();
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
        toast.success(t('affiliate.referralCodeCopied', 'Referral code copied to clipboard!'));
      } catch (error) {
        console.error('Failed to copy referral code:', error);
        toast.error(t('affiliate.copyFailed', 'Failed to copy referral code'));
      }
    }
  };

  const shareReferralCode = async () => {
    if (referralStats.referralCode) {
      const shareText = t('affiliate.shareMessage', 'Join me on RoamJet! Use my referral code: {{code}}', { code: referralStats.referralCode });

      if (navigator.share) {
        try {
          await navigator.share({
            title: t('affiliate.shareTitle', 'RoamJet Referral'),
            text: shareText,
          });
        } catch (error) {
          console.error('Error sharing:', error);
        }
      } else {
        // Fallback to copying to clipboard
        try {
          await navigator.clipboard.writeText(shareText);
          toast.success(t('affiliate.shareMessageCopied', 'Referral message copied to clipboard!'));
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
          toast('No pending referral earnings to withdraw', {
            icon: 'ℹ️',
            duration: 3000,
          });
          return;
        }

        // Calculate total amount first to check minimum withdrawal
        const totalAmount = transactionsSnapshot.docs.reduce((sum, doc) => sum + (doc.data().amount || 0), 0);
        const minimumWithdrawal = 50;

        if (totalAmount < minimumWithdrawal) {
          toast.error(`Minimum withdrawal amount is $${minimumWithdrawal}. You have $${totalAmount.toFixed(2)} available.`, {
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
          description: `Withdrawal of ${updatedCount} referral earnings`,
          status: 'completed',
          method: 'withdrawal',
          withdrawalDate: new Date(),
          transactionCount: updatedCount,
          timestamp: new Date(),
          createdAt: new Date(),
        });
        
        toast.success(`Successfully withdrew $${totalAmount.toFixed(2)} from ${updatedCount} referral earnings!`);
        
        // Reload referral stats to reflect changes
        loadReferralStats();
        
      } catch (error) {
        console.error('Error processing withdrawal:', error);
        toast.error('Failed to process withdrawal');
      }
    } else {
      // User doesn't have bank account - redirect to add bank account
      router.push('/add-bank-account');
    }
  };

  const handleEarningsClick = () => {
    router.push('/transactions');
  };


  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-tufts-blue to-cobalt-blue shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">{t('affiliate.title', 'Affiliate Program')}</h1>
                <p className="text-blue-100">{t('affiliate.subtitle', 'Earn money by referring friends')}</p>
              </div>
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
          className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-gray-100"
        >
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-gradient-to-r from-tufts-blue to-cobalt-blue p-3 rounded-full">
                <Star className="w-6 h-6 text-white" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">{t('affiliate.yourPerformance', 'Your Performance')}</h3>
            <p className="text-gray-600">{t('affiliate.trackSuccess', 'Track your referral success and earnings')}</p>
          </div>

          {loadingReferralStats ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 mb-4 border border-blue-200">
                  <div className="flex items-center justify-center mb-3">
                    <Gift className="w-8 h-8 text-blue-600" />
                  </div>
                  <p className="text-3xl font-bold font-mono text-blue-900 mb-2">
                    {referralStats.referralCode || t('affiliate.loading', 'Loading...')}
                  </p>
                  <p className="text-sm text-blue-700 font-medium">{t('affiliate.yourReferralCode', 'Your Referral Code')}</p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={copyReferralCode}
                    disabled={!referralStats.referralCode}
                    className="flex-1 bg-gradient-to-r from-tufts-blue to-cobalt-blue hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 text-white shadow-lg hover:shadow-xl"
                  >
                    <Copy className="w-4 h-4 inline mr-2" />
                    {t('affiliate.copy', 'Copy')}
                  </button>
                  <button
                    onClick={shareReferralCode}
                    disabled={!referralStats.referralCode}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 text-gray-700 border border-gray-200 hover:border-gray-300"
                  >
                    <Share2 className="w-4 h-4 inline mr-2" />
                    {t('affiliate.share', 'Share')}
                  </button>
                </div>
              </div>

              <div className="text-center">
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 border border-purple-200">
                  <div className="flex items-center justify-center mb-4">
                    <Users className="w-10 h-10 text-purple-600" />
                  </div>
                  <p className="text-4xl font-bold text-purple-900 mb-2">{referralStats.usageCount}</p>
                  <p className="text-sm text-purple-700 font-medium">{t('affiliate.totalReferrals', 'Total Referrals')}</p>
                </div>
              </div>

              <div className="text-center">
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 border border-green-200">
                  <div className="flex items-center justify-center mb-4">
                    <Wallet className="w-10 h-10 text-green-600" />
                  </div>
                  <button
                    onClick={handleEarningsClick}
                    className="text-4xl font-bold text-green-700 hover:text-green-800 transition-colors cursor-pointer mb-2 block w-full"
                  >
                    ${referralStats.totalEarnings.toFixed(2)}
                  </button>
                  <p className="text-sm text-green-700 font-medium">{t('affiliate.totalEarnings', 'Total Earnings')}</p>
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
              <h3 className="text-lg font-bold text-gray-900 mb-4">Withdraw Your Earnings</h3>
              <p className="text-gray-600 mb-2">
                Transfer your referral earnings to your bank account
              </p>
              <p className="text-sm text-gray-500 mb-6">
                Minimum withdrawal: $50.00
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
                    ? 'Checking...' 
                    : referralStats.totalEarnings < 50 
                      ? `Need $${(50 - referralStats.totalEarnings).toFixed(2)} more` 
                      : 'Withdraw Funds'
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
              <h3 className="text-lg font-bold text-gray-900 mb-4">Add Bank Account</h3>
              <p className="text-gray-600 mb-6">
                Add your bank account details to withdraw your earnings
              </p>
              <button
                onClick={handleWithdrawClick}
                className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg text-white font-medium transition-colors flex items-center space-x-2 mx-auto"
              >
                <CreditCard className="w-5 h-5" />
                <span>Add Bank Account</span>
              </button>
            </div>
          </motion.div>
        )}

        {/* How It Works */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-gray-100"
        >
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">{t('affiliate.howItWorks', 'How It Works')}</h3>
            <p className="text-gray-600">{t('affiliate.howItWorksDesc', 'Simple steps to start earning with referrals')}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-gradient-to-br from-blue-100 to-blue-200 p-6 rounded-2xl w-20 h-20 mx-auto mb-6 flex items-center justify-center shadow-lg">
                <span className="text-2xl font-bold text-blue-700">1</span>
              </div>
              <h4 className="font-bold text-gray-900 mb-3 text-lg">{t('affiliate.step1Title', 'Share Your Code')}</h4>
              <p className="text-gray-600">{t('affiliate.step1Desc', 'Copy and share your unique referral code with friends and family')}</p>
            </div>
            <div className="text-center">
              <div className="bg-gradient-to-br from-green-100 to-green-200 p-6 rounded-2xl w-20 h-20 mx-auto mb-6 flex items-center justify-center shadow-lg">
                <span className="text-2xl font-bold text-green-700">2</span>
              </div>
              <h4 className="font-bold text-gray-900 mb-3 text-lg">{t('affiliate.step2Title', 'Friend Signs Up')}</h4>
              <p className="text-gray-600">{t('affiliate.step2Desc', 'Your friend uses your code when creating their RoamJet account')}</p>
            </div>
            <div className="text-center">
              <div className="bg-gradient-to-br from-purple-100 to-purple-200 p-6 rounded-2xl w-20 h-20 mx-auto mb-6 flex items-center justify-center shadow-lg">
                <span className="text-2xl font-bold text-purple-700">3</span>
              </div>
              <h4 className="font-bold text-gray-900 mb-3 text-lg">{t('affiliate.step3Title', 'Earn $1')}</h4>
              <p className="text-gray-600">{t('affiliate.step3Desc', 'You instantly earn $1 for each successful referral - no limits!')}</p>
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
};

export default AffiliateProgramPage;
