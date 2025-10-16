'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PrivacyPolicyRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace('/privacy-policy');
  }, [router]);

  return null;
}

