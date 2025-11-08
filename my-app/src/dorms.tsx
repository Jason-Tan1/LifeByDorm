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
    },
    {
      id: 2,
      user: "John Doe",
    },
    {
      id: 3,
      user: "Jane Smith",
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