import React from 'react';
import './Home.css'; 
import { Link } from 'react-router-dom';
import NavBar from './NavBarPages/navbar.tsx'; 
import SearchBar from './searchbar.tsx'; 
import Footer from './footer.tsx'; 


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

const featuredDorms = [
  {
    id: 1,
    name: 'Founders Residence',
    slug: 'founders-residence', 
    university: 'York University',
    universitySlug: 'york-university',
    rating: 4.0,
    imageUrl: 'https://www.yorku.ca/housing/wp-content/uploads/sites/57/2022/02/Founders-Exterior-1024x682.jpg'
  },
  {
    id: 2,
    name: 'Graduate House',
    slug: 'graduate-house',
    university: 'University of Toronto',
    universitySlug: 'university-of-toronto',
    rating: 4.5,
    imageUrl: 'https://gradhouse.utoronto.ca/wp-content/uploads/uoft-gradhouse-1-1024x683.jpg'
  },
  {
    id: 3,
    name: 'Saugeen-Maitland Hall',
    slug: 'saugeen-maitland-hall',
    university: 'Western University',
    universitySlug: 'western-university',
    rating: 4.1,
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/a8/Saugeen-Maitland_Hall.jpg'
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

      {/* Featured Section */}
      <div className="featured-section">
        {/* Featured Universities Section */}
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
            

        {/* Featured Dorms Section */}
        <div className="featured-container" style={{ marginTop: '40px' }}>
          <h2 className="featured-title">Featured Dorms</h2>
          <p className="featured-subtitle">Check out highly-rated residences across campuses.</p>
          
          <div className="featured-grid">
            {featuredDorms.map(dorm => (
              <Link key={dorm.id} to={`/universities/${dorm.universitySlug}/dorms/${dorm.slug}`} className="featured-card">
                <div className="featured-image-container">
                  <img src={dorm.imageUrl} alt={dorm.name} className="featured-image" />
                </div>
                <div className="featured-info">
                  <h3 className="featured-university-name">
                    <span className="icon">🏠</span> {dorm.name}
                  </h3>
                  <p className="featured-location">
                    <span className="icon">🏫</span> {dorm.university}
                  </p>
                  <p className="featured-location">
                    <span className="icon">⭐</span> {dorm.rating.toFixed(1)} rating
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>

      </div>

      <Footer />
    </div>
  );
}

export default Home;