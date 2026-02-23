import { useEffect, useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import './home.css';

import { Link } from 'react-router-dom';
import NavBar from '../nav/navbar.tsx';
import SearchBar from './searchbar.tsx';
import Footer from './footer.tsx';
import { useUniversityData } from '../../context/UniversityDataContext';
import { SkeletonSlider } from '../../components/SkeletonCard';
import DefaultCampus from '../../assets/Default_Campus.png';
import DefaultDorm from '../../assets/Default_Dorm.png';

// Use relative path '' on localhost to leverage the Vite proxy
const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const API_BASE = isLocal ? '' : ((import.meta as any).env?.VITE_API_BASE || '');

function Home() {
  const { t } = useTranslation();
  const [topUniversities, setTopUniversities] = useState<any[]>([]);
  const [topDorms, setTopDorms] = useState<any[]>([]);
  const [mostRatedDorms, setMostRatedDorms] = useState<any[]>([]);
  const [dormRatings, setDormRatings] = useState<{ [dormName: string]: number }>({});
  const [dormReviewCounts, setDormReviewCounts] = useState<{ [dormName: string]: number }>({});
  const [universityReviewCounts, setUniversityReviewCounts] = useState<{ [universitySlug: string]: number }>({});
  const [universityScrollPosition, setUniversityScrollPosition] = useState(0);
  const [mostRatedDormsScrollPosition, setMostRatedDormsScrollPosition] = useState(0);
  const [dormScrollPosition, setDormScrollPosition] = useState(0);
  const [isLoading, setIsLoading] = useState(true);


  // Track if data has been fetched to prevent duplicate calls
  const hasFetched = useRef(false);

  // Use shared context for universities - single source of truth!
  const { universities, isLoading: universitiesLoading } = useUniversityData();

  const calculateOverallRating = useCallback((review: any) => {
    const ratings = [review.room, review.bathroom, review.building, review.amenities, review.location];
    return ratings.reduce((acc, rating) => acc + rating, 0) / ratings.length;
  }, []);

  useEffect(() => {
    // Wait for universities to load from context and prevent duplicate fetches
    if (universitiesLoading || universities.length === 0 || hasFetched.current) {
      return;
    }

    hasFetched.current = true;

    // Optimized: Fetch all homepage data in a single request
    const fetchAllData = async () => {
      setIsLoading(true);

      try {
        // Single API call to get all stats
        const statsRes = await fetch(`${API_BASE}/api/stats/homepage`);

        if (!statsRes.ok) {
          throw new Error('Failed to fetch homepage stats');
        }

        const stats = await statsRes.json();

        // Set top universities (already sorted and limited to 7)
        setTopUniversities(stats.topUniversities);

        // Build university review counts map
        const uniCounts: { [slug: string]: number } = {};
        stats.topUniversities.forEach((uni: any) => {
          uniCounts[uni.slug] = uni.reviewCount;
        });
        setUniversityReviewCounts(uniCounts);

        // Set top rated dorms (already sorted and limited to 7)
        setTopDorms(stats.topRatedDorms);

        // Build dorm ratings and counts maps
        const ratings: { [name: string]: number } = {};
        const counts: { [name: string]: number } = {};
        stats.topRatedDorms.forEach((dorm: any) => {
          ratings[dorm.name] = dorm.avgRating;
          counts[dorm.name] = dorm.reviewCount;
        });
        setDormRatings(ratings);
        setDormReviewCounts(counts);

        // Set most reviewed dorms (already sorted and limited to 7)
        setMostRatedDorms(stats.mostReviewedDorms);
      } catch (e) {
        console.error('Failed to fetch data', e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllData();
  }, [universities, universitiesLoading, calculateOverallRating]);

  /* Helper to scroll a container by exactly one card width + gap */
  const scrollContainer = (containerId: string, direction: 'left' | 'right', setPos: (pos: number) => void) => {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Find the first card to measure its width
    const firstCard = container.querySelector('.slider-card') as HTMLElement;
    if (!firstCard) return;

    // Calculate total item width (card + gap)
    const style = window.getComputedStyle(container);
    const gap = parseFloat(style.gap) || 20; // Default to 20px if not set
    const itemWidth = firstCard.offsetWidth + gap;

    // Get current scroll position from the DOM
    const currentScroll = container.scrollLeft;

    // Add a small tolerance for floating point scroll positions
    const tolerance = 5;

    let newPosition;

    if (direction === 'right') {
      // Calculate next snap point: (current + tolerance) / width
      const nextIndex = Math.floor((currentScroll + tolerance) / itemWidth) + 1;
      newPosition = nextIndex * itemWidth;
    } else {
      // Calculate previous snap point: (current - tolerance) / width
      const prevIndex = Math.ceil((currentScroll - tolerance) / itemWidth) - 1;
      newPosition = Math.max(0, prevIndex * itemWidth);
    }

    // scrollWidth - clientWidth is the max scroll
    const maxScroll = container.scrollWidth - container.clientWidth;
    // Clamp newPosition
    if (newPosition > maxScroll) newPosition = maxScroll;

    container.scrollTo({ left: newPosition, behavior: 'smooth' });
    setPos(newPosition);
  };

  // Add event listeners to sync state on manual scroll
  useEffect(() => {
    const handleScroll = (id: string, setPos: (pos: number) => void) => {
      const container = document.getElementById(id);
      if (container) {
        setPos(container.scrollLeft);
      }
    };

    const uniSlider = document.getElementById('university-slider');
    const mostRatedSlider = document.getElementById('most-rated-dorms-slider');
    const dormSlider = document.getElementById('dorm-slider');

    const onUniScroll = () => handleScroll('university-slider', setUniversityScrollPosition);
    const onMostRatedScroll = () => handleScroll('most-rated-dorms-slider', setMostRatedDormsScrollPosition);
    const onDormScroll = () => handleScroll('dorm-slider', setDormScrollPosition);

    uniSlider?.addEventListener('scroll', onUniScroll, { passive: true });
    mostRatedSlider?.addEventListener('scroll', onMostRatedScroll, { passive: true });
    dormSlider?.addEventListener('scroll', onDormScroll, { passive: true });

    return () => {
      uniSlider?.removeEventListener('scroll', onUniScroll);
      mostRatedSlider?.removeEventListener('scroll', onMostRatedScroll);
      dormSlider?.removeEventListener('scroll', onDormScroll);
    };
  }, []);

  const scrollUniversities = (direction: 'left' | 'right') => {
    scrollContainer('university-slider', direction, setUniversityScrollPosition);
  };

  const scrollMostRatedDorms = (direction: 'left' | 'right') => {
    scrollContainer('most-rated-dorms-slider', direction, setMostRatedDormsScrollPosition);
  };

  const scrollDorms = (direction: 'left' | 'right') => {
    scrollContainer('dorm-slider', direction, setDormScrollPosition);
  };

  return (
    <div className="home">
      <NavBar />
      <div className="home-container">
        <div className="home-content">
          <div className="home-section">
            <h1>
              {t('home.heroTitle')}
            </h1>
            <SearchBar />
          </div>
        </div>
      </div>

      {/* Featured Section */}
      <div className="featured-section">
        {/* Featured Universities Section */}
        <div className="featured-container">
          <h2 className="featured-title">{t('home.mostRatedUniversities')}</h2>
          <p className="featured-subtitle">{t('home.mostRatedUniversitiesSubtitle')}</p>

          <div className="slider-container">
            <button
              className="slider-button slider-button-left"
              onClick={() => scrollUniversities('left')}
              disabled={universityScrollPosition === 0}
            >
              ‹
            </button>
            <div className="slider-wrapper" id="university-slider">
              {isLoading ? (
                <SkeletonSlider count={4} />
              ) : (
                topUniversities.map(uni => (
                  <Link key={uni.slug} to={`/universities/${uni.slug}`} className="featured-card slider-card">
                    <div className="featured-image-container">
                      <img src={uni.imageUrl || DefaultCampus} alt={uni.name} className="featured-image" loading="lazy" />
                    </div>
                    <div className="featured-info">
                      <h3 className="featured-university-name">
                        <span className="icon"></span> {uni.name}
                      </h3>
                      <p className="featured-location">
                        <span className="icon"></span> {uni.location?.replace(', Canada', '') || t('home.locationNA')}
                      </p>
                      <p className="featured-location">
                        <span className="icon"></span> {universityReviewCounts[uni.slug] ?? 0} {universityReviewCounts[uni.slug] === 1 ? t('home.review') : t('home.reviews')}
                      </p>
                    </div>
                  </Link>
                ))
              )}
            </div>
            <button
              className="slider-button slider-button-right"
              onClick={() => scrollUniversities('right')}
            >
              ›
            </button>
          </div>
        </div>

        {/* Most Rated Dorms Section */}
        <div className="featured-container" style={{ marginTop: '40px' }}>
          <h2 className="featured-title">{t('home.mostRatedDorms')}</h2>
          <p className="featured-subtitle">{t('home.mostRatedDormsSubtitle')}</p>

          <div className="slider-container">
            <button
              className="slider-button slider-button-left"
              onClick={() => scrollMostRatedDorms('left')}
              disabled={mostRatedDormsScrollPosition === 0}
            >
              ‹
            </button>
            <div className="slider-wrapper" id="most-rated-dorms-slider">
              {isLoading ? (
                <SkeletonSlider count={4} />
              ) : (
                mostRatedDorms.map(dorm => (
                  <Link key={`${dorm.universitySlug}-${dorm.slug}`} to={`/universities/${dorm.universitySlug}/dorms/${dorm.slug}`} className="featured-card slider-card">
                    <div className="featured-image-container">
                      <img src={dorm.imageUrl || DefaultDorm} alt={dorm.name} className="featured-image" loading="lazy" />
                    </div>
                    <div className="featured-info">
                      <h3 className="featured-university-name">
                        <span className="icon"></span> {dorm.name}
                      </h3>
                      <p className="featured-location">
                        <span className="icon"></span> {dorm.university}
                      </p>
                      <p className="featured-location">
                        <span className="icon"></span> {dorm.reviewCount ?? 0} {dorm.reviewCount === 1 ? t('home.review') : t('home.reviews')}
                      </p>
                    </div>
                  </Link>
                ))
              )}
            </div>
            <button
              className="slider-button slider-button-right"
              onClick={() => scrollMostRatedDorms('right')}
            >
              ›
            </button>
          </div>
        </div>


        {/* Top Rated Dorms Section */}
        <div className="featured-container" style={{ marginTop: '40px' }}>
          <h2 className="featured-title">{t('home.topRatedDorms')}</h2>
          <p className="featured-subtitle">{t('home.topRatedDormsSubtitle')}</p>

          <div className="slider-container">
            <button
              className="slider-button slider-button-left"
              onClick={() => scrollDorms('left')}
              disabled={dormScrollPosition === 0}
            >
              ‹
            </button>
            <div className="slider-wrapper" id="dorm-slider">
              {isLoading ? (
                <SkeletonSlider count={4} />
              ) : (
                topDorms.map(dorm => (
                  <Link key={`${dorm.universitySlug}-${dorm.slug}`} to={`/universities/${dorm.universitySlug}/dorms/${dorm.slug}`} className="featured-card slider-card">
                    <div className="featured-image-container">
                      <img src={dorm.imageUrl || DefaultDorm} alt={dorm.name} className="featured-image" loading="lazy" />
                    </div>
                    <div className="featured-info">
                      <h3 className="featured-university-name">
                        <span className="icon"></span> {dorm.name}
                      </h3>
                      <p className="featured-location">
                        <span className="icon"></span> {dorm.university}
                      </p>
                      <p className="featured-location">
                        <span className="icon"></span> {(dormRatings[dorm.name] ?? 0).toFixed(1)} ({dormReviewCounts[dorm.name] ?? 0} {dormReviewCounts[dorm.name] === 1 ? t('home.review') : t('home.reviews')})
                      </p>
                    </div>
                  </Link>
                ))
              )}
            </div>
            <button
              className="slider-button slider-button-right"
              onClick={() => scrollDorms('right')}
            >
              ›
            </button>
          </div>
        </div>

      </div>

      <Footer />
    </div>
  );
}

export default Home;