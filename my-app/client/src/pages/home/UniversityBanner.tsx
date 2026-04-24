import React, { useRef, useEffect } from 'react';
import './UniversityBanner.css';

// Local logo imports — faster, reliable, Vite-optimized
import UofTLogo from '../../assets/UofT.webp';
import McGillLogo from '../../assets/mcgill-logo.webp';
import UBCLogo from '../../assets/UBC.webp';
import WaterlooLogo from '../../assets/Waterloo.webp';
import MontrealLogo from '../../assets/Montreal.webp';
import WesternLogo from '../../assets/Western.webp';
import QueensLogo from '../../assets/queens-logo.webp';
import YorkLogo from '../../assets/York.webp';
import LaurierLogo from '../../assets/laurier-logo.webp';
import GuelphLogo from '../../assets/guelph-crest.webp';

const universities = [
  { name: 'University of Toronto', url: UofTLogo, isHorizontal: false, scale: 1.75 },
  { name: 'McGill University', url: McGillLogo, isHorizontal: false },
  { name: 'University of British Columbia', url: UBCLogo, isHorizontal: false },
  { name: 'University of Waterloo', url: WaterlooLogo, isHorizontal: false, scale: 1.4 },
  { name: 'Université de Montréal', url: MontrealLogo, isHorizontal: true },
  { name: 'Western University', url: WesternLogo, isHorizontal: true },
  { name: "Queen's University", url: QueensLogo, isHorizontal: true },
  { name: 'York University', url: YorkLogo, isHorizontal: true },
  { name: 'Wilfrid Laurier University', url: LaurierLogo, isHorizontal: false },
  { name: 'University of Guelph', url: GuelphLogo, isHorizontal: false }
];

// Only duplicate twice instead of 4x — still enough for seamless scrolling,
// but halves the number of external image requests (20 instead of 40)
const extendedUniversities = [...universities, ...universities];

const UniversityBanner: React.FC = () => {
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!trackRef.current) return;

    // Use Web Animations API for smooth playback rate changes
    const animation = trackRef.current.animate(
      [
        { transform: 'translateX(0)' },
        { transform: 'translateX(-50%)' }
      ],
      {
        duration: 60000, // 60s
        iterations: Infinity,
        easing: 'linear' // Ensure linear scrolling
      }
    );

    const handleMouseEnter = () => {
      // Slow down to 180s equivalent
      animation.playbackRate = 0.33;
    };

    const handleMouseLeave = () => {
      // Restore normal speed
      animation.playbackRate = 1;
    };

    const track = trackRef.current;
    track.addEventListener('mouseenter', handleMouseEnter);
    track.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      track.removeEventListener('mouseenter', handleMouseEnter);
      track.removeEventListener('mouseleave', handleMouseLeave);
      animation.cancel();
    };
  }, []);

  return (
    <div className="university-banner-container">
      <div className="university-banner-track" ref={trackRef}>
        {extendedUniversities.map((uni, index) => (
          <div key={index} className="university-banner-item">
            <img
              src={uni.url}
              alt={`${uni.name} logo`}
              className={`university-logo ${uni.isHorizontal ? 'logo-horizontal' : 'logo-standard'}`}
              loading="lazy"
              style={uni.scale ? { transform: `scale(${uni.scale})` } : undefined}
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default UniversityBanner;
