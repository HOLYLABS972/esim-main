'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Gift,
  RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  getAllApiClients,
  getAllUsageStats,
  approveKycApplication,
  rejectKycApplication,
  updateCommissionPercentage
} from '../services/businessService';

const BusinessManagement = ({ onApiKeyClick }) => {
  // Main state
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [usageStats, setUsageStats] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const isLoadingRef = useRef(false);

  // KYC Modal state (can be triggered externally if needed)
  const [showKycDetailsModal, setShowKycDetailsModal] = useState(false);
  const [selectedKycApplication, setSelectedKycApplication] = useState(null);
  
  // Commission editing state
  const [editingCommission, setEditingCommission] = useState(false);
  const [commissionValue, setCommissionValue] = useState(50);
  
  // Gift state
  const [processingGift, setProcessingGift] = useState(false);
  const [giftGiven, setGiftGiven] = useState(false);

  useEffect(() => {
    if (!isLoadingRef.current) {
      loadData();
    }
  }, []);

  const loadData = async () => {
    if (isLoadingRef.current) return; // Prevent duplicate loads
    
    isLoadingRef.current = true;
    setLoading(true);
    try {
      const [clientsData, statsData] = await Promise.all([
        getAllApiClients(),
        getAllUsageStats()
      ]);
      
      setClients(clientsData);
      setUsageStats(statsData);
      
      toast.success('Business data loaded');
    } catch (error) {
      console.error('Error loading business data:', error);
      toast.error('Failed to load business data');
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  };

  // View KYC application details
  const viewKycDetails = (application) => {
    setSelectedKycApplication(application);
    setShowKycDetailsModal(true);
  };

  // View KYC from client in details modal
  const viewKycFromClient = (client) => {
    if (!client.kycData) {
      toast.error('No KYC data available for this client');
      return;
    }

    // Convert client KYC data to application format
    const kycApplication = {
      id: client.id,
      userId: client.id,
      userEmail: client.contactEmail,
      fullName: client.kycData.fullName,
      country: client.kycData.country,
      phoneNumber: client.kycData.phoneNumber,
      dateOfBirth: client.kycData.dateOfBirth,
      documentUrl: client.kycData.documentUrl,
      status: client.kycStatus || 'pending',
      submittedAt: client.kycData.submittedAt,
      businessName: client.businessName,
      apiKey: client.apiKey,
      apiMode: client.apiMode,
      approvedAt: client.kycApprovedAt,
      rejectedAt: client.kycRejectedAt
    };

    // Close the client details modal first
    setShowDetailsModal(false);
    
    // Then open the KYC details modal
    setSelectedKycApplication(kycApplication);
    setShowKycDetailsModal(true);
  };

  // Handle KYC approval/rejection
  const handleKycDecision = async (userId, decision) => {
    try {
      if (decision === 'approved') {
        await approveKycApplication(userId);
        toast.success('KYC application approved successfully');
      } else {
        await rejectKycApplication(userId);
        toast.success('KYC application rejected successfully');
      }
      
      // Reload data to show updated status
      await loadData();
      setShowDetailsModal(false);
    } catch (error) {
      console.error('Error updating KYC application:', error);
      toast.error(`Failed to ${decision} KYC application`);
    }
  };

  const handleViewDetails = (client) => {
    // If onApiKeyClick prop is provided, use it to filter data
    if (onApiKeyClick) {
      onApiKeyClick(client);
    } else {
      // Otherwise, show the modal (legacy behavior)
      setSelectedClient(client);
      setShowDetailsModal(true);
      setCommissionValue(client.commissionPercentage || 50);
      setEditingCommission(false);
      setGiftGiven(false); // Reset gift state when viewing new client
    }
  };

  // Handle gift topup - add $100 directly to business balance
  const handleGiftTopup = async () => {
    if (!selectedClient) return;

    try {
      setProcessingGift(true);

      // Call admin API endpoint to add balance to business
      const response = await fetch('/api/business/add-balance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          businessId: selectedClient.id,
          amount: 100,
          description: 'New user gift - $100 topup',
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('$100 added to business balance successfully!');
        setGiftGiven(true);
        // Reload data to show updated balance
        await loadData();
        // Update selected client balance
        setSelectedClient({
          ...selectedClient,
          balance: (selectedClient.balance || 0) + 100
        });
      } else {
        toast.error(`Failed to add balance: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error adding balance:', error);
      toast.error(`Error adding balance: ${error.message}`);
    } finally {
      setProcessingGift(false);
    }
  };

  // Handle commission percentage update
  const handleUpdateCommission = async () => {
    if (!selectedClient) return;
    
    try {
      await updateCommissionPercentage(selectedClient.id, commissionValue);
      toast.success(`Commission updated to ${commissionValue}%`);
      
      // Reload data to reflect changes
      await loadData();
      
      // Update selected client
      setSelectedClient({
        ...selectedClient,
        commissionPercentage: commissionValue
      });
      
      setEditingCommission(false);
    } catch (error) {
      console.error('Error updating commission:', error);
      toast.error('Failed to update commission percentage');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Helper function to get flag emoji (used in KYC modal)
  const getFlagEmoji = (countryCode) => {
    if (!countryCode || countryCode.length !== 2) return '🌍';
    
    try {
      const codePoints = countryCode
        .toUpperCase()
        .split('')
        .map(char => 127397 + char.charCodeAt());
      
      return String.fromCodePoint(...codePoints);
    } catch (error) {
      return '🌍';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Business API Dashboard</h2>
          <p className="text-gray-600 mt-1">Manage API clients and monitor usage</p>
        </div>
      </div>

      {/* Main Content */}
      <>
      {/* Clients Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold">API Clients</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Business</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Balance</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tier</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {clients.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                    No business clients yet
                  </td>
                </tr>
              ) : (
                clients.map((client) => (
                  <tr key={client.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">{client.businessName}</div>
                        <div className="text-sm text-gray-500">{client.id.substring(0, 20)}...</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm text-gray-900">{client.contactName}</div>
                        <div className="text-sm text-gray-500">{client.contactEmail}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-semibold text-gray-900">
                        ${(client.balance || 0).toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                        {client.tier}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(client.status)}`}>
                        {client.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleViewDetails(client)}
                        className="flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      </>

      {/* KYC Details Modal */}
      {showKycDetailsModal && selectedKycApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold">KYC Application Details</h3>
                <button
                  onClick={() => setShowKycDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Applicant Information */}
              <div>
                <h4 className="text-lg font-semibold mb-3">Applicant Information</h4>
                <div className="grid grid-cols-2 gap-4 bg-gray-50 rounded-lg p-4">
                  <div>
                    <span className="text-sm text-gray-600">Full Name</span>
                    <p className="text-lg font-semibold text-gray-900">{selectedKycApplication.fullName}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Email</span>
                    <p className="text-lg font-semibold text-gray-900">{selectedKycApplication.userEmail}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Phone Number</span>
                    <p className="text-lg font-semibold text-gray-900">{selectedKycApplication.phoneNumber || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Country</span>
                    <div className="flex items-center">
                      <span className="text-lg mr-2">{getFlagEmoji(selectedKycApplication.country)}</span>
                      <p className="text-lg font-semibold text-gray-900">{selectedKycApplication.country}</p>
                    </div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Date of Birth</span>
                    <p className="text-lg font-semibold text-gray-900">
                      {new Date(selectedKycApplication.dateOfBirth).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Business Name</span>
                    <p className="text-lg font-semibold text-gray-900">{selectedKycApplication.businessName}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Status</span>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      selectedKycApplication.status === 'approved' ? 'bg-green-100 text-green-800' :
                      selectedKycApplication.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {selectedKycApplication.status === 'approved' ? <CheckCircle className="w-4 h-4 mr-1" /> :
                       selectedKycApplication.status === 'rejected' ? <XCircle className="w-4 h-4 mr-1" /> :
                       <Clock className="w-4 h-4 mr-1" />}
                      {selectedKycApplication.status.charAt(0).toUpperCase() + selectedKycApplication.status.slice(1)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Document Upload */}
              <div>
                <h4 className="text-lg font-semibold mb-3">Identity Document</h4>
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="text-center">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-sm text-gray-600 mb-2">Uploaded Document</p>
                    <p className="text-xs text-gray-500 mb-4">
                      {selectedKycApplication.documentUrl}
                    </p>
                    <button
                      onClick={() => window.open(selectedKycApplication.documentUrl, '_blank')}
                      className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mx-auto"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Document
                    </button>
                  </div>
                </div>
              </div>

              {/* Submission Details */}
              <div>
                <h4 className="text-lg font-semibold mb-3">Submission Details</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-gray-600">Submitted At</span>
                      <p className="text-sm font-semibold text-gray-900">
                        {selectedKycApplication.submittedAt.toLocaleString()}
                      </p>
                    </div>
                    {selectedKycApplication.approvedAt && (
                      <div>
                        <span className="text-sm text-gray-600">Approved At</span>
                        <p className="text-sm font-semibold text-gray-900">
                          {selectedKycApplication.approvedAt.toLocaleString()}
                        </p>
                      </div>
                    )}
                    {selectedKycApplication.rejectedAt && (
                      <div>
                        <span className="text-sm text-gray-600">Rejected At</span>
                        <p className="text-sm font-semibold text-gray-900">
                          {selectedKycApplication.rejectedAt.toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200">
              <button
                onClick={() => setShowKycDetailsModal(false)}
                className="w-full px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{selectedClient.businessName}</h3>
                  <p className="text-gray-600 mt-1">{selectedClient.contactEmail}</p>
                </div>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Client Info */}
              <div>
                <h4 className="text-lg font-semibold mb-3">Client Information</h4>
                <div className="grid grid-cols-2 gap-4 bg-gray-50 rounded-lg p-4">
                  <div>
                    <span className="text-sm text-gray-600">Balance</span>
                    <p className="text-xl font-bold text-gray-900">${(selectedClient.balance || 0).toFixed(2)}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Tier</span>
                    <p className="text-lg font-semibold text-gray-900 capitalize">{selectedClient.tier}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Status</span>
                    <p className="text-lg font-semibold text-gray-900 capitalize">{selectedClient.status}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Created</span>
                    <p className="text-sm text-gray-900">{selectedClient.createdAt.toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              {/* Commission Settings */}
              {selectedClient.source === 'business_users' && (
                <div>
                  <h4 className="text-lg font-semibold mb-3">Commission Settings</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <span className="text-sm text-gray-600 block mb-2">Partner Commission Percentage</span>
                        {editingCommission ? (
                          <div className="flex items-center space-x-3">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={commissionValue}
                              onChange={(e) => setCommissionValue(Number(e.target.value))}
                              className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <span className="text-lg font-semibold text-gray-900">%</span>
                            <button
                              onClick={handleUpdateCommission}
                              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => {
                                setEditingCommission(false);
                                setCommissionValue(selectedClient.commissionPercentage || 50);
                              }}
                              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-3">
                            <p className="text-2xl font-bold text-gray-900">{selectedClient.commissionPercentage || 50}%</p>
                            <button
                              onClick={() => setEditingCommission(true)}
                              className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                            >
                              Edit
                            </button>
                          </div>
                        )}
                        <p className="text-xs text-gray-500 mt-2">
                          Platform keeps: {100 - (editingCommission ? commissionValue : (selectedClient.commissionPercentage || 50))}% | 
                          Partner gets: {editingCommission ? commissionValue : (selectedClient.commissionPercentage || 50)}%
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Gift Topup Section */}
              {selectedClient.source === 'business_users' && !giftGiven && (
                <div className="mb-6">
                  <h4 className="text-lg font-semibold mb-3">Gift Topup</h4>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center mb-2">
                          <Gift className="w-5 h-5 text-green-600 mr-2" />
                          <span className="text-sm font-medium text-green-900">New User Gift</span>
                        </div>
                        <p className="text-sm text-green-700">
                          Add $100 to business balance
                        </p>
                      </div>
                      <button
                        onClick={handleGiftTopup}
                        disabled={processingGift}
                        className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium flex items-center transition-colors"
                      >
                        {processingGift ? (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <Gift className="w-4 h-4 mr-2" />
                            Give $100 Gift
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* KYC Information */}
              {selectedClient.source === 'business_users' && (
                <div>
                  <h4 className="text-lg font-semibold mb-3">KYC Information</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <span className="text-sm text-gray-600">KYC Status</span>
                        <div className="mt-1">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                            selectedClient.kycStatus === 'approved' ? 'bg-green-100 text-green-800' :
                            selectedClient.kycStatus === 'rejected' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {selectedClient.kycStatus === 'approved' ? <CheckCircle className="w-4 h-4 mr-1" /> :
                             selectedClient.kycStatus === 'rejected' ? <XCircle className="w-4 h-4 mr-1" /> :
                             <Clock className="w-4 h-4 mr-1" />}
                            {selectedClient.kycStatus ? selectedClient.kycStatus.charAt(0).toUpperCase() + selectedClient.kycStatus.slice(1) : 'Not Submitted'}
                          </span>
                        </div>
                      </div>
                      {selectedClient.kycStatus === 'pending' && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleKycDecision(selectedClient.id, 'approved')}
                            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Approve KYC
                          </button>
                          <button
                            onClick={() => handleKycDecision(selectedClient.id, 'rejected')}
                            className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Reject KYC
                          </button>
                        </div>
                      )}
                    </div>
                    
                    {selectedClient.kycData && (
                      <div className="mb-4">
                        <button
                          onClick={() => viewKycFromClient(selectedClient)}
                          className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          View Full KYC Details & Document
                        </button>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">API Mode</span>
                        <p className="font-semibold text-gray-900 capitalize">{selectedClient.apiMode || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">API Key</span>
                        <p className="font-mono text-xs text-gray-900 break-all">{selectedClient.apiKey || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default BusinessManagement;