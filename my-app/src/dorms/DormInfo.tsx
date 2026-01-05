import { Link } from 'react-router-dom';
import Star from '@mui/icons-material/Star';
import StarHalf from '@mui/icons-material/StarHalf';
import StarBorder from '@mui/icons-material/StarBorder';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

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
  universityName?: string;
  calculateAverageRating: () => number;
  calculateCategoryAverages: () => {
    room: number;
    bathroom: number;
    building: number;
    amenities: number;
    location: number;
  };
}

function DormInfo({ dorm, reviews, universityName, calculateAverageRating, calculateCategoryAverages }: DormInfoProps) {
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

  const getWouldDormAgainPercentage = () => {
    if (reviews.length === 0) return 0;
    const yesCount = reviews.filter(r => r.wouldDormAgain === true).length;
    return Math.round((yesCount / reviews.length) * 100);
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
      </div>

      {/* Description Section */}
      {dorm.description && (
        <div className="dorm-details">
          <h2>About</h2>
          <p>{dorm.description}</p>
        </div>
      )}

      {/* Average Ratings Section - New Layout */}
      {reviews.length > 0 && (
        <div className="dorm-details">
          <div className="ratings-container">
            {/* Left side - Category Ratings */}
            <div className="rating-distribution">
              {[
                { label: 'Room', value: calculateCategoryAverages().room },
                { label: 'Bathroom', value: calculateCategoryAverages().bathroom },
                { label: 'Building', value: calculateCategoryAverages().building },
                { label: 'Amenities', value: calculateCategoryAverages().amenities },
                { label: 'Location', value: calculateCategoryAverages().location },
              ].map((item) => {
                const percentage = (item.value / 5) * 100;
                return (
                  <div key={item.label} className="distribution-item">
                    <div className="distribution-label">
                      <span>{item.label}</span>
                      <span className="distribution-count">{item.value.toFixed(1)}</span>
                    </div>
                    <div className="distribution-bar">
                      <div 
                        className="distribution-fill" 
                        style={{ width: `${percentage}%` }}
                      ></div>
                      <span className="distribution-percentage">{Math.round(percentage)}%</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right side - Would Dorm Again & Average Rating */}
            <div className="ratings-summary">
              <Link 
                to={`/review?university=${encodeURIComponent(universityName || '')}&dorm=${encodeURIComponent(dorm.name)}`} 
                className="leave-review-button"
              >
                Leave Review
              </Link>
              
              <div className="would-dorm-again-box">
                <div className="would-dorm-percentage-large">
                  {getWouldDormAgainPercentage()}%
                  <CheckCircleIcon className="checkmark-icon" />
                </div>
                <span className="would-dorm-text">Would Dorm Again</span>
              </div>
              
              <div className="average-rating-box">
                <span className="average-rating-label">Average Rating: <strong>{calculateAverageRating().toFixed(1)}</strong></span>
                <div className="stars-display">
                  {renderStars(calculateAverageRating())}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DormInfo;
