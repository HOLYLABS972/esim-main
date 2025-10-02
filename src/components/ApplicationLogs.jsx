'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, orderBy, limit, getDocs, startAfter, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { motion } from 'framer-motion';
import { 
  FileText, 
  RefreshCw,
  AlertTriangle,
  Clock,
  CreditCard,
  Globe,
  Smartphone,
  Search
} from 'lucide-react';
import toast from 'react-hot-toast';

const ApplicationLogs = () => {
  const { currentUser } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Load logs on component mount
  useEffect(() => {
    if (currentUser) {
      loadLogs();
    }
  }, [currentUser]);

  // Helper function to get user email by ID
  const getUserEmailById = async (userId) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        return userData.actualEmail || userData.email || userId;
      }
      return userId; // Return ID if no email found
    } catch (error) {
      console.error('Error fetching user email:', error);
      return userId; // Return ID as fallback
    }
  };

  const loadLogs = async (loadMore = false) => {
    try {
      setLoading(true);
      
      // Load from all collections for backward compatibility
      const [applicationLogsSnapshot, blacklistLogsSnapshot, referralUsagesSnapshot] = await Promise.all([
        getDocs(query(
          collection(db, 'application_logs'),
          orderBy('timestamp', 'desc'),
          limit(50)
        )),
        getDocs(collection(db, 'blacklist')),
        getDocs(query(
          collection(db, 'referralUsages'),
          orderBy('createdAt', 'desc'),
          limit(50)
        ))
      ]);

      // Combine logs from all collections
      const applicationLogs = applicationLogsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date(),
        source: 'application_logs'
      }));

          const blacklistLogs = await Promise.all(
            blacklistLogsSnapshot.docs.map(async (doc) => {
              const data = doc.data();
              // Use createdAt as the main timestamp, fallback to other fields
              const timestamp = data.createdAt?.toDate() ||
                               data.blockedAt?.toDate() ||
                               data.updatedAt?.toDate() ||
                               data.timestamp?.toDate() ||
                               new Date();

              // Get user email if not already present
              let userEmail = data.userEmail;
              if (!userEmail && data.userId) {
                userEmail = await getUserEmailById(data.userId);
              }

              return {
                id: doc.id,
                ...data,
                timestamp: timestamp,
                source: 'blacklist',
                type: 'blacklist',
                level: 'warning', // Blacklist entries are warnings
                message: data.description || `User blocked: ${data.reason || 'unknown reason'}`,
                details: null,
                userId: data.userId,
                userEmail: userEmail,
                metadata: {
                  reason: data.reason,
                  status: data.status,
                  source: data.source,
                  clicksToday: data.clicksToday,
                  maxClicksPerDay: data.maxClicksPerDay,
                  autoUnblockTime: data.autoUnblockTime,
                  blockedAt: data.blockedAt,
                  additionalData: data.additionalData
                }
              };
            })
          );

      // Process referral usage logs and fetch referrer and referred user emails
      const referralUsageLogs = await Promise.all(
        referralUsagesSnapshot.docs.map(async (doc) => {
          const data = doc.data();
          const referrerEmail = await getUserEmailById(data.referrerId);
          const referredUserEmail = await getUserEmailById(data.referredUserId);
          
          return {
            id: doc.id,
            ...data,
            timestamp: data.createdAt?.toDate() || new Date(),
            source: 'referralUsages',
            type: 'promocode',
            level: 'success',
            message: `Referral code "${data.referralCode}" used by ${referrerEmail}`,
            details: null,
            userId: data.referredUserId,
            userEmail: referredUserEmail,
            metadata: {
              referralCode: data.referralCode,
              referrerId: data.referrerId,
              referrerEmail: referrerEmail,
              referredUserId: data.referredUserId,
              referredUserEmail: referredUserEmail,
              status: data.status
            }
          };
        })
      );

      // Combine and sort by timestamp
      const allLogs = [...applicationLogs, ...blacklistLogs, ...referralUsageLogs]
        .sort((a, b) => b.timestamp - a.timestamp);

      if (loadMore) {
        setLogs(prev => [...prev, ...allLogs]);
      } else {
        setLogs(allLogs);
      }

      // Set pagination based on application_logs collection only (blacklist loads all)
      setLastDoc(applicationLogsSnapshot.docs.length > 0 ? applicationLogsSnapshot.docs[applicationLogsSnapshot.docs.length - 1] : null);
      setHasMore(applicationLogsSnapshot.docs.length === 50);
    } catch (error) {
      console.error('Error loading logs:', error);
      toast.error('Failed to load application logs');
    } finally {
      setLoading(false);
    }
  };

  // Filter logs based on search term
  const filteredLogs = logs.filter(log => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      log.userEmail?.toLowerCase().includes(searchLower) ||
      log.userId?.toLowerCase().includes(searchLower) ||
      log.message?.toLowerCase().includes(searchLower) ||
      log.details?.toLowerCase().includes(searchLower) ||
      (log.metadata?.referrerEmail && log.metadata.referrerEmail.toLowerCase().includes(searchLower)) ||
      (log.metadata?.referredUserEmail && log.metadata.referredUserEmail.toLowerCase().includes(searchLower))
    );
  });

  const getLogIcon = (type) => {
    switch (type) {
      case 'system':
        return <CreditCard className="w-4 h-4 text-red-500" />;
      case 'promocode':
        return <Smartphone className="w-4 h-4 text-purple-500" />;
      case 'blacklist':
        return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      default:
        return <FileText className="w-4 h-4 text-gray-500" />;
    }
  };


  const getLogLevelColor = (level) => {
    switch (level) {
      case 'error':
        return 'border-red-200 bg-red-50';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
      case 'info':
        return 'border-blue-200 bg-blue-50';
      case 'success':
        return 'border-green-200 bg-green-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(timestamp);
  };


  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <FileText className="w-8 h-8 text-blue-600 mr-3" />
            Application Logs
          </h2>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search by user email, user ID, or message..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Logs List */}
      <div className="bg-white rounded-xl shadow-lg">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Recent Activity ({filteredLogs.length} of {logs.length} logs)
          </h3>
        </div>
        
        <div className="divide-y divide-gray-200">
          {loading && logs.length === 0 ? (
            <div className="p-8 text-center">
              <RefreshCw className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-4" />
              <p className="text-gray-500">Loading application logs...</p>
            </div>
              ) : filteredLogs.length === 0 ? (
                <div className="p-8 text-center">
                  <FileText className="w-8 h-8 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">
                    {searchTerm ? `No logs found matching "${searchTerm}"` : 'No logs found'}
                  </p>
                </div>
              ) : (
                filteredLogs.map((log) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 border-l-4 ${getLogLevelColor(log.level)}`}
              >
                <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className="flex items-center space-x-2">
                        {getLogIcon(log.type)}
                      </div>
                    
                    <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              log.type === 'blacklist' ? 'bg-orange-100 text-orange-800' :
                              log.type === 'promocode' ? 'bg-purple-100 text-purple-800' :
                              log.type === 'system' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {log.type?.toUpperCase() || 'SYSTEM'}
                            </span>
                          </div>
                      
                      <p className="text-gray-900 font-medium mb-1">
                        {log.message}
                      </p>
                      
                      {log.details && (
                        <p className="text-gray-600 text-sm mb-2">
                          {log.details}
                        </p>
                      )}
                      
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <div className="flex items-center space-x-1">
                          <span>{formatTimestamp(log.timestamp)}</span>
                        </div>
                        
                        {log.userId && (
                          <div className="flex items-center space-x-1">
                            <span>User: {log.userEmail || log.userId}</span>
                          </div>
                        )}
                        
                        {log.ip && (
                          <div className="flex items-center space-x-1">
                            <Globe className="w-3 h-3" />
                            <span>IP: {log.ip}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Load More Button */}
        {hasMore && !loading && (
          <div className="p-4 text-center border-t border-gray-200">
            <button
              onClick={() => loadLogs(true)}
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Load More Logs
            </button>
          </div>
        )}

        {loading && logs.length > 0 && (
          <div className="p-4 text-center border-t border-gray-200">
            <RefreshCw className="w-4 h-4 text-gray-400 animate-spin mx-auto" />
          </div>
        )}
      </div>
    </div>
  );
};

export default ApplicationLogs;
