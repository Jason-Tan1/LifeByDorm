import React, { useEffect, useState } from 'react';
import './Home.css'; 
import { Link } from 'react-router-dom';
import NavBar from '../NavBarPages/navbar.tsx'; 
import SearchBar from './searchbar.tsx'; 
import Footer from './footer.tsx';

const API_BASE = (import.meta as any).env?.VITE_API_BASE || 'http://localhost:3000'; 


const featuredUniversities = [
  {
    id: 1,
    name: 'York University',
    slug: 'york-university',
    location: 'Toronto, ON',
    imageUrl: 'https://cdn.prod.website-files.com/5fc4462337773c2fc7fcbcfb/62bd296b4a3a37ee3d8050c2_york-university-skedda-2.jpeg'
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
    imageUrl: 'https://www.yorku.ca/housing/wp-content/uploads/sites/57/2022/02/Founders-Exterior-1024x682.jpg'
  },
  {
    id: 2,
    name: 'Graduate House',
    slug: 'graduate-house',
    university: 'University of Toronto',
    universitySlug: 'university-of-toronto',
    imageUrl: 'https://gradhouse.utoronto.ca/wp-content/uploads/uoft-gradhouse-1-1024x683.jpg'
  },
  {
    id: 3,
    name: 'Saugeen-Maitland Hall',
    slug: 'saugeen-maitland-hall',
    university: 'Western University',
    universitySlug: 'western-university',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/a8/Saugeen-Maitland_Hall.jpg'
  }
];

function Home() {
  const [dormRatings, setDormRatings] = useState<{ [dormName: string]: number }>({});
  const [dormReviewCounts, setDormReviewCounts] = useState<{ [dormName: string]: number }>({});
  const [universityReviewCounts, setUniversityReviewCounts] = useState<{ [universitySlug: string]: number }>({});

  const calculateOverallRating = (review: any) => {
    const ratings = [review.room, review.bathroom, review.building, review.amenities, review.location];
    return ratings.reduce((acc, rating) => acc + rating, 0) / ratings.length;
  };

  useEffect(() => {
    const fetchDormRatings = async () => {
      const ratings: { [dormName: string]: number } = {};
      const counts: { [dormName: string]: number } = {};
      await Promise.all(
        featuredDorms.map(async (dorm) => {
          try {
            console.log(`Fetching reviews for: ${dorm.name} at ${dorm.universitySlug}`);
            const reviewRes = await fetch(`${API_BASE}/api/reviews?university=${encodeURIComponent(dorm.universitySlug)}&dorm=${encodeURIComponent(dorm.name)}`);
            if (reviewRes.ok) {
              const reviews = await reviewRes.json();
              console.log(`Reviews for ${dorm.name}:`, reviews);
              counts[dorm.name] = reviews.length;
              if (reviews.length > 0) {
                const totalRating = reviews.reduce((sum: number, review: any) => sum + calculateOverallRating(review), 0);
                ratings[dorm.name] = totalRating / reviews.length;
                console.log(`Calculated rating for ${dorm.name}: ${ratings[dorm.name]}`);
              } else {
                ratings[dorm.name] = 0;
                console.log(`No reviews found for ${dorm.name}`);
              }
            } else {
              console.error(`Failed to fetch reviews for ${dorm.name}, status: ${reviewRes.status}`);
            }
          } catch (e) {
            console.error(`Failed to fetch reviews for ${dorm.name}`, e);
            ratings[dorm.name] = 0;
            counts[dorm.name] = 0;
          }
        })
      );
      console.log('All ratings:', ratings);
      setDormRatings(ratings);
      setDormReviewCounts(counts);
    };
    fetchDormRatings();

    const fetchUniversityReviewCounts = async () => {
      const uniCounts: { [universitySlug: string]: number } = {};
      await Promise.all(
        featuredUniversities.map(async (uni) => {
          try {
            const reviewRes = await fetch(`${API_BASE}/api/reviews?university=${encodeURIComponent(uni.slug)}`);
            if (reviewRes.ok) {
              const reviews = await reviewRes.json();
              uniCounts[uni.slug] = reviews.length;
            } else {
              uniCounts[uni.slug] = 0;
            }
          } catch (e) {
            console.error(`Failed to fetch reviews for ${uni.name}`, e);
            uniCounts[uni.slug] = 0;
          }
        })
      );
      setUniversityReviewCounts(uniCounts);
    };
    fetchUniversityReviewCounts();
  }, []);

  return (
    <div className = "home"> 
      <NavBar />
      <div className="home-container">
        <div className="home-content">
          <div className="home-section">
            <h1>
              Honest Dorm Reviews from Students Across Canada
            </h1>
            <SearchBar />
          </div>
        </div>
      </div>

      {/* Featured Section */}
      <div className="featured-section">
        {/* Featured Universities Section */}
        <div className="featured-container">
          <h2 className="featured-title">Most Rated Universities</h2>
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
                  <p className="featured-location">
                    <span className="icon">💬</span> {universityReviewCounts[uni.slug] ?? 0} {universityReviewCounts[uni.slug] === 1 ? 'review' : 'reviews'}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
            

        {/* Top Rated Dorms Section */}
        <div className="featured-container" style={{ marginTop: '40px' }}>
          <h2 className="featured-title">Most Rated Dorms</h2>
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
                    <span className="icon">⭐</span> {(dormRatings[dorm.name] ?? 0).toFixed(1)} ({dormReviewCounts[dorm.name] ?? 0} {dormReviewCounts[dorm.name] === 1 ? 'review' : 'reviews'})
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