import { Link } from 'react-router-dom';

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

interface ReviewsListProps {
  universityName: string | undefined;
  dorm: APIDorm;
  reviews: any[];
  reviewsLoading: boolean;
  currentReviews: any[];
  currentPage: number;
  totalPages: number;
  reviewsPerPage: number;
  calculateOverallRating: (review: any) => number;
  getRatingClass: (rating: number) => string;
  formatReviewTime: (createdAt: string) => string;
  openLightbox: (images: string[], index: number) => void;
  handlePrevPage: () => void;
  handleNextPage: () => void;
  handlePageClick: (pageNumber: number) => void;
  getPageNumbers: () => number[];
}

function ReviewsList({
  universityName,
  dorm,
  reviews,
  reviewsLoading,
  currentReviews,
  currentPage,
  totalPages,
  reviewsPerPage,
  calculateOverallRating,
  getRatingClass,
  formatReviewTime,
  openLightbox,
  handlePrevPage,
  handleNextPage,
  handlePageClick,
  getPageNumbers
}: ReviewsListProps) {
  return (
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
              <div className="review-header">
                <div className="review-overall-rating">
                  <span className={`overall-rating-number ${getRatingClass(calculateOverallRating(review))}`}>
                    {calculateOverallRating(review).toFixed(1)}
                  </span>
                  <span className="rating-label">RATING</span>
                </div>
                <div className="review-metadata">
                  <span>Year: {review.year}</span>
                  <span>Room Type: {review.roomType.charAt(0).toUpperCase() + review.roomType.slice(1)}</span>
                  {review.createdAt && <span className="review-time">{formatReviewTime(review.createdAt)}</span>}
                </div>
              </div>
              <div className="review-content">
                <p className="review-description">{review.description}</p>
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
          </div>
          
          <button 
            className="pagination-button" 
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

export default ReviewsList;
