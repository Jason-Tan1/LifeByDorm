import { Link } from 'react-router-dom';
import { useState } from 'react';
import Star from '@mui/icons-material/Star';
import StarHalf from '@mui/icons-material/StarHalf';
import StarBorder from '@mui/icons-material/StarBorder';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HomeIcon from '@mui/icons-material/Home';
import DefaultDorm from '../../assets/Default_Dorm.webp';
import CompareCard from '../../components/CompareCard/CompareCard';

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
  aiSummary?: string;
  aiTags?: string[];
  images?: string[];
};

interface DormInfoProps {
  dorm: APIDorm;
  reviews: any[];
  universityName?: string;
  universityLocation?: string;
  calculateAverageRating: () => number;
  calculateCategoryAverages: () => {
    room: number;
    bathroom: number;
    building: number;
    amenities: number;
    location: number;
  };
  onOpenCompare: () => void;
  openLightbox: (images: string[], index: number) => void;
  onShowAllPhotos: (photos: string[]) => void;
  onAddPhotosClick: () => void;
}

function DormInfo({ dorm, reviews, universityName, universityLocation, calculateAverageRating, calculateCategoryAverages, onOpenCompare, openLightbox, onShowAllPhotos, onAddPhotosClick }: DormInfoProps) {
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
      {/* Breadcrumbs */}
      <div className="dorm-breadcrumbs">
        <Link to="/" className="breadcrumb-home">
          <HomeIcon style={{ fontSize: '1.1rem' }} />
        </Link>
        <span className="breadcrumb-separator">›</span>
        <Link to={`/universities/${universityName}`}>
          {universityName?.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')} Dorms
        </Link>
        <span className="breadcrumb-separator">›</span>
        <span className="breadcrumb-current">{dorm.name}</span>
      </div>

      <div className="dorm-image-container">
        <img
          src={dorm.imageUrl && dorm.imageUrl.trim() !== '' ? dorm.imageUrl : DefaultDorm}
          alt={`Photo of ${dorm.name} residence${universityName ? ` at ${universityName.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}` : ''}`}
          className="dorm-main-image"
          loading="eager"
        />
        <div className="dorm-image-overlay"></div>
        <div className="dorm-header-content">
          <h1>{dorm.name}</h1>
          {universityLocation && <p className="dorm-location">{universityLocation}</p>}
        </div>
      </div>

      {/* Description Section */}
      {dorm.description && (
        <div className="dorm-details">
          <h2>About</h2>
          <p>{dorm.description}</p>
        </div>
      )}

      {/* Average Ratings Section - New Layout */}
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
              const hasReviews = reviews.length > 0;
              const percentage = hasReviews ? (item.value / 5) * 100 : 0;
              return (
                <div key={item.label} className="distribution-item">
                  <div className="distribution-label">
                    <span>{item.label}</span>
                    <span className="distribution-count">{hasReviews ? item.value.toFixed(1) : 'N/A'}</span>
                  </div>
                  <div className="distribution-bar">
                    <div
                      className="distribution-fill"
                      style={{ width: `${percentage}%` }}
                    ></div>

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
                {reviews.length > 0 ? `${getWouldDormAgainPercentage()}%` : 'N/A'}
                {reviews.length > 0 && <CheckCircleIcon className="checkmark-icon" />}
              </div>
              <span className="would-dorm-text">Would Dorm Again</span>
            </div>

            <div className="average-rating-box">
              <span className="average-rating-label">Average Rating: <strong>{reviews.length > 0 ? calculateAverageRating().toFixed(1) : 'N/A'}</strong></span>
              <div className="stars-display">
                {reviews.length > 0 ? renderStars(calculateAverageRating()) : renderStars(0)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Photo Gallery Section */}
      <div className="dorm-details photo-gallery-container">
        <div className="gallery-header">
          <h2>Photo Gallery</h2>
          <button className="add-photos-btn" onClick={onAddPhotosClick}>
            + Add Photos
          </button>
        </div>
        
        {(() => {
          const allPhotos = [...new Set([
            ...(dorm.images || []),
            ...reviews.flatMap(r => r.images || []),
            ...reviews.map(r => r.fileImage).filter(Boolean)
          ])];

          if (allPhotos.length === 0) {
            return (
              <p className="no-photos-text">No photos have been added yet. Be the first to share!</p>
            );
          }

          const displayPhotos = allPhotos.slice(0, 8);
          const hasMore = allPhotos.length > 8;

          return (
            <div className="photo-gallery-grid">
              {displayPhotos.map((photo, idx) => (
                <div
                  key={idx}
                  className={`gallery-thumbnail ${hasMore && idx === 7 ? 'has-more-overlay' : ''}`}
                  onClick={() => hasMore && idx === 7 ? onShowAllPhotos(allPhotos) : openLightbox(allPhotos, idx)}
                >
                  <img src={photo} alt={`Dorm photo ${idx + 1}`} loading="lazy" />
                  {hasMore && idx === 7 && (
                    <div className="more-photos-text">+{allPhotos.length - 8}</div>
                  )}
                </div>
              ))}
            </div>
          );
        })()}
      </div>

      {/* AI Summary Section */}
      {dorm.aiSummary && (
        <div className="dorm-details">
          <div className="ai-summary-card">
            <h2 className="ai-summary-header">AI Student Review Summary</h2>
            <p className="ai-summary-text">{dorm.aiSummary}</p>
            {dorm.aiTags && dorm.aiTags.length > 0 && (
              <div className="ai-summary-tags">
                {dorm.aiTags.map((tag, i) => (
                  <span key={i} className="ai-summary-tag">{tag}</span>
                ))}
              </div>
            )}
            <div className="ai-summary-footer">
              <span className="ai-summary-disclaimer">
                Based on {reviews.length} student review{reviews.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Compare Link */}
      <div className="dorm-details">
        <CompareCard onOpenCompare={onOpenCompare} />
      </div>

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
                <p style={{ fontSize: '0.8em', color: '#666', marginTop: '8px' }}>
                  Note: Map requires VITE_GOOGLE_MAPS_API_KEY in .env
                </p>
              )}
            </>
          )}
        </div>
      </div>

    </div >
  );
}

export default DormInfo;
