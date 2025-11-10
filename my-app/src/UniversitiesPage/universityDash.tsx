import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import NavBar from '../NavBarPages/navbar';
import './universityDash.css';

interface Dorm {
  id: number;
  name: string;
  imageUrl: string;
  rating: number;
  reviews: number;
}

function UniversityDash() {
  const { universityName } = useParams();
  
  // Add console log to debug the URL parameter
  console.log('University Name from URL:', universityName);
  
  // University data mapping
  const universities = {
    'york-university': {
      name: "York University",
      founded: 1959,
      location: "Toronto, Ontario, Canada",
      totalStudents: 55000,
      acceptanceRate: 47,
      imageUrl: "https://www.yorku.ca/yfile/wp-content/uploads/sites/889/2023/08/aerial_ross-east.jpg",
      website: "https://www.yorku.ca",
      highlights: [
        "Over 55,000 students from 178 countries",
        "11 Faculties offering more than 200 programs",
        "Modern campus with state-of-the-art facilities",
        "Located in the heart of the Greater Toronto Area",
        "Strong focus on research and innovation"
      ]
    },
    'university-of-toronto': {
      name: "University of Toronto",
      founded: 1827,
      location: "Toronto, Ontario, Canada",
      totalStudents: 93000,
      acceptanceRate: 43,
      imageUrl: "https://defygravitycampaign.utoronto.ca/wp-content/uploads/2024/10/landmark_frontcampusaerial-scaled-1.jpg",
      website: "https://www.utoronto.ca",
      highlights: [
        "Ranked #1 in Canada and among top 20 globally",
        "3 distinct campuses across the Greater Toronto Area",
        "Over 700 undergraduate programs",
        "World-renowned research facilities",
        "Rich history dating back to 1827"
      ]
    },
    'western-university': {
      name: "Western University",
      founded: 1878,
      location: "London, Ontario, Canada",
      totalStudents: 38000,
      acceptanceRate: 31,
      imageUrl: "https://brand.westernu.ca/assets/img/assets/wallpaper/middlesex-wallpaper.jpg",
      website: "https://www.uwo.ca",
      highlights: [
        "Beautiful 481-hectare campus",
        "12 faculties and schools",
        "Top-ranked student experience",
        "Strong research and innovation focus",
        "Vibrant student community in London, Ontario"
      ]
    }
  };

  // Get university data based on URL parameter, default to York if not found
  const university = universities[universityName as keyof typeof universities] || universities['york-university'];

  //Hardcoded dorm data for demonstration purposes
  const dorms: Dorm[] = [
    {
      id: 1,
      name: "Founders Residence",
      imageUrl: "https://www.yorku.ca/housing/wp-content/uploads/sites/57/2022/02/Founders-Exterior-1024x682.jpg",
      rating: 4.3,
      reviews: 21,
    },
    {
      id: 2,
      name: "Stong Residence",
      imageUrl: "https://central.apps01.yorku.ca/maps/wp-content/uploads/2010/06/stong-res-2-copy.jpg",
      rating: 4.0,
      reviews: 34,
    }
  ];

  // Function to render star ratings
  const renderStars = (rating: number) => {
    return "★".repeat(Math.floor(rating)) + "☆".repeat(5 - Math.floor(rating));
  };

  // Main component render
  return (
    <div className="university-dash">
      <NavBar />
      <div className="university-content">
        {/* Left side - University Information */}
        <div className="university-info">
          <img 
            src={university.imageUrl} 
            alt={university.name} 
            className="university-main-image"
          />
          <h1>{university.name}</h1>
          
          
          <div className="university-stats">
            <div className="stat-item">
              <span className="stat-label">Founded</span>
              <span className="stat-value">{university.founded}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Total Students</span>
              <span className="stat-value">{university.totalStudents.toLocaleString()}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Acceptance Rate</span>
              <span className="stat-value">{university.acceptanceRate}%</span>
            </div>
          </div>

          <div className="university-highlights">
            <h2>University Highlights</h2>
            <ul>
              {university.highlights.map((highlight, index) => (
                <li key={index}>{highlight}</li>
              ))}
            </ul>
          </div>

          <a 
            href={university.website} 
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