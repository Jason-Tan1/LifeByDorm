import { useEffect, useRef, useState } from 'react';
import Star from '@mui/icons-material/Star';
import { Link } from 'react-router-dom';
import DefaultDorm from '../../assets/Default_Dorm.webp';
import SkeletonCard from '../../components/SkeletonCard';

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
      const nextIndex = Math.floor((currentScroll + tolerance) / itemWidth) + 2;
      newPosition = nextIndex * itemWidth;
    } else {
      const prevIndex = Math.ceil((currentScroll - tolerance) / itemWidth) - 2;
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
        <h2 className="featured-title">Recent Reviews</h2>
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

      <div className="slider-wrapper recent-reviews-slider-wrapper" ref={sliderRef}>
        {isLoading ? (
          Array.from({ length: 8 }).map((_, index) => (
            <div
              key={index}
              className="recent-review-slider-card"
            >
              <SkeletonCard showRating={true} imageHeight={180} />
            </div>
          ))
        ) : recentVerifiedReviews.length === 0 ? (
          <p className="col-span-full rounded-xl border border-[#e0e0e0] bg-[#f8f8f8] px-5 py-8 text-center text-[#565656]">
            No verified reviews available yet.
          </p>
        ) : (
          recentVerifiedReviews.map((review) => {
            const rating = calculateReviewRating(review);
            const avatarSource = String(review.userInitial || review.user || '').trim();
            const avatarInitial = (avatarSource.match(/[A-Za-z0-9]/)?.[0] || 'A').toUpperCase();

            return (
              <Link
                key={review._id}
                to={`/universities/${review.universitySlug}/dorms/${review.dormSlug}`}
                className="recent-review-slider-card group flex flex-col overflow-hidden rounded-xl border border-[#e0e0e0] bg-white transition-all duration-300 ease-in-out hover:-translate-y-2 hover:shadow-[0_12px_24px_rgba(0,0,0,0.1)]"
              >
                <div className="flex items-center justify-between px-4 pt-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[1.05rem] font-bold text-white shadow-sm"
                      style={{ backgroundColor: getAvatarColor(review._id) }}
                    >
                      {avatarInitial}
                    </div>
                    
                    <div className="flex flex-col">
                      <span className="text-[0.8rem] font-bold uppercase tracking-wider text-[#7a7a7a]">
                        Verified
                      </span>
                      <span className="text-[0.75rem] text-[#9a9a9a]">Student Review</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 rounded-full border border-[#ebebeb] bg-[#fafafa] px-2.5 py-1 text-[0.95rem] font-semibold text-[#444444]">
                    <Star style={{ color: '#FFB800', fontSize: '1.2rem' }} />
                    {rating.toFixed(1)}
                  </div>
                </div>

                <div className="px-5 pb-4 pt-4">
                  <p className="line-clamp-4 text-[0.98rem] leading-[1.5] text-[#4a4a4a]">
                    {review.description}
                  </p>
                </div>

                <div className="mt-auto flex items-center gap-3 border-t border-[#e0e0e0] bg-[#f8f8f8] px-4 py-3">
                  <img
                    src={review.dormImageUrl || DefaultDorm}
                    alt="Dorm thumbnail"
                    className="h-[42px] w-[42px] rounded-lg border border-[#d9d5ce] object-cover"
                    loading="lazy"
                    onError={(event) => {
                      event.currentTarget.onerror = null;
                      event.currentTarget.src = DefaultDorm;
                    }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[0.95rem] font-bold text-[#2f2f2f]" title={review.dorm}>
                      {truncateDormName(review.dorm)}
                    </p>
                    <p className="truncate text-[0.88rem] text-[#6a6966]">
                      {formatUniversityName(review.universityName || review.university)}
                    </p>
                  </div>
                  
                  <div className="pb-[2px] text-[1.3rem] text-[#b0b0b0] transition-colors group-hover:text-[#6a6966]">
                    ›
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}

export default RecentReviewsSection;
