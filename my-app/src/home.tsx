import React from 'react';
import './Home.css'; 
import { Link } from 'react-router-dom';
import NavBar from './NavBarPages/navbar.tsx'; 
import SearchBar from './searchbar.tsx'; 


const featuredUniversities = [
  {
    id: 1,
    name: 'York University',
    slug: 'york-university',
    location: 'Toronto, ON',
    imageUrl: 'https://miro.medium.com/0*-mSi2pTfWKkJpVf9'
  },
  {
    id: 2,
    name: 'University of Toronto',
    slug: 'university-of-toronto',
    location: 'Toronto, ON',
    imageUrl: 'https://www.utoronto.ca/sites/default/files/2025-07/UofT-st-george-campus.jpg'
  },
  {
    id: 3,
    name: 'Western University',
    slug: 'western-university',
    location: 'London, ON',
    imageUrl: 'https://brand.westernu.ca/assets/img/assets/wallpaper/middlesex-wallpaper.jpg'
  }
];

function Home() {
  return (
    <div className = "home"> 
      <NavBar />
      <div className="home-container">
        <div className="home-content">
          <div className="home-section">
            <h1>
              Honest Reviews of Canadian University Dorms
              <br />
              Straight from Real Students
            </h1>
            <SearchBar />
          </div>
        </div>
      </div>

      {/* Featured Universities Section */}
      <div className="featured-section">
        <div className="featured-container">
          <h2 className="featured-title">Featured Universities</h2>
          <p className="featured-subtitle">Explore top universities and their housing options.</p>
          
          <div className="featured-grid">
            {featuredUniversities.map(uni => (
              <Link key={uni.id} to={`/universities/${uni.slug}`} className="featured-card">
                <div className="featured-image-container">
                  <img src={uni.imageUrl} alt={uni.name} className="featured-image" />
                </div>
                <div className="featured-info">
                  <h3 className="featured-university-name">
                    <span className="icon">🏛️</span> {uni.name}
                  </h3>
                  <p className="featured-location">
                    <span className="icon">📍</span> {uni.location}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;