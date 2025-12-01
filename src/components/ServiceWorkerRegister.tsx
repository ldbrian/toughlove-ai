// src/components/ServiceWorkerRegister.tsx
'use client';

import { useEffect } from 'react';

export function ServiceWorkerRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker
        .register('/service-worker.js')
        .then((reg) => console.log('SW registered'))
        .catch((err) => console.log('SW failed', err));
    }
  }, []);
  
  return null;
}