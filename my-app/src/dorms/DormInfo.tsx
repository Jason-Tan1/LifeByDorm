import Star from '@mui/icons-material/Star';
import StarHalf from '@mui/icons-material/StarHalf';
import StarBorder from '@mui/icons-material/StarBorder';

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

interface DormInfoProps {
  dorm: APIDorm;
  reviews: any[];
  calculateAverageRating: () => number;
  calculateCategoryAverages: () => {
    room: number;
    bathroom: number;
    building: number;
    amenities: number;
    location: number;
  };
}

function DormInfo({ dorm, reviews, calculateAverageRating, calculateCategoryAverages }: DormInfoProps) {
  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating - fullStars >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    return (
      <>
        {[...Array(fullStars)].map((_, i) => (
          <Star key={`full-${i}`} />
        ))}
        {hasHalfStar && <StarHalf key="half" />}
        {[...Array(emptyStars)].map((_, i) => (
          <StarBorder key={`empty-${i}`} />
        ))}
      </>
    );
  };

  return (
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
  );
}

export default DormInfo;
