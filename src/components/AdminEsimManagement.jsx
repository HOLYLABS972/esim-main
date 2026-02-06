'use client';

import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, getDoc, doc, deleteDoc, orderBy, limit, startAfter, where } from 'firebase/firestore';
import { db } from '../firebase/config';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  Search,
  Trash2,
  RefreshCw,
  User,
  Smartphone,
  Calendar,
  X,
  UserCircle,
  ChevronLeft,
  ChevronRight,
  Plus,
  ShieldCheck,
  Users,
  Package,
  CreditCard,
  Globe,
  Eye,
  DollarSign
} from 'lucide-react';
import toast from 'react-hot-toast';

const AdminEsimManagement = ({ defaultTab = 'users' }) => {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [admins, setAdmins] = useState([]);
  const [loadingAdmins, setLoadingAdmins] = useState(false);
  const [allOrders, setAllOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [orderSearch, setOrderSearch] = useState('');
  const [orderPage, setOrderPage] = useState(1);
  const ordersPerPage = 20;

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(15);

  // Load users for specific page (true Firestore pagination)
  const loadUsers = async (page = 1) => {
    try {
      setLoading(true);
      
      // Calculate offset for pagination
      const offset = (page - 1) * usersPerPage;
      
      // Build Firestore query with pagination
      let usersQuery;
      
      if (page === 1) {
        // First page - no offset needed
        usersQuery = query(
          collection(db, 'users'),
          orderBy('createdAt', 'desc'),
          limit(usersPerPage)
        );
      } else {
        // For subsequent pages, we need to skip documents
        // First, get the total count to calculate how many to skip
        const countQuery = query(collection(db, 'users'));
        const countSnapshot = await getDocs(countQuery);
        const totalUsers = countSnapshot.docs.length;
        
        // Get all users up to the offset to find the start document
        const skipQuery = query(
          collection(db, 'users'),
          orderBy('createdAt', 'desc'),
          limit(offset)
        );
        const skipSnapshot = await getDocs(skipQuery);
        
        if (skipSnapshot.docs.length === offset && skipSnapshot.docs.length > 0) {
          // Use the last document as startAfter cursor
          usersQuery = query(
            collection(db, 'users'),
            orderBy('createdAt', 'desc'),
            startAfter(skipSnapshot.docs[skipSnapshot.docs.length - 1]),
            limit(usersPerPage)
          );
        } else {
          // No more users to load
          setUsers([]);
          setFilteredUsers([]);
          setLoading(false);
          return;
        }
      }
      
      console.log(`Loading page ${page} users from Firestore...`);
      const usersSnapshot = await getDocs(usersQuery);
      
      console.log(`Loaded ${usersSnapshot.docs.length} users from Firestore for page ${page}`);
      
      const usersData = [];
      
      // Process each user document with minimal data fetching
      const userPromises = usersSnapshot.docs.map(async (userDoc) => {
        const userData = userDoc.data();
        
        // Get only eSIM count and basic stats (limit to 10 for performance)
        const esimsSnapshot = await getDocs(
          query(
            collection(db, 'users', userDoc.id, 'esims'),
            orderBy('createdAt', 'desc'),
            limit(10) // Reduced from 50 to 10 for faster loading
          )
        );
        
        // Process eSIMs in parallel with minimal data
        const esims = esimsSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            status: data.status,
            price: data.price || 0,
            // Don't load full eSIM data - just what we need for display
          };
        });
        
        return {
          id: userDoc.id,
          email: userData.email || userData.actualEmail || 'No email',
          role: userData.role || 'customer',
          displayName: userData.displayName || userData.name || '',
          createdAt: userData.createdAt?.toDate(),
          esims: esims, // Minimal eSIM data
          esimCount: esims.length,
          activeEsims: esims.filter(esim => esim.status === 'active').length,
          deactivatedEsims: esims.filter(esim => esim.status === 'deactivated').length,
          totalSpent: esims.reduce((sum, esim) => sum + (esim.price || 0), 0),
        };
      });

      // Wait for all user processing to complete
      const processedUsers = await Promise.all(userPromises);
      usersData.push(...processedUsers);

      setUsers(usersData);
      setFilteredUsers(usersData);

    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  // Search users across entire database
  const searchUsers = async (searchTerm) => {
    if (!searchTerm.trim()) {
      // If search term is empty, load the current page
      await loadUsers(currentPage);
      return;
    }

    try {
      setLoading(true);
      console.log(`Searching for: "${searchTerm}"`);
      
      // For better performance, limit the search to recent users (last 1000)
      // This prevents searching through the entire database which could be slow
      const usersQuery = query(
        collection(db, 'users'),
        orderBy('createdAt', 'desc'),
        limit(1000) // Limit search scope for performance
      );
      
      const usersSnapshot = await getDocs(usersQuery);
      console.log(`Searching through ${usersSnapshot.docs.length} recent users`);
      
      const searchTermLower = searchTerm.toLowerCase();
      
      // Process each user document and check if it matches search criteria
      const userPromises = usersSnapshot.docs.map(async (userDoc) => {
        const userData = userDoc.data();
        const userEmail = (userData.email || userData.actualEmail || '').toLowerCase();
        const userId = userDoc.id.toLowerCase();
        
        // Check if user matches search criteria
        if (userEmail.includes(searchTermLower) || userId.includes(searchTermLower)) {
          // Get eSIM count and basic stats for matching users only
          const esimsSnapshot = await getDocs(
            query(
              collection(db, 'users', userDoc.id, 'esims'),
              orderBy('createdAt', 'desc'),
              limit(10)
            )
          );
          
          const esims = esimsSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              status: data.status,
              price: data.price || 0,
            };
          });
          
          return {
            id: userDoc.id,
            email: userData.email || userData.actualEmail || 'No email',
            role: userData.role || 'customer',
            displayName: userData.displayName || userData.name || '',
            createdAt: userData.createdAt?.toDate(),
            esims: esims,
            esimCount: esims.length,
            activeEsims: esims.filter(esim => esim.status === 'active').length,
            deactivatedEsims: esims.filter(esim => esim.status === 'deactivated').length,
            totalSpent: esims.reduce((sum, esim) => sum + (esim.price || 0), 0),
          };
        }
        return null; // User doesn't match search criteria
      });
      
      // Wait for all user processing to complete and filter out null results
      const processedUsers = (await Promise.all(userPromises)).filter(user => user !== null);
      
      console.log(`Found ${processedUsers.length} users matching search criteria`);
      
      setUsers(processedUsers);
      setFilteredUsers(processedUsers);
      setTotalUsers(processedUsers.length); // Update total count for search results
      
    } catch (error) {
      console.error('Error searching users:', error);
      toast.error('Failed to search users');
    } finally {
      setLoading(false);
    }
  };

  // Handle search with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchUsers(searchTerm);
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Pagination calculations
  const [totalUsers, setTotalUsers] = useState(0);
  const totalPages = Math.ceil(totalUsers / usersPerPage);
  const isSearching = searchTerm.trim().length > 0;

  // Pagination handlers
  const handlePageChange = (pageNumber) => {
    if (isSearching) {
      // When searching, don't change pages - show all search results
      return;
    }
    setCurrentPage(pageNumber);
    loadUsers(pageNumber);
  };

  const handlePreviousPage = () => {
    if (isSearching || currentPage <= 1) {
      return;
    }
    const newPage = currentPage - 1;
    setCurrentPage(newPage);
    loadUsers(newPage);
  };

  const handleNextPage = () => {
    if (isSearching || currentPage >= totalPages) {
      return;
    }
    const newPage = currentPage + 1;
    setCurrentPage(newPage);
    loadUsers(newPage);
  };

  // Load total count and first page on component mount
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Get total user count quickly (without loading all data)
        const countQuery = query(collection(db, 'users'));
        const countSnapshot = await getDocs(countQuery);
        setTotalUsers(countSnapshot.docs.length);
        
        // Load first page
        await loadUsers(1);
      } catch (error) {
        console.error('Error loading initial data:', error);
        toast.error('Failed to load users');
      }
    };
    
    loadInitialData();
  }, []);

  // Load admin users
  const loadAdmins = async () => {
    try {
      setLoadingAdmins(true);
      const adminQuery = query(
        collection(db, 'users'),
        where('role', 'in', ['admin', 'super_admin'])
      );
      const snap = await getDocs(adminQuery);
      const adminData = snap.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          email: data.email || data.actualEmail || 'No email',
          role: data.role || 'admin',
          displayName: data.displayName || data.name || '',
          createdAt: data.createdAt?.toDate(),
        };
      });
      setAdmins(adminData);
    } catch (error) {
      console.error('Error loading admins:', error);
    } finally {
      setLoadingAdmins(false);
    }
  };

  useEffect(() => {
    loadAdmins();
  }, []);

  // Load all orders
  const loadOrders = async () => {
    try {
      setLoadingOrders(true);
      const ordersQuery = query(
        collection(db, 'orders'),
        orderBy('createdAt', 'desc'),
        limit(500)
      );
      const snap = await getDocs(ordersQuery);
      const ordersData = snap.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          orderId: data.orderId || d.id,
          userId: data.userId || data.customerId || '',
          customerEmail: data.customerEmail || data.email || '',
          planName: data.planName || data.planId || data.package_id || 'Unknown',
          countryCode: data.countryCode || data.country_code || '',
          countryName: data.countryName || data.country || '',
          amount: parseFloat(data.amount || data.price || 0),
          currency: data.currency || 'USD',
          status: data.status || 'unknown',
          paymentMethod: data.paymentMethod || 'stripe',
          affiliateRef: data.affiliateRef || null,
          isGuest: data.isGuest || false,
          isTestMode: data.isTestMode || false,
          createdAt: data.createdAt,
        };
      });
      setAllOrders(ordersData);
      setFilteredOrders(ordersData);
    } catch (error) {
      console.error('Error loading orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoadingOrders(false);
    }
  };

  // Filter orders on search
  useEffect(() => {
    if (!orderSearch.trim()) {
      setFilteredOrders(allOrders);
      return;
    }
    const term = orderSearch.toLowerCase();
    setFilteredOrders(allOrders.filter(o =>
      o.customerEmail.toLowerCase().includes(term) ||
      o.orderId.toLowerCase().includes(term) ||
      o.planName.toLowerCase().includes(term) ||
      o.userId.toLowerCase().includes(term) ||
      (o.affiliateRef && o.affiliateRef.toLowerCase().includes(term)) ||
      (o.countryName && o.countryName.toLowerCase().includes(term))
    ));
    setOrderPage(1);
  }, [orderSearch, allOrders]);

  // Load orders when switching to orders tab
  useEffect(() => {
    if (activeTab === 'orders' && allOrders.length === 0) {
      loadOrders();
    }
  }, [activeTab]);

  // Handle user selection
  const handleViewUser = (user) => {
    router.push(`/dashboard/user/${user.id}`);
  };

  // Handle delete user
  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      // Delete all user's eSIMs first
      for (const esim of userToDelete.esims) {
        await deleteDoc(doc(db, 'users', userToDelete.id, 'esims', esim.id));
      }
      
      // Delete user document
      await deleteDoc(doc(db, 'users', userToDelete.id));
      
      toast.success('User and all eSIMs deleted successfully');
      setShowDeleteModal(false);
      setUserToDelete(null);
      await loadUsers(); // Reload the list
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Format date
  const formatDate = (date) => {
    if (!date) return 'Unknown';
    return date.toLocaleDateString();
  };


  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Admins Tab */}
        {activeTab === 'admins' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {loadingAdmins ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : admins.length === 0 ? (
              <div className="text-center py-12">
                <ShieldCheck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Admins Found</h3>
                <p className="text-gray-500">No users with admin role found.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Admin</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {admins.map((admin) => (
                      <tr key={admin.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleViewUser(admin)}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <ShieldCheck className="w-5 h-5 text-purple-500 mr-3" />
                            <div>
                              <div className="text-sm font-medium text-gray-900">{admin.displayName || admin.email}</div>
                              {admin.displayName && <div className="text-xs text-gray-500">{admin.email}</div>}
                              <div className="text-xs text-gray-400 font-mono">{admin.id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                            admin.role === 'super_admin' ? 'bg-red-100 text-red-800' : 'bg-purple-100 text-purple-800'
                          }`}>
                            {admin.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                            <span className="text-sm text-gray-900">{formatDate(admin.createdAt)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleViewUser(admin); }}
                            className="text-blue-600 hover:text-blue-800 font-medium"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            {/* Orders Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-xs text-gray-500">Total Orders</p>
                    <p className="text-xl font-bold text-gray-900">{allOrders.length}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-xs text-gray-500">Total Revenue</p>
                    <p className="text-xl font-bold text-gray-900">${allOrders.reduce((s, o) => s + o.amount, 0).toFixed(2)}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-purple-600" />
                  <div>
                    <p className="text-xs text-gray-500">Active</p>
                    <p className="text-xl font-bold text-gray-900">{allOrders.filter(o => o.status === 'active').length}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-orange-600" />
                  <div>
                    <p className="text-xs text-gray-500">Countries</p>
                    <p className="text-xl font-bold text-gray-900">{new Set(allOrders.map(o => o.countryCode).filter(Boolean)).size}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Orders Search */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by email, order ID, plan, country, affiliate..."
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                {orderSearch && (
                  <button
                    onClick={() => setOrderSearch('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              {orderSearch && (
                <p className="text-xs text-gray-500 mt-2">
                  Found {filteredOrders.length} order(s) matching &quot;{orderSearch}&quot;
                </p>
              )}
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              {loadingOrders ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Orders Found</h3>
                  <p className="text-gray-500">{orderSearch ? 'Try adjusting your search.' : 'No orders yet.'}</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredOrders.slice((orderPage - 1) * ordersPerPage, orderPage * ordersPerPage).map((order) => {
                          const flagEmoji = (() => {
                            if (!order.countryCode || order.countryCode.length !== 2) return '🌍';
                            try {
                              const codePoints = order.countryCode.toUpperCase().split('').map(c => 127397 + c.charCodeAt());
                              return String.fromCodePoint(...codePoints);
                            } catch { return '🌍'; }
                          })();
                          const statusColor = {
                            active: 'bg-green-100 text-green-800',
                            completed: 'bg-blue-100 text-blue-800',
                            pending: 'bg-yellow-100 text-yellow-800',
                            failed: 'bg-red-100 text-red-800',
                            deactivated: 'bg-gray-100 text-gray-800',
                          }[order.status] || 'bg-gray-100 text-gray-600';

                          const orderDate = (() => {
                            if (!order.createdAt) return 'N/A';
                            const d = order.createdAt.toDate ? order.createdAt.toDate() : (order.createdAt.seconds ? new Date(order.createdAt.seconds * 1000) : new Date(order.createdAt));
                            return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(d);
                          })();

                          return (
                            <tr key={order.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 whitespace-nowrap">
                                <div className="text-xs font-mono text-gray-900 truncate max-w-[120px]" title={order.orderId}>{order.orderId}</div>
                                {order.isTestMode && <span className="text-[10px] text-yellow-600 font-medium">TEST</span>}
                                {order.isGuest && <span className="text-[10px] text-orange-600 font-medium ml-1">GUEST</span>}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <div className="text-sm text-gray-900 truncate max-w-[180px]">{order.customerEmail || 'N/A'}</div>
                                {order.userId && (
                                  <div className="text-[10px] text-gray-400 font-mono truncate max-w-[180px]">{order.userId}</div>
                                )}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-base">{flagEmoji}</span>
                                  <div>
                                    <div className="text-sm text-gray-900 truncate max-w-[140px]">{order.planName}</div>
                                    <div className="text-[10px] text-gray-500">{order.countryName || order.countryCode || ''}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <span className="text-sm font-bold text-gray-900">${order.amount.toFixed(2)}</span>
                                {order.affiliateRef && (
                                  <div className="text-[10px] text-purple-600 font-mono">ref: {order.affiliateRef}</div>
                                )}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${statusColor}`}>
                                  {order.status}
                                </span>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500">{orderDate}</td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                {order.userId && (
                                  <button
                                    onClick={() => router.push(`/dashboard/user/${order.userId}`)}
                                    className="text-blue-600 hover:text-blue-800 text-xs font-medium flex items-center gap-1"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                    User
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Orders Pagination */}
                  {filteredOrders.length > ordersPerPage && (
                    <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
                      <p className="text-sm text-gray-700">
                        Showing {(orderPage - 1) * ordersPerPage + 1} to {Math.min(orderPage * ordersPerPage, filteredOrders.length)} of {filteredOrders.length}
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setOrderPage(p => Math.max(1, p - 1))}
                          disabled={orderPage === 1}
                          className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="px-3 py-1 text-sm text-gray-700">
                          {orderPage} / {Math.ceil(filteredOrders.length / ordersPerPage)}
                        </span>
                        <button
                          onClick={() => setOrderPage(p => Math.min(Math.ceil(filteredOrders.length / ordersPerPage), p + 1))}
                          disabled={orderPage >= Math.ceil(filteredOrders.length / ordersPerPage)}
                          className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Users Tab Content */}
        {activeTab === 'users' && (
        <>
        {/* Search and Actions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by email or user ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Clear Search
              </button>
            )}
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Users Found</h3>
              <p className="text-gray-500">
                {searchTerm ? 'Try adjusting your search terms.' : 'No users with eSIMs found.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      eSIMs
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Spent
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Joined
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleViewUser(user)}>
                      {/* User Column */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <UserCircle className="w-5 h-5 text-gray-400 mr-3" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {user.email}
                            </div>
                            <div className="text-xs text-gray-400 font-mono">
                              {user.id}
                            </div>
                          </div>
                        </div>
                      </td>
                      
                      {/* eSIM Count Column */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Smartphone className="w-4 h-4 text-blue-500 mr-2" />
                          <span className="text-sm font-medium text-gray-900">
                            {user.esimCount}
                          </span>
                        </div>
                      </td>
                      
                      {/* Total Spent Column */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-sm font-medium text-gray-900">
                            ${user.totalSpent.toFixed(2)}
                          </span>
                        </div>
                      </td>
                      
                      {/* Joined Date Column */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900">
                            {formatDate(user.createdAt)}
                          </span>
                        </div>
                      </td>
                      
                      {/* Actions Column */}
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent row click
                            setUserToDelete(user);
                            setShowDeleteModal(true);
                          }}
                          className="text-red-600 hover:text-red-900 flex items-center justify-center w-full py-1 px-2 rounded border border-red-200 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && !isSearching && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 rounded-lg shadow-sm">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={handlePreviousPage}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{(currentPage - 1) * usersPerPage + 1}</span> to{' '}
                  <span className="font-medium">
                    {Math.min(currentPage * usersPerPage, totalUsers)}
                  </span>{' '}
                  of <span className="font-medium">{totalUsers}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={handlePreviousPage}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">Previous</span>
                    <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                  </button>
                  
                  {/* Page numbers */}
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNumber) => {
                    // Show first page, last page, current page, and pages around current page
                    const shouldShow = 
                      pageNumber === 1 || 
                      pageNumber === totalPages || 
                      Math.abs(pageNumber - currentPage) <= 1;
                    
                    if (!shouldShow) {
                      // Show ellipsis for gaps
                      if (pageNumber === 2 && currentPage > 3) {
                        return (
                          <span key={`ellipsis-${pageNumber}`} className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                            ...
                          </span>
                        );
                      }
                      if (pageNumber === totalPages - 1 && currentPage < totalPages - 2) {
                        return (
                          <span key={`ellipsis-${pageNumber}`} className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                            ...
                          </span>
                        );
                      }
                      return null;
                    }
                    
                    return (
                      <button
                        key={pageNumber}
                        onClick={() => handlePageChange(pageNumber)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          pageNumber === currentPage
                            ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {pageNumber}
                      </button>
                    );
                  })}
                  
                  <button
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">Next</span>
                    <ChevronRight className="h-5 w-5" aria-hidden="true" />
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}

        {/* Search Results Info */}
        {isSearching && filteredUsers.length > 0 && (
          <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6 rounded-lg shadow-sm">
            <p className="text-sm text-gray-700">
              Found <span className="font-medium">{filteredUsers.length}</span> user(s) matching "{searchTerm}"
            </p>
          </div>
        )}

        </>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && userToDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full">
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
                    <Trash2 className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Delete User</h3>
                    <p className="text-sm text-gray-500">This action cannot be undone.</p>
                  </div>
                </div>
                
                <div className="mb-6">
                  <p className="text-sm text-gray-700">
                    Are you sure you want to delete <strong>{userToDelete.email}</strong>?
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    This will also delete all {userToDelete.esimCount} eSIM orders associated with this user.
                  </p>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setShowDeleteModal(false);
                      setUserToDelete(null);
                    }}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteUser}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium"
                  >
                    Delete User
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminEsimManagement;