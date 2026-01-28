import { useEffect, useState, useCallback, useRef } from 'react';
import './home.css';

import { Link } from 'react-router-dom';
import NavBar from '../NavBarPages/navbar.tsx';
import SearchBar from './searchbar.tsx';
import Footer from './footer.tsx';
import { useUniversityData } from '../context/UniversityDataContext';
import DefaultCampus from '../assets/Default_Campus.png';
import DefaultDorm from '../assets/Default_Dorm.png';

const API_BASE = (import.meta as any).env?.VITE_API_BASE || 'http://localhost:3000';

function Home() {
  const [topUniversities, setTopUniversities] = useState<any[]>([]);
  const [topDorms, setTopDorms] = useState<any[]>([]);
  const [mostRatedDorms, setMostRatedDorms] = useState<any[]>([]);
  const [dormRatings, setDormRatings] = useState<{ [dormName: string]: number }>({});
  const [dormReviewCounts, setDormReviewCounts] = useState<{ [dormName: string]: number }>({});
  const [universityReviewCounts, setUniversityReviewCounts] = useState<{ [universitySlug: string]: number }>({});
  const [universityScrollPosition, setUniversityScrollPosition] = useState(0);
  const [mostRatedDormsScrollPosition, setMostRatedDormsScrollPosition] = useState(0);
  const [dormScrollPosition, setDormScrollPosition] = useState(0);
  const [_isLoading, setIsLoading] = useState(true);

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

  const scrollUniversities = (direction: 'left' | 'right') => {
    const container = document.getElementById('university-slider');
    if (container) {
      const scrollAmount = 350;
      const newPosition = direction === 'left'
        ? Math.max(0, universityScrollPosition - scrollAmount)
        : Math.min(container.scrollWidth - container.clientWidth, universityScrollPosition + scrollAmount);

      container.scrollTo({ left: newPosition, behavior: 'smooth' });
      setUniversityScrollPosition(newPosition);
    }
  };

  const scrollMostRatedDorms = (direction: 'left' | 'right') => {
    const container = document.getElementById('most-rated-dorms-slider');
    if (container) {
      const scrollAmount = 350;
      const newPosition = direction === 'left'
        ? Math.max(0, mostRatedDormsScrollPosition - scrollAmount)
        : Math.min(container.scrollWidth - container.clientWidth, mostRatedDormsScrollPosition + scrollAmount);

      container.scrollTo({ left: newPosition, behavior: 'smooth' });
      setMostRatedDormsScrollPosition(newPosition);
    }
  };

  const scrollDorms = (direction: 'left' | 'right') => {
    const container = document.getElementById('dorm-slider');
    if (container) {
      const scrollAmount = 350;
      const newPosition = direction === 'left'
        ? Math.max(0, dormScrollPosition - scrollAmount)
        : Math.min(container.scrollWidth - container.clientWidth, dormScrollPosition + scrollAmount);

      container.scrollTo({ left: newPosition, behavior: 'smooth' });
      setDormScrollPosition(newPosition);
    }
  };

  return (
    <div className="home">
      <NavBar />
      <div className="home-container">
        <div className="home-content">
          <div className="home-section">
            <h1>
              Honest Dorm Reviews from Students Across Canada
            </h1>
            <SearchBar />
          </div>
        </div>
      </div>

      {/* Featured Section */}
      <div className="featured-section">
        {/* Featured Universities Section */}
        <div className="featured-container">
          <h2 className="featured-title">Most Rated Universities</h2>
          <p className="featured-subtitle">Explore top universities and their housing options.</p>

          <div className="slider-container">
            <button
              className="slider-button slider-button-left"
              onClick={() => scrollUniversities('left')}
              disabled={universityScrollPosition === 0}
            >
              ‹
            </button>
            <div className="slider-wrapper" id="university-slider">
              {topUniversities.map(uni => (
                <Link key={uni.slug} to={`/universities/${uni.slug}`} className="featured-card slider-card">
                  <div className="featured-image-container">
                    <img src={uni.imageUrl || DefaultCampus} alt={uni.name} className="featured-image" loading="lazy" />
                  </div>
                  <div className="featured-info">
                    <h3 className="featured-university-name">
                      <span className="icon"></span> {uni.name}
                    </h3>
                    <p className="featured-location">
                      <span className="icon"></span> {uni.location?.replace(', Canada', '') || 'Location N/A'}
                    </p>
                    <p className="featured-location">
                      <span className="icon"></span> {universityReviewCounts[uni.slug] ?? 0} {universityReviewCounts[uni.slug] === 1 ? 'review' : 'reviews'}
                    </p>
                  </div>
                </Link>
              ))}
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
          <h2 className="featured-title">Most Rated Dorms</h2>
          <p className="featured-subtitle">Discover the most reviewed residences across campuses.</p>

          <div className="slider-container">
            <button
              className="slider-button slider-button-left"
              onClick={() => scrollMostRatedDorms('left')}
              disabled={mostRatedDormsScrollPosition === 0}
            >
              ‹
            </button>
            <div className="slider-wrapper" id="most-rated-dorms-slider">
              {mostRatedDorms.map(dorm => (
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
                      <span className="icon"></span> {dorm.reviewCount ?? 0} {dorm.reviewCount === 1 ? 'review' : 'reviews'}
                    </p>
                  </div>
                </Link>
              ))}
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
          <h2 className="featured-title">Top Rated Dorms</h2>
          <p className="featured-subtitle">Check out highly-rated residences across campuses.</p>

          <div className="slider-container">
            <button
              className="slider-button slider-button-left"
              onClick={() => scrollDorms('left')}
              disabled={dormScrollPosition === 0}
            >
              ‹
            </button>
            <div className="slider-wrapper" id="dorm-slider">
              {topDorms.map(dorm => (
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
                      <span className="icon"></span> {(dormRatings[dorm.name] ?? 0).toFixed(1)} ({dormReviewCounts[dorm.name] ?? 0} {dormReviewCounts[dorm.name] === 1 ? 'review' : 'reviews'})
                    </p>
                  </div>
                </Link>
              ))}
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