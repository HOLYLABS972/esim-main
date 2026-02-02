'use client';

import { useState } from 'react';
import { Users, ShoppingBag, Ticket, Key, ArrowLeft, Wallet, CheckCircle, DollarSign } from 'lucide-react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import toast from 'react-hot-toast';

const BusinessManagement = dynamic(() => import('./BusinessManagement'), { ssr: false });
const PartnerBillingView = dynamic(() => import('./PartnerBillingView'), { ssr: false });

export default function RoamjetAdminDashboard() {
  const [selectedApiKey, setSelectedApiKey] = useState(null);
  const [activeTab, setActiveTab] = useState('api-keys');
  const [showAddBalanceModal, setShowAddBalanceModal] = useState(false);
  const [balanceAmount, setBalanceAmount] = useState('');
  const [balanceDescription, setBalanceDescription] = useState('');

  const handleApiKeyClick = (apiKeyData) => {
    setSelectedApiKey(apiKeyData);
    setActiveTab('users'); // Default to users tab when selecting an API key
  };

  const handleBackToApiKeys = () => {
    setSelectedApiKey(null);
    setActiveTab('api-keys');
  };

  const handleApproveKYC = async (businessId) => {
    if (!confirm('Are you sure you want to approve KYC for this partner?')) return;

    try {
      const response = await fetch(`/api/business/${businessId}/approve-kyc`, {
        method: 'POST'
      });

      const data = await response.json();

      if (data.success) {
        toast.success('KYC approved successfully');
        // Update local state
        setSelectedApiKey(prev => ({
          ...prev,
          kycStatus: 'approved'
        }));
      } else {
        toast.error(data.error || 'Failed to approve KYC');
      }
    } catch (error) {
      console.error('Error approving KYC:', error);
      toast.error('Failed to approve KYC');
    }
  };

  const handleAddBalance = async () => {
    if (!balanceAmount || parseFloat(balanceAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (!selectedApiKey?.id) {
      toast.error('Partner ID not found');
      return;
    }

    try {
      const response = await fetch('/api/business/add-balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: selectedApiKey.id,
          amount: parseFloat(balanceAmount),
          description: balanceDescription || 'Admin balance addition'
        })
      });

      const data = await response.json();

      if (data.success) {
        toast.success(data.message || 'Balance added successfully');
        // Update local state
        setSelectedApiKey(prev => ({
          ...prev,
          balance: data.newBalance
        }));
        setShowAddBalanceModal(false);
        setBalanceAmount('');
        setBalanceDescription('');
      } else {
        toast.error(data.error || 'Failed to add balance');
      }
    } catch (error) {
      console.error('Error adding balance:', error);
      toast.error('Failed to add balance');
    }
  };

  return (
    <div className="space-y-6">
      {/* Main Content */}
      {!selectedApiKey ? (
        // Show Business Partners List - Clean, no extra headers
        <BusinessManagement onApiKeyClick={handleApiKeyClick} />
      ) : (
        // Show selected partner's dashboard
        <>
          {/* Header with back button */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {selectedApiKey.businessName} - Partner Dashboard
                </h2>
                <p className="text-gray-600">
                  Viewing dashboard for {selectedApiKey.businessName} ({selectedApiKey.contactEmail})
                </p>
              </div>
              <button
                onClick={handleBackToApiKeys}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Partners</span>
              </button>
            </div>
          </div>

          {/* Partner Info Card */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-xl">{selectedApiKey.businessName?.[0]?.toUpperCase()}</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{selectedApiKey.businessName}</h3>
                  <p className="text-sm text-gray-600">Partner Dashboard</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div>
                <span className="text-sm text-gray-600">Contact Email</span>
                <p className="text-sm font-semibold text-gray-900">{selectedApiKey.contactEmail}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Account Balance</span>
                <p className="text-sm font-semibold text-green-600">${(selectedApiKey.balance || 0).toFixed(2)}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Account Status</span>
                <p className="text-sm font-semibold text-gray-900 capitalize">{selectedApiKey.status}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">API Key</span>
                <p className="text-xs font-mono text-gray-700">{selectedApiKey.apiKey?.substring(0, 20)}...</p>
              </div>
            </div>

            {/* KYC Status */}
            {selectedApiKey.kycStatus && (
              <div className="mb-4">
                <span className="text-sm text-gray-600">KYC Status: </span>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  selectedApiKey.kycStatus === 'approved' ? 'bg-green-100 text-green-800' :
                  selectedApiKey.kycStatus === 'rejected' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {selectedApiKey.kycStatus === 'approved' ? <CheckCircle className="w-4 h-4 mr-1" /> : null}
                  {selectedApiKey.kycStatus.charAt(0).toUpperCase() + selectedApiKey.kycStatus.slice(1)}
                </span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 mt-4">
              {selectedApiKey.kycStatus === 'pending' && (
                <button
                  onClick={() => handleApproveKYC(selectedApiKey.id)}
                  className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve KYC
                </button>
              )}
              <button
                onClick={() => setShowAddBalanceModal(true)}
                className="inline-flex items-center px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors text-sm"
              >
                <DollarSign className="w-4 h-4 mr-2" />
                Add Money
              </button>
            </div>
          </div>

          {/* Tabs Navigation */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-1 px-4">
                <button
                  onClick={() => setActiveTab('users')}
                  className={`flex items-center space-x-2 px-6 py-4 border-b-2 font-medium transition-colors ${
                    activeTab === 'users'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Users className="w-5 h-5" />
                  <span>Users</span>
                </button>
                <button
                  onClick={() => setActiveTab('orders')}
                  className={`flex items-center space-x-2 px-6 py-4 border-b-2 font-medium transition-colors ${
                    activeTab === 'orders'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <ShoppingBag className="w-5 h-5" />
                  <span>Orders</span>
                </button>
                <button
                  onClick={() => setActiveTab('coupons')}
                  className={`flex items-center space-x-2 px-6 py-4 border-b-2 font-medium transition-colors ${
                    activeTab === 'coupons'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Ticket className="w-5 h-5" />
                  <span>Coupons</span>
                </button>
                <button
                  onClick={() => setActiveTab('billing')}
                  className={`flex items-center space-x-2 px-6 py-4 border-b-2 font-medium transition-colors ${
                    activeTab === 'billing'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Wallet className="w-5 h-5" />
                  <span>Billing</span>
                </button>
              </nav>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {activeTab === 'users' && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-gray-900">Partner's Users</h3>
                    <span className="text-sm text-gray-500">All users created via this partner's API</span>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-8 text-center border-2 border-dashed border-gray-300">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 mb-2">Users Dashboard for {selectedApiKey.businessName}</p>
                    <p className="text-sm text-gray-500 mb-4">Shows all users created through their API integration</p>
                    <div className="text-xs text-gray-400">API Key: {selectedApiKey.apiKey?.substring(0, 20)}...</div>
                  </div>
                </div>
              )}

              {activeTab === 'orders' && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-gray-900">Partner's Orders</h3>
                    <span className="text-sm text-gray-500">All orders placed via this partner's API</span>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-8 text-center border-2 border-dashed border-gray-300">
                    <ShoppingBag className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 mb-2">Orders Dashboard for {selectedApiKey.businessName}</p>
                    <p className="text-sm text-gray-500 mb-4">Shows all eSIM orders from their customers</p>
                    <div className="text-xs text-gray-400">API Key: {selectedApiKey.apiKey?.substring(0, 20)}...</div>
                  </div>
                </div>
              )}

              {activeTab === 'coupons' && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-gray-900">Partner's Coupons</h3>
                    <span className="text-sm text-gray-500">All coupons used by this partner</span>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-8 text-center border-2 border-dashed border-gray-300">
                    <Ticket className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 mb-2">Coupons Dashboard for {selectedApiKey.businessName}</p>
                    <p className="text-sm text-gray-500 mb-4">Shows all coupon usage through their platform</p>
                    <div className="text-xs text-gray-400">API Key: {selectedApiKey.apiKey?.substring(0, 20)}...</div>
                  </div>
                </div>
              )}

              {activeTab === 'billing' && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-gray-900">Partner's Billing</h3>
                    <span className="text-sm text-gray-500">Balance and transactions for this partner</span>
                  </div>
                  <PartnerBillingView partnerId={selectedApiKey.id} partnerData={selectedApiKey} />
                </div>
              )}
            </div>
          </div>

          {/* Add Balance Modal */}
          {showAddBalanceModal && selectedApiKey && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg max-w-md w-full border border-gray-200">
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-semibold text-gray-900">Add Balance</h3>
                    <button
                      onClick={() => {
                        setShowAddBalanceModal(false);
                        setBalanceAmount('');
                        setBalanceDescription('');
                      }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <span className="sr-only">Close</span>
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <div className="mb-6">
                    <div className="bg-gray-50 p-4 rounded-lg mb-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Partner Details</h4>
                      <p className="text-sm text-gray-900">
                        <strong>Partner:</strong> {selectedApiKey.businessName}
                      </p>
                      <p className="text-sm text-gray-900">
                        <strong>Email:</strong> {selectedApiKey.contactEmail}
                      </p>
                      <p className="text-sm text-gray-900">
                        <strong>Current Balance:</strong> ${(selectedApiKey.balance || 0).toFixed(2)}
                      </p>
                    </div>

                    <div className="mb-4">
                      <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
                        Amount (USD) *
                      </label>
                      <input
                        type="number"
                        id="amount"
                        value={balanceAmount}
                        onChange={(e) => setBalanceAmount(e.target.value)}
                        placeholder="Enter amount"
                        min="0.01"
                        step="0.01"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        autoFocus
                      />
                    </div>

                    <div className="mb-4">
                      <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                        Description (Optional)
                      </label>
                      <input
                        type="text"
                        id="description"
                        value={balanceDescription}
                        onChange={(e) => setBalanceDescription(e.target.value)}
                        placeholder="Transaction description"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => {
                        setShowAddBalanceModal(false);
                        setBalanceAmount('');
                        setBalanceDescription('');
                      }}
                      className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddBalance}
                      className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors"
                    >
                      Add Balance
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
