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

function AdUnit({ adSlot, adFormat = 'horizontal', fullWidthResponsive = true, style }: AdUnitProps) {
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

  if (!clientId && !isDev) return null;

  return (
    <div className="ad-unit-container" style={{ width: '100%', margin: '16px 0', ...style }}>
      {isDev ? (
        <div style={{
          width: '100%',
          minHeight: '120px',
          maxHeight: '160px',
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          border: '1px solid #eaeaea',
          boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'relative',
          overflow: 'hidden',
          padding: '12px 16px',
          boxSizing: 'border-box',
          gap: '16px'
        }}>
          {/* Mock Google Ad Choices Badge */}
          <div style={{
            position: 'absolute',
            top: 0,
            right: 0,
            backgroundColor: '#ffffff',
            borderBottomLeftRadius: '4px',
            borderLeft: '1px solid #eaeaea',
            borderBottom: '1px solid #eaeaea',
            padding: '2px 6px',
            fontSize: '10px',
            color: '#8b8b8b',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            Ad
            <span style={{ color: '#4285F4', fontWeight: 'bold' }}>&#9432;</span>
            <span style={{ fontSize: '10px' }}>&times;</span>
          </div>

          {/* Mock Ad Content — horizontal banner layout */}
          <div style={{ height: '88px', width: '120px', flexShrink: 0, backgroundColor: '#f9f9f9', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #f0f0f0' }}>
            <span style={{ color: '#b0b0b0', fontSize: '0.75rem', fontWeight: 600 }}>Ad Image</span>
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px', minWidth: 0 }}>
            <div style={{ height: '16px', width: '70%', backgroundColor: '#eaeaea', borderRadius: '4px' }}></div>
            <div style={{ height: '12px', width: '45%', backgroundColor: '#f5f5f5', borderRadius: '4px' }}></div>
            <div style={{ fontSize: '10px', color: '#b8b8b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '2px' }}>
              Local Ad Placeholder ({adSlot})
            </div>
          </div>
          <button style={{ backgroundColor: '#1a1a1a', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '50px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.8rem', flexShrink: 0 }}>
            Visit Site
          </button>
        </div>
      ) : (
        <ins
          className="adsbygoogle"
          ref={adRef}
          style={{
            display: 'block',
            width: '100%',
          }}
          data-ad-client={clientId}
          data-ad-slot={adSlot}
          data-ad-format={adFormat}
          data-full-width-responsive={fullWidthResponsive ? 'true' : 'false'}
        />
      )}
    </div>
  );
}

export default AdUnit;
