import React from 'react';
import NavBar from './NavBarPages/navbar.tsx';
import './dorms.css';
import './NavBarPages/navbar.css';
import { Link } from 'react-router-dom';

function Dorms() {
  const dormData = {
    name: "Founders Residence",
    rating: 4.3,
    reviews: 42,
    address: "91 Ottawa R, North York, ON M3J 1P3",
    imageUrl: "https://central.apps01.yorku.ca/maps/wp-content/uploads/2010/06/founders-res-1-copy.jpg",
    details: {
      yearBuilt: 2015,
      totalFloors: 5,
      capacity: 350,
      reviewTypes: ["Single", "Double", "Suite"],
      distanceToCampus: "5 minutes walking"
    },

  };

  
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

  return (
    <div className="dorm-page">
      <NavBar />
      
      <div className="dorm-content">
        {/* Left side - Dorm Information */}
        <div className="dorm-info">
          <img 
            src={dormData.imageUrl} 
            alt={dormData.name} 
            className="dorm-main-image"
          />
          
          <div className="dorm-header">
            <h1>{dormData.name}</h1>
            <div className="dorm-rating">
              <div className="stars" title={dormData.rating.toString()}>
                {renderStars(dormData.rating)}
              </div>
              <span className="rating-number">
                {dormData.rating.toFixed(1)} ({dormData.reviews} reviews)
              </span>
            </div>
            <p className="dorm-address">{dormData.address}</p>
          </div>

          {/* Building Details Section */}
          <div className="dorm-details">
            <h2>Building Details</h2>
            <div className="details-grid">
              <div className="detail-item">
                <span>Year Built</span>
                <p>{dormData.details.yearBuilt}</p>
              </div>
              <div className="detail-item">
                <span>Total Floors</span>
                <p>{dormData.details.totalFloors}</p>
              </div>
              <div className="detail-item">
                <span>Capacity</span>
                <p>{dormData.details.capacity} students</p>
              </div>
              <div className="detail-item">
                <span>Distance to Campus</span>
                <p>{dormData.details.distanceToCampus}</p>
              </div>
            </div>

            {/* Room Types Section */}
            <h2>Room Types Available</h2>
            <div className="room-types">
              <ul className="room-types-list">
                {dormData.details.reviewTypes.map((type, index) => (
                  <li key={index} className="room-type-item">{type}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Right side - Review Listings */}
        <div className="reviews-list">
          <h2>Student Reviews 
            <Link to="/review" className="review-button">
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