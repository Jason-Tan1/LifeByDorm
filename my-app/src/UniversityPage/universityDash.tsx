import React from 'react';
import { Link } from 'react-router-dom';
import NavBar from '../NavBarPages/navbar';
import './universityDash.css';

interface Dorm {
  id: number;
  name: string;
  imageUrl: string;
  rating: number;
  reviews: number;
  description: string;
}

function UniversityDash() {
  const yorkUniversity = {
    name: "York University",
    description: "York University is a leading international teaching and research university and a driving force for positive change. York is empowering students, faculty, staff, and alumni to create positive change in their communities and the world.",
    founded: 1959,
    location: "Toronto, Ontario, Canada",
    totalStudents: 55000,
    acceptanceRate: 27,
    imageUrl: "https://www.yorku.ca/yfile/wp-content/uploads/sites/889/2023/08/aerial_ross-east.jpg",
    website: "https://www.yorku.ca",
    highlights: [
      "Over 55,000 students from 178 countries",
      "11 Faculties offering more than 200 programs",
      "Modern campus with state-of-the-art facilities",
      "Located in the heart of the Greater Toronto Area",
      "Strong focus on research and innovation"
    ]
  };

  const dorms: Dorm[] = [
    {
      id: 1,
      name: "Founders Residence",
      imageUrl: "https://www.yorku.ca/housing/wp-content/uploads/sites/57/2022/02/Founders-Exterior-1024x682.jpg",
      rating: 4.3,
      reviews: 21,
      description: "Traditional-style residence with single and double rooms, perfect for first-year students."
    },
    {
      id: 2,
      name: "Stong Residence",
      imageUrl: "https://central.apps01.yorku.ca/maps/wp-content/uploads/2010/06/stong-res-2-copy.jpg",
      rating: 4.0,
      reviews: 34,
      description: "Modern suite-style residence offering private bathrooms and shared kitchen facilities."
    }
  ];

  const renderStars = (rating: number) => {
    return "★".repeat(Math.floor(rating)) + "☆".repeat(5 - Math.floor(rating));
  };

  return (
    <div className="university-dash">
      <NavBar />
      
      <div className="university-content">
        {/* Left side - University Information */}
        <div className="university-info">
          <img 
            src={yorkUniversity.imageUrl} 
            alt={yorkUniversity.name} 
            className="university-main-image"
          />
          <h1>{yorkUniversity.name}</h1>
          <p className="university-description">{yorkUniversity.description}</p>
          
          <div className="university-stats">
            <div className="stat-item">
              <span className="stat-label">Founded</span>
              <span className="stat-value">{yorkUniversity.founded}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Total Students</span>
              <span className="stat-value">{yorkUniversity.totalStudents.toLocaleString()}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Acceptance Rate</span>
              <span className="stat-value">{yorkUniversity.acceptanceRate}%</span>
            </div>
          </div>

          <div className="university-highlights">
            <h2>University Highlights</h2>
            <ul>
              {yorkUniversity.highlights.map((highlight, index) => (
                <li key={index}>{highlight}</li>
              ))}
            </ul>
          </div>

          <a 
            href={yorkUniversity.website} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="university-website-link"
          >
            Visit University Website
          </a>
        </div>

        {/* Right side - Dorms List */}
        <div className="dorms-list">
          <h2>Available Residences</h2>
          <div className="dorms-grid">
            {dorms.map(dorm => (
              <div key={dorm.id} className="dorm-card">
                <img src={dorm.imageUrl} alt={dorm.name} className="dorm-image" />
                <div className="dorm-info">
                  <h3>{dorm.name}</h3>
                  <div className="dorm-rating">
                    <div className="stars" title={dorm.rating.toString()}>
                      {renderStars(dorm.rating)}
                    </div>
                    <span className="rating-number">
                      {dorm.rating.toFixed(1)} ({dorm.reviews} reviews)
                    </span>
                  </div>
                  <p className="dorm-description">{dorm.description}</p>
                  <div className="dorm-buttons">
                    <Link to="/dorms" className="view-dorm-button">
                      View Details
                    </Link>
                    <Link to="/review" className="review-button">
                      Leave Review
                    </Link>
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

export default UniversityDash;