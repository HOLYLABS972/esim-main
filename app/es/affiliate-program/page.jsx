'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../src/contexts/AuthContext';
import { useI18n } from '../../../src/contexts/I18nContext';
import { getReferralStats, createReferralCode } from '../../../src/services/referralService';
import { doc, getDoc, collection, query, where, getDocs, writeBatch, setDoc } from 'firebase/firestore';
import { db } from '../../../src/firebase/config';
import toast from 'react-hot-toast';

// Affiliate Components
import AffiliateHeader from '../../../src/components/affiliate/AffiliateHeader';
import AffiliateStats from '../../../src/components/affiliate/AffiliateStats';
import WithdrawalSection from '../../../src/components/affiliate/WithdrawalSection';
import HowItWorks from '../../../src/components/affiliate/HowItWorks';

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

  const handleAddBankAccount = () => {
    router.push('/add-bank-account');
  };

  const handleEditBankAccount = () => {
    router.push('/add-bank-account');
  };

  const handleDeleteBankAccount = async () => {
    // Implement delete bank account logic if needed
    console.log('Delete bank account clicked');
  };


  // If user is not logged in, show public landing page
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-white">
        {/* Header Section */}
        <section className="bg-white py-8">
          <div className="mx-auto max-w-2xl px-6 lg:max-w-7xl lg:px-8">
            <div className="relative">
              <div className="absolute inset-px rounded-xl bg-white"></div>
              <div className="relative flex h-full flex-col overflow-hidden rounded-xl">
                <div className="px-8 pt-6 pb-6">
                  <AffiliateHeader onBack={() => router.back()} />
                </div>
              </div>
              <div className="pointer-events-none absolute inset-px rounded-xl shadow-sm ring-1 ring-black/5"></div>
            </div>
          </div>
        </section>

        {/* How It Works - Main content for visitors */}
        <HowItWorks />

        {/* Call to Action - Login/Register */}
        <section className="bg-white py-16">
          <div className="mx-auto max-w-2xl px-6 lg:max-w-7xl lg:px-8">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-eerie-black mb-4">{t('affiliate.readyToEarn', 'Ready to Start Earning?')}</h3>
              <p className="text-cool-black mb-8">{t('affiliate.createAccountPrompt', 'Create an account or log in to get your referral code')}</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => router.push('/es/register')}
                  className="btn-primary px-8 py-3 text-white font-semibold rounded-full transition-all duration-200"
                >
                  {t('auth.register.title', 'Create Account')}
                </button>
                <button
                  onClick={() => router.push('/es/login')}
                  className="bg-white text-tufts-blue border-2 border-tufts-blue hover:bg-tufts-blue hover:text-white px-8 py-3 rounded-full font-semibold transition-all duration-200"
                >
                  {t('navbar.login', 'Log In')}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Spacing after content */}
        <div className="h-20"></div>
      </div>
    );
  }

  // Logged-in users see their dashboard
  return (
    <div className="min-h-screen bg-white ">
      {/* Header Section */}
      <section className="bg-white py-8">
        <div className="mx-auto max-w-2xl px-6 lg:max-w-7xl lg:px-8">
          <div className="relative">
            <div className="absolute inset-px rounded-xl bg-white"></div>
            <div className="relative flex h-full flex-col overflow-hidden rounded-xl">
              <div className="px-8 pt-6 pb-6">
                <AffiliateHeader onBack={() => router.back()} />
              </div>
            </div>
            <div className="pointer-events-none absolute inset-px rounded-xl shadow-sm ring-1 ring-black/5"></div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <AffiliateStats 
        referralStats={referralStats}
        loadingReferralStats={loadingReferralStats}
        onEarningsClick={handleEarningsClick}
      />

      {/* Withdrawal Section */}
      <WithdrawalSection 
        hasBankAccount={hasBankAccount}
        checkingBankAccount={checkingBankAccount}
        referralStats={referralStats}
        onWithdrawClick={handleWithdrawClick}
        onAddBankAccount={handleAddBankAccount}
        onEditBankAccount={handleEditBankAccount}
        onDeleteBankAccount={handleDeleteBankAccount}
      />

      {/* How It Works - Show last for logged-in users */}
      <HowItWorks />

      {/* Spacing after content */}
      <div className="h-20"></div>
    </div>
  );
};

export default AffiliateProgramPage;

