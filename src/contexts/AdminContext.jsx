'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
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
  const { currentUser, userProfile: authUserProfile } = useAuth();
  const [userRole, setUserRole] = useState(ADMIN_ROLES.USER);
  const [isAdmin, setIsAdmin] = useState(false);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const loadingForUidRef = useRef(null);

  useEffect(() => {
    const uid = currentUser?.uid ?? null;
    if (!uid) {
      loadingForUidRef.current = null;
      setUserRole(ADMIN_ROLES.USER);
      setIsAdmin(false);
      setPermissions([]);
      setLoading(false);
      return;
    }

    const roleFromAuth = authUserProfile?.role;
    if (roleFromAuth === 'admin' || roleFromAuth === 'super_admin' || roleFromAuth === 'customer') {
      loadingForUidRef.current = uid;
      const role = roleFromAuth === 'admin' || roleFromAuth === 'super_admin' ? roleFromAuth : ADMIN_ROLES.USER;
      setUserRole(role);
      setIsAdmin(role !== ADMIN_ROLES.USER);
      setPermissions(ADMIN_PERMISSIONS[role] || []);
      setLoading(false);
      return;
    }

    if (loadingForUidRef.current === uid) return;
    loadingForUidRef.current = uid;

    const loadUserRole = async () => {
      try {
        setLoading(true);
        if (typeof adminService?.getUserRole !== 'function') {
          setUserRole(ADMIN_ROLES.USER);
          setIsAdmin(false);
          setPermissions([]);
          setLoading(false);
          loadingForUidRef.current = null;
          return;
        }
        const role = await adminService.getUserRole(uid);
        if (loadingForUidRef.current !== uid) return;
        setUserRole(role);
        setIsAdmin(role !== ADMIN_ROLES.USER);
        const userPermissions = ADMIN_PERMISSIONS[role] || [];
        setPermissions(userPermissions);
      } catch (error) {
        console.error('Error loading user role:', error);
        if (loadingForUidRef.current === uid) {
          setUserRole(ADMIN_ROLES.USER);
          setIsAdmin(false);
          setPermissions([]);
        }
      } finally {
        if (loadingForUidRef.current === uid) {
          setLoading(false);
        }
        loadingForUidRef.current = null;
      }
    };

    loadUserRole();
  }, [currentUser?.uid, authUserProfile?.role]);

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
      if (typeof adminService?.getUserRole !== 'function') return;
      adminService.invalidateUserRoleCache?.(currentUser.uid);
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
