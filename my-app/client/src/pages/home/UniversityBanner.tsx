import React, { useRef, useEffect } from 'react';
import './UniversityBanner.css';

// Using Clearbit Logo API for consistent logos (or specific verified URLs)
// Some are placeholders if Clearbit doesn't have a good one, but major unis should be fine.
// Using inline SVGs or direct image links for the logos requested.

const universities = [
  { name: 'University of Toronto', url: 'https://upload.wikimedia.org/wikipedia/en/thumb/0/04/Utoronto_coa.svg/1200px-Utoronto_coa.svg.png', isHorizontal: false },
  { name: 'McGill University', url: 'https://www.uniscope.ca/_next/image?url=%2Flogos%2Fmcgill-logo.png&w=256&q=75', isHorizontal: false },
  { name: 'University of British Columbia', url: 'https://ires.ubc.ca/files/2019/10/ubc-logo.png', isHorizontal: false },
  { name: 'University of Waterloo', url: 'https://upload.wikimedia.org/wikipedia/en/thumb/6/6e/University_of_Waterloo_seal.svg/1200px-University_of_Waterloo_seal.svg.png', isHorizontal: false },
  { name: 'University ofhttps://www.frog3d.com/wp-content/uploads/2022/11/york-university.png', url: 'https://www.ipsa.org/sites/default/files/news-announcements/joboffer/logo-186377.png', isHorizontal: true },
  { name: 'Western University', url: 'https://uniscope.ca/logos/western-logo2.png', isHorizontal: true },
  { name: "Queen's University", url: 'https://www.uniscope.ca/_next/image?url=%2Flogos%2Fqueens-logo.png&w=256&q=75', isHorizontal: true },
  { name: "York University", url: "https://www.frog3d.com/wp-content/uploads/2022/11/york-university.png", isHorizontal: true },
  { name: "Wilfrid Laurier University", url: "https://www.uniscope.ca/_next/image?url=%2Flogos%2Flaurier-logo.png&w=256&q=75", isHorizontal: false },
  { name: "University of Guelph", url: "https://www.uniscope.ca/_next/image?url=%2Flogos%2Fguelph-crest.webp&w=256&q=75", isHorizontal: false }
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
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default UniversityBanner;
