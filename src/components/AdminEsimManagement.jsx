'use client';

import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, doc, updateDoc, deleteDoc, orderBy, where, limit } from 'firebase/firestore';
import { db } from '../firebase/config';
import { motion } from 'framer-motion';
import { 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Trash2, 
  RefreshCw, 
  Calendar, 
  User, 
  Globe, 
  QrCode,
  Smartphone,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  DollarSign,
  X,
  Zap,
  MoreVertical
} from 'lucide-react';
import { esimService } from '../services/esimService';
import toast from 'react-hot-toast';

const AdminEsimManagement = () => {
  const [esimOrders, setEsimOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingOrder, setDeletingOrder] = useState(false);
  const [resubmittingOrder, setResubmittingOrder] = useState(null);
  const [openDropdown, setOpenDropdown] = useState(null);

  // Load all eSIM orders from all users
  const loadEsimOrders = async () => {
    try {
      setLoading(true);
      console.log('Loading all eSIM orders...');
      
      // Get all users
      const usersSnapshot = await getDocs(collection(db, 'users'));
      console.log(`Found ${usersSnapshot.docs.length} users`);
      const allOrders = [];
      
      for (const userDoc of usersSnapshot.docs) {
        const userId = userDoc.id;
        const userData = userDoc.data();
        
        // Get eSIM orders for this user
        const esimsQuery = query(
          collection(db, 'users', userId, 'esims'),
          orderBy('createdAt', 'desc')
        );
        
        const esimsSnapshot = await getDocs(esimsQuery);
        console.log(`User ${userId}: Found ${esimsSnapshot.docs.length} eSIM orders`);
        
        esimsSnapshot.docs.forEach(esimDoc => {
          const esimData = esimDoc.data();
          
          // Debug: Log raw data for first document
          if (allOrders.length === 0) {
            console.log('🔍 Raw esimData from Firestore:', esimData);
            console.log('🔍 esimData.qrCode:', esimData.qrCode);
            console.log('🔍 esimData.orderResult:', esimData.orderResult);
            console.log('🔍 esimData.iccid:', esimData.iccid);
          }
          
          allOrders.push({
            id: esimDoc.id,
            userId: userId,
            userEmail: userData.email || 'Unknown',
            userName: userData.displayName || 'Unknown User',
            ...esimData,
            // Map QR code data properly - check all possible locations
            qrCode: {
              qrCode: esimData.qrCode || esimData.orderResult?.qrCode,
              qrCodeUrl: esimData.qrCodeUrl || esimData.orderResult?.qrCodeUrl,
              directAppleInstallationUrl: esimData.directAppleInstallationUrl || esimData.orderResult?.directAppleInstallationUrl,
              iccid: esimData.iccid || esimData.orderResult?.iccid,
              lpa: esimData.lpa || esimData.orderResult?.lpa,
              matchingId: esimData.matchingId || esimData.orderResult?.matchingId
            },
            // Also keep top-level ICCID for backward compatibility
            iccid: esimData.iccid || esimData.orderResult?.iccid,
            // Keep original orderResult for debugging
            orderResult: esimData.orderResult,
            createdAt: esimData.createdAt?.toDate() || null,
            updatedAt: esimData.updatedAt?.toDate() || null,
            purchaseDate: esimData.purchaseDate?.toDate() || null,
          });
        });
      }
      
      // Sort by creation date (newest first)
      allOrders.sort((a, b) => (b.createdAt || new Date(0)) - (a.createdAt || new Date(0)));
      
      setEsimOrders(allOrders);
      setFilteredOrders(allOrders);
      console.log(`Loaded ${allOrders.length} eSIM orders`);
      
      // Debug: Log first order to see data structure
      if (allOrders.length > 0) {
        console.log('🔍 Sample eSIM order data:', allOrders[0]);
        console.log('🔍 QR Code data:', allOrders[0].qrCode);
        console.log('🔍 ICCID:', allOrders[0].iccid);
        console.log('🔍 Raw esimData:', allOrders[0]);
        console.log('🔍 orderResult:', allOrders[0].orderResult);
        
        // Test specific fields
        console.log('🔍 Testing ICCID fields:');
        console.log('  - order.iccid:', allOrders[0].iccid);
        console.log('  - order.qrCode?.iccid:', allOrders[0].qrCode?.iccid);
        console.log('  - order.orderResult?.iccid:', allOrders[0].orderResult?.iccid);
        
        console.log('🔍 Testing QR Code fields:');
        console.log('  - order.qrCode?.qrCode:', allOrders[0].qrCode?.qrCode);
        console.log('  - order.qrCode?.qrCodeUrl:', allOrders[0].qrCode?.qrCodeUrl);
        console.log('  - order.orderResult?.qrCode:', allOrders[0].orderResult?.qrCode);
      }
      
    } catch (error) {
      console.error('Error loading eSIM orders:', error);
      toast.error('Failed to load eSIM orders');
    } finally {
      setLoading(false);
    }
  };

  // Filter orders based on search term and status
  const filterOrders = () => {
    let filtered = esimOrders;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(order =>
        order.planName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.orderId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.iccid?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    setFilteredOrders(filtered);
  };


  // Delete eSIM order
  const handleDeleteOrder = async (order) => {
    try {
      setDeletingOrder(true);
      console.log('🗑️ Deleting eSIM order:', order.id);
      
      // Delete from Firestore
      const esimRef = doc(db, 'users', order.userId, 'esims', order.id);
      await deleteDoc(esimRef);
      
      // Remove from local state
      setEsimOrders(prev => prev.filter(o => o.id !== order.id));
      setFilteredOrders(prev => prev.filter(o => o.id !== order.id));
      
      toast.success('eSIM order deleted successfully');
      setShowDeleteModal(false);
      
    } catch (error) {
      console.error('Error deleting eSIM order:', error);
      toast.error('Failed to delete eSIM order');
    } finally {
      setDeletingOrder(false);
    }
  };

  // View success page for this order
  const handleViewSuccessPage = (order) => {
    console.log('👁️ Viewing success page for order:', order.id);
    
    // Create URL parameters for success page
    const params = new URLSearchParams({
      order_id: order.orderId || order.id,
      plan_id: order.planId || 'ae-1gb-7',
      email: order.userEmail,
      total: (order.price || 0).toString(),
      name: order.planName || 'eSIM Plan',
      currency: 'usd',
      user_id: order.userId
    });
    
    // Redirect to success page
    const successUrl = `/payment-success?${params.toString()}`;
    console.log('👁️ Redirecting to success page:', successUrl);
    
    toast.success('Redirecting to success page...');
    
    // Use window.location for full page redirect
    window.location.href = successUrl;
  };

  // Format date
  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Export orders to CSV
  const exportToCSV = () => {
    const headers = ['Order ID', 'User Email', 'Plan Name', 'Status', 'Price', 'Country', 'Created At', 'ICCID'];
    const csvContent = [
      headers.join(','),
      ...filteredOrders.map(order => [
        order.orderId || order.id || '',
        order.userEmail || '',
        order.planName || '',
        order.status || '',
        order.price || 0,
        order.countryName || '',
        formatDate(order.createdAt),
        order.iccid || order.qrCode?.iccid || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `esim-orders-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast.success('eSIM orders exported to CSV');
  };

  // Load data on component mount
  useEffect(() => {
    loadEsimOrders();
  }, []);

  // Filter orders when search term or status changes
  useEffect(() => {
    filterOrders();
  }, [searchTerm, statusFilter, esimOrders]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">eSIM Management</h2>
            <p className="text-gray-600 mt-1">Manage all eSIM orders across all users</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={exportToCSV}
              disabled={filteredOrders.length === 0}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-full">
              <Globe className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">{esimOrders.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-full">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active</p>
              <p className="text-2xl font-bold text-gray-900">
                {esimOrders.filter(order => order.status === 'active').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-full">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">
                {esimOrders.filter(order => order.status === 'pending').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-full">
              <DollarSign className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                ${esimOrders.reduce((sum, order) => sum + (order.price || 0), 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search orders by plan, user, email, order ID, or ICCID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="md:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="expired">Expired</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading eSIM orders...</span>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <Globe className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">
              {searchTerm || statusFilter !== 'all' 
                ? 'No eSIM orders found matching your criteria' 
                : 'No eSIM orders found'
              }
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Plan & Country
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 font-mono">
                          {order.iccid || order.qrCode?.iccid || 'No ICCID'}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          {order.qrCode?.qrCode ? '✅ QR Available' : 
                           order.qrCode?.qrCodeUrl ? '🖼️ QR Image' : 
                           '❌ No QR'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {order.userName === 'Unknown User' ? order.userEmail : order.userName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {order.userName === 'Unknown User' ? '' : order.userEmail}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {order.planName || 'Unknown Plan'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {order.countryName || order.countryCode || 'Unknown Country'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                        {order.status || 'Unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${order.price || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="relative dropdown-container">
                        <button
                          onClick={() => setOpenDropdown(openDropdown === order.id ? null : order.id)}
                          className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
                          title="Actions"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        
                        {/* Dropdown Menu */}
                        {openDropdown === order.id && (
                          <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                            <div className="py-1">
                              <button
                                onClick={() => {
                                  setSelectedOrder(order);
                                  setShowDetailsModal(true);
                                  setOpenDropdown(null);
                                }}
                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              >
                                <Eye className="w-4 h-4 mr-3" />
                                View Details
                              </button>
                              
                              {/* Show View Success Page option for all orders */}
                              <button
                                onClick={() => {
                                  handleViewSuccessPage(order);
                                  setOpenDropdown(null);
                                }}
                                className="flex items-center w-full px-4 py-2 text-sm text-blue-600 hover:bg-gray-100"
                              >
                                <Eye className="w-4 h-4 mr-3" />
                                View Success Page
                              </button>
                              
                              <button
                                onClick={() => {
                                  setSelectedOrder(order);
                                  setShowDeleteModal(true);
                                  setOpenDropdown(null);
                                }}
                                className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                              >
                                <Trash2 className="w-4 h-4 mr-3" />
                                Delete Order
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {showDetailsModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">eSIM Order Details</h3>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Order ID</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedOrder.orderId || selectedOrder.id}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedOrder.status)}`}>
                    {selectedOrder.status}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">User Name</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedOrder.userName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">User Email</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedOrder.userEmail}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Plan Name</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedOrder.planName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Country</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedOrder.countryName || selectedOrder.countryCode}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Price</label>
                  <p className="mt-1 text-sm text-gray-900">${selectedOrder.price}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">ICCID</label>
                  <p className="mt-1 text-sm text-gray-900 font-mono">{selectedOrder.iccid || selectedOrder.qrCode?.iccid || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Created At</label>
                  <p className="mt-1 text-sm text-gray-900">{formatDate(selectedOrder.createdAt)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Updated At</label>
                  <p className="mt-1 text-sm text-gray-900">{formatDate(selectedOrder.updatedAt)}</p>
                </div>
              </div>
              
              {/* QR Code Info */}
              {selectedOrder.qrCode && (
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <h4 className="text-lg font-medium text-gray-900 mb-3">QR Code Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedOrder.qrCode.qrCode && (
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700">QR Code Data (LPA)</label>
                        <p className="mt-1 text-xs text-gray-900 font-mono break-all bg-gray-100 p-2 rounded">
                          {selectedOrder.qrCode.qrCode}
                        </p>
                      </div>
                    )}
                    {selectedOrder.qrCode.qrCodeUrl && (
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700">QR Code URL</label>
                        <a 
                          href={selectedOrder.qrCode.qrCodeUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="mt-1 text-xs text-blue-600 hover:underline break-all block"
                        >
                          {selectedOrder.qrCode.qrCodeUrl}
                        </a>
                      </div>
                    )}
                    {selectedOrder.qrCode.directAppleInstallationUrl && (
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700">Apple Installation URL</label>
                        <a 
                          href={selectedOrder.qrCode.directAppleInstallationUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="mt-1 text-xs text-blue-600 hover:underline break-all block"
                        >
                          {selectedOrder.qrCode.directAppleInstallationUrl}
                        </a>
                      </div>
                    )}
                    {selectedOrder.qrCode.lpa && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">LPA Address</label>
                        <p className="mt-1 text-sm text-gray-900 font-mono">{selectedOrder.qrCode.lpa}</p>
                      </div>
                    )}
                    {selectedOrder.qrCode.matchingId && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Matching ID</label>
                        <p className="mt-1 text-sm text-gray-900 font-mono">{selectedOrder.qrCode.matchingId}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex justify-end p-6 border-t border-gray-200">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">Delete eSIM Order</h3>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-red-600" />
                  </div>
                </div>
                <div className="ml-4">
                  <h4 className="text-lg font-medium text-gray-900">Are you sure?</h4>
                  <p className="text-sm text-gray-500">
                    This action cannot be undone. The eSIM order will be permanently deleted.
                  </p>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <h5 className="font-medium text-gray-900 mb-2">Order Details:</h5>
                <div className="text-sm text-gray-600 space-y-1">
                  <p><span className="font-medium">Order ID:</span> {selectedOrder.orderId || selectedOrder.id}</p>
                  <p><span className="font-medium">User:</span> {selectedOrder.userName} ({selectedOrder.userEmail})</p>
                  <p><span className="font-medium">Plan:</span> {selectedOrder.planName || 'Unknown'}</p>
                  <p><span className="font-medium">ICCID:</span> {selectedOrder.iccid || selectedOrder.qrCode?.iccid || 'N/A'}</p>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={deletingOrder}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteOrder(selectedOrder)}
                disabled={deletingOrder}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center"
              >
                {deletingOrder ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Order
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminEsimManagement;
