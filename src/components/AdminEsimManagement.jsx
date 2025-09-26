'use client';

import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, getDoc, doc, deleteDoc, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  Eye, 
  Trash2, 
  RefreshCw, 
  User, 
  Smartphone,
  DollarSign,
  Calendar,
  X,
  UserCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

const AdminEsimManagement = () => {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  // Load users with their eSIM counts
  const loadUsers = async () => {
    try {
      setLoading(true);
      
      // Get all users
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const usersData = [];
      
      for (const userDoc of usersSnapshot.docs) {
        const userData = userDoc.data();
        
        // Get eSIM count for this user
        const esimsSnapshot = await getDocs(
          query(
            collection(db, 'users', userDoc.id, 'esims'),
            orderBy('createdAt', 'desc')
          )
        );
        
        const esims = esimsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
        }));
        
        usersData.push({
          id: userDoc.id,
          email: userData.email || userData.actualEmail || 'No email',
          createdAt: userData.createdAt?.toDate(),
          esims: esims,
          esimCount: esims.length,
          activeEsims: esims.filter(esim => esim.status === 'active').length,
          totalSpent: esims.reduce((sum, esim) => sum + (esim.price || 0), 0),
        });
      }
      
      // Sort by eSIM count (descending)
      usersData.sort((a, b) => b.esimCount - a.esimCount);
      
      setUsers(usersData);
      setFilteredUsers(usersData);
      
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  // Filter users based on search term
  useEffect(() => {
    if (!searchTerm) {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(user =>
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  }, [searchTerm, users]);

  // Load users on component mount
  useEffect(() => {
    loadUsers();
  }, []);

  // Handle user selection
  const handleViewUser = (user) => {
    router.push(`/admin/user/${user.id}`);
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
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
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
                    <tr key={user.id} className="hover:bg-gray-50">
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
                        <div className="flex flex-col space-y-2">
                          <button
                            onClick={() => handleViewUser(user)}
                            className="text-blue-600 hover:text-blue-900 flex items-center justify-center w-full py-1 px-2 rounded border border-blue-200 hover:bg-blue-50 transition-colors"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </button>
                          <button
                            onClick={() => {
                              setUserToDelete(user);
                              setShowDeleteModal(true);
                            }}
                            className="text-red-600 hover:text-red-900 flex items-center justify-center w-full py-1 px-2 rounded border border-red-200 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

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