import React from 'react';
import { CreditCard } from 'lucide-react';

const WithdrawalSection = ({ 
  hasBankAccount, 
  checkingBankAccount, 
  referralStats, 
  onWithdrawClick 
}) => {
  if (checkingBankAccount) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking bank account...</p>
        </div>
      </div>
    );
  }

  if (hasBankAccount) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <div className="text-center">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Withdraw Your Earnings</h3>
          <p className="text-gray-600 mb-2">
            Transfer your referral earnings to your bank account
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Minimum withdrawal: $50.00
          </p>
          <button
            onClick={onWithdrawClick}
            disabled={referralStats.totalEarnings < 50}
            className={`${
              referralStats.totalEarnings < 50 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-green-600 hover:bg-green-700'
            } disabled:opacity-50 disabled:cursor-not-allowed px-6 py-3 rounded-lg text-white font-medium transition-colors flex items-center space-x-2 mx-auto`}
          >
            <CreditCard className="w-5 h-5" />
            <span>
              {referralStats.totalEarnings < 50 
                ? `Need $${(50 - referralStats.totalEarnings).toFixed(2)} more` 
                : 'Withdraw Funds'
              }
            </span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
      <div className="text-center">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Add Bank Account</h3>
        <p className="text-gray-600 mb-6">
          Add your bank account details to withdraw your earnings
        </p>
        <button
          onClick={onWithdrawClick}
          className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg text-white font-medium transition-colors flex items-center space-x-2 mx-auto"
        >
          <CreditCard className="w-5 h-5" />
          <span>Add Bank Account</span>
        </button>
      </div>
    </div>
  );
};

export default WithdrawalSection;
