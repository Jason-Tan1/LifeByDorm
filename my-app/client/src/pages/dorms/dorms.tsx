import { useEffect, useState, useMemo, useRef, lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import NavBar from '../nav/navbar.tsx';
import Footer from '../home/footer.tsx';
import DormInfo from './DormInfo.tsx';
import ReviewsList from './ReviewsList.tsx';
import './dorms.css';
import '../nav/navbar.css';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import LoginModal from '../nav/login';

// Heavy modals are loaded on demand — CompareModal pulls in react-markdown,
// and PhotoUploadModal is only opened from a button click.
const CompareModal = lazy(() => import('../compare/CompareModal.tsx'));
const PhotoUploadModal = lazy(() => import('./PhotoUploadModal'));

import { useSEO } from '../../hooks/useSEO';

//Define types for Dorm data from API (IMPORTANT)
type CategoryAverages = {
  room: number;
  bathroom: number;
  building: number;
  amenities: number;
  location: number;
};

type APIDorm = {
  name: string;
  slug: string;
  universitySlug: string;
  imageUrl?: string;
  rating?: number;
  totalReviews?: number;
  description?: string;
  amenities?: string[];
  roomTypes?: string[];
  aiSummary?: string;
  aiTags?: string[];
  images?: string[];
  avgRating?: number;
  reviewCount?: number;
  categoryAverages?: CategoryAverages;
  wouldDormAgainPercent?: number;
  reviewImages?: string[];
};

//Base URL for API requests
// Use relative path '' on localhost to leverage the Vite proxy
const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const API_BASE = isLocal ? '' : ((import.meta as any).env?.VITE_API_BASE || '');

// Main component for Dorm Page
function Dorms() {
  const { t } = useTranslation();
  const { universityName, dormSlug } = useParams();
  const [dorm, setDorm] = useState<APIDorm | null>(null);
  const [univLocation, setUnivLocation] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [currentImages, setCurrentImages] = useState<string[]>([]);

  // Toast state for review submission
  const location = useLocation();
  const navigate = useNavigate();
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [showAllPhotosModal, setShowAllPhotosModal] = useState(false);
  const [allPhotosForModal, setAllPhotosForModal] = useState<string[]>([]);

  const handleShowAllPhotos = (photos: string[]) => {
    setAllPhotosForModal(photos);
    setShowAllPhotosModal(true);
  };

  const handlePhotoUploadSuccess = (newImages: string[]) => {
    if (dorm) {
      setDorm({
        ...dorm,
        images: [...(dorm.images || []), ...newImages]
      });
    }
  };

  useEffect(() => {
    // Check if we were redirected here after submitting a review
    if (location.state?.reviewSubmitted) {
      setShowSuccessToast(true);
      // Clean up the location state so it doesn't show again on refresh
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  useEffect(() => {
    if (!universityName || !dormSlug) return;

    async function fetchDorm() {
      try {
        setLoading(true);
        setError(null);

        // Use the optimized single-dorm endpoint with stats
        const [dormRes, uniRes] = await Promise.all([
          fetch(`${API_BASE}/api/universities/${encodeURIComponent(universityName!)}/dorms/${encodeURIComponent(dormSlug!)}`),
          fetch(`${API_BASE}/api/universities/${encodeURIComponent(universityName!)}`)
        ]);

        if (!dormRes.ok) {
          if (dormRes.status === 404) {
            throw new Error(t('dorms.notFound'));
          }
          throw new Error('Failed to fetch dorm data');
        }

        const dormData: APIDorm = await dormRes.json();
        setDorm(dormData);

        if (uniRes.ok) {
          const uniData = await uniRes.json();
          setUnivLocation(uniData.location);
        }

      } catch (e: any) {
        setError(e?.message || t('dorms.notFound'));
      } finally {
        setLoading(false);
      }
    }

    fetchDorm();
  }, [universityName, dormSlug]);

  const [reviews, setReviews] = useState<any[]>([]);
  // Start true so the right-side reviews panel shows the LBDLogo loader from
  // initial render until the lazy /api/reviews fetch resolves — matches the
  // original UX. The lazy fetch itself still defers via IntersectionObserver.
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewsPageLoading, setReviewsPageLoading] = useState(false);
  const reviewsPerLoad = 10;
  const reviewsAnchorRef = useRef<HTMLDivElement | null>(null);
  const hasFetchedReviews = useRef(false);
  // The dorm endpoint returns the authoritative review count; until reviews
  // have been fetched, fall back to it so "Load More" knows there's more to load.
  const totalReviews = dorm?.reviewCount ?? reviews.length;

  // SEO: Dynamic title, description, canonical, and structured data for dorm page.
  // Use server-computed avgRating / reviewCount so SEO doesn't wait for the
  // lazy /api/reviews fetch.
  const formatName = (slug: string) => slug?.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') || '';
  const dormDisplayName = dorm?.name || formatName(dormSlug || '');
  const uniDisplayName = formatName(universityName || '');
  const avgRating = dorm?.avgRating ?? 0;

  const dormJsonLd = useMemo(() => {
    if (!dorm) return undefined;
    const schemas: Record<string, unknown>[] = [
      {
        '@context': 'https://schema.org',
        '@type': 'Place',
        name: dorm.name,
        description: dorm.description || `Student residence at ${uniDisplayName}`,
        ...(dorm.imageUrl ? { image: dorm.imageUrl } : {}),
        ...(totalReviews > 0 ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: avgRating.toFixed(1),
            bestRating: '5',
            worstRating: '1',
            ratingCount: totalReviews.toString()
          },
          ...(reviews.length > 0 ? {
            review: reviews.slice(0, 5).map((r: any) => ({
              '@type': 'Review',
              reviewRating: {
                '@type': 'Rating',
                ratingValue: ([r.room, r.bathroom, r.building, r.amenities, r.location].reduce((a: number, b: number) => a + b, 0) / 5).toFixed(1),
                bestRating: '5',
                worstRating: '1'
              },
              author: { '@type': 'Person', name: 'Student' },
              reviewBody: r.description ? r.description.slice(0, 500) : ''
            }))
          } : {})
        } : {})
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.lifebydorm.ca/' },
          { '@type': 'ListItem', position: 2, name: `${uniDisplayName} Dorms`, item: `https://www.lifebydorm.ca/universities/${universityName}` },
          { '@type': 'ListItem', position: 3, name: dorm.name, item: `https://www.lifebydorm.ca/universities/${universityName}/dorms/${dormSlug}` }
        ]
      }
    ];
    return schemas;
  }, [dorm, totalReviews, reviews, avgRating, universityName, dormSlug, uniDisplayName]);

  useSEO({
    title: `${dormDisplayName} at ${uniDisplayName} — Reviews & Photos`,
    description: totalReviews > 0
      ? `${dormDisplayName} at ${uniDisplayName} has a ${avgRating.toFixed(1)}/5 rating from ${totalReviews} student reviews. See real photos and detailed ratings.`
      : `Read student reviews and see real photos of ${dormDisplayName} at ${uniDisplayName}. Get insights before you move in.`,
    canonicalPath: `/universities/${universityName}/dorms/${dormSlug}`,
    jsonLd: dormJsonLd,
    ogImage: dorm?.imageUrl || undefined
  });

  // Lazy-fetch reviews when the right-side ReviewsList is near the viewport.
  // The dorm endpoint already returns avgRating, categoryAverages, and a
  // photo sample, so DormInfo can paint without these reviews.
  useEffect(() => {
    if (!universityName || !dorm) return;
    if (hasFetchedReviews.current) return;

    const dormName = dorm.name;

    const fetchFirstPage = async () => {
      if (hasFetchedReviews.current) return;
      hasFetchedReviews.current = true;
      try {
        setReviewsLoading(true);
        const response = await fetch(
          `${API_BASE}/api/reviews?university=${encodeURIComponent(universityName!)}&dorm=${encodeURIComponent(dormName)}&limit=${reviewsPerLoad}&skip=0`
        );
        if (!response.ok) throw new Error('Failed to fetch reviews');
        const data = await response.json();
        setReviews(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error('Error fetching reviews:', e);
        setReviews([]);
      } finally {
        setReviewsLoading(false);
      }
    };

    const target = reviewsAnchorRef.current;
    if (!target || typeof IntersectionObserver === 'undefined') {
      const id = window.setTimeout(fetchFirstPage, 0);
      return () => window.clearTimeout(id);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some(e => e.isIntersecting)) {
          observer.disconnect();
          fetchFirstPage();
        }
      },
      { rootMargin: '600px 0px' }
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [universityName, dorm]);

  const calculateOverallRating = (review: any) => {
    const ratings = [review.room, review.bathroom, review.building, review.amenities, review.location];
    return ratings.reduce((acc, rating) => acc + rating, 0) / ratings.length;
  };

  //Time formatting function
  const formatReviewTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    const day = date.getDate();
    const daySuffix = (d: number) => {
      if (d > 3 && d < 21) return 'th';
      switch (d % 10) {
        case 1: return 'st';
        case 2: return 'nd';
        case 3: return 'rd';
        default: return 'th';
      }
    };
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    return `${month} ${day}${daySuffix(day)}, ${year}`;
  };

  // Prefer server-computed averages (from /api/universities/:slug/dorms/:dormSlug)
  // so DormInfo paints without waiting for the lazy /api/reviews fetch. Fall back
  // to client computation if the dorm response somehow lacks them.
  const calculateAverageRating = () => {
    if (typeof dorm?.avgRating === 'number') return dorm.avgRating;
    if (reviews.length === 0) return 0;
    const totalRating = reviews.reduce((sum, review) => sum + calculateOverallRating(review), 0);
    return totalRating / reviews.length;
  };

  const calculateCategoryAverages = () => {
    if (dorm?.categoryAverages) return dorm.categoryAverages;
    if (reviews.length === 0) {
      return { room: 0, bathroom: 0, building: 0, amenities: 0, location: 0 };
    }
    const totals = reviews.reduce((acc, review) => {
      acc.room += review.room || 0;
      acc.bathroom += review.bathroom || 0;
      acc.building += review.building || 0;
      acc.amenities += review.amenities || 0;
      acc.location += review.location || 0;
      return acc;
    }, { room: 0, bathroom: 0, building: 0, amenities: 0, location: 0 });
    return {
      room: totals.room / reviews.length,
      bathroom: totals.bathroom / reviews.length,
      building: totals.building / reviews.length,
      amenities: totals.amenities / reviews.length,
      location: totals.location / reviews.length
    };
  };

  const handleVote = async (reviewId: string, type: 'upvote' | 'downvote') => {
    const token = localStorage.getItem('token');
    if (!token) {
      setShowLoginModal(true);
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/reviews/${reviewId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ type })
      });

      if (!response.ok) {
        if (response.status === 401) {
          setShowLoginModal(true);
        }
        throw new Error('Failed to vote');
      }

      const data = await response.json();

      // Update local reviews state to reflect new votes
      setReviews(prevReviews =>
        prevReviews.map(review => {
          if (review._id === reviewId) {
            return {
              ...review,
              upvotes: data.upvotes,
              downvotes: data.downvotes
            };
          }
          return review;
        })
      );
    } catch (e) {
      console.error('Error voting:', e);
    }
  };

  // Reviews are paginated server-side now: each "Load More" click fetches the
  // next batch using skip=loaded. ReviewsList renders the entire `reviews`
  // array as visible because the server only sends what's been requested.
  const visibleReviews = reviews;
  const visibleCount = reviews.length;

  const handleLoadMore = async () => {
    if (!universityName || !dorm) return;
    if (reviewsPageLoading) return;
    if (reviews.length >= totalReviews) return;
    try {
      setReviewsPageLoading(true);
      const response = await fetch(
        `${API_BASE}/api/reviews?university=${encodeURIComponent(universityName)}&dorm=${encodeURIComponent(dorm.name)}&limit=${reviewsPerLoad}&skip=${reviews.length}`
      );
      if (!response.ok) throw new Error('Failed to fetch reviews');
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        setReviews(prev => {
          const seen = new Set(prev.map((r: any) => String(r._id)));
          const additions = data.filter((r: any) => !seen.has(String(r._id)));
          return [...prev, ...additions];
        });
      }
    } catch (e) {
      console.error('Error loading more reviews:', e);
    } finally {
      setReviewsPageLoading(false);
    }
  };

  const openLightbox = (images: string[], index: number) => {
    setCurrentImages(images);
    setCurrentImageIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
  };

  const getRatingClass = (rating: number): string => {
    if (rating >= 4.0) return 'rating-high';
    if (rating >= 3.0) return 'rating-medium';
    return 'rating-low';
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % currentImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + currentImages.length) % currentImages.length);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') nextImage();
    if (e.key === 'ArrowLeft') prevImage();
    if (e.key === 'Escape') closeLightbox();
  };

  // If finished loading and there's an error or no dorm found, show error
  if (!loading && (error || !dorm)) {
    return (
      <div className="dorm-page">
        <NavBar />
        <div className="dorm-content">
          <p>{error || t('dorms.notFound')}</p>
        </div>
        <Footer />
      </div>
    );
  }

  // Build a display-ready dorm — uses real data when loaded, slug-based fallback while loading
  const displayDorm: APIDorm = dorm || {
    name: dormDisplayName || 'Loading...',
    slug: dormSlug || '',
    universitySlug: universityName || '',
  };

  return (
    <div className="dorm-page">
      <NavBar />

      {/* Success Toast */}
      {showSuccessToast && (
        <div className="success-toast">
          <div className="toast-content">
            <span className="toast-icon">✓</span>
            <div className="toast-text">
              <h4>{t('review.reviewSubmitted')}</h4>
              <p>{t('review.thanksSharing')}</p>
            </div>
            <button className="toast-close" onClick={() => setShowSuccessToast(false)}>×</button>
          </div>
        </div>
      )}

      <main className="dorm-content">
        {/* Left side - Dorm Information */}
        <DormInfo
          dorm={displayDorm}
          reviews={reviews}
          universityName={universityName}
          universityLocation={univLocation || undefined}
          totalReviewCount={dorm?.reviewCount}
          wouldDormAgainPercent={dorm?.wouldDormAgainPercent}
          reviewImagesFromServer={dorm?.reviewImages}
          calculateAverageRating={calculateAverageRating}
          calculateCategoryAverages={calculateCategoryAverages}
          onOpenCompare={() => setIsCompareModalOpen(true)}
          openLightbox={openLightbox}
          onShowAllPhotos={handleShowAllPhotos}
          onAddPhotosClick={() => {
            const token = localStorage.getItem('token');
            if (!token) {
              setShowLoginModal(true);
            } else {
              setShowPhotoModal(true);
            }
          }}
        />

        {/* Right side - Review Listings (lazy-fetched via IntersectionObserver) */}
        <div ref={reviewsAnchorRef}>
          <ReviewsList
            universityName={universityName}
            dorm={displayDorm}
            reviews={reviews}
            reviewsLoading={reviewsLoading}
            visibleReviews={visibleReviews}
            visibleCount={visibleCount}
            reviewsPerLoad={reviewsPerLoad}
            totalReviewCount={totalReviews}
            calculateOverallRating={calculateOverallRating}
            getRatingClass={getRatingClass}
            formatReviewTime={formatReviewTime}
            openLightbox={openLightbox}
            handleLoadMore={handleLoadMore}
            handleVote={handleVote}
          />
        </div>
      </main>

      {/* Lightbox Modal */}
      {lightboxOpen && (
        <div
          className="lightbox-overlay"
          onClick={closeLightbox}
          onKeyDown={handleKeyDown}
          tabIndex={0}
        >
          <button className="lightbox-close" onClick={closeLightbox}>×</button>
          <button className="lightbox-arrow lightbox-arrow-left" onClick={(e) => { e.stopPropagation(); prevImage(); }}>‹</button>
          <img
            src={currentImages[currentImageIndex]}
            alt={`Full size photo of ${dormDisplayName}`}
            className="lightbox-image"
            onClick={(e) => e.stopPropagation()}
          />
          <button className="lightbox-arrow lightbox-arrow-right" onClick={(e) => { e.stopPropagation(); nextImage(); }}>›</button>
          <div className="lightbox-counter">{currentImageIndex + 1} / {currentImages.length}</div>
        </div>
      )}

      {showAllPhotosModal && (
        <div
          className="all-photos-modal-overlay"
          onClick={() => setShowAllPhotosModal(false)}
        >
          <div
            className="all-photos-modal-content"
            onClick={e => e.stopPropagation()}
          >
            <div className="all-photos-modal-header">
              <h3>All Photos ({allPhotosForModal.length})</h3>
              <button
                className="all-photos-modal-close"
                onClick={() => setShowAllPhotosModal(false)}
              >×</button>
            </div>
            <div className="all-photos-modal-grid">
              {allPhotosForModal.map((photo, idx) => (
                <div
                  key={idx}
                  className="all-photos-modal-thumb"
                  onClick={() => {
                    setShowAllPhotosModal(false);
                    openLightbox(allPhotosForModal, idx);
                  }}
                >
                  <img src={photo} alt={`Dorm photo ${idx + 1}`} loading="lazy" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />

      {/* Lazy-mount: chunk only loads when the user opens the modal */}
      {isCompareModalOpen && (
        <Suspense fallback={null}>
          <CompareModal
            isOpen={isCompareModalOpen}
            onClose={() => setIsCompareModalOpen(false)}
            initialUni1={displayDorm.universitySlug}
            initialDorm1={displayDorm.slug}
          />
        </Suspense>
      )}

      {showPhotoModal && (
        <Suspense fallback={null}>
          <PhotoUploadModal
            isOpen={showPhotoModal}
            onClose={() => setShowPhotoModal(false)}
            universitySlug={universityName || ''}
            dormSlug={dormSlug || ''}
            onSuccess={handlePhotoUploadSuccess}
          />
        </Suspense>
      )}

      <Footer />
    </div>
  );
}

export default Dorms;