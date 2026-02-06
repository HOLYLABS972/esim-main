'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { collection, query, getDocs, doc, getDoc, where, updateDoc } from 'firebase/firestore';
import { db } from '../../../../src/firebase/config';
import { useAuth } from '../../../../src/contexts/AuthContext';
import {
  ArrowLeft,
  Mail,
  Calendar,
  Package,
  CreditCard,
  Globe,
  Wifi,
  QrCode,
  ChevronDown,
  ChevronRight,
  User,
  ShieldCheck,
  Pencil,
  Check,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';

const UserDashboardPage = () => {
  const params = useParams();
  const router = useRouter();
  const { currentUser } = useAuth();
  const userId = params.userId;

  const [userData, setUserData] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState('');
  const [editingRole, setEditingRole] = useState(false);

  // Check admin access
  useEffect(() => {
    const checkAdmin = async () => {
      if (!currentUser) return;
      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setIsAdmin(data.role === 'admin' || data.isAdmin === true);
        }
      } catch (err) {
        console.error('Error checking admin:', err);
      }
    };
    checkAdmin();
  }, [currentUser]);

  // Load user data and orders
  useEffect(() => {
    if (!userId) return;

    const loadUserData = async () => {
      try {
        setLoading(true);

        // Fetch user profile
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
          setUserData({ id: userDoc.id, ...userDoc.data() });
        } else {
          setUserData({ id: userId, email: 'Unknown', createdAt: null });
        }

        // Fetch eSIMs from user subcollection
        const esimsSnap = await getDocs(
          query(collection(db, 'users', userId, 'esims'))
        );

        // Fetch from global orders collection
        const globalOrdersSnap = await getDocs(
          query(collection(db, 'orders'), where('userId', '==', userId))
        );

        // Merge and dedup
        const ordersMap = new Map();
        esimsSnap.docs.forEach(d => ordersMap.set(d.id, { id: d.id, ...d.data() }));
        globalOrdersSnap.docs.forEach(d => {
          if (!ordersMap.has(d.id)) {
            ordersMap.set(d.id, { id: d.id, ...d.data() });
          }
        });

        const allOrders = Array.from(ordersMap.values());

        // Sort by date desc
        allOrders.sort((a, b) => {
          const aTime = a.createdAt?.toMillis?.() || a.createdAt?.seconds * 1000 || 0;
          const bTime = b.createdAt?.toMillis?.() || b.createdAt?.seconds * 1000 || 0;
          return bTime - aTime;
        });

        setOrders(allOrders);
      } catch (error) {
        console.error('Error loading user data:', error);
        toast.error('Failed to load user data');
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [userId]);

  const handleNameSave = async () => {
    const trimmed = editNameValue.trim();
    if (!trimmed || trimmed === (userData?.displayName || userData?.name || '')) {
      setEditingName(false);
      return;
    }
    try {
      await updateDoc(doc(db, 'users', userId), { displayName: trimmed });
      setUserData(prev => ({ ...prev, displayName: trimmed }));
      toast.success('Name updated');
    } catch (err) {
      console.error('Error updating name:', err);
      toast.error('Failed to update name');
    }
    setEditingName(false);
  };

  const handleRoleSave = async (newRole) => {
    if (newRole === (userData?.role || 'customer')) {
      setEditingRole(false);
      return;
    }
    try {
      await updateDoc(doc(db, 'users', userId), { role: newRole });
      setUserData(prev => ({ ...prev, role: newRole }));
      toast.success(`Role updated to ${newRole}`);
    } catch (err) {
      console.error('Error updating role:', err);
      toast.error('Failed to update role');
    }
    setEditingRole(false);
  };

  const roleOptions = [
    { value: 'customer', label: 'Customer', color: 'bg-gray-100 text-gray-800' },
    { value: 'admin', label: 'Admin', color: 'bg-purple-100 text-purple-800' },
    { value: 'super_admin', label: 'Super Admin', color: 'bg-red-100 text-red-800' },
  ];

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'super_admin': return 'bg-red-100 text-red-800';
      case 'admin': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    const d = date.toDate ? date.toDate() : (date.seconds ? new Date(date.seconds * 1000) : new Date(date));
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(d);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'deactivated': return 'bg-gray-100 text-gray-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getFlagEmoji = (code) => {
    if (!code || code.length !== 2) return '🌍';
    try {
      const codePoints = code.toUpperCase().split('').map(c => 127397 + c.charCodeAt());
      return String.fromCodePoint(...codePoints);
    } catch {
      return '🌍';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading user data...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin && currentUser?.uid !== userId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ShieldCheck className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">You do not have permission to view this page.</p>
          <button onClick={() => router.back()} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const totalSpent = orders.reduce((sum, o) => sum + (parseFloat(o.amount || o.price || 0)), 0);
  const activeOrders = orders.filter(o => o.status === 'active').length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-gray-900">User Dashboard</h1>
              <p className="text-xs text-gray-500 font-mono">{userId}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* User Info Card */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-start gap-4">
            <div className="bg-blue-100 p-3 rounded-full">
              <User className="w-8 h-8 text-blue-600" />
            </div>
            <div className="flex-1">
              {editingName ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editNameValue}
                    onChange={(e) => setEditNameValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleNameSave();
                      if (e.key === 'Escape') setEditingName(false);
                    }}
                    autoFocus
                    className="text-xl font-bold text-gray-900 border border-blue-400 rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button onClick={handleNameSave} className="p-1 hover:bg-green-100 rounded-full transition-colors">
                    <Check className="w-5 h-5 text-green-600" />
                  </button>
                  <button onClick={() => setEditingName(false)} className="p-1 hover:bg-red-100 rounded-full transition-colors">
                    <X className="w-5 h-5 text-red-500" />
                  </button>
                </div>
              ) : (
                <h2
                  className="text-xl font-bold text-gray-900 flex items-center gap-2 cursor-pointer group"
                  onClick={() => {
                    setEditNameValue(userData?.displayName || userData?.name || '');
                    setEditingName(true);
                  }}
                >
                  {userData?.displayName || userData?.name || 'Unknown User'}
                  <Pencil className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </h2>
              )}
              <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Mail className="w-4 h-4" />
                  <span>{userData?.email || userData?.actualEmail || 'No email'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>Joined: {formatDate(userData?.createdAt)}</span>
                </div>
                {isAdmin && (
                  <div className="relative">
                    {editingRole ? (
                      <div className="flex items-center gap-1 bg-white border border-gray-300 rounded-lg shadow-lg p-1">
                        {roleOptions.map((opt) => (
                          <button
                            key={opt.value}
                            onClick={() => handleRoleSave(opt.value)}
                            className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full transition-colors hover:ring-2 hover:ring-blue-400 ${opt.color} ${
                              (userData?.role || 'customer') === opt.value ? 'ring-2 ring-blue-500' : ''
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                        <button onClick={() => setEditingRole(false)} className="p-0.5 hover:bg-red-100 rounded-full ml-1">
                          <X className="w-3 h-3 text-red-500" />
                        </button>
                      </div>
                    ) : (
                      <span
                        onClick={() => setEditingRole(true)}
                        className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full cursor-pointer hover:ring-2 hover:ring-blue-400 transition-all ${getRoleBadgeColor(userData?.role)}`}
                        title="Click to change role"
                      >
                        {userData?.role === 'super_admin' ? 'Super Admin' : userData?.role || 'customer'}
                      </span>
                    )}
                  </div>
                )}
                {!isAdmin && userData?.role && (
                  <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${getRoleBadgeColor(userData?.role)}`}>
                    {userData.role === 'super_admin' ? 'Super Admin' : userData.role}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow p-4">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-xs text-gray-500">Total Orders</p>
                <p className="text-xl font-bold text-gray-900">{orders.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow p-4">
            <div className="flex items-center gap-2">
              <Wifi className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-xs text-gray-500">Active eSIMs</p>
                <p className="text-xl font-bold text-gray-900">{activeOrders}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow p-4">
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-xs text-gray-500">Total Spent</p>
                <p className="text-xl font-bold text-gray-900">${totalSpent.toFixed(2)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow p-4">
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-orange-600" />
              <div>
                <p className="text-xs text-gray-500">Countries</p>
                <p className="text-xl font-bold text-gray-900">
                  {new Set(orders.map(o => o.countryCode || o.country_code).filter(Boolean)).size}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Orders & eSIMs ({orders.length})</h3>
          </div>

          {orders.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-500">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p>No orders found for this user.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {orders.map((order) => {
                const isExpanded = expandedOrder === order.id;
                const countryCode = order.countryCode || order.country_code || '';
                const countryName = order.countryName || order.country || '';
                const planName = order.planName || order.planId || order.package_id || 'Unknown Plan';
                const amount = parseFloat(order.amount || order.price || 0);
                const status = order.status || 'unknown';
                const hasQR = !!(order.qrCode || order.qr_code || order.esimData?.qrcode || order.esimData?.qrCodeUrl);

                return (
                  <div key={order.id}>
                    {/* Order Row */}
                    <div
                      className={`px-6 py-4 flex items-center gap-4 cursor-pointer hover:bg-gray-50 transition-colors ${isExpanded ? 'bg-blue-50' : ''}`}
                      onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                    >
                      <div className="flex-shrink-0">
                        {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                      </div>
                      <div className="text-2xl flex-shrink-0">{getFlagEmoji(countryCode)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 text-sm truncate">{planName}</div>
                        <div className="text-xs text-gray-500">{countryName || countryCode || 'Unknown'}</div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        {hasQR && <QrCode className="w-4 h-4 text-green-500" title="Has QR code" />}
                        <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(status)}`}>
                          {status}
                        </span>
                        <span className="font-bold text-sm text-gray-900">${amount.toFixed(2)}</span>
                        <span className="text-xs text-gray-400">{formatDate(order.createdAt)}</span>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="px-6 pb-4 bg-gray-50">
                        <div className="ml-10 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div className="space-y-2">
                            <h4 className="font-semibold text-gray-700 text-xs uppercase">Order Details</h4>
                            <div className="bg-white rounded-lg p-3 space-y-1.5">
                              <div className="flex justify-between">
                                <span className="text-gray-500">Order ID:</span>
                                <span className="font-mono text-xs">{order.orderId || order.id}</span>
                              </div>
                              {order.customerEmail && (
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Email:</span>
                                  <span>{order.customerEmail}</span>
                                </div>
                              )}
                              <div className="flex justify-between">
                                <span className="text-gray-500">Amount:</span>
                                <span className="font-bold">${amount.toFixed(2)} {order.currency || 'USD'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500">Payment:</span>
                                <span>{order.paymentMethod || 'stripe'}</span>
                              </div>
                              {order.chargeId && (
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Charge ID:</span>
                                  <span className="font-mono text-xs">{order.chargeId}</span>
                                </div>
                              )}
                              {order.isGuest && (
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Guest:</span>
                                  <span className="text-orange-600">Yes</span>
                                </div>
                              )}
                              {order.affiliateRef && (
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Affiliate:</span>
                                  <span className="font-mono text-xs bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded">{order.affiliateRef}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="space-y-2">
                            <h4 className="font-semibold text-gray-700 text-xs uppercase">eSIM Details</h4>
                            <div className="bg-white rounded-lg p-3 space-y-1.5">
                              {order.airaloOrderId && (
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Airalo Order:</span>
                                  <span className="font-mono text-xs">{order.airaloOrderId}</span>
                                </div>
                              )}
                              {(order.esimData?.iccid || order.iccid) && (
                                <div className="flex justify-between">
                                  <span className="text-gray-500">ICCID:</span>
                                  <span className="font-mono text-xs">{order.esimData?.iccid || order.iccid}</span>
                                </div>
                              )}
                              {order.esimData?.data && (
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Data:</span>
                                  <span>{order.esimData.data}</span>
                                </div>
                              )}
                              {order.esimData?.validity && (
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Validity:</span>
                                  <span>{order.esimData.validity} days</span>
                                </div>
                              )}
                              {hasQR && (
                                <div className="flex justify-between">
                                  <span className="text-gray-500">QR Code:</span>
                                  <span className="text-green-600 font-medium">Available</span>
                                </div>
                              )}
                              {order.isTestMode && (
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Test Mode:</span>
                                  <span className="text-yellow-600">Yes</span>
                                </div>
                              )}
                              <div className="flex justify-between">
                                <span className="text-gray-500">Created:</span>
                                <span>{formatDate(order.createdAt)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserDashboardPage;
