// Admin service for managing user roles and permissions

import { doc, getDoc, collection, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

// Admin roles constants
export const ADMIN_ROLES = {
  USER: 'customer',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin'
};

// Admin permissions constants
export const ADMIN_PERMISSIONS = {
  [ADMIN_ROLES.USER]: [],
  [ADMIN_ROLES.ADMIN]: [
    'manage_users',
    'manage_plans',
    'manage_countries',
    'manage_orders',
    'view_analytics',
    'manage_blog',
    'manage_newsletter',
    'manage_contact_requests'
  ],
  [ADMIN_ROLES.SUPER_ADMIN]: [
    'manage_admins',
    'manage_users',
    'manage_plans',
    'manage_countries',
    'manage_orders',
    'view_analytics',
    'manage_config',
    'delete_data',
    'manage_blog',
    'manage_newsletter',
    'manage_contact_requests'
  ]
};

export async function createSuperAdmin(email) {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      throw new Error('User not found. Please create the user account first.');
    }

    const userDoc = querySnapshot.docs[0];
    const userId = userDoc.id;

    await updateDoc(doc(db, 'users', userId), {
      role: 'super_admin',
      isSuperAdmin: true,
      adminPermissions: {
        canManageUsers: true,
        canManagePlans: true,
        canManageOrders: true,
        canViewAnalytics: true,
        canManageSettings: true
      },
      updatedAt: new Date()
    });

    return true;
  } catch (error) {
    console.error('Error creating super admin:', error);
    throw error;
  }
}

export async function createAdmin(email) {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      throw new Error('User not found. Please create the user account first.');
    }

    const userDoc = querySnapshot.docs[0];
    const userId = userDoc.id;

    await updateDoc(doc(db, 'users', userId), {
      role: 'admin',
      isAdmin: true,
      adminPermissions: {
        canManageUsers: true,
        canManagePlans: true,
        canManageOrders: true,
        canViewAnalytics: true,
        canManageSettings: false
      },
      updatedAt: new Date()
    });

    return true;
  } catch (error) {
    console.error('Error creating admin:', error);
    throw error;
  }
}

export async function removeAdminPrivileges(email) {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      throw new Error('User not found.');
    }

    const userDoc = querySnapshot.docs[0];
    const userId = userDoc.id;

    await updateDoc(doc(db, 'users', userId), {
      role: 'customer',
      isAdmin: false,
      isSuperAdmin: false,
      adminPermissions: null,
      updatedAt: new Date()
    });

    return true;
  } catch (error) {
    console.error('Error removing admin privileges:', error);
    throw error;
  }
}

export function hasAdminAccess(userProfile) {
  if (!userProfile) return false;
  return userProfile.role === 'admin' || userProfile.role === 'super_admin';
}

export function hasSuperAdminAccess(userProfile) {
  if (!userProfile) return false;
  return userProfile.role === 'super_admin';
}

export function hasAdminPermission(userProfile, permission) {
  if (!userProfile || !userProfile.adminPermissions) return false;
  if (userProfile.role === 'super_admin') return true;
  return userProfile.adminPermissions[permission] === true;
}

export async function getUserRole(userId) {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      return userDoc.data().role || ADMIN_ROLES.USER;
    }
    return ADMIN_ROLES.USER;
  } catch (error) {
    console.error('Error getting user role:', error);
    return ADMIN_ROLES.USER;
  }
}

export const adminService = {
  getUserRole,
  createSuperAdmin,
  createAdmin,
  removeAdminPrivileges,
  hasAdminAccess,
  hasSuperAdminAccess,
  hasAdminPermission
};
