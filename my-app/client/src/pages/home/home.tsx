import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import Star from '@mui/icons-material/Star';
import './home.css';

import { Link } from 'react-router-dom';
import NavBar from '../nav/navbar.tsx';
import SearchBar from './searchbar.tsx';
import Footer from './footer.tsx';
import { useUniversityData } from '../../context/UniversityDataContext';
import { SkeletonSlider } from '../../components/SkeletonCard';
import DefaultCampus from '../../assets/Default_Campus.webp';
import DefaultDorm from '../../assets/Default_Dorm.webp';
import GiveawayBanner from './GiveawayBanner';
import UniversityBanner from './UniversityBanner';
import InfoSection from './InfoSection';
import { useSEO } from '../../hooks/useSEO';

// Use relative path '' on localhost to leverage the Vite proxy
const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const API_BASE = isLocal ? '' : ((import.meta as any).env?.VITE_API_BASE || '');

type RecentVerifiedReview = {
  _id: string;
  university: string;
  dorm: string;
  universitySlug: string;
  universityName?: string;
  dormSlug: string;
  dormImageUrl?: string | null;
  description: string;
  createdAt: string;
  verified: boolean;
  room: number;
  bathroom: number;
  building: number;
  amenities: number;
  location: number;
  user?: string;
  userInitial?: string;
};

function Home() {
  const { t } = useTranslation();

  // SEO: Dynamic title, description, and structured data for homepage
  const homepageJsonLd = useMemo(() => ({
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'LifeByDorm',
    url: 'https://www.lifebydorm.ca',
    description: 'Real student photos and dorm reviews for Canadian universities.',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://www.lifebydorm.ca/universities/{search_term_string}',
      'query-input': 'required name=search_term_string'
    }
  }), []);

  useSEO({
    title: 'LifeByDorm | Real Student Photos & Dorm Reviews for Canadian Schools',
    description: 'Read real, unbiased dorm reviews and see authentic photos from students at Canadian universities. Find the best college residences before you move in on LifeByDorm.',
    canonicalPath: '/',
    jsonLd: homepageJsonLd
  });
  const [topUniversities, setTopUniversities] = useState<any[]>([]);
  const [topDorms, setTopDorms] = useState<any[]>([]);
  const [mostRatedDorms, setMostRatedDorms] = useState<any[]>([]);
  const [dormRatings, setDormRatings] = useState<{ [dormName: string]: number }>({});
  const [dormReviewCounts, setDormReviewCounts] = useState<{ [dormName: string]: number }>({});
  const [universityReviewCounts, setUniversityReviewCounts] = useState<{ [universitySlug: string]: number }>({});
  const [totalReviewsCount, setTotalReviewsCount] = useState<number>(0);
  const [universityScrollPosition, setUniversityScrollPosition] = useState(0);
  const [mostRatedDormsScrollPosition, setMostRatedDormsScrollPosition] = useState(0);
  const [dormScrollPosition, setDormScrollPosition] = useState(0);
  const [recentReviewsScrollPosition, setRecentReviewsScrollPosition] = useState(0);
  const [recentVerifiedReviews, setRecentVerifiedReviews] = useState<RecentVerifiedReview[]>([]);
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

        // Set total review count for the site
        if (stats.totalReviewsCount !== undefined) {
          setTotalReviewsCount(stats.totalReviewsCount);
        }

        setRecentVerifiedReviews(
          Array.isArray(stats.recentVerifiedReviews)
            ? stats.recentVerifiedReviews.filter((review: any) => review?.verified === true)
            : []
        );
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
    const firstCard = (container.querySelector('.slider-card') || container.firstElementChild) as HTMLElement;
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
    const recentReviewsSlider = document.getElementById('recent-reviews-slider');

    const onUniScroll = () => handleScroll('university-slider', setUniversityScrollPosition);
    const onMostRatedScroll = () => handleScroll('most-rated-dorms-slider', setMostRatedDormsScrollPosition);
    const onDormScroll = () => handleScroll('dorm-slider', setDormScrollPosition);
    const onRecentReviewsScroll = () => handleScroll('recent-reviews-slider', setRecentReviewsScrollPosition);

    uniSlider?.addEventListener('scroll', onUniScroll, { passive: true });
    mostRatedSlider?.addEventListener('scroll', onMostRatedScroll, { passive: true });
    dormSlider?.addEventListener('scroll', onDormScroll, { passive: true });
    recentReviewsSlider?.addEventListener('scroll', onRecentReviewsScroll, { passive: true });

    return () => {
      uniSlider?.removeEventListener('scroll', onUniScroll);
      mostRatedSlider?.removeEventListener('scroll', onMostRatedScroll);
      dormSlider?.removeEventListener('scroll', onDormScroll);
      recentReviewsSlider?.removeEventListener('scroll', onRecentReviewsScroll);
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

  const scrollRecentReviews = (direction: 'left' | 'right') => {
    scrollContainer('recent-reviews-slider', direction, setRecentReviewsScrollPosition);
  };

  const getRatingClass = (rating: number): string => {
    if (rating >= 4.0) return 'rating-high';
    if (rating >= 3.0) return 'rating-medium';
    return 'rating-low';
  };

  const calculateReviewRating = (review: RecentVerifiedReview) => {
    const ratings = [review.room, review.bathroom, review.building, review.amenities, review.location];
    return ratings.reduce((sum, value) => sum + value, 0) / ratings.length;
  };

  const getAvatarColor = (identifier: string) => {
    const colors = [
      '#EF4444', // red-500
      '#F97316', // orange-500
      '#F59E0B', // amber-500
      '#84CC16', // lime-500
      '#10B981', // emerald-500
      '#06B6D4', // cyan-500
      '#3B82F6', // blue-500
      '#6366F1', // indigo-500
      '#8B5CF6', // violet-500
      '#D946EF', // fuchsia-500
      '#F43F5E'  // rose-500
    ];
    let hash = 0;
    for (let i = 0; i < identifier.length; i++) {
      hash = identifier.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  const formatUniversityName = (name: string) => {
    if (!name) return '';
    return name.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };
  return (
    <div className="home">
      <NavBar />
      <GiveawayBanner totalReviews={totalReviewsCount} />
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

      {/* University Banner Section */}
      <UniversityBanner />

      {/* Featured Section */}
      <main className="featured-section">
        {/* Featured Universities Section */}
        <div className="featured-container">
          <div className="featured-header">
            <h2 className="featured-title">{t('home.mostRatedUniversities')}</h2>
            <div className="slider-controls">
              <button
                className="slider-button slider-button-left"
                onClick={() => scrollUniversities('left')}
                disabled={universityScrollPosition === 0}
              >
                ‹
              </button>
              <button
                className="slider-button slider-button-right"
                onClick={() => scrollUniversities('right')}
              >
                ›
              </button>
            </div>
          </div>

          <div className="slider-container">
            <div className="slider-wrapper" id="university-slider">
              {isLoading ? (
                <SkeletonSlider count={4} />
              ) : (
                topUniversities.map(uni => (
                  <Link key={uni.slug} to={`/universities/${uni.slug}`} className="featured-card slider-card">
                    <div className="featured-image-container">
                      <img src={uni.imageUrl || DefaultCampus} alt={`${uni.name} campus photo`} className="featured-image" loading="lazy" />
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
          </div>
        </div>

        {/* Most Rated Dorms Section */}
        <div className="featured-container" style={{ marginTop: '40px' }}>
          <div className="featured-header">
            <h2 className="featured-title">{t('home.mostRatedDorms')}</h2>
            <div className="slider-controls">
              <button
                className="slider-button slider-button-left"
                onClick={() => scrollMostRatedDorms('left')}
                disabled={mostRatedDormsScrollPosition === 0}
              >
                ‹
              </button>
              <button
                className="slider-button slider-button-right"
                onClick={() => scrollMostRatedDorms('right')}
              >
                ›
              </button>
            </div>
          </div>

          <div className="slider-container">
            <div className="slider-wrapper" id="most-rated-dorms-slider">
              {isLoading ? (
                <SkeletonSlider count={4} />
              ) : (
                mostRatedDorms.map(dorm => (
                  <Link key={`${dorm.universitySlug}-${dorm.slug}`} to={`/universities/${dorm.universitySlug}/dorms/${dorm.slug}`} className="featured-card slider-card">
                    <div className="featured-image-container">
                      <img src={dorm.imageUrl || DefaultDorm} alt={`${dorm.name} residence photo`} className="featured-image" loading="lazy" />
                    </div>
                    <div className="featured-info">
                      <h3 className="featured-university-name">
                        <span className="icon"></span> {dorm.name}
                      </h3>
                      <p className="featured-location">
                        <span className="icon"></span> {universities.find((u) => u.slug === dorm.universitySlug)?.name || dorm.universitySlug}
                      </p>
                      <p className="featured-location">
                        <span className="icon"></span> {dorm.reviewCount ?? 0} {dorm.reviewCount === 1 ? t('home.review') : t('home.reviews')}
                      </p>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>


        {/* Top Rated Dorms Section */}
        <div className="featured-container" style={{ marginTop: '40px' }}>
          <div className="featured-header">
            <h2 className="featured-title">{t('home.topRatedDorms')}</h2>
            <div className="slider-controls">
              <button
                className="slider-button slider-button-left"
                onClick={() => scrollDorms('left')}
                disabled={dormScrollPosition === 0}
              >
                ‹
              </button>
              <button
                className="slider-button slider-button-right"
                onClick={() => scrollDorms('right')}
              >
                ›
              </button>
            </div>
          </div>

          <div className="slider-container">
            <div className="slider-wrapper" id="dorm-slider">
              {isLoading ? (
                <SkeletonSlider count={4} />
              ) : (
                topDorms.map(dorm => (
                  <Link key={`${dorm.universitySlug}-${dorm.slug}`} to={`/universities/${dorm.universitySlug}/dorms/${dorm.slug}`} className="featured-card slider-card">
                    <div className="featured-image-container">
                      <img src={dorm.imageUrl || DefaultDorm} alt={`${dorm.name} residence photo`} className="featured-image" loading="lazy" />
                    </div>
                    <div className="featured-info">
                      <h3 className="featured-university-name">
                        <span className="icon"></span> {dorm.name}
                      </h3>
                      <p className="featured-location">
                        <span className="icon"></span> {universities.find((u) => u.slug === dorm.universitySlug)?.name || dorm.universitySlug}
                      </p>
                      <p className="featured-location">
                        <span className="icon"></span> {(dormRatings[dorm.name] ?? 0).toFixed(1)} ({dormReviewCounts[dorm.name] ?? 0} {dormReviewCounts[dorm.name] === 1 ? t('home.review') : t('home.reviews')})
                      </p>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>

        {/* LifeByDorm Info Section Banner */}
        <InfoSection />

        <div className="featured-container" style={{ marginTop: '40px' }}>
          <div className="featured-header">
            <h2 className="featured-title">Recent reviews</h2>
            <div className="slider-controls">
              <button
                className="slider-button slider-button-left"
                onClick={() => scrollRecentReviews('left')}
                disabled={recentReviewsScrollPosition === 0}
                aria-label="Previous reviews"
              >
                ‹
              </button>
              <button
                className="slider-button slider-button-right"
                onClick={() => scrollRecentReviews('right')}
                aria-label="Next reviews"
              >
                ›
              </button>
            </div>
          </div>

          <div className="recent-reviews-content-pad">
            {isLoading ? (
              <div className="slider-wrapper recent-reviews-slider-wrapper" id="recent-reviews-slider">
                {Array.from({ length: 8 }).map((_, index) => (
                  <div key={index} className="recent-review-slider-card h-[330px] animate-pulse rounded-2xl border border-[#d8d5ce] bg-white" />
                ))}
              </div>
            ) : recentVerifiedReviews.length === 0 ? (
              <p className="rounded-2xl border border-[#d8d5ce] bg-white px-5 py-8 text-center text-[#565656]">
                No verified reviews available yet.
              </p>
            ) : (
              <div className="slider-wrapper recent-reviews-slider-wrapper" id="recent-reviews-slider">
                {recentVerifiedReviews.map((review) => {
                  const rating = calculateReviewRating(review);
                  const ratingClass = getRatingClass(rating);
                  const avatarSource = String(review.userInitial || review.user || '').trim();
                  const avatarInitial = (avatarSource.match(/[A-Za-z0-9]/)?.[0] || 'A').toUpperCase();

                  return (
                    <Link
                      key={review._id}
                      to={`/universities/${review.universitySlug}/dorms/${review.dormSlug}`}
                      className="recent-review-slider-card group flex min-h-[268px] flex-col overflow-hidden rounded-[18px] border border-[#d1cdc5] bg-white transition hover:-translate-y-0.5 hover:shadow-md"
                    >
                      <div className="flex items-start gap-3 px-4 pt-3">
                        <div
                          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-lg font-bold text-white shadow-sm"
                          style={{ backgroundColor: getAvatarColor(review._id) }}
                        >
                          {avatarInitial}
                        </div>

                        <div className="review-overall-rating">
                          <span className={`overall-rating-badge ${ratingClass}`}>
                            <Star className="rating-star-icon" />
                            {rating.toFixed(1)}
                          </span>
                        </div>
                      </div>

                      <div className="px-4 pb-3 pt-2">
                        <p className="text-[1.02rem] leading-[1.35] text-[#343434]">
                          {review.description.length > 185 ? `${review.description.slice(0, 185)}...` : review.description}
                        </p>
                      </div>

                      <div className="mt-auto flex items-center gap-3 border-t border-[#dedad3] bg-[#f9f8f6] px-4 py-2.5">
                        <img
                          src={review.dormImageUrl || DefaultDorm}
                          alt={`${review.dorm} thumbnail`}
                          className="h-10 w-10 rounded-[10px] border border-[#d9d5ce] object-cover"
                          loading="lazy"
                        />
                        <div className="min-w-0">
                          <p className="truncate text-[0.98rem] font-semibold text-[#2f2f2f]">{review.dorm}</p>
                          <p className="truncate text-[0.94rem] text-[#6a6966]">
                            {formatUniversityName(review.universityName || review.university)}
                          </p>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </main>

      <Footer />
    </div>
  );
}

export default Home;