import { useEffect, useRef, useState } from 'react';
import Star from '@mui/icons-material/Star';
import { Link } from 'react-router-dom';
import DefaultDorm from '../../assets/Default_Dorm.webp';

export type RecentVerifiedReview = {
  _id: string;
  university: string;
  dorm: string;
  universitySlug: string;
  universityName?: string;
  dormSlug: string;
  dormImageUrl?: string | null;
  description: string;
  createdAt: string;
  verified: boolean;
  room: number;
  bathroom: number;
  building: number;
  amenities: number;
  location: number;
  user?: string;
  userInitial?: string;
};

type RecentReviewsSectionProps = {
  isLoading: boolean;
  recentVerifiedReviews: RecentVerifiedReview[];
};

function RecentReviewsSection({ isLoading, recentVerifiedReviews }: RecentReviewsSectionProps) {
  const [scrollPosition, setScrollPosition] = useState(0);
  const sliderRef = useRef<HTMLDivElement | null>(null);

  const scrollRecentReviews = (direction: 'left' | 'right') => {
    const container = sliderRef.current;
    if (!container) return;

    const firstCard = (container.querySelector('.recent-review-slider-card') || container.firstElementChild) as HTMLElement;
    if (!firstCard) return;

    const style = window.getComputedStyle(container);
    const gap = parseFloat(style.gap) || 20;
    const itemWidth = firstCard.offsetWidth + gap;
    const currentScroll = container.scrollLeft;
    const tolerance = 5;

    let newPosition;
    if (direction === 'right') {
      const nextIndex = Math.floor((currentScroll + tolerance) / itemWidth) + 1;
      newPosition = nextIndex * itemWidth;
    } else {
      const prevIndex = Math.ceil((currentScroll - tolerance) / itemWidth) - 1;
      newPosition = Math.max(0, prevIndex * itemWidth);
    }

    const maxScroll = container.scrollWidth - container.clientWidth;
    if (newPosition > maxScroll) newPosition = maxScroll;

    container.scrollTo({ left: newPosition, behavior: 'smooth' });
    setScrollPosition(newPosition);
  };

  useEffect(() => {
    const slider = sliderRef.current;
    if (!slider) return;

    const onScroll = () => setScrollPosition(slider.scrollLeft);
    slider.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      slider.removeEventListener('scroll', onScroll);
    };
  }, []);

  const getRatingClass = (rating: number): string => {
    if (rating >= 4.0) return 'rating-high';
    if (rating >= 3.0) return 'rating-medium';
    return 'rating-low';
  };

  const calculateReviewRating = (review: RecentVerifiedReview) => {
    const ratings = [review.room, review.bathroom, review.building, review.amenities, review.location];
    return ratings.reduce((sum, value) => sum + value, 0) / ratings.length;
  };

  const getAvatarColor = (identifier: string) => {
    const colors = [
      '#EF4444',
      '#F97316',
      '#F59E0B',
      '#84CC16',
      '#10B981',
      '#06B6D4',
      '#3B82F6',
      '#6366F1',
      '#8B5CF6',
      '#D946EF',
      '#F43F5E'
    ];
    let hash = 0;
    for (let i = 0; i < identifier.length; i++) {
      hash = identifier.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  const formatUniversityName = (name: string) => {
    if (!name) return '';
    return name.replace(/-/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
  };

  const truncateDormName = (name: string, maxLength = 26) => {
    if (!name) return '';
    return name.length > maxLength ? `${name.slice(0, maxLength).trimEnd()}...` : name;
  };

  return (
    <div className="featured-container" style={{ marginTop: '40px' }}>
      <div className="featured-header">
        <h2 className="featured-title">Recent reviews</h2>
        <div className="slider-controls">
          <button
            className="slider-button slider-button-left"
            onClick={() => scrollRecentReviews('left')}
            disabled={scrollPosition === 0}
            aria-label="Previous reviews"
          >
            ‹
          </button>
          <button
            className="slider-button slider-button-right"
            onClick={() => scrollRecentReviews('right')}
            aria-label="Next reviews"
          >
            ›
          </button>
        </div>
      </div>

      <div className="recent-reviews-content-pad">
        {isLoading ? (
          <div className="slider-wrapper recent-reviews-slider-wrapper" ref={sliderRef}>
            {Array.from({ length: 8 }).map((_, index) => (
              <div
                key={index}
                className="recent-review-slider-card recent-review-skeleton-card animate-pulse rounded-2xl border border-[#d8d5ce] bg-white"
              />
            ))}
          </div>
        ) : recentVerifiedReviews.length === 0 ? (
          <p className="rounded-2xl border border-[#d8d5ce] bg-white px-5 py-8 text-center text-[#565656]">
            No verified reviews available yet.
          </p>
        ) : (
          <div className="slider-wrapper recent-reviews-slider-wrapper" ref={sliderRef}>
            {recentVerifiedReviews.map((review) => {
              const rating = calculateReviewRating(review);
              const ratingClass = getRatingClass(rating);
              const avatarSource = String(review.userInitial || review.user || '').trim();
              const avatarInitial = (avatarSource.match(/[A-Za-z0-9]/)?.[0] || 'A').toUpperCase();

              return (
                <Link
                  key={review._id}
                  to={`/universities/${review.universitySlug}/dorms/${review.dormSlug}`}
                  className="recent-review-slider-card recent-review-link-card group flex flex-col overflow-hidden rounded-[18px] border border-[#d1cdc5] bg-white transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex items-start gap-3 px-4 pt-3">
                    <div
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-lg font-bold text-white shadow-sm"
                      style={{ backgroundColor: getAvatarColor(review._id) }}
                    >
                      {avatarInitial}
                    </div>

                    <div className="review-overall-rating">
                      <span className={`overall-rating-badge ${ratingClass}`}>
                        <Star className="rating-star-icon" />
                        {rating.toFixed(1)}
                      </span>
                    </div>
                  </div>

                  <div className="px-4 pb-3 pt-2">
                    <p className="text-[1.02rem] leading-[1.35] text-[#343434]">
                      {review.description.length > 185 ? `${review.description.slice(0, 185)}...` : review.description}
                    </p>
                  </div>

                  <div className="mt-auto flex items-center gap-3 border-t border-[#dedad3] bg-[#f9f8f6] px-4 py-2.5">
                    <img
                      src={review.dormImageUrl || DefaultDorm}
                      alt="Dorm thumbnail"
                      className="h-10 w-10 rounded-[10px] border border-[#d9d5ce] object-cover"
                      loading="lazy"
                      onError={(event) => {
                        event.currentTarget.onerror = null;
                        event.currentTarget.src = DefaultDorm;
                      }}
                    />
                    <div className="min-w-0">
                      <p className="truncate text-[0.98rem] font-semibold text-[#2f2f2f]" title={review.dorm}>
                        {truncateDormName(review.dorm)}
                      </p>
                      <p className="truncate text-[0.94rem] text-[#6a6966]">
                        {formatUniversityName(review.universityName || review.university)}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default RecentReviewsSection;
