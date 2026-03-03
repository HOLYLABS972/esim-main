// Admin service for managing user roles and permissions

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
