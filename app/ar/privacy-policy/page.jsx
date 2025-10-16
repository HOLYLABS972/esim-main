'use client';

import { useEffect } from 'react';

export default function PrivacyPolicyRedirect() {
  useEffect(() => {
    window.location.href = '/privacy-policy';
  }, []);

  return null;
}

