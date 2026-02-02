'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { adminService, ADMIN_ROLES, ADMIN_PERMISSIONS } from '../services/adminService';

const AdminContext = createContext();

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};

export const AdminProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [userRole, setUserRole] = useState(ADMIN_ROLES.USER);
  const [isAdmin, setIsAdmin] = useState(false);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUserRole = async () => {
      if (!currentUser) {
        setUserRole(ADMIN_ROLES.USER);
        setIsAdmin(false);
        setPermissions([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const role = await adminService.getUserRole(currentUser.uid);
        setUserRole(role);
        setIsAdmin(role !== ADMIN_ROLES.USER);
        const userPermissions = ADMIN_PERMISSIONS[role] || [];
        setPermissions(userPermissions);
      } catch (error) {
        console.error('Error loading user role:', error);
        setUserRole(ADMIN_ROLES.USER);
        setIsAdmin(false);
        setPermissions([]);
      } finally {
        setLoading(false);
      }
    };

    loadUserRole();
  }, [currentUser]);

  const hasPermission = (permission) => permissions.includes(permission);
  const canManageAdmins = () => hasPermission('manage_admins');
  const canManageCountries = () => hasPermission('manage_countries');
  const canManagePlans = () => hasPermission('manage_plans');
  const canManageConfig = () => hasPermission('manage_config');
  const canDeleteData = () => hasPermission('delete_data');
  const canViewAnalytics = () => hasPermission('view_analytics');
  const canManageBlog = () => hasPermission('manage_blog');
  const canManageNewsletter = () => hasPermission('manage_newsletter');
  const canManageContactRequests = () => hasPermission('manage_contact_requests');

  const refreshRole = async () => {
    if (!currentUser) return;
    try {
      const role = await adminService.getUserRole(currentUser.uid);
      setUserRole(role);
      setIsAdmin(role !== ADMIN_ROLES.USER);
      setPermissions(ADMIN_PERMISSIONS[role] || []);
    } catch (error) {
      console.error('Error refreshing user role:', error);
    }
  };

  const value = {
    userRole,
    isAdmin,
    permissions,
    loading,
    hasPermission,
    canManageAdmins,
    canManageCountries,
    canManagePlans,
    canManageConfig,
    canDeleteData,
    canViewAnalytics,
    canManageBlog,
    canManageNewsletter,
    canManageContactRequests,
    refreshRole,
    ADMIN_ROLES
  };

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
};

export default AdminContext;
