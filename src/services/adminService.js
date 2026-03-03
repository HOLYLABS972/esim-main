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

const ROLE_CACHE_MS = 5 * 60 * 1000; // 5 minutes
const roleCache = new Map();
const inFlight = new Map();

/** Fetch user role from user_profiles. Returns ADMIN_ROLES.USER if not found or on error. Coalesces and caches to avoid duplicate requests. */
export async function getUserRole(userId) {
  if (!userId) return ADMIN_ROLES.USER;

  const cached = roleCache.get(userId);
  if (cached && Date.now() - cached.ts < ROLE_CACHE_MS) return cached.role;

  let promise = inFlight.get(userId);
  if (promise) return promise;

  promise = (async () => {
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
      const role = data?.role === 'admin' || data?.role === 'super_admin' ? data.role : ADMIN_ROLES.USER;
      roleCache.set(userId, { role, ts: Date.now() });
      return role;
    } catch (e) {
      console.warn('adminService.getUserRole exception:', e);
      return ADMIN_ROLES.USER;
    } finally {
      inFlight.delete(userId);
    }
  })();

  inFlight.set(userId, promise);
  return promise;
}

export function invalidateUserRoleCache(userId) {
  if (userId) {
    roleCache.delete(userId);
    inFlight.delete(userId);
  }
}

export const adminService = { getUserRole, invalidateUserRoleCache };

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
