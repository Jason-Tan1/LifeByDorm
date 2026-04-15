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

  if (!clientId && !isDev) return null;

  return (
    <div className="ad-unit-container" style={{ width: '100%', margin: '20px 0', ...style }}>
      {isDev ? (
        <div style={{
          width: '100%',
          minHeight: '250px',
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          border: '1px solid #eaeaea',
          boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
          padding: '20px',
          boxSizing: 'border-box'
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

          {/* Mock Ad Content */}
          <div style={{
             width: '100%',
             maxWidth: '900px',
             display: 'flex',
             flexDirection: 'column',
             gap: '12px'
          }}>
            <div style={{ height: '140px', backgroundColor: '#f9f9f9', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #f0f0f0' }}>
              <span style={{ color: '#b0b0b0', fontSize: '1.2rem', fontWeight: 600 }}>Advertisement Image</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                 <div style={{ height: '18px', width: '200px', backgroundColor: '#eaeaea', borderRadius: '4px' }}></div>
                 <div style={{ height: '14px', width: '120px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}></div>
               </div>
               <button style={{ backgroundColor: '#1a1a1a', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '50px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.9rem' }}>
                 Visit Site
               </button>
            </div>
          </div>
          <div style={{ marginTop: '20px', fontSize: '11px', color: '#b8b8b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Local AdSense Placeholder ({adSlot})
          </div>
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
