// Admin service for managing user roles and permissions
import { supabase } from '../supabase/config';

export const ADMIN_ROLES = {
  USER: 'customer',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin'
};

export const ADMIN_PERMISSIONS = {
  [ADMIN_ROLES.USER]: [],
  [ADMIN_ROLES.ADMIN]: ['manage_users','manage_plans','manage_countries','manage_orders','view_analytics','manage_blog','manage_newsletter','manage_contact_requests'],
  [ADMIN_ROLES.SUPER_ADMIN]: ['manage_admins','manage_users','manage_plans','manage_countries','manage_orders','view_analytics','manage_settings','manage_blog','manage_newsletter','manage_contact_requests','manage_billing','manage_api_keys'],
};

/** Fetch user role from user_profiles. Returns ADMIN_ROLES.USER if not found or on error. */
export async function getUserRole(userId) {
  if (!userId) return ADMIN_ROLES.USER;
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', userId)
      .maybeSingle();
    if (error) {
      console.warn('adminService.getUserRole error:', error.message);
      return ADMIN_ROLES.USER;
    }
    const role = data?.role;
    if (role === 'admin' || role === 'super_admin') return role;
    return ADMIN_ROLES.USER;
  } catch (e) {
    console.warn('adminService.getUserRole exception:', e);
    return ADMIN_ROLES.USER;
  }
}

export const adminService = { getUserRole };

export function hasAdminAccess(userProfile) {
  if (!userProfile) return false;
  return userProfile.role === 'admin' || userProfile.role === 'super_admin';
}

export function hasSuperAdminAccess(userProfile) {
  if (!userProfile) return false;
  return userProfile.role === 'super_admin';
}

export function hasAdminPermission(userProfile, permission) {
  if (!userProfile) return false;
  const permissions = ADMIN_PERMISSIONS[userProfile.role] || [];
  return permissions.includes(permission);
}
