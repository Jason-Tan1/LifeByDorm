import Star from '@mui/icons-material/Star';
import { useTranslation } from 'react-i18next';

const UpArrowIcon = ({ active }: { active: boolean }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
    <path d="M12 4 L4 12 h5 v8 h6 v-8 h5 Z" />
  </svg>
);

const DownArrowIcon = ({ active }: { active: boolean }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
    <path d="M12 20 L4 12 h5 v-8 h6 v8 h5 Z" />
  </svg>
);

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
  handleVote: (reviewId: string, type: 'upvote' | 'downvote') => void;
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
  handleLoadMore,
  handleVote
}: ReviewsListProps) {
  const { t } = useTranslation();
  const totalReviews = reviews.length;
  const hasMoreReviews = visibleCount < totalReviews;

  let currentUserId = '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (token) {
    try {
      currentUserId = JSON.parse(atob(token.split('.')[1])).userId;
    } catch (e) { }
  }

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
                      <span>{t('dorms.year')}: {Array.isArray(review.year) ? review.year.map((y: number) => y > 10 ? y : ['', t('dorms.years.1'), t('dorms.years.2'), t('dorms.years.3'), t('dorms.years.4'), t('dorms.years.5')][y]).join(', ') : review.year}</span>
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

                <div className="review-footer-actions">
                  <div className="review-votes-container reddit-style">
                    <button
                      className={`vote-action-btn upvote ${review.upvotes?.includes(currentUserId) ? 'active' : ''}`}
                      onClick={() => handleVote(review._id, 'upvote')}
                      aria-label="Upvote review"
                    >
                      <UpArrowIcon active={!!review.upvotes?.includes(currentUserId)} />
                    </button>
                    <span className={`vote-action-count ${review.upvotes?.includes(currentUserId) ? 'upvoted' : review.downvotes?.includes(currentUserId) ? 'downvoted' : ''}`}>
                      {Math.max(0, (review.upvotes?.length || 0) - (review.downvotes?.length || 0))}
                    </span>
                    <button
                      className={`vote-action-btn downvote ${review.downvotes?.includes(currentUserId) ? 'active' : ''}`}
                      onClick={() => handleVote(review._id, 'downvote')}
                      aria-label="Downvote review"
                    >
                      <DownArrowIcon active={!!review.downvotes?.includes(currentUserId)} />
                    </button>
                  </div>
                </div>
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
