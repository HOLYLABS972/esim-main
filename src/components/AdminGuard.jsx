"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import Loading from './Loading';

const AdminGuard = ({ children }) => {
  const { currentUser, userProfile, loading } = useAuth();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAdminAccess = async () => {
      console.log('🔍 AdminGuard: Checking admin access...');
      console.log('📊 AdminGuard: Loading state:', loading);
      console.log('👤 AdminGuard: Current user:', currentUser?.email);
      console.log('📋 AdminGuard: User profile:', userProfile);

      if (loading) {
        console.log('⏳ AdminGuard: Still loading, waiting...');
        return;
      }

      // If user is not logged in, redirect to login
      if (!currentUser) {
        console.log('❌ AdminGuard: No user logged in, redirecting to login');
        router.push('/login');
        return;
      }

      // If user profile is not loaded yet, wait
      if (!userProfile) {
        console.log('⏳ AdminGuard: User profile not loaded yet, waiting...');
        return;
      }

      console.log('🔐 AdminGuard: User role:', userProfile.role);
      console.log('📊 AdminGuard: Full user profile:', JSON.stringify(userProfile, null, 2));
      
      // Check if user has admin role
      const userRole = userProfile.role;
      console.log('🔍 AdminGuard: Checking role:', userRole, 'Type:', typeof userRole);
      
      if (userRole !== 'admin' && userRole !== 'super_admin') {
        console.log('🚫 AdminGuard: User does not have admin access, redirecting to dashboard');
        console.log('🔍 AdminGuard: Expected role: admin or super_admin, got:', userRole);
        router.push('/dashboard?error=access_denied');
        return;
      }

      console.log('✅ AdminGuard: Admin access granted');
      setIsChecking(false);
    };

    checkAdminAccess();
  }, [currentUser, userProfile, loading, router]);

  // Show loading while checking permissions
  if (loading || isChecking) {
    return <Loading />;
  }

  // If user is not logged in or doesn't have admin access, don't render children
  if (!currentUser || (userProfile && userProfile.role !== 'admin' && userProfile.role !== 'super_admin')) {
    return null;
  }

  return children;
};

export default AdminGuard;
