'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getNewsletterSubscriptions, updateNewsletterSubscriptionStatus, deleteNewsletterSubscription, getNewsletterStats } from '../services/newsletterService';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Mail,
  Trash2,
  RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';

const NewsletterManagement = () => {
  const { currentUser } = useAuth();

  // State Management
  const [newsletterSubscriptions, setNewsletterSubscriptions] = useState([]);
  const [filteredNewsletterSubscriptions, setFilteredNewsletterSubscriptions] = useState([]);
  const [newsletterSearchTerm, setNewsletterSearchTerm] = useState('');
  const [newsletterStatusFilter, setNewsletterStatusFilter] = useState('all');
  const [newsletterStats, setNewsletterStats] = useState({ total: 0, active: 0, unsubscribed: 0, bounced: 0 });
  const [loading, setLoading] = useState(false);

  // Load data on component mount
  useEffect(() => {
    if (currentUser) {
      loadNewsletterSubscriptions();
    }
  }, [currentUser]);

  // Filter newsletter subscriptions based on search and status
  useEffect(() => {
    let filtered = newsletterSubscriptions.filter(subscription => 
      subscription.email?.toLowerCase().includes(newsletterSearchTerm.toLowerCase()) ||
      subscription.source?.toLowerCase().includes(newsletterSearchTerm.toLowerCase())
    );
    
    if (newsletterStatusFilter !== 'all') {
      filtered = filtered.filter(subscription => subscription.status === newsletterStatusFilter);
    }
    
    setFilteredNewsletterSubscriptions(filtered);
  }, [newsletterSubscriptions, newsletterSearchTerm, newsletterStatusFilter]);

  // Newsletter Management Functions
  const loadNewsletterSubscriptions = async () => {
    try {
      setLoading(true);
      const subscriptions = await getNewsletterSubscriptions();
      const stats = await getNewsletterStats();
      setNewsletterSubscriptions(subscriptions);
      setFilteredNewsletterSubscriptions(subscriptions);
      setNewsletterStats(stats);
      console.log('✅ Loaded', subscriptions.length, 'newsletter subscriptions from Firestore');
    } catch (error) {
      console.error('❌ Error loading newsletter subscriptions:', error);
      toast.error(`Error loading newsletter subscriptions: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateNewsletterStatus = async (subscriptionId, newStatus) => {
    try {
      setLoading(true);
      await updateNewsletterSubscriptionStatus(subscriptionId, newStatus);
      toast.success(`Subscription status updated to ${newStatus}`);
      await loadNewsletterSubscriptions();
    } catch (error) {
      console.error('❌ Error updating newsletter status:', error);
      toast.error(`Error updating newsletter status: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNewsletterSubscription = async (subscriptionId, subscriberEmail) => {
    if (!window.confirm(`Delete newsletter subscription for ${subscriberEmail}? This action cannot be undone.`)) {
      return;
    }

    try {
      setLoading(true);
      await deleteNewsletterSubscription(subscriptionId);
      toast.success('Newsletter subscription deleted successfully');
      await loadNewsletterSubscriptions();
    } catch (error) {
      console.error('❌ Error deleting newsletter subscription:', error);
      toast.error(`Error deleting newsletter subscription: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">Newsletter Subscriptions</h2>
            <p className="text-gray-600">Manage newsletter subscribers and their status</p>
          </div>
          <div className="text-sm text-gray-600">
            {filteredNewsletterSubscriptions.length} subscription{filteredNewsletterSubscriptions.length !== 1 ? 's' : ''} found
          </div>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-600">{newsletterStats.total}</div>
            <div className="text-sm text-blue-800">Total Subscribers</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-600">{newsletterStats.active}</div>
            <div className="text-sm text-green-800">Active</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-gray-600">{newsletterStats.unsubscribed}</div>
            <div className="text-sm text-gray-800">Unsubscribed</div>
          </div>
          <div className="bg-red-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-red-600">{newsletterStats.bounced}</div>
            <div className="text-sm text-red-800">Bounced</div>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search subscribers by email or source..."
              value={newsletterSearchTerm}
              onChange={(e) => setNewsletterSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center space-x-3">
            <select
              value={newsletterStatusFilter}
              onChange={(e) => setNewsletterStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="unsubscribed">Unsubscribed</option>
              <option value="bounced">Bounced</option>
            </select>
          </div>
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Loading newsletter subscriptions...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Source
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subscribed
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredNewsletterSubscriptions.length > 0 ? (
                  filteredNewsletterSubscriptions.map((subscription) => (
                    <tr key={subscription.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                              <span className="text-sm font-medium text-gray-700">
                                {subscription.email?.charAt(0).toUpperCase() || 'U'}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {subscription.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          subscription.status === 'active' 
                            ? 'bg-green-100 text-green-800'
                            : subscription.status === 'unsubscribed'
                            ? 'bg-gray-100 text-gray-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {subscription.status || 'unknown'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {subscription.source || 'website'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {subscription.subscribedAt ? new Date(subscription.subscribedAt.toDate()).toLocaleDateString() : 'Unknown'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <select
                            value={subscription.status || 'active'}
                            onChange={(e) => handleUpdateNewsletterStatus(subscription.id, e.target.value)}
                            className="text-xs px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="active">Active</option>
                            <option value="unsubscribed">Unsubscribed</option>
                            <option value="bounced">Bounced</option>
                          </select>
                          <button
                            onClick={() => handleDeleteNewsletterSubscription(subscription.id, subscription.email)}
                            className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-2 py-1 rounded text-xs transition-colors"
                            title="Delete subscription"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                      <Mail className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p className="text-sm">No newsletter subscriptions found</p>
                      {newsletterSearchTerm && (
                        <p className="text-xs mt-1">Try adjusting your search terms</p>
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default NewsletterManagement;
