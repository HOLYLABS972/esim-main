'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getContactRequests, updateContactRequestStatus, deleteContactRequest } from '../services/contactService';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  MessageSquare,
  Trash2,
  RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';

const ContactRequestsManagement = () => {
  const { currentUser } = useAuth();

  // State Management
  const [contactRequests, setContactRequests] = useState([]);
  const [filteredContactRequests, setFilteredContactRequests] = useState([]);
  const [contactRequestSearchTerm, setContactRequestSearchTerm] = useState('');
  const [contactRequestStatusFilter, setContactRequestStatusFilter] = useState('all');
  const [loading, setLoading] = useState(false);

  // Load data on component mount
  useEffect(() => {
    if (currentUser) {
      loadContactRequests();
    }
  }, [currentUser]);

  // Filter contact requests based on search and status
  useEffect(() => {
    let filtered = contactRequests.filter(request => 
      request.name?.toLowerCase().includes(contactRequestSearchTerm.toLowerCase()) ||
      request.email?.toLowerCase().includes(contactRequestSearchTerm.toLowerCase()) ||
      request.message?.toLowerCase().includes(contactRequestSearchTerm.toLowerCase())
    );
    
    if (contactRequestStatusFilter !== 'all') {
      filtered = filtered.filter(request => request.status === contactRequestStatusFilter);
    }
    
    setFilteredContactRequests(filtered);
  }, [contactRequests, contactRequestSearchTerm, contactRequestStatusFilter]);

  // Contact Requests Management Functions
  const loadContactRequests = async () => {
    try {
      setLoading(true);
      const requests = await getContactRequests();
      setContactRequests(requests);
      setFilteredContactRequests(requests);
      console.log('✅ Loaded', requests.length, 'contact requests from Firestore');
    } catch (error) {
      console.error('❌ Error loading contact requests:', error);
      toast.error(`Error loading contact requests: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRequestStatus = async (requestId, newStatus) => {
    try {
      setLoading(true);
      await updateContactRequestStatus(requestId, newStatus);
      toast.success(`Request status updated to ${newStatus}`);
      await loadContactRequests();
    } catch (error) {
      console.error('❌ Error updating request status:', error);
      toast.error(`Error updating request status: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteContactRequest = async (requestId, requestName) => {
    if (!window.confirm(`Are you sure you want to delete the contact request from ${requestName || 'this user'}?`)) {
      return;
    }

    try {
      setLoading(true);
      await deleteContactRequest(requestId);
      toast.success('Contact request deleted successfully');
      await loadContactRequests();
    } catch (error) {
      console.error('❌ Error deleting contact request:', error);
      toast.error(`Error deleting contact request: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">

      {/* Search and Filter */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search requests by name, email, or message..."
              value={contactRequestSearchTerm}
              onChange={(e) => setContactRequestSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center space-x-3">
            <select
              value={contactRequestStatusFilter}
              onChange={(e) => setContactRequestStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="new">New</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Loading contact requests...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Message
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredContactRequests.length > 0 ? (
                  filteredContactRequests.map((request) => (
                    <tr key={request.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                              <span className="text-sm font-medium text-gray-700">
                                {request.name?.charAt(0).toUpperCase() || 'U'}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {request.name || 'Unknown'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {request.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">
                          {request.message}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          request.status === 'new' 
                            ? 'bg-blue-100 text-blue-800'
                            : request.status === 'in_progress'
                            ? 'bg-yellow-100 text-yellow-800'
                            : request.status === 'resolved'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {request.status?.replace('_', ' ') || 'unknown'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {request.createdAt ? new Date(request.createdAt.toDate()).toLocaleDateString() : 'Unknown'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <select
                            value={request.status || 'new'}
                            onChange={(e) => handleUpdateRequestStatus(request.id, e.target.value)}
                            className="text-xs px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="new">New</option>
                            <option value="in_progress">In Progress</option>
                            <option value="resolved">Resolved</option>
                            <option value="closed">Closed</option>
                          </select>
                          <button
                            onClick={() => handleDeleteContactRequest(request.id, request.name)}
                            className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-2 py-1 rounded text-xs transition-colors"
                            title="Delete request"
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
                      <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p className="text-sm">No contact requests found</p>
                      {contactRequestSearchTerm && (
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

export default ContactRequestsManagement;
