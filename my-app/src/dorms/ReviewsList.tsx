import Star from '@mui/icons-material/Star';
import { useTranslation } from 'react-i18next';

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
  visibleReviews: any[];
  visibleCount: number;
  reviewsPerLoad: number;
  calculateOverallRating: (review: any) => number;
  getRatingClass: (rating: number) => string;
  formatReviewTime: (createdAt: string) => string;
  openLightbox: (images: string[], index: number) => void;
  handleLoadMore: () => void;
}

function ReviewsList({
  // universityName, (Removed unused)
  // dorm, (Removed unused)
  reviews,
  reviewsLoading,
  visibleReviews,
  visibleCount,
  // reviewsPerLoad, (Removed unused)
  calculateOverallRating,
  getRatingClass,
  formatReviewTime,
  openLightbox,
  handleLoadMore
}: ReviewsListProps) {
  const { t } = useTranslation();
  const totalReviews = reviews.length;
  const hasMoreReviews = visibleCount < totalReviews;

  return (
    <div className="reviews-list">
      {reviewsLoading ? (
        <p>{t('dorms.loading')}</p>
      ) : reviews.length === 0 ? (
        <p>{t('dorms.noReviews')}</p>
      ) : (
        <>
          <div className="reviews-grid">
            {visibleReviews.map(review => (
              <div key={review._id} className="review-card">
                <div className="review-header">
                  <div className="review-overall-rating">
                    <span className={`overall-rating-badge ${getRatingClass(calculateOverallRating(review))}`}>
                      <Star className="rating-star-icon" />
                      {calculateOverallRating(review).toFixed(1)}
                    </span>
                  </div>
                  <div className="review-metadata">
                    <div className="review-metadata-row">
                      {review.createdAt && <span className="review-time">{formatReviewTime(review.createdAt)}</span>}
                      {review.verified && <span className="verified-badge">✓ {t('dorms.verifiedStudent')}</span>}
                    </div>
                    <div className="review-metadata-row">
                      <span>{t('dorms.year')}: {Array.isArray(review.year) ? review.year.map((y: number) => ['', t('dorms.years.1'), t('dorms.years.2'), t('dorms.years.3'), t('dorms.years.4'), t('dorms.years.5')][y]).join(', ') : review.year}</span>
                      <span>{t('dorms.roomType')}: {Array.isArray(review.roomType) ? review.roomType.map((r: string) => r.charAt(0).toUpperCase() + r.slice(1)).join(', ') : (review.roomType?.charAt(0).toUpperCase() + review.roomType?.slice(1))}</span>
                      <span>{t('dorms.wouldDormAgain')}: {review.wouldDormAgain ? t('common.yes') : t('common.no')}</span>
                    </div>
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

          {/* Load More Button */}
          {hasMoreReviews && (
            <div className="load-more-container">
              <button
                className="load-more-button"
                onClick={handleLoadMore}
              >
                {t('dorms.loadMore')}
              </button>
              <span className="load-more-hint">
                {t('dorms.moreRemaining', { count: totalReviews - visibleCount })}
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default ReviewsList;
