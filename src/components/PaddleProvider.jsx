'use client';

import { useEffect, useRef } from 'react';

const PADDLE_SCRIPT = 'https://cdn.paddle.com/paddle/v2/paddle.js';

export default function PaddleProvider({ children }) {
  const loadedRef = useRef(false);

  useEffect(() => {
    const token = process.env.NEXT_PUBLIC_PDL_API_KEY;
    if (!token || loadedRef.current) return;

    const script = document.createElement('script');
    script.src = PADDLE_SCRIPT;
    script.async = true;
    script.onload = () => {
      if (typeof window !== 'undefined' && window.Paddle) {
        window.Paddle.Initialize({
          token,
        });
        loadedRef.current = true;
      }
    };
    document.body.appendChild(script);
    return () => {
      if (script.parentNode) script.parentNode.removeChild(script);
    };
  }, []);

  return children;
}
