'use client';

import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, getDoc, doc, updateDoc, deleteDoc, orderBy, where, limit, serverTimestamp, startAfter } from 'firebase/firestore';
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
  const [fetchingQrCode, setFetchingQrCode] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalPages, setTotalPages] = useState(0);
  const ORDERS_PER_PAGE = 20; // Reduced for better pagination experience

  // Load eSIM orders from orders collection with pagination
  const loadEsimOrders = async (loadMore = false) => {
    try {
      if (!loadMore) {
        setLoading(true);
        setCurrentPage(1);
        setEsimOrders([]);
        setLastDoc(null);
      } else {
        setLoadingMore(true);
      }
      
      console.log(`Loading eSIM orders from orders collection (page ${loadMore ? currentPage + 1 : 1})...`);
      
      // Create query for orders collection with pagination
      let ordersQuery = query(
        collection(db, 'orders'),
        orderBy('createdAt', 'desc'),
        limit(ORDERS_PER_PAGE)
      );

      if (loadMore && lastDoc) {
        ordersQuery = query(
          collection(db, 'orders'),
          orderBy('createdAt', 'desc'),
          startAfter(lastDoc),
          limit(ORDERS_PER_PAGE)
        );
      }
      
      // Get orders from the orders collection
      const ordersSnapshot = await getDocs(ordersQuery);
      console.log(`Found ${ordersSnapshot.docs.length} orders in this batch`);
      
      // No need to fetch user data since we're only displaying user IDs
      
      const newOrders = ordersSnapshot.docs.map(orderDoc => {
        const orderData = orderDoc.data();
        
        // Debug: Log raw data for first document
        if (!loadMore && ordersSnapshot.docs.indexOf(orderDoc) === 0) {
          console.log('🔍 Raw orderData from Firestore:', orderData);
          console.log('🔍 orderData.airaloOrderData:', orderData.airaloOrderData);
        }
        
        // Extract data from the actual airaloOrderData structure
        const airaloData = orderData.airaloOrderData || {};
        const esimData = orderData.esimData || {};
        const simData = airaloData.sims?.[0] || {}; // First SIM in the array
        
        return {
          id: orderDoc.id,
          userId: orderData.userId,
          
          // Order details
          orderId: orderData.orderId || airaloData.code,
          airaloOrderId: orderData.airaloOrderId || airaloData.id,
          planId: orderData.planId || orderData.package_id || airaloData.package_id,
          planName: orderData.planName || airaloData.package || `${airaloData.data} - ${airaloData.validity || 30} Days`,
          
          // Pricing info
          amount: orderData.amount || airaloData.price,
          price: orderData.amount || airaloData.price,
          currency: orderData.currency || airaloData.currency || 'USD',
          
          // Status and timing
          status: orderData.status || esimData.status || 'active',
          customerEmail: orderData.customerEmail,
          createdAt: orderData.createdAt?.toDate() || null,
          updatedAt: orderData.updatedAt?.toDate() || null,
          purchaseDate: orderData.createdAt?.toDate() || null,
          
          // Plan details from airalo data
          data: airaloData.data,
          validity: airaloData.validity,
          esimType: airaloData.esim_type,
          
          // Country info - extract from package name or other fields
          countryCode: orderData.countryCode,
          countryName: orderData.countryName || airaloData.package?.split('-')[0], // Extract from package name
          
          // QR code and activation data from nested structure
          qrCode: {
            qrCode: esimData.qrcode || simData.qrcode,
            qrCodeUrl: esimData.qrcode_url || simData.qrcode_url,
            directAppleInstallationUrl: esimData.direct_apple_installation_url || simData.direct_apple_installation_url,
            iccid: esimData.iccid || simData.iccid,
            lpa: esimData.lpa || simData.lpa,
            matchingId: esimData.matching_id || simData.matching_id
          },
          
          // Top-level ICCID for backward compatibility
          iccid: esimData.iccid || simData.iccid,
          
          // Installation guides and instructions
          installationGuides: airaloData.installation_guides,
          manualInstallation: esimData.manual_installation || airaloData.manual_installation,
          qrcodeInstallation: esimData.qrcode_installation || airaloData.qrcode_installation,
          
          // Keep original data for debugging
          airaloOrderData: orderData.airaloOrderData,
          esimData: orderData.esimData,
          orderResult: orderData.airaloOrderData,
        };
      });
      
      // Update state
      if (loadMore) {
        setEsimOrders(prev => [...prev, ...newOrders]);
        setCurrentPage(prev => prev + 1);
      } else {
        setEsimOrders(newOrders);
        setCurrentPage(1);
        // Get total count on first load
        const totalQuery = query(collection(db, 'orders'));
        const totalSnapshot = await getDocs(totalQuery);
        const totalCount = totalSnapshot.docs.length;
        setTotalOrders(totalCount);
        setTotalPages(Math.ceil(totalCount / ORDERS_PER_PAGE));
      }
      
      // Update pagination
      setLastDoc(ordersSnapshot.docs[ordersSnapshot.docs.length - 1]);
      setHasMore(ordersSnapshot.docs.length === ORDERS_PER_PAGE);
      
      console.log(`Loaded ${newOrders.length} eSIM orders from orders collection`);
      
      // Debug: Log first order to see data structure (only on initial load)
      if (!loadMore && newOrders.length > 0) {
        console.log('🔍 Sample processed order data:', newOrders[0]);
        console.log('🔍 QR Code data:', newOrders[0].qrCode);
        console.log('🔍 ICCID:', newOrders[0].iccid);
      }
      
    } catch (error) {
      console.error('Error loading eSIM orders:', error);
      toast.error('Failed to load eSIM orders');
    } finally {
      setLoading(false);
      setLoadingMore(false);
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
        order.userId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
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

  // Load more orders
  const loadMoreOrders = () => {
    if (hasMore && !loadingMore) {
      loadEsimOrders(true);
    }
  };

  // Go to specific page
  const goToPage = async (page) => {
    if (page < 1 || page > totalPages || page === currentPage) return;
    
    try {
      setLoading(true);
      setCurrentPage(page);
      
      // Calculate offset for the page
      const offset = (page - 1) * ORDERS_PER_PAGE;
      
      // Create query for specific page
      let ordersQuery = query(
        collection(db, 'orders'),
        orderBy('createdAt', 'desc'),
        limit(ORDERS_PER_PAGE)
      );

      // For pages beyond the first, we need to use startAfter with the appropriate document
      if (page > 1) {
        // We need to get the document to start after
        const skipQuery = query(
          collection(db, 'orders'),
          orderBy('createdAt', 'desc'),
          limit(offset)
        );
        const skipSnapshot = await getDocs(skipQuery);
        const lastSkipDoc = skipSnapshot.docs[skipSnapshot.docs.length - 1];
        
        if (lastSkipDoc) {
          ordersQuery = query(
            collection(db, 'orders'),
            orderBy('createdAt', 'desc'),
            startAfter(lastSkipDoc),
            limit(ORDERS_PER_PAGE)
          );
        }
      }
      
      const ordersSnapshot = await getDocs(ordersQuery);
      
      const newOrders = ordersSnapshot.docs.map(orderDoc => {
        const orderData = orderDoc.data();
        const airaloData = orderData.airaloOrderData || {};
        const esimData = orderData.esimData || {};
        const simData = airaloData.sims?.[0] || {};
        
        return {
          id: orderDoc.id,
          userId: orderData.userId,
          orderId: orderData.orderId || airaloData.code,
          airaloOrderId: orderData.airaloOrderId || airaloData.id,
          planId: orderData.planId || orderData.package_id || airaloData.package_id,
          planName: orderData.planName || airaloData.package || `${airaloData.data} - ${airaloData.validity || 30} Days`,
          amount: orderData.amount || airaloData.price,
          price: orderData.amount || airaloData.price,
          currency: orderData.currency || airaloData.currency || 'USD',
          status: orderData.status || esimData.status || 'active',
          customerEmail: orderData.customerEmail,
          createdAt: orderData.createdAt?.toDate() || null,
          updatedAt: orderData.updatedAt?.toDate() || null,
          purchaseDate: orderData.createdAt?.toDate() || null,
          data: airaloData.data,
          validity: airaloData.validity,
          esimType: airaloData.esim_type,
          countryCode: orderData.countryCode,
          countryName: orderData.countryName || airaloData.package?.split('-')[0],
          qrCode: {
            qrCode: esimData.qrcode || simData.qrcode,
            qrCodeUrl: esimData.qrcode_url || simData.qrcode_url,
            directAppleInstallationUrl: esimData.direct_apple_installation_url || simData.direct_apple_installation_url,
            iccid: esimData.iccid || simData.iccid,
            lpa: esimData.lpa || simData.lpa,
            matchingId: esimData.matching_id || simData.matching_id
          },
          iccid: esimData.iccid || simData.iccid,
          installationGuides: airaloData.installation_guides,
          manualInstallation: esimData.manual_installation || airaloData.manual_installation,
          qrcodeInstallation: esimData.qrcode_installation || airaloData.qrcode_installation,
          airaloOrderData: orderData.airaloOrderData,
          esimData: orderData.esimData,
          orderResult: orderData.airaloOrderData,
        };
      });
      
      setEsimOrders(newOrders);
      setLastDoc(ordersSnapshot.docs[ordersSnapshot.docs.length - 1]);
      setHasMore(page < totalPages);
      
    } catch (error) {
      console.error('Error loading page:', error);
      toast.error('Failed to load page');
    } finally {
      setLoading(false);
    }
  };



  // Helper function to remove undefined values from an object
  const removeUndefinedValues = (obj) => {
    return Object.fromEntries(
      Object.entries(obj).filter(([_, v]) => v !== undefined && v !== null)
    );
  };

  // Fetch QR code for order missing QR code data
  const handleFetchQrCode = async (order) => {
    try {
      setFetchingQrCode(order.id);
      console.log('🔄 Fetching QR code for order:', order.id, 'ICCID:', order.iccid);
      
      if (!order.iccid) {
        toast.error('No ICCID found for this order');
        return;
      }

      // Fetch eSIM details from Airalo API
      const result = await esimService.getEsimDetailsByIccid(order.iccid);
      
      if (!result.success) {
        throw new Error(result.error);
      }

      const qrCodeData = result.data;
      console.log('✅ Fetched QR code data:', qrCodeData);

      // Prepare update data with only defined values
      const updateData = removeUndefinedValues({
        qrCode: qrCodeData.qrCode,
        qrCodeUrl: qrCodeData.qrCodeUrl,
        directAppleInstallationUrl: qrCodeData.directAppleInstallationUrl,
        lpa: qrCodeData.lpa,
        matchingId: qrCodeData.matchingId,
        activationCode: qrCodeData.activationCode,
        updatedAt: serverTimestamp()
      });

      console.log('📝 Updating Firestore with data:', updateData);
      
      // Update the order in Firestore
      const esimRef = doc(db, 'users', order.userId, 'esims', order.id);
      await updateDoc(esimRef, updateData);

      // Build updated qrCode object for local state
      const qrCodeObject = removeUndefinedValues({
        qrCode: qrCodeData.qrCode,
        qrCodeUrl: qrCodeData.qrCodeUrl,
        directAppleInstallationUrl: qrCodeData.directAppleInstallationUrl,
        iccid: order.iccid,
        lpa: qrCodeData.lpa,
        matchingId: qrCodeData.matchingId
      });

      // Update local state
      const updatedOrder = {
        ...order,
        qrCode: qrCodeObject,
        ...removeUndefinedValues({ activationCode: qrCodeData.activationCode }),
        updatedAt: new Date()
      };

      setEsimOrders(prev => prev.map(o => o.id === order.id ? updatedOrder : o));
      setFilteredOrders(prev => prev.map(o => o.id === order.id ? updatedOrder : o));
      
      toast.success('QR code fetched and updated successfully!');
      
    } catch (error) {
      console.error('Error fetching QR code:', error);
      toast.error(`Failed to fetch QR code: ${error.message}`);
    } finally {
      setFetchingQrCode(null);
    }
  };

  // Delete eSIM order
  const handleDeleteOrder = async (order) => {
    try {
      setDeletingOrder(true);
      console.log('🗑️ Deleting eSIM order:', order.id);
      
      // Delete from orders collection
      const orderRef = doc(db, 'orders', order.id);
      await deleteDoc(orderRef);
      
      // Remove from local state
      setEsimOrders(prev => prev.filter(o => o.id !== order.id));
      setFilteredOrders(prev => prev.filter(o => o.id !== order.id));
      
      // Update total count
      setTotalOrders(prev => prev - 1);
      
      toast.success('eSIM order deleted successfully');
      setShowDeleteModal(false);
      
    } catch (error) {
      console.error('Error deleting eSIM order:', error);
      toast.error('Failed to delete eSIM order');
    } finally {
      setDeletingOrder(false);
    }
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
    const headers = ['Order ID', 'User ID', 'User Email', 'Plan Name', 'Status', 'Price', 'Country', 'Created At', 'ICCID'];
    const csvContent = [
      headers.join(','),
      ...filteredOrders.map(order => [
        order.orderId || order.id || '',
        order.userId || '',
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


      {/* Filters */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search orders by plan, user ID, email, order ID, or ICCID..."
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
                    User ID
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
                      <button
                        onClick={() => {
                          // Navigate to user details page
                          window.location.href = `/admin/user/${order.userId}`;
                        }}
                        className="text-sm font-medium text-blue-600 hover:text-blue-800 font-mono hover:underline transition-colors"
                        title="Click to view user details"
                      >
                        {order.userId}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {order.planName || 'Unknown Plan'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {order.data && `${order.data}`}{order.validity && ` - ${order.validity} days`}
                        </div>
                        <div className="text-xs text-gray-400">
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
                              
                              {/* Show Fetch QR Code button only if QR code is missing and ICCID exists */}
                              {(!order.qrCode?.qrCode && !order.qrCode?.qrCodeUrl && order.iccid) && (
                                <button
                                  onClick={() => {
                                    handleFetchQrCode(order);
                                    setOpenDropdown(null);
                                  }}
                                  disabled={fetchingQrCode === order.id}
                                  className="flex items-center w-full px-4 py-2 text-sm text-blue-600 hover:bg-gray-100 disabled:opacity-50"
                                >
                                  {fetchingQrCode === order.id ? (
                                    <>
                                      <RefreshCw className="w-4 h-4 mr-3 animate-spin" />
                                      Fetching...
                                    </>
                                  ) : (
                                    <>
                                      <QrCode className="w-4 h-4 mr-3" />
                                      Fetch QR Code
                                    </>
                                  )}
                                </button>
                              )}
                              
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
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between py-6 border-t border-gray-200 px-6">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1 || loading}
                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  
                  {/* Page Numbers */}
                  <div className="flex space-x-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => goToPage(pageNum)}
                          disabled={loading}
                          className={`px-3 py-2 text-sm font-medium rounded-md ${
                            currentPage === pageNum
                              ? 'bg-blue-600 text-white'
                              : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  
                  <button
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages || loading}
                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
                
                <div className="text-sm text-gray-500">
                  Page {currentPage} of {totalPages} • Showing {esimOrders.length} of {totalOrders} orders
                </div>
              </div>
            )}
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
                  <label className="block text-sm font-medium text-gray-700">User ID</label>
                  <p className="mt-1 text-sm text-gray-900 font-mono">{selectedOrder.userId}</p>
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
                  <label className="block text-sm font-medium text-gray-700">Data & Validity</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedOrder.data} - {selectedOrder.validity} days
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Country</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedOrder.countryName || selectedOrder.countryCode}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Price</label>
                  <p className="mt-1 text-sm text-gray-900">${selectedOrder.price} {selectedOrder.currency}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">eSIM Type</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedOrder.esimType || 'Prepaid'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Airalo Order ID</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedOrder.airaloOrderId}</p>
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
