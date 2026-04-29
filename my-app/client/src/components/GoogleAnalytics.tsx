import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

declare global {
  interface Window {
    gtag: (command: 'config' | 'event' | 'js', targetId: string, config?: Record<string, any>) => void;
  }
}

const MEASUREMENT_ID = 'G-GG4MC5H4PE';

export default function GoogleAnalytics() {
  const location = useLocation();

  useEffect(() => {
    if (typeof window.gtag === 'function') {
      // Fire a config update on every route navigation.
      // This tells GA4 that the React Single Page App has transitioned to a new "page".
      window.gtag('config', MEASUREMENT_ID, {
        page_path: location.pathname + location.search,
      });
    }
  }, [location]);

  return null;
}
