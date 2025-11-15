import { useEffect, useState } from 'react';
import NavBar from './NavBarPages/navbar.tsx';
import './dorms.css';
import './NavBarPages/navbar.css';
import { Link, useParams } from 'react-router-dom';

//Define types for Dorm data from API (IMPORTANT)
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

//Base URL for API requests
const API_BASE = (import.meta as any).env?.VITE_API_BASE || 'http://localhost:3000';

// Main component for Dorm Page
function Dorms() {
  const { universityName, dormSlug } = useParams();
  const [dorm, setDorm] = useState<APIDorm | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!universityName || !dormSlug) return;
    
    async function fetchDorm() {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch all dorms for this university and find the matching one
        const response = await fetch(`${API_BASE}/api/universities/${encodeURIComponent(universityName!)}/dorms`);
        if (!response.ok) throw new Error('Failed to fetch dorm data');
        
        const dorms: APIDorm[] = await response.json();
        const matchedDorm = dorms.find(d => d.slug === dormSlug);
        
        if (!matchedDorm) throw new Error('Dorm not found');
        
        setDorm(matchedDorm);
      } catch (e: any) {
        setError(e?.message || 'Failed to load dorm');
      } finally {
        setLoading(false);
      }
    }

    fetchDorm();
  }, [universityName, dormSlug]);

  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  // Fetch reviews for this dorm
  useEffect(() => {
    if (!universityName || !dorm) return;
    
    const dormName = dorm.name; // Capture the name before async function
    
    async function fetchReviews() {
      try {
        setReviewsLoading(true);
        const response = await fetch(`${API_BASE}/api/reviews?university=${encodeURIComponent(universityName!)}&dorm=${encodeURIComponent(dormName)}`);
        if (!response.ok) throw new Error('Failed to fetch reviews');
        
        const data = await response.json();
        setReviews(data);
      } catch (e) {
        console.error('Error fetching reviews:', e);
        setReviews([]);
      } finally {
        setReviewsLoading(false);
      }
    }

    fetchReviews();
  }, [universityName, dorm]);

  const renderStars = (rating: number) => {
    return "★".repeat(Math.floor(rating)) + "☆".repeat(5 - Math.floor(rating));
  };

  if (loading) {
    return (
      <div className="dorm-page">
        <NavBar />
        <div className="dorm-content">
          <p>Loading dorm details...</p>
        </div>
      </div>
    );
  }

  if (error || !dorm) {
    return (
      <div className="dorm-page">
        <NavBar />
        <div className="dorm-content">
          <p>{error || 'Dorm not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dorm-page">
      <NavBar />
      
      <div className="dorm-content">
        {/* Left side - Dorm Information */}
        <div className="dorm-info">
          <img 
            src={dorm.imageUrl || ''} 
            alt={dorm.name} 
            className="dorm-main-image"
          />
          
          <div className="dorm-header">
            <h1>{dorm.name}</h1>
            <div className="dorm-rating">
              <div className="stars" title={(dorm.rating ?? 0).toString()}>
                {renderStars(dorm.rating ?? 0)}
              </div>
              <span className="rating-number">
                {(dorm.rating ?? 0).toFixed(1)} ({dorm.totalReviews ?? 0} reviews)
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

          {/* Amenities Section */}
          {dorm.amenities && dorm.amenities.length > 0 && (
            <div className="dorm-details">
              <h2>Amenities</h2>
              <ul className="room-types-list">
                {dorm.amenities.map((amenity, index) => (
                  <li key={index} className="room-type-item">{amenity}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Room Types Section */}
          {dorm.roomTypes && dorm.roomTypes.length > 0 && (
            <div className="dorm-details">
              <h2>Room Types Available</h2>
              <ul className="room-types-list">
                {dorm.roomTypes.map((type, index) => (
                  <li key={index} className="room-type-item">{type}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Right side - Review Listings */}
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
              {reviews.map(review => (
                <div key={review._id} className="review-card">
                  <div className="review-info">
                    <h3>{review.user || 'Anonymous'}</h3>
                    <div className="review-details">
                      {/* Review Description */}
                      <p className="review-description">{review.description}</p>
                      
                      {/* Ratings */}
                      <div className="review-rating-group">
                        <div className="review-rating-item">
                          <span className="review-rating-label">Room</span>
                          <span className="review-stars">{renderStars(review.room)}</span>
                        </div>
                        <div className="review-rating-item">
                          <span className="review-rating-label">Bathroom</span>
                          <span className="review-stars">{renderStars(review.bathroom)}</span>
                        </div>
                        <div className="review-rating-item">
                          <span className="review-rating-label">Building</span>
                          <span className="review-stars">{renderStars(review.building)}</span>
                        </div>
                        <div className="review-rating-item">
                          <span className="review-rating-label">Amenities</span>
                          <span className="review-stars">{renderStars(review.amenities)}</span>
                        </div>
                        <div className="review-rating-item">
                          <span className="review-rating-label">Location</span>
                          <span className="review-stars">{renderStars(review.location)}</span>
                        </div>
                      </div>

                      {/* Metadata */}
                      <div className="review-metadata">
                        <span>Year: {review.year}</span>
                        <span>Room Type: {review.roomType}</span>
                      </div>
                    </div>            
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dorms;