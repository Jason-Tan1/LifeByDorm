import { useEffect, useState } from 'react';
import NavBar from './NavBarPages/navbar.tsx';
import './dorms.css';
import './NavBarPages/navbar.css';
import { Link, useParams } from 'react-router-dom';

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

const API_BASE = (import.meta as any).env?.VITE_API_BASE || 'http://localhost:3000';

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

  
  const reviews = [
    {
      id: 1,
      user: "Jason Tan",
      description: "Blah Blah Blah",
      rateRoom: 1,
      rateBathroom: 2,
      rateBuilding: 3,
      rateAmenities: 4,
      rateLocation: 5,
      fileImage: "https://example.com/review1",
      year: 2022,
      roomType: "Single"
    },
    {
      id: 2,
      user: "John Doe",
      description: "Great location and amenities, but the rooms could be cleaner.",
      rateRoom: 3,
      rateBathroom: 4,
      rateBuilding: 4,
      rateAmenities: 5,
      rateLocation: 5,
      year: 2023,
      roomType: "Double"
    }
  ];

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
          <div className="reviews-grid">
            {reviews.map(review => (
              <div key={review.id} className="review-card">
                <div className="review-info">
                  <h3>{review.user}</h3>
                  <div className="review-details">
                    {/* Review Description */}
                    <p className="review-description">{review.description}</p>
                    
                    {/* Ratings */}
                    <div className="review-rating-group">
                      <div className="review-rating-item">
                        <span className="review-rating-label">Room</span>
                        <span className="review-stars">{renderStars(review.rateRoom)}</span>
                      </div>
                      <div className="review-rating-item">
                        <span className="review-rating-label">Bathroom</span>
                        <span className="review-stars">{renderStars(review.rateBathroom)}</span>
                      </div>
                      <div className="review-rating-item">
                        <span className="review-rating-label">Building</span>
                        <span className="review-stars">{renderStars(review.rateBuilding)}</span>
                      </div>
                      <div className="review-rating-item">
                        <span className="review-rating-label">Amenities</span>
                        <span className="review-stars">{renderStars(review.rateAmenities)}</span>
                      </div>
                      <div className="review-rating-item">
                        <span className="review-rating-label">Location</span>
                        <span className="review-stars">{renderStars(review.rateLocation)}</span>
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
        </div>
      </div>
    </div>
  );
}

export default Dorms;