import { useEffect, useState, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams, useNavigate } from 'react-router-dom';
import NavBar from '../nav/navbar';
import Footer from '../home/footer';
import Star from '@mui/icons-material/Star';
import HomeIcon from '@mui/icons-material/Home';
import AddDorm from './AddDorm';
import './universityDash.css';
import '../home/searchbar.css';
import { FaSearch } from 'react-icons/fa';
import DefaultCampus from '../../assets/Default_Campus.webp';
import DefaultDorm from '../../assets/Default_Dorm.webp';
import PageLoader from '../../components/PageLoader';
import { useSEO } from '../../hooks/useSEO';
import CompareModal from '../compare/CompareModal';
import CompareCard from '../../components/CompareCard/CompareCard';
import AdUnit from '../../components/AdUnit';

// Define types for University and Dorm data from API
type APIUniversity = {
  name: string;
  slug: string;
  founded?: number | null;
  location?: string | null;
  totalStudents?: number | null;
  acceptanceRate?: number | null;
  imageUrl?: string | null;
  website?: string | null;
};

type APIDorm = {
  name: string;
  slug: string;
  universitySlug: string;
  imageUrl?: string | null;
  rating?: number;
  totalReviews?: number;
  reviewCount?: number; // Add actual review count
};

// Use relative path '' on localhost to leverage the Vite proxy
const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const API_BASE = isLocal ? '' : ((import.meta as any).env?.VITE_API_BASE || '');

// Main component for University Dashboard
function UniversityDash() {
  const { t } = useTranslation();
  const { universityName } = useParams();
  const navigate = useNavigate();

  const [university, setUniversity] = useState<APIUniversity | null>(null);
  const [dorms, setDorms] = useState<APIDorm[]>([]);
  const [filteredDorms, setFilteredDorms] = useState<APIDorm[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOption, setFilterOption] = useState('most-reviewed');
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  const [reviewCounts, setReviewCounts] = useState<{ [dormName: string]: number }>({});
  const [dormRatings, setDormRatings] = useState<{ [dormName: string]: number }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsFilterDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [filterRef]);

  // SEO: Dynamic title, description, canonical, and structured data
  const formatName = (slug: string) => slug?.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') || '';
  const uniDisplayName = university?.name || formatName(universityName || '');

  const universityJsonLd = useMemo(() => {
    if (!university) return undefined;
    return [
      {
        '@context': 'https://schema.org',
        '@type': 'CollegeOrUniversity',
        name: university.name,
        url: university.website || undefined,
        address: university.location ? { '@type': 'PostalAddress', addressLocality: university.location } : undefined,
        ...(university.imageUrl ? { image: university.imageUrl } : {})
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.lifebydorm.ca/' },
          { '@type': 'ListItem', position: 2, name: `${university.name} Dorms`, item: `https://www.lifebydorm.ca/universities/${universityName}` }
        ]
      }
    ];
  }, [university, universityName]);

  useSEO({
    title: `${uniDisplayName} Dorm Reviews & Residence Photos`,
    description: `Read real student reviews and see photos of dorms at ${uniDisplayName}. Compare ${dorms.length} residences to find your perfect campus home.`,
    canonicalPath: `/universities/${universityName}`,
    jsonLd: universityJsonLd
  });

  // Fetch university and dorm data when component mounts or universityName changes
  useEffect(() => {
    if (!universityName) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    // Helper to calculate overall rating from a review
    const calculateOverallRating = (review: any) => {
      const ratings = [review.room, review.bathroom, review.building, review.amenities, review.location];
      return ratings.reduce((acc, rating) => acc + rating, 0) / ratings.length;
    };

    // Fetch data from APIs - try optimized endpoint first, fallback to old method
    async function fetchData() {
      try {
        // Fetch university data and dorm stats in parallel (both only need the slug from URL)
        const [uniRes, dormsStatsRes] = await Promise.all([
          fetch(`${API_BASE}/api/universities/${encodeURIComponent(universityName!)}`),
          fetch(`${API_BASE}/api/universities/${encodeURIComponent(universityName!)}/dorms-stats`)
        ]);

        if (!uniRes.ok) {
          throw new Error(`Failed to load university: ${uniRes.status}`);
        }
        const uniData: APIUniversity = await uniRes.json();

        let dormsWithStats: APIDorm[] = [];

        if (dormsStatsRes.ok) {
          // Use the optimized endpoint - dorms come with stats pre-calculated
          dormsWithStats = await dormsStatsRes.json();
        } else {
          // Fallback to old method if new endpoint not available (404)
          // Fallback to old dorms endpoint
          const dormsRes = await fetch(`${API_BASE}/api/universities/${encodeURIComponent(universityName!)}/dorms`);
          if (!dormsRes.ok) {
            throw new Error(`Failed to load dorms: ${dormsRes.status}`);
          }
          const dormsData = await dormsRes.json();

          // Fetch reviews for each dorm (old N+1 method)
          const reviewPromises = dormsData.map(async (dorm: any) => {
            try {
              const reviewRes = await fetch(
                `${API_BASE}/api/reviews?university=${encodeURIComponent(universityName!)}&dorm=${encodeURIComponent(dorm.name)}`
              );
              if (reviewRes.ok) {
                const reviews = await reviewRes.json();
                const avgRating = reviews.length > 0
                  ? reviews.reduce((sum: number, r: any) => sum + calculateOverallRating(r), 0) / reviews.length
                  : 0;
                return { ...dorm, avgRating, reviewCount: reviews.length };
              }
            } catch (e) {
              console.error(`Failed to fetch reviews for ${dorm.name}`, e);
            }
            return { ...dorm, avgRating: 0, reviewCount: 0 };
          });

          dormsWithStats = await Promise.all(reviewPromises);
        }

        if (!cancelled) {
          setUniversity(uniData);
          setDorms(dormsWithStats);

          // Extract ratings and counts from the stats
          const counts: { [dormName: string]: number } = {};
          const ratings: { [dormName: string]: number } = {};

          dormsWithStats.forEach((dorm: any) => {
            counts[dorm.name] = dorm.reviewCount || 0;
            ratings[dorm.name] = dorm.avgRating || 0;
          });

          setReviewCounts(counts);
          setDormRatings(ratings);
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Failed to load data');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [universityName]);

  // Filter and sort dorms based on search query and filter option
  useEffect(() => {
    let result = [...dorms];

    // Apply search filter
    if (searchQuery.trim()) {
      result = result.filter(dorm =>
        dorm.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply sorting
    switch (filterOption) {
      case 'most-reviewed':
        result.sort((a, b) => (reviewCounts[b.name] || 0) - (reviewCounts[a.name] || 0));
        break;
      case 'least-reviewed':
        result.sort((a, b) => (reviewCounts[a.name] || 0) - (reviewCounts[b.name] || 0));
        break;
      case 'highest-rated':
        result.sort((a, b) => (dormRatings[b.name] || 0) - (dormRatings[a.name] || 0));
        break;
      case 'lowest-rated':
        result.sort((a, b) => (dormRatings[a.name] || 0) - (dormRatings[b.name] || 0));
        break;
      case 'a-z':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'z-a':
        result.sort((a, b) => b.name.localeCompare(a.name));
        break;
    }

    setFilteredDorms(result);
  }, [dorms, searchQuery, filterOption, reviewCounts, dormRatings]);

  // Function to render star ratings (kept for future use)
  // const _renderStars = (rating: number) => {
  //   const fullStars = Math.floor(rating);
  //   const hasHalfStar = rating - fullStars >= 0.5;
  //   const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
  //   return "★".repeat(fullStars) + (hasHalfStar ? "⯨" : "") + "☆".repeat(emptyStars);
  // };

  // Main component render
  if (loading) {
    return <PageLoader />;
  }

  // Handle error state
  if (error || !university) {
    return (
      <div className="university-dash">
        <NavBar />
        <div className="university-content">
          <p>{error || t('universityDash.notFound')}</p>
        </div>
      </div>
    );
  }

  // Render university dashboard
  return (
    <div className="university-dash">
      <NavBar />
      <main className="university-content">
        {/* Left side - University Information */}
        <div className="university-info">
          {/* Breadcrumbs */}
          <div className="dorm-breadcrumbs" style={{ marginBottom: '16px' }}>
            <Link to="/" className="breadcrumb-home">
              <HomeIcon style={{ fontSize: '1.2rem', color: '#1a1a1a' }} />
            </Link>
            <span className="breadcrumb-separator" style={{ margin: '0 8px', color: '#666' }}>›</span>
            <span className="breadcrumb-current" style={{ fontWeight: 600, color: '#1a1a1a' }}>{university.name} {t('universityDash.dorms')}</span>
          </div>

          <div className="university-image-container">
            <img
              src={university.imageUrl || DefaultCampus}
              alt={`${university.name} campus photo`}
              className="university-main-image"
            />
            <div className="university-image-overlay"></div>
            <div className="university-header-content">
              <h1>{university.name}</h1>
              {university.location && <p className="university-location">{university.location}</p>}
            </div>
          </div>

          <div className="university-website-card">
            <h2>{t('universityDash.needInfo')}</h2>
            <p>{t('universityDash.visitWebsite', { name: university.name })}</p>
            <a
              href={university.website || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="university-website-btn"
            >
              {t('universityDash.visitWebsiteBtn')}
            </a>
          </div>

          {/* Add Dorm Section */}
          <AddDorm
            universitySlug={universityName || ''}
            universityName={university.name}
            onDormSubmitted={() => {
              // Optionally refresh dorms list (though pending dorms won't show)
              // Dorm submitted successfully
            }}
          />

          {/* Compare Dorms Section */}
          <CompareCard
            onOpenCompare={() => setIsCompareModalOpen(true)}
            title="Compare dorms"
            description="Select two dorms to see a side-by-side breakdown of ratings and reviews."
          />
        </div>

        {/* Right side - Dorms List */}
        <div className="dorms-list">

          <div className="dorms-controls">
            <div className="search-section">
              <label htmlFor="dorm-search">{t('universityDash.searchLabel', { count: dorms.length })} </label>
              <div className="search-bar-container">
                <input
                  id="dorm-search"
                  type="text"
                  className="search-input"
                  placeholder={t('universityDash.searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button className="search-button">
                  <FaSearch />
                </button>
              </div>
            </div>

            <div className="filter-section" ref={filterRef}>
              <label>{t('universityDash.filterLabel')}</label>
              <div className="custom-filter-dropdown">
                <button
                  id="filter-select"
                  className="filter-button"
                  onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
                >
                  {filterOption === 'most-reviewed' && t('universityDash.filterMostReviewed')}
                  {filterOption === 'least-reviewed' && t('universityDash.filterLeastReviewed')}
                  {filterOption === 'highest-rated' && t('universityDash.filterHighestRated')}
                  {filterOption === 'lowest-rated' && t('universityDash.filterLowestRated')}
                  {filterOption === 'a-z' && t('universityDash.filterAZ')}
                  {filterOption === 'z-a' && t('universityDash.filterZA')}
                </button>
                {isFilterDropdownOpen && (
                  <div className="filter-dropdown-menu">
                    <button onClick={() => { setFilterOption('most-reviewed'); setIsFilterDropdownOpen(false); }}>{t('universityDash.filterMostReviewed')}</button>
                    <button onClick={() => { setFilterOption('least-reviewed'); setIsFilterDropdownOpen(false); }}>{t('universityDash.filterLeastReviewed')}</button>
                    <button onClick={() => { setFilterOption('highest-rated'); setIsFilterDropdownOpen(false); }}>{t('universityDash.filterHighestRated')}</button>
                    <button onClick={() => { setFilterOption('lowest-rated'); setIsFilterDropdownOpen(false); }}>{t('universityDash.filterLowestRated')}</button>
                    <button onClick={() => { setFilterOption('a-z'); setIsFilterDropdownOpen(false); }}>{t('universityDash.filterAZ')}</button>
                    <button onClick={() => { setFilterOption('z-a'); setIsFilterDropdownOpen(false); }}>{t('universityDash.filterZA')}</button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="dorms-grid">
            {filteredDorms.length > 0 ? (
              filteredDorms.map(dorm => (
                <Link
                  key={`${dorm.universitySlug}-${dorm.slug}`}
                  to={`/universities/${universityName}/dorms/${dorm.slug}`}
                  className="dorm-card"
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  <img src={(dorm.imageUrl && dorm.imageUrl !== '' && dorm.imageUrl !== 'null') ? dorm.imageUrl : DefaultDorm} alt={`${dorm.name} residence at ${uniDisplayName}`} className="dorm-image" loading="lazy" />
                  <div className="dorm-card-info">
                    <div className="dorm-text-content">
                      <h3>{dorm.name}</h3>
                      <div className="dorm-rating" style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '8px' }}>
                        <Star style={{ fontSize: '1.15rem', color: '#FFD700' }} />
                        <span className="rating-number">
                          {(dormRatings[dorm.name] ?? 0).toFixed(1)} ({reviewCounts[dorm.name] ?? 0} {t('universityDash.reviews')})
                        </span>
                      </div>
                    </div>
                    <div className="dorm-action-area">
                      <button
                        className="leave-review-btn-small"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          navigate(`/review?university=${encodeURIComponent(universityName || '')}&dorm=${encodeURIComponent(dorm.name)}`);
                        }}
                      >
                        {t('universityDash.leaveReview')}
                      </button>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="no-results">
                <p>{t('universityDash.noResults')}</p>
              </div>
            )}
          </div>

          <AdUnit adSlot="6505275777" />
        </div>
      </main>
      <Footer />
      <CompareModal
        isOpen={isCompareModalOpen}
        onClose={() => setIsCompareModalOpen(false)}
        initialUni1={universityName}
      />
    </div>
  );
}

export default UniversityDash;