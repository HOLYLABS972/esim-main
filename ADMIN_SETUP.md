# Admin Panel Setup Guide

This guide explains how to set up admin access for the eSIM application.

## 🔐 Admin Access Control

The admin panel (`/admin`) is now protected and only accessible to users with admin privileges:

- **Super Admin**: Full access to all admin features
- **Admin**: Limited admin access (can be configured)
- **Customer**: No admin access (redirected to dashboard with error message)

## 🚀 Creating Your First Super Admin

### Step 1: Register a Regular User
1. Go to `/register` and create a normal user account
2. Complete the email verification process
3. Note the email address you used

### Step 2: Promote to Super Admin
Run the super admin creation script:

```bash
# Navigate to your project directory
cd /path/to/your/project

# Run the script with the user's email
node scripts/create-super-admin.js user@example.com
```

### Step 3: Verify Admin Access
1. Log in with the promoted user account
2. Navigate to `/admin` - you should now have access
3. The navbar will show "Dashboard" and "Logout" instead of "Login"

## 🛠️ Admin Service Functions

The `adminService.js` provides these functions:

### Creating Admins
```javascript
import { createSuperAdmin, createAdmin } from '../services/adminService';

// Create super admin
await createSuperAdmin('admin@example.com', 'Admin Name');

// Create regular admin
await createAdmin('moderator@example.com', 'Moderator Name');
```

### Checking Permissions
```javascript
import { hasAdminAccess, hasSuperAdminAccess, hasAdminPermission } from '../services/adminService';

// Check if user has admin access
if (hasAdminAccess(userProfile)) {
  // User can access admin panel
}

// Check if user is super admin
if (hasSuperAdminAccess(userProfile)) {
  // User has full admin privileges
}

// Check specific permission
if (hasAdminPermission(userProfile, 'canManageUsers')) {
  // User can manage users
}
```

## 🔒 Permission System

### User Roles
- **customer**: Regular users (default)
- **admin**: Limited admin access
- **super_admin**: Full admin access

### Admin Permissions
- `canManageUsers`: Manage user accounts
- `canManagePlans`: Manage eSIM plans
- `canManageOrders`: Manage orders
- `canViewAnalytics`: View analytics
- `canManageSettings`: Manage system settings

### Permission Hierarchy
- **Super Admin**: All permissions (cannot be restricted)
- **Admin**: Configurable permissions
- **Customer**: No admin permissions

## 🚨 Security Features

1. **Route Protection**: Admin routes are protected by `AdminGuard` component
2. **Role Verification**: User roles are checked on every admin page load
3. **Access Denied**: Non-admin users are redirected with error message
4. **Firestore Security**: Admin data is stored securely in Firestore

## 🔧 Troubleshooting

### "User not found" Error
- Make sure the user has completed registration and email verification
- Check that the email address is correct
- Verify the user exists in Firestore

### "Access Denied" Message
- User doesn't have admin role
- Run the super admin creation script
- Check user's role in Firestore

### Admin Panel Not Loading
- Check browser console for errors
- Verify Firebase configuration
- Ensure user is logged in

## 📝 Manual Admin Creation

If you need to manually create an admin in Firestore:

1. Find the user document in the `users` collection
2. Update the document with:
```json
{
  "role": "super_admin",
  "isSuperAdmin": true,
  "adminPermissions": {
    "canManageUsers": true,
    "canManagePlans": true,
    "canManageOrders": true,
    "canViewAnalytics": true,
    "canManageSettings": true
  },
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

## 🎯 Next Steps

1. Create your first super admin using the script
2. Test admin panel access
3. Configure additional admin users as needed
4. Set up proper admin permissions for your team

---

**Important**: Keep your super admin credentials secure and only share admin access with trusted team members.
