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
      <section className="bg-white py-16">
        <div className="mx-auto max-w-2xl px-6 lg:max-w-7xl lg:px-8">
          <div className="relative">
            <div className="absolute inset-px rounded-xl bg-white"></div>
            <div className="relative flex h-full flex-col overflow-hidden rounded-xl">
              <div className="px-8 pt-8 pb-8">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-tufts-blue mx-auto mb-4"></div>
                  <p className="text-cool-black">Checking bank account...</p>
                </div>
              </div>
            </div>
            <div className="pointer-events-none absolute inset-px rounded-xl shadow-sm ring-1 ring-black/5"></div>
          </div>
        </div>
      </section>
    );
  }

  if (hasBankAccount) {
    return (
      <section className="bg-white py-16">
        <div className="mx-auto max-w-2xl px-6 lg:max-w-7xl lg:px-8">
          <div className="relative">
            <div className="absolute inset-px rounded-xl bg-white"></div>
            <div className="relative flex h-full flex-col overflow-hidden rounded-xl">
              <div className="px-8 pt-8 pb-8">
                <div className="text-center">
                  <h3 className="text-xl font-medium tracking-tight text-eerie-black mb-4">Withdraw Your Earnings</h3>
                  <p className="text-cool-black mb-2">
                    Transfer your referral earnings to your bank account
                  </p>
                  <p className="text-sm text-cool-black mb-6">
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
            </div>
            <div className="pointer-events-none absolute inset-px rounded-xl shadow-sm ring-1 ring-black/5"></div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-white py-16">
      <div className="mx-auto max-w-2xl px-6 lg:max-w-7xl lg:px-8">
        <div className="relative">
          <div className="absolute inset-px rounded-xl bg-white"></div>
          <div className="relative flex h-full flex-col overflow-hidden rounded-xl">
            <div className="px-8 pt-8 pb-8">
              <div className="text-center">
                <h3 className="text-xl font-medium tracking-tight text-eerie-black mb-4">Add Bank Account</h3>
                <p className="text-cool-black mb-6">
                  Add your bank account details to withdraw your earnings
                </p>
                <button
                  onClick={onWithdrawClick}
                  className="bg-tufts-blue hover:bg-cobalt-blue px-6 py-3 rounded-lg text-white font-medium transition-colors flex items-center space-x-2 mx-auto"
                >
                  <CreditCard className="w-5 h-5" />
                  <span>Add Bank Account</span>
                </button>
              </div>
            </div>
          </div>
          <div className="pointer-events-none absolute inset-px rounded-xl shadow-sm ring-1 ring-black/5"></div>
        </div>
      </div>
    </section>
  );
};

export default WithdrawalSection;
