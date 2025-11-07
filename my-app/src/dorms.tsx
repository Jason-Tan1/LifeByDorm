import React from 'react';
import NavBar from './navbar.tsx';
import './dorms.css';
import './navbar.css';

function Dorms() {
  const dormData = {
    name: "Founders Residence",
    rating: 4.3,
    reviews: 42,
    address: "123 Example Road, Toronto, ON M3J 1P3",
    imageUrl: "/images/founders-main.jpg",
    description: "Founders Residence is a modern student housing facility offering comfortable living spaces with excellent amenities. Located in the heart of campus, it provides easy access to academic buildings and student facilities.",
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
    },
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

          <div className="dorm-description">
            <p>{dormData.description}</p>
          </div>

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
                <span>Distance</span>
                <p>{dormData.details.distanceToCampus}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Review Listings */}
        <div className="reviews-list">
          <h2>Student Reviews</h2>
          <div className="reviews-grid">
            {reviews.map(review => (
              <div key={review.id} className="review-card">
                <div className="review-info">
                  <h3>{review.user}</h3>
                  <div className="review-details">
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