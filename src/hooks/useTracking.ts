/**
 * useTracking.ts
 * SPA Tracking Hook for Meta Pixel and GA4
 * Fires PageView events on every route change
 */

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// ══════════════════════════════════════════════════════════════════
// TYPE DECLARATIONS FOR GLOBAL TRACKING FUNCTIONS
// ══════════════════════════════════════════════════════════════════

declare global {
  interface Window {
    fbq: (
      action: 'track' | 'trackCustom' | 'init',
      eventName: string,
      params?: Record<string, unknown>
    ) => void;
    gtag: (
      command: 'config' | 'event' | 'js' | 'set',
      targetId: string,
      config?: Record<string, unknown>
    ) => void;
    dataLayer: unknown[];
  }
}

// GA4 Measurement ID
const GA4_ID = 'G-LZG4822FGT';

/**
 * Custom hook to track page views on route changes
 * Should be used inside a component that is a child of <Router>
 */
export function useTracking(): void {
  const location = useLocation();

  useEffect(() => {
    // ════════════════════════════════════════════════════════════
    // META PIXEL: Track PageView
    // ════════════════════════════════════════════════════════════
    if (typeof window.fbq === 'function') {
      window.fbq('track', 'PageView');
    }

    // ════════════════════════════════════════════════════════════
    // GA4: Send page_view with updated page_path
    // ════════════════════════════════════════════════════════════
    if (typeof window.gtag === 'function') {
      window.gtag('config', GA4_ID, {
        page_path: location.pathname + location.search,
      });
    }

  }, [location]);
}

export default useTracking;
