import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    adsbygoogle: unknown[];
  }
}

interface AdUnitProps {
  adSlot: string;
  adFormat?: string;
  fullWidthResponsive?: boolean;
  style?: React.CSSProperties;
}

function AdUnit({ adSlot, adFormat = 'auto', fullWidthResponsive = true, style }: AdUnitProps) {
  const adRef = useRef<HTMLModElement>(null);
  const pushed = useRef(false);
  const clientId = import.meta.env.VITE_GOOGLE_ADSENSE_CLIENT_ID;
  const isDev = import.meta.env.DEV;

  useEffect(() => {
    if (!clientId || pushed.current) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushed.current = true;
    } catch (_e) {
      // AdSense not loaded
    }
  }, [clientId]);

  if (!clientId) return null;

  return (
    <div className="ad-unit-container">
      {isDev && (
        <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '6px' }}>
          AdSense test slot ({adSlot})
        </div>
      )}
      <ins
        className="adsbygoogle"
        ref={adRef}
        style={{
          display: 'block',
          width: '100%',
          minHeight: isDev ? '90px' : undefined,
          background: isDev ? '#f8f9fa' : undefined,
          border: isDev ? '1px dashed #d1d5db' : undefined,
          ...style,
        }}
        data-ad-client={clientId}
        data-ad-slot={adSlot}
        data-ad-format={adFormat}
        data-full-width-responsive={fullWidthResponsive ? 'true' : 'false'}
        data-adtest={isDev ? 'on' : undefined}
      />
    </div>
  );
}

export default AdUnit;
