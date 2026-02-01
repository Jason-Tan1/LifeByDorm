import { useEffect, useState } from 'react';
import NavBar from '../NavBarPages/navbar.tsx';
import Footer from '../homepage/footer.tsx';
import DormInfo from './DormInfo.tsx';
import ReviewsList from './ReviewsList.tsx';
import './dorms.css';
import '../NavBarPages/navbar.css';
import { useParams } from 'react-router-dom';


import PageLoader from '../components/PageLoader';

//Define types for Dorm data from API (IMPORTANT)
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
};

//Base URL for API requests
// Use relative path '' on localhost to leverage the Vite proxy
const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const API_BASE = isLocal ? '' : ((import.meta as any).env?.VITE_API_BASE || '');

// Main component for Dorm Page
function Dorms() {
  const { universityName, dormSlug } = useParams();
  const [dorm, setDorm] = useState<APIDorm | null>(null);
  const [univLocation, setUnivLocation] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [currentImages, setCurrentImages] = useState<string[]>([]);

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
            throw new Error('Dorm not found');
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
        setError(e?.message || 'Failed to load dorm');
      } finally {
        setLoading(false);
      }
    }

    fetchDorm();
  }, [universityName, dormSlug]);

  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [visibleCount, setVisibleCount] = useState(10);
  const reviewsPerLoad = 10;

  // Fetch reviews for this dorm
  useEffect(() => {
    if (!universityName || !dorm) return;

    const dormName = dorm.name; // Capture the name before async function

    async function fetchReviews() {
      try {
        setReviewsLoading(true);
        const response = await fetch(`${API_BASE}/api/reviews?university=${encodeURIComponent(universityName!)}&dorm=${encodeURIComponent(dormName)}`);
        if (!response.ok) throw new Error('Failed to fetch reviews');

        const data = await response.json();
        setReviews(data);
      } catch (e) {
        console.error('Error fetching reviews:', e);
        setReviews([]);
      } finally {
        setReviewsLoading(false);
      }
    }

    fetchReviews();
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

  const calculateAverageRating = () => {
    if (reviews.length === 0) return 0;
    const totalRating = reviews.reduce((sum, review) => sum + calculateOverallRating(review), 0);
    return totalRating / reviews.length;
  };

  const calculateCategoryAverages = () => {
    if (reviews.length === 0) {
      return {
        room: 0,
        bathroom: 0,
        building: 0,
        amenities: 0,
        location: 0
      };
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

  // Load More logic - simple slice of reviews
  const visibleReviews = reviews.slice(0, visibleCount);

  const handleLoadMore = () => {
    setVisibleCount(prev => Math.min(prev + reviewsPerLoad, reviews.length));
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

  if (loading) {
    return <PageLoader />;
  }

  if (error || !dorm) {
    return (
      <div className="dorm-page">
        <NavBar />
        <div className="dorm-content">
          <p>{error || 'Dorm not found'}</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="dorm-page">
      <NavBar />

      <div className="dorm-content">
        {/* Left side - Dorm Information */}
        <DormInfo
          dorm={dorm}
          reviews={reviews}
          universityName={universityName}
          universityLocation={univLocation || undefined}
          calculateAverageRating={calculateAverageRating}
          calculateCategoryAverages={calculateCategoryAverages}
        />

        {/* Right side - Review Listings */}
        <ReviewsList
          universityName={universityName}
          dorm={dorm}
          reviews={reviews}
          reviewsLoading={reviewsLoading}
          visibleReviews={visibleReviews}
          visibleCount={visibleCount}
          reviewsPerLoad={reviewsPerLoad}
          calculateOverallRating={calculateOverallRating}
          getRatingClass={getRatingClass}
          formatReviewTime={formatReviewTime}
          openLightbox={openLightbox}
          handleLoadMore={handleLoadMore}
        />
      </div>

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
            alt="Full size"
            className="lightbox-image"
            onClick={(e) => e.stopPropagation()}
          />
          <button className="lightbox-arrow lightbox-arrow-right" onClick={(e) => { e.stopPropagation(); nextImage(); }}>›</button>
          <div className="lightbox-counter">{currentImageIndex + 1} / {currentImages.length}</div>
        </div>
      )}

      <Footer />
    </div>
  );
}

export default Dorms;