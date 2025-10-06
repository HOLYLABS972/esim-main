import React from 'react';
import { Copy, Share2, Users, Wallet, Gift, Star } from 'lucide-react';
import { useI18n } from '../../contexts/I18nContext';
import toast from 'react-hot-toast';

const AffiliateStats = ({ referralStats, loadingReferralStats, onEarningsClick }) => {
  const { t } = useI18n();

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

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-gray-100">
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
          {/* Referral Code Card */}
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

          {/* Total Referrals Card */}
          <div className="text-center">
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 border border-purple-200">
              <div className="flex items-center justify-center mb-4">
                <Users className="w-10 h-10 text-purple-600" />
              </div>
              <p className="text-4xl font-bold text-purple-900 mb-2">{referralStats.usageCount}</p>
              <p className="text-sm text-purple-700 font-medium">{t('affiliate.totalReferrals', 'Total Referrals')}</p>
            </div>
          </div>

          {/* Total Earnings Card */}
          <div className="text-center">
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 border border-green-200">
              <div className="flex items-center justify-center mb-4">
                <Wallet className="w-10 h-10 text-green-600" />
              </div>
              <button
                onClick={onEarningsClick}
                className="text-4xl font-bold text-green-700 hover:text-green-800 transition-colors cursor-pointer mb-2 block w-full"
              >
                ${referralStats.totalEarnings.toFixed(2)}
              </button>
              <p className="text-sm text-green-700 font-medium">{t('affiliate.totalEarnings', 'Total Earnings')}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AffiliateStats;
