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
  Plus
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