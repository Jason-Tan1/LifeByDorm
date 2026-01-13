import React from 'react';
import NavBar from './navbar.tsx';
import Footer from '../homepage/footer.tsx';
import DefaultDormImage from '../assets/Default_Dorm.png';
import './aboutme.css';
import '../legal/legal.css'; // Reusing the clean text formatting

function AboutMe() {
  return (
    <div className="about-page">
      <NavBar />
      
      {/* Hero Section */}
      <div className="about-hero" style={{ backgroundImage: `url(${DefaultDormImage})` }}>
        <div className="about-hero-overlay">
           <h1>About</h1>
        </div>
      </div>

      <div className="legal-container">
        
        <div className="legal-section">
          <h2>Our Mission</h2>
          <p>
            At LifeByDorm, we believe that where you live shapes your university experience. 
            Our mission is to empower students with transparent, honest, and comprehensive 
            reviews of dorms and residences across the country.
          </p>
        </div>

        <div className="legal-section">
          <h2>Who We Are</h2>
          <p>
            LifeByDorm is a platform built by students, for students. We understand the anxiety 
            of choosing a place to live without knowing what it's really like. We bridge the gap 
            between official university brochures and the reality of student living.
          </p>
        </div>

        <div className="legal-section">
          <h2>What We Do</h2>
          <p>
            We provide a centralized hub for university housing reviews. From analyzing room layouts 
            and bathroom cleanliness to rating social vibes and amenities, we cover it all. Our 
            community-driven approach ensuring you get the real scoop before you move in.
          </p>
          <ul>
            <li><strong>Authentic Reviews:</strong> Real stories from real residents.</li>
            <li><strong>Detailed Ratings:</strong> specific scores for cleanliness, location, and social life.</li>
            <li><strong>Photos:</strong> See what the rooms actually look like.</li>
          </ul>
        </div>

        <div className="legal-section">
            <h2>Join Our Community</h2>
            <p>
                Have you lived in a dorm? Share your experience! Your review could help a future 
                freshman find their perfect home away from home. Together, we make student living 
                better for everyone.
            </p>
        </div>

      </div>
      <Footer />
    </div>
  )
}

export default AboutMe;