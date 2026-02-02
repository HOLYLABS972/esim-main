'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import Loading from './Loading';

const AdminGuard = ({ children }) => {
  const { currentUser, userProfile, loading } = useAuth();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!currentUser) {
      router.push('/login');
      return;
    }
    if (!userProfile) return;
    if (userProfile.role !== 'admin' && userProfile.role !== 'super_admin') {
      router.push('/dashboard?error=access_denied');
      return;
    }
    setIsChecking(false);
  }, [currentUser, userProfile, loading, router]);

  if (loading || isChecking) return <Loading />;
  if (!currentUser || (userProfile && userProfile.role !== 'admin' && userProfile.role !== 'super_admin')) {
    return null;
  }
  return children;
};

export default AdminGuard;
