'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, orderBy, limit, getDocs, startAfter } from 'firebase/firestore';
import { db } from '../firebase/config';
import { motion } from 'framer-motion';
import { 
  FileText, 
  RefreshCw, 
  AlertTriangle,
  CheckCircle,
  Info,
  Clock,
  CreditCard,
  Globe,
  Smartphone
} from 'lucide-react';
import toast from 'react-hot-toast';

const ApplicationLogs = () => {
  const { currentUser } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);

  // Load logs on component mount
  useEffect(() => {
    if (currentUser) {
      loadLogs();
    }
  }, [currentUser]);

  const loadLogs = async (loadMore = false) => {
    try {
      setLoading(true);
      
      // Load from both collections for backward compatibility
      const [applicationLogsSnapshot, blacklistLogsSnapshot] = await Promise.all([
        getDocs(query(
          collection(db, 'application_logs'),
          orderBy('timestamp', 'desc'),
          limit(50)
        )),
        getDocs(query(
          collection(db, 'blacklist'),
          orderBy('timestamp', 'desc'),
          limit(50)
        ))
      ]);

      // Combine logs from both collections
      const applicationLogs = applicationLogsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date(),
        source: 'application_logs'
      }));

      const blacklistLogs = blacklistLogsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date(),
        source: 'blacklist',
        type: 'blacklist', // Add type for backward compatibility
        level: 'info' // Add default level for backward compatibility
      }));

      // Combine and sort by timestamp
      const allLogs = [...applicationLogs, ...blacklistLogs]
        .sort((a, b) => b.timestamp - a.timestamp);

      if (loadMore) {
        setLogs(prev => [...prev, ...allLogs]);
      } else {
        setLogs(allLogs);
      }

      // Set pagination based on the larger collection
      const maxDocs = Math.max(applicationLogsSnapshot.docs.length, blacklistLogsSnapshot.docs.length);
      setLastDoc(maxDocs > 0 ? allLogs[allLogs.length - 1] : null);
      setHasMore(maxDocs === 50);
    } catch (error) {
      console.error('Error loading logs:', error);
      toast.error('Failed to load application logs');
    } finally {
      setLoading(false);
    }
  };

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

  const getLogLevelIcon = (level) => {
    switch (level) {
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'info':
        return <Info className="w-4 h-4 text-blue-500" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      default:
        return <Info className="w-4 h-4 text-gray-500" />;
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
      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <FileText className="w-8 h-8 text-blue-600 mr-3" />
            Application Logs
          </h2>
          <button
            onClick={() => loadLogs()}
            disabled={loading}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
        
        <p className="text-gray-600">
          Monitor application events, errors, and system activities including Stripe key status.
        </p>
      </div>

      {/* Logs List */}
      <div className="bg-white rounded-xl shadow-lg">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Recent Activity ({logs.length} logs)
          </h3>
        </div>
        
        <div className="divide-y divide-gray-200">
          {loading && logs.length === 0 ? (
            <div className="p-8 text-center">
              <RefreshCw className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-4" />
              <p className="text-gray-500">Loading application logs...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="p-8 text-center">
              <FileText className="w-8 h-8 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No logs found</p>
            </div>
          ) : (
            logs.map((log) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 border-l-4 ${getLogLevelColor(log.level)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className="flex items-center space-x-2">
                      {getLogLevelIcon(log.level)}
                      {getLogIcon(log.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {log.level?.toUpperCase() || 'INFO'}
                        </span>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {log.type?.toUpperCase() || 'SYSTEM'}
                        </span>
                        {log.source && (
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            log.source === 'blacklist' ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'
                          }`}>
                            {log.source === 'blacklist' ? 'LEGACY' : 'NEW'}
                          </span>
                        )}
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
                          <Clock className="w-3 h-3" />
                          <span>{formatTimestamp(log.timestamp)}</span>
                        </div>
                        
                        {log.userId && (
                          <div className="flex items-center space-x-1">
                            <span>User: {log.userId}</span>
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
