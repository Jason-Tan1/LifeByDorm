import './SkeletonCard.css';

interface SkeletonCardProps {
    /** Whether to show the rating skeleton row */
    showRating?: boolean;
    /** Custom height for the image skeleton */
    imageHeight?: number;
}

/**
 * A skeleton loading card that mimics the structure of dorm/university cards.
 * Shows a shimmer animation while content is loading.
 */
export default function SkeletonCard({ showRating = true, imageHeight = 200 }: SkeletonCardProps) {
    return (
        <div className="skeleton-card">
            <div className="skeleton-image" style={{ height: imageHeight }} />
            <div className="skeleton-content">
                <div className="skeleton-title" />
                <div className="skeleton-text" />
                {showRating && (
                    <div className="skeleton-rating">
                        <div className="skeleton-star" />
                        <div className="skeleton-rating-text" />
                    </div>
                )}
            </div>
        </div>
    );
}

interface SkeletonGridProps {
    /** Number of skeleton cards to show */
    count?: number;
    /** Whether to show rating in each card */
    showRating?: boolean;
}

/**
 * A grid of skeleton cards for loading states.
 */
export function SkeletonGrid({ count = 6, showRating = true }: SkeletonGridProps) {
    return (
        <div className="skeleton-grid">
            {Array.from({ length: count }).map((_, index) => (
                <SkeletonCard key={index} showRating={showRating} />
            ))}
        </div>
    );
}

interface SkeletonSliderProps {
    /** Number of skeleton cards to show */
    count?: number;
}

/**
 * A horizontal slider of skeleton cards for loading states.
 */
export function SkeletonSlider({ count = 4 }: SkeletonSliderProps) {
    return (
        <div className="skeleton-slider">
            {Array.from({ length: count }).map((_, index) => (
                <SkeletonCard key={index} showRating={true} imageHeight={180} />
            ))}
        </div>
    );
}
