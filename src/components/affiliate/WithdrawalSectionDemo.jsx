import React, { useState } from 'react';
import WithdrawalSection from './WithdrawalSection';

const WithdrawalSectionDemo = () => {
  const [selectedDemo, setSelectedDemo] = useState('us-bank');

  // Sample referral stats
  const referralStats = {
    totalEarnings: 125.50,
    pendingEarnings: 25.00,
    totalReferrals: 15
  };

  // Sample bank account data for different countries and types
  const demoAccounts = {
    'us-bank': {
      id: 'bank_1',
      type: 'bank',
      bankName: 'Chase Bank',
      routing: '021000021',
      account: '1234567890',
      accountHolder: 'John Doe',
      country: 'US'
    },
    'us-card': {
      id: 'card_1',
      type: 'card',
      cardNumber: '4532123456789012',
      cardHolder: 'John Doe',
      expiryDate: '12/26',
      country: 'US'
    },
    'uk-bank': {
      id: 'bank_2',
      type: 'bank',
      bankName: 'Barclays Bank',
      sortCode: '20-00-00',
      account: '12345678',
      accountHolder: 'Jane Smith',
      country: 'GB'
    },
    'de-iban': {
      id: 'iban_1',
      type: 'iban',
      iban: 'DE89370400440532013000',
      bankName: 'Deutsche Bank',
      accountHolder: 'Hans Mueller',
      country: 'DE'
    },
    'fr-iban': {
      id: 'iban_2',
      type: 'iban',
      iban: 'FR1420041010050500013M02606',
      bankName: 'BNP Paribas',
      accountHolder: 'Marie Dubois',
      country: 'FR'
    }
  };

  const handleEditBankAccount = (accountDetails) => {
    console.log('Edit account:', accountDetails);
    alert(`Edit ${accountDetails.type} account: ${accountDetails.id}`);
  };

  const handleDeleteBankAccount = (accountId) => {
    console.log('Delete account:', accountId);
    alert(`Delete account: ${accountId}`);
  };

  const handleAddBankAccount = (type) => {
    console.log('Add new account type:', type);
    alert(`Add new ${type} account`);
  };

  const handleWithdraw = () => {
    console.log('Withdraw funds');
    alert('Withdraw funds clicked');
  };

  const currentAccount = demoAccounts[selectedDemo];
  const currentCountry = currentAccount?.country || 'US';

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">WithdrawalSection Component Demo</h1>
          
          {/* Demo Controls */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Select Demo Account Type:</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(demoAccounts).map(([key, account]) => (
                <button
                  key={key}
                  onClick={() => setSelectedDemo(key)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    selectedDemo === key
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}
                >
                  <div className="font-medium">
                    {account.country} - {account.type.toUpperCase()}
                  </div>
                  <div className="text-sm opacity-75">
                    {account.bankName || 'Credit Card'}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Current Account Info */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-800 mb-2">Current Demo Account:</h3>
            <pre className="text-sm text-gray-600 overflow-x-auto">
              {JSON.stringify(currentAccount, null, 2)}
            </pre>
          </div>
        </div>

        {/* WithdrawalSection Component */}
        <WithdrawalSection
          hasBankAccount={true}
          checkingBankAccount={false}
          referralStats={referralStats}
          bankAccountDetails={currentAccount}
          userCountry={currentCountry}
          onWithdrawClick={handleWithdraw}
          onEditBankAccount={handleEditBankAccount}
          onDeleteBankAccount={handleDeleteBankAccount}
          onAddBankAccount={handleAddBankAccount}
        />

        {/* No Account Demo */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">No Account State (Add New Account)</h2>
          <WithdrawalSection
            hasBankAccount={false}
            checkingBankAccount={false}
            referralStats={referralStats}
            bankAccountDetails={null}
            userCountry={currentCountry}
            onWithdrawClick={handleWithdraw}
            onEditBankAccount={handleEditBankAccount}
            onDeleteBankAccount={handleDeleteBankAccount}
            onAddBankAccount={handleAddBankAccount}
          />
        </div>

        {/* Loading State Demo */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Loading State</h2>
          <WithdrawalSection
            hasBankAccount={false}
            checkingBankAccount={true}
            referralStats={referralStats}
            bankAccountDetails={null}
            userCountry={currentCountry}
            onWithdrawClick={handleWithdraw}
            onEditBankAccount={handleEditBankAccount}
            onDeleteBankAccount={handleDeleteBankAccount}
            onAddBankAccount={handleAddBankAccount}
          />
        </div>
      </div>
    </div>
  );
};

export default WithdrawalSectionDemo;
