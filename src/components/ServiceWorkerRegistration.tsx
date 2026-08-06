"use client";

import { useEffect } from 'react';

/**
 * Registers the service worker so the app can be installed as a PWA.
 * Only runs in production builds (next start).
 */
export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (
      process.env.NODE_ENV === 'production' &&
      'serviceWorker' in navigator
    ) {
      navigator.serviceWorker
        .register('/sw.js')
        .catch((err) => {
          console.error('Service worker registration failed:', err);
        });
    }
  }, []);

  return null;
}
