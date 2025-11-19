import { useEffect, useState } from 'react';
import NavBar from './NavBarPages/navbar.tsx';
import Footer from './homepage/footer';
import './dorms.css';
import './NavBarPages/navbar.css';
import { Link, useParams } from 'react-router-dom';

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

  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating - fullStars >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    return "★".repeat(fullStars) + (hasHalfStar ? "⯨" : "") + "☆".repeat(emptyStars);
  };

  const calculateOverallRating = (review: any) => {
    const ratings = [review.room, review.bathroom, review.building, review.amenities, review.location];
    return ratings.reduce((acc, rating) => acc + rating, 0) / ratings.length;
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
        <div className="dorm-info">
          <img 
            src={dorm.imageUrl && dorm.imageUrl.trim() !== '' ? dorm.imageUrl : 'https://thumbs.dreamstime.com/b/college-dorm-ai-generated-stock-image-college-dorm-bunk-bed-bed-above-desk-window-generated-276344540.jpg'} 
            alt={dorm.name} 
            className="dorm-main-image"
          />
          
          <div className="dorm-header">
            <h1>{dorm.name}</h1>
            <div className="dorm-rating">
              <div className="stars" title={calculateAverageRating().toString()}>
                {renderStars(calculateAverageRating())}
              </div>
              <span className="rating-number">
                {calculateAverageRating().toFixed(1)} ({reviews.length} reviews)
              </span>
            </div>
          </div>

          {/* Description Section */}
          {dorm.description && (
            <div className="dorm-details">
              <h2>About</h2>
              <p>{dorm.description}</p>
            </div>
          )}

          {/* Average Ratings by Category */}
          {reviews.length > 0 && (
            <div className="dorm-details">
              <h2>Average Ratings</h2>
              <div className="category-ratings">
                <div className="category-rating-item">
                  <span className="category-label">Room</span>
                  <div className="category-rating-bar">
                    <div className="category-rating-fill" style={{ width: `${(calculateCategoryAverages().room / 5) * 100}%` }}></div>
                  </div>
                  <span className="category-rating-value">{calculateCategoryAverages().room.toFixed(1)}</span>
                </div>
                <div className="category-rating-item">
                  <span className="category-label">Bathroom</span>
                  <div className="category-rating-bar">
                    <div className="category-rating-fill" style={{ width: `${(calculateCategoryAverages().bathroom / 5) * 100}%` }}></div>
                  </div>
                  <span className="category-rating-value">{calculateCategoryAverages().bathroom.toFixed(1)}</span>
                </div>
                <div className="category-rating-item">
                  <span className="category-label">Building</span>
                  <div className="category-rating-bar">
                    <div className="category-rating-fill" style={{ width: `${(calculateCategoryAverages().building / 5) * 100}%` }}></div>
                  </div>
                  <span className="category-rating-value">{calculateCategoryAverages().building.toFixed(1)}</span>
                </div>
                <div className="category-rating-item">
                  <span className="category-label">Amenities</span>
                  <div className="category-rating-bar">
                    <div className="category-rating-fill" style={{ width: `${(calculateCategoryAverages().amenities / 5) * 100}%` }}></div>
                  </div>
                  <span className="category-rating-value">{calculateCategoryAverages().amenities.toFixed(1)}</span>
                </div>
                <div className="category-rating-item">
                  <span className="category-label">Location</span>
                  <div className="category-rating-bar">
                    <div className="category-rating-fill" style={{ width: `${(calculateCategoryAverages().location / 5) * 100}%` }}></div>
                  </div>
                  <span className="category-rating-value">{calculateCategoryAverages().location.toFixed(1)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right side - Review Listings */}
        <div className="reviews-list">
          <h2>Student Reviews 
            <Link to={`/review?university=${encodeURIComponent(universityName || '')}&dorm=${encodeURIComponent(dorm.name)}`} className="review-button">
              Leave Review
            </Link>
          </h2>
          {reviewsLoading ? (
            <p>Loading reviews...</p>
          ) : reviews.length === 0 ? (
            <p>No reviews yet. Be the first to leave a review!</p>
          ) : (
            <div className="reviews-grid">
              {currentReviews.map(review => (
                <div key={review._id} className="review-card">
                  <div className="review-info">
                    <div className="review-overall-rating">
                      <span className="overall-rating-number">{calculateOverallRating(review).toFixed(1)}</span>
                      <span className="review-stars">{renderStars(calculateOverallRating(review))}</span>
                    </div>
                    <div className="review-details">
                      <p className="review-description">{review.description}</p>
                      <div className="review-metadata">
                        <span>Year: {review.year}</span>
                        <span>Room Type: {review.roomType}</span>
                      </div>
                    </div>            
                  </div>
                  {review.images && review.images.length > 0 ? (
                    <div className="review-images-gallery">
                      {review.images.slice(0, 3).map((img: string, idx: number) => (
                        <div 
                          key={idx} 
                          className="review-gallery-image-wrapper"
                          onClick={() => openLightbox(review.images, idx)}
                        >
                          <img src={img} alt={`Dorm ${idx + 1}`} className="review-gallery-image" />
                          {idx === 2 && review.images.length > 3 && (
                            <div className="review-image-overlay">
                              +{review.images.length - 3} more
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : review.fileImage ? (
                    <img 
                      src={review.fileImage} 
                      alt="Dorm" 
                      className="review-image"
                      onClick={() => openLightbox([review.fileImage], 0)}
                    />
                  ) : null}
                </div>
              ))}
            </div>
          )}
          
          {/* Pagination Controls */}
          {reviews.length > reviewsPerPage && (
            <div className="pagination-controls">
              <button 
                className="pagination-button" 
                onClick={handlePrevPage}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              
              <div className="pagination-numbers">
                {getPageNumbers().map(pageNum => (
                  <button
                    key={pageNum}
                    className={`pagination-number ${currentPage === pageNum ? 'active' : ''}`}
                    onClick={() => handlePageClick(pageNum)}
                  >
                    {pageNum}
                  </button>
                ))}
                {totalPages > 10 && currentPage + 9 < totalPages && (
                  <button 
                    className="pagination-button" 
                    onClick={handleNextPage}
                  >
                    Next
                  </button>
                )}
              </div>
              
              <button 
                className="pagination-button" 
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                style={{ visibility: totalPages > 10 && currentPage + 9 < totalPages ? 'hidden' : 'visible' }}
              >
                Next
              </button>
            </div>
          )}
        </div>
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