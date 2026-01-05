import { useEffect, useState } from 'react';
import NavBar from '../NavBarPages/navbar.tsx';
import Footer from '../homepage/footer.tsx';
import DormInfo from './DormInfo.tsx';
import ReviewsList from './ReviewsList.tsx';
import './dorms.css';
import '../NavBarPages/navbar.css';
import { useParams } from 'react-router-dom';


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
const API_BASE = (import.meta as any).env?.VITE_API_BASE || 'http://localhost:3000';

// Main component for Dorm Page
function Dorms() {
  const { universityName, dormSlug } = useParams();
  const [dorm, setDorm] = useState<APIDorm | null>(null);
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
        
        // Fetch all dorms for this university and find the matching one
        const response = await fetch(`${API_BASE}/api/universities/${encodeURIComponent(universityName!)}/dorms`);
        if (!response.ok) throw new Error('Failed to fetch dorm data');
        
        const dorms: APIDorm[] = await response.json();
        const matchedDorm = dorms.find(d => d.slug === dormSlug);
        
        if (!matchedDorm) throw new Error('Dorm not found');
        
        setDorm(matchedDorm);
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
  const [currentPage, setCurrentPage] = useState(1);
  const reviewsPerPage = 10;

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
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    const minutes = Math.floor(diffInSeconds / 60);
    if (diffInSeconds < 3600) return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
    const hours = Math.floor(diffInSeconds / 3600);
    if (diffInSeconds < 86400) return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    const days = Math.floor(diffInSeconds / 86400);
    if (diffInSeconds < 604800) return `${days} ${days === 1 ? 'day' : 'days'} ago`;
    const weeks = Math.floor(diffInSeconds / 604800);
    if (diffInSeconds < 2592000) return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
    const months = Math.floor(diffInSeconds / 2592000);
    if (diffInSeconds < 31536000) return `${months} ${months === 1 ? 'month' : 'months'} ago`;
    const years = Math.floor(diffInSeconds / 31536000);
    return `${years} ${years === 1 ? 'year' : 'years'} ago`;
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

  // Pagination logic
  const indexOfLastReview = currentPage * reviewsPerPage;
  const indexOfFirstReview = indexOfLastReview - reviewsPerPage;
  const currentReviews = reviews.slice(indexOfFirstReview, indexOfLastReview);
  const totalPages = Math.ceil(reviews.length / reviewsPerPage);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePageClick = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 10;
    
    if (totalPages <= maxPagesToShow) {
      // Show all pages if total is 10 or less
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show first 10 pages, then "Next" button
      const endPage = Math.min(currentPage + 9, totalPages);
      for (let i = currentPage; i <= endPage && pages.length < maxPagesToShow; i++) {
        pages.push(i);
      }
    }
    
    return pages;
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
    return (
      <div className="dorm-page">
        <NavBar />
        <div className="dorm-content">
          <p>Loading dorm details...</p>
        </div>
        <Footer />
      </div>
    );
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
          calculateAverageRating={calculateAverageRating}
          calculateCategoryAverages={calculateCategoryAverages}
        />

        {/* Right side - Review Listings */}
        <ReviewsList 
          universityName={universityName}
          dorm={dorm}
          reviews={reviews}
          reviewsLoading={reviewsLoading}
          currentReviews={currentReviews}
          currentPage={currentPage}
          totalPages={totalPages}
          reviewsPerPage={reviewsPerPage}
          calculateOverallRating={calculateOverallRating}
          getRatingClass={getRatingClass}
          formatReviewTime={formatReviewTime}
          openLightbox={openLightbox}
          handlePrevPage={handlePrevPage}
          handleNextPage={handleNextPage}
          handlePageClick={handlePageClick}
          getPageNumbers={getPageNumbers}
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