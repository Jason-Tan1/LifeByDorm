import { Link } from 'react-router-dom';
import { useState } from 'react';
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
  const [showMap, setShowMap] = useState(false);

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
        src={dorm.imageUrl && dorm.imageUrl.trim() !== '' ? dorm.imageUrl : '/src/assets/Default_Dorm.png'} 
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
      {/* Location Section */}
      <div className="dorm-details">
        <div className="location-header">
        </div>
        
        <div className="map-container">
          {!showMap ? (
            <div className="map-placeholder">
              <button 
                onClick={() => setShowMap(true)} 
                className="view-location-btn"
              >
                View Location
              </button>
            </div>
          ) : (
            <>
              <iframe
                width="100%"
                height="300"
                style={{ border: 0, borderRadius: '8px' }}
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
                src={`https://www.google.com/maps/embed/v1/place?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''}&q=${encodeURIComponent((dorm.name || '') + ', ' + (universityName || ''))}`}
              ></iframe>
              {!import.meta.env.VITE_GOOGLE_MAPS_API_KEY && (
                 <p style={{fontSize: '0.8em', color: '#666', marginTop: '8px'}}>
                   Note: Map requires VITE_GOOGLE_MAPS_API_KEY in .env
                 </p>
              )}
            </>
          )}
        </div>
      </div>

    </div>
  );
}

export default DormInfo;
