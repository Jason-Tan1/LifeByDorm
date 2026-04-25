import { useEffect, useState, useMemo, useRef, lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams, useNavigate } from 'react-router-dom';
import NavBar from '../nav/navbar';
import Footer from '../home/footer';
import Star from '@mui/icons-material/Star';
import HomeIcon from '@mui/icons-material/Home';
import './universityDash.css';
import '../home/searchbar.css';
import { FaSearch, FaInstagram } from 'react-icons/fa';
import DefaultCampus from '../../assets/Default_Campus.webp';
import DefaultDorm from '../../assets/Default_Dorm.webp';
import LBDLogo from '../../assets/LBDLogo.webp';
import '../../components/PageLoader.css';
import { useSEO } from '../../hooks/useSEO';
import CompareCard from '../../components/CompareCard/CompareCard';
import AdUnit from '../../components/AdUnit';
import GetYorkedProfile from '../../assets/Get_Yorked.png';

// Lazy boundaries: AddDorm is below the fold and CompareModal pulls in
// react-markdown — neither is needed for first paint.
const AddDorm = lazy(() => import('./AddDorm'));
const CompareModal = lazy(() => import('../compare/CompareModal'));

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
  const [dormsLoading, setDormsLoading] = useState(true);
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
    jsonLd: universityJsonLd,
    ogImage: university?.imageUrl || undefined
  });

  // Fetch university and dorm data when component mounts or universityName changes.
  // The two fetches now resolve independently so the university card can paint
  // while the dorms grid is still loading its stats.
  useEffect(() => {
    if (!universityName) return;
    let cancelled = false;
    setLoading(true);
    setDormsLoading(true);
    setError(null);

    // Helper to calculate overall rating from a review
    const calculateOverallRating = (review: any) => {
      const ratings = [review.room, review.bathroom, review.building, review.amenities, review.location];
      return ratings.reduce((acc, rating) => acc + rating, 0) / ratings.length;
    };

    // 1. University card data (small payload, paints first)
    (async () => {
      try {
        const uniRes = await fetch(`${API_BASE}/api/universities/${encodeURIComponent(universityName!)}`);
        if (!uniRes.ok) throw new Error(`Failed to load university: ${uniRes.status}`);
        const uniData: APIUniversity = await uniRes.json();
        if (!cancelled) setUniversity(uniData);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Failed to load data');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    // 2. Dorms list with stats (independent — grid stays in skeleton until done)
    (async () => {
      try {
        const dormsStatsRes = await fetch(`${API_BASE}/api/universities/${encodeURIComponent(universityName!)}/dorms-stats`);

        let dormsWithStats: APIDorm[] = [];

        if (dormsStatsRes.ok) {
          dormsWithStats = await dormsStatsRes.json();
        } else {
          // Fallback to old method if dorms-stats endpoint isn't available
          const dormsRes = await fetch(`${API_BASE}/api/universities/${encodeURIComponent(universityName!)}/dorms`);
          if (!dormsRes.ok) throw new Error(`Failed to load dorms: ${dormsRes.status}`);
          const dormsData = await dormsRes.json();

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
          setDorms(dormsWithStats);

          const counts: { [dormName: string]: number } = {};
          const ratings: { [dormName: string]: number } = {};
          dormsWithStats.forEach((dorm: any) => {
            counts[dorm.name] = dorm.reviewCount || 0;
            ratings[dorm.name] = dorm.avgRating || 0;
          });
          setReviewCounts(counts);
          setDormRatings(ratings);
        }
      } catch (e) {
        console.error('Error fetching dorm stats', e);
      } finally {
        if (!cancelled) setDormsLoading(false);
      }
    })();

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

  // Handle error state (only after loading completes)
  if (!loading && (error || !university)) {
    return (
      <div className="university-dash">
        <NavBar />
        <div className="university-content">
          <p>{error || t('universityDash.notFound')}</p>
        </div>
      </div>
    );
  }

  // Build display-ready university — uses real data when loaded, slug-based fallback while loading
  const displayUniversity: APIUniversity = university || {
    name: uniDisplayName || 'Loading...',
    slug: universityName || '',
    location: null,
    website: null,
    imageUrl: null,
  };

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
            <span className="breadcrumb-current" style={{ fontWeight: 600, color: '#1a1a1a' }}>{displayUniversity.name} {t('universityDash.dorms')}</span>
          </div>

          <div className="university-image-container">
            <img
              src={displayUniversity.imageUrl || DefaultCampus}
              alt={`${displayUniversity.name} campus photo`}
              className="university-main-image"
            />
            <div className="university-image-overlay"></div>
            <div className="university-header-content">
              <h1>{displayUniversity.name}</h1>
              {displayUniversity.location && <p className="university-location">{displayUniversity.location}</p>}
            </div>
          </div>

          <div className="university-website-card">
            <h2>{t('universityDash.needInfo')}</h2>
            <p>{t('universityDash.visitWebsite', { name: displayUniversity.name })}</p>
            <a
              href={displayUniversity.website || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="university-website-btn"
            >
              {t('universityDash.visitWebsiteBtn')}
            </a>
          </div>

          {/* Add Dorm Section — defer the form chunk until React idles */}
          <Suspense fallback={null}>
            <AddDorm
              universitySlug={universityName || ''}
              universityName={displayUniversity.name}
              onDormSubmitted={() => {
                // Optionally refresh dorms list (though pending dorms won't show)
                // Dorm submitted successfully
              }}
            />
          </Suspense>

          {/* Compare Dorms Section */}
          <CompareCard
            onOpenCompare={() => setIsCompareModalOpen(true)}
            title="Compare dorms"
            description="Select two dorms to see a side-by-side breakdown of ratings and reviews."
          />

          {/* Specifically for York University - Get_Yorked Instagram Link */}
          {displayUniversity.slug === 'york-university' && (
            <a
              href="https://www.instagram.com/get_yorked/"
              target="_blank"
              rel="noopener noreferrer"
              className="instagram-card"
            >
              <div className="instagram-card-content">
                <img
                  src={GetYorkedProfile}
                  alt="Get_Yorked Profile Logo"
                  className="instagram-profile-pic"
                />
                <div className="instagram-text">
                  <div className="instagram-name-row">
                    <h3>Get_Yorked</h3>
                    <FaInstagram className="instagram-icon" />
                  </div>
                  <p>YorkU News & Entertainment</p>
                </div>
              </div>
            </a>
          )}
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

          <AdUnit adSlot="6737267534" />

          <div className="dorms-grid">
            {dormsLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', minHeight: '300px' }}>
                <div className="loader-content">
                  <div className="logo-pulse">
                    <img src={LBDLogo} alt="" className="loader-logo" />
                  </div>
                  <div className="loader-spinner" />
                </div>
              </div>
            ) : filteredDorms.length > 0 ? (
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

          <AdUnit adSlot="6505275777" adFormat="auto" />
        </div>
      </main>
      <Footer />
      {isCompareModalOpen && (
        <Suspense fallback={null}>
          <CompareModal
            isOpen={isCompareModalOpen}
            onClose={() => setIsCompareModalOpen(false)}
            initialUni1={universityName}
          />
        </Suspense>
      )}
    </div>
  );
}

export default UniversityDash;