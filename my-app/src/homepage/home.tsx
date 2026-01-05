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
  const [topUniversities, setTopUniversities] = useState<any[]>([]);
  const [topDorms, setTopDorms] = useState<any[]>([]);
  const [mostRatedDorms, setMostRatedDorms] = useState<any[]>([]);
  const [dormRatings, setDormRatings] = useState<{ [dormName: string]: number }>({});
  const [dormReviewCounts, setDormReviewCounts] = useState<{ [dormName: string]: number }>({});
  const [universityReviewCounts, setUniversityReviewCounts] = useState<{ [universitySlug: string]: number }>({});
  const [universityScrollPosition, setUniversityScrollPosition] = useState(0);
  const [mostRatedDormsScrollPosition, setMostRatedDormsScrollPosition] = useState(0);
  const [dormScrollPosition, setDormScrollPosition] = useState(0);

  const calculateOverallRating = (review: any) => {
    const ratings = [review.room, review.bathroom, review.building, review.amenities, review.location];
    return ratings.reduce((acc, rating) => acc + rating, 0) / ratings.length;
  };

  useEffect(() => {
    // Fetch all universities and find top 3 by review count
    const fetchTopUniversities = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/universities`);
        if (response.ok) {
          const allUniversities = await response.json();
          
          // Get review counts for all universities
          const universityData = await Promise.all(
            allUniversities.map(async (uni: any) => {
              try {
                const reviewRes = await fetch(`${API_BASE}/api/reviews?university=${encodeURIComponent(uni.slug)}`);
                if (reviewRes.ok) {
                  const reviews = await reviewRes.json();
                  return { ...uni, reviewCount: reviews.length };
                }
              } catch (e) {
                console.error(`Failed to fetch reviews for ${uni.name}`, e);
              }
              return { ...uni, reviewCount: 0 };
            })
          );

          // Sort by review count and take top 7
          const top7 = universityData
            .sort((a, b) => b.reviewCount - a.reviewCount)
            .slice(0, 7);
          
          setTopUniversities(top7);
          
          // Set review counts for display
          const counts: { [slug: string]: number } = {};
          top7.forEach(uni => {
            counts[uni.slug] = uni.reviewCount;
          });
          setUniversityReviewCounts(counts);
        }
      } catch (e) {
        console.error('Failed to fetch universities', e);
      }
    };

    // Fetch all dorms and find top 3 by rating
    const fetchTopDorms = async () => {
      try {
        const allUniversitiesRes = await fetch(`${API_BASE}/api/universities`);
        if (!allUniversitiesRes.ok) return;
        
        const allUniversities = await allUniversitiesRes.json();
        const allDorms: any[] = [];
        
        // Fetch dorms for all universities
        await Promise.all(
          allUniversities.map(async (uni: any) => {
            try {
              const dormsRes = await fetch(`${API_BASE}/api/universities/${encodeURIComponent(uni.slug)}/dorms`);
              if (dormsRes.ok) {
                const dorms = await dormsRes.json();
                dorms.forEach((dorm: any) => {
                  allDorms.push({
                    ...dorm,
                    university: uni.name,
                    universitySlug: uni.slug
                  });
                });
              }
            } catch (e) {
              console.error(`Failed to fetch dorms for ${uni.name}`, e);
            }
          })
        );

        // Get ratings and review counts for all dorms
        const dormData = await Promise.all(
          allDorms.map(async (dorm) => {
            try {
              const reviewRes = await fetch(`${API_BASE}/api/reviews?university=${encodeURIComponent(dorm.universitySlug)}&dorm=${encodeURIComponent(dorm.name)}`);
              if (reviewRes.ok) {
                const reviews = await reviewRes.json();
                const reviewCount = reviews.length;
                let avgRating = 0;
                
                if (reviews.length > 0) {
                  const totalRating = reviews.reduce((sum: number, review: any) => sum + calculateOverallRating(review), 0);
                  avgRating = totalRating / reviews.length;
                }
                
                return { ...dorm, avgRating, reviewCount };
              }
            } catch (e) {
              console.error(`Failed to fetch reviews for ${dorm.name}`, e);
            }
            return { ...dorm, avgRating: 0, reviewCount: 0 };
          })
        );

        // Sort by average rating (then by review count as tiebreaker) and take top 7
        const top7 = dormData
          .sort((a, b) => {
            if (b.avgRating === a.avgRating) {
              return b.reviewCount - a.reviewCount;
            }
            return b.avgRating - a.avgRating;
          })
          .slice(0, 7);

        setTopDorms(top7);
        
        // Set ratings and counts for display
        const ratings: { [name: string]: number } = {};
        const counts: { [name: string]: number } = {};
        top7.forEach(dorm => {
          ratings[dorm.name] = dorm.avgRating;
          counts[dorm.name] = dorm.reviewCount;
        });
        setDormRatings(ratings);
        setDormReviewCounts(counts);
      } catch (e) {
        console.error('Failed to fetch dorms', e);
      }
    };

    // Fetch all dorms and find top 7 by review count
    const fetchMostRatedDorms = async () => {
      try {
        const allUniversitiesRes = await fetch(`${API_BASE}/api/universities`);
        if (!allUniversitiesRes.ok) return;
        
        const allUniversities = await allUniversitiesRes.json();
        const allDorms: any[] = [];
        
        // Fetch dorms for all universities
        await Promise.all(
          allUniversities.map(async (uni: any) => {
            try {
              const dormsRes = await fetch(`${API_BASE}/api/universities/${encodeURIComponent(uni.slug)}/dorms`);
              if (dormsRes.ok) {
                const dorms = await dormsRes.json();
                dorms.forEach((dorm: any) => {
                  allDorms.push({
                    ...dorm,
                    university: uni.name,
                    universitySlug: uni.slug
                  });
                });
              }
            } catch (e) {
              console.error(`Failed to fetch dorms for ${uni.name}`, e);
            }
          })
        );

        // Get review counts for all dorms
        const dormData = await Promise.all(
          allDorms.map(async (dorm) => {
            try {
              const reviewRes = await fetch(`${API_BASE}/api/reviews?university=${encodeURIComponent(dorm.universitySlug)}&dorm=${encodeURIComponent(dorm.name)}`);
              if (reviewRes.ok) {
                const reviews = await reviewRes.json();
                const reviewCount = reviews.length;
                let avgRating = 0;
                
                if (reviews.length > 0) {
                  const totalRating = reviews.reduce((sum: number, review: any) => sum + calculateOverallRating(review), 0);
                  avgRating = totalRating / reviews.length;
                }
                
                return { ...dorm, avgRating, reviewCount };
              }
            } catch (e) {
              console.error(`Failed to fetch reviews for ${dorm.name}`, e);
            }
            return { ...dorm, avgRating: 0, reviewCount: 0 };
          })
        );

        // Sort by review count and take top 7
        const top7 = dormData
          .sort((a, b) => b.reviewCount - a.reviewCount)
          .slice(0, 7);

        setMostRatedDorms(top7);
      } catch (e) {
        console.error('Failed to fetch most rated dorms', e);
      }
    };

    fetchTopUniversities();
    fetchMostRatedDorms();
    fetchTopDorms();
  }, []);

  const scrollUniversities = (direction: 'left' | 'right') => {
    const container = document.getElementById('university-slider');
    if (container) {
      const scrollAmount = 350;
      const newPosition = direction === 'left' 
        ? Math.max(0, universityScrollPosition - scrollAmount)
        : Math.min(container.scrollWidth - container.clientWidth, universityScrollPosition + scrollAmount);
      
      container.scrollTo({ left: newPosition, behavior: 'smooth' });
      setUniversityScrollPosition(newPosition);
    }
  };

  const scrollMostRatedDorms = (direction: 'left' | 'right') => {
    const container = document.getElementById('most-rated-dorms-slider');
    if (container) {
      const scrollAmount = 350;
      const newPosition = direction === 'left' 
        ? Math.max(0, mostRatedDormsScrollPosition - scrollAmount)
        : Math.min(container.scrollWidth - container.clientWidth, mostRatedDormsScrollPosition + scrollAmount);
      
      container.scrollTo({ left: newPosition, behavior: 'smooth' });
      setMostRatedDormsScrollPosition(newPosition);
    }
  };

  const scrollDorms = (direction: 'left' | 'right') => {
    const container = document.getElementById('dorm-slider');
    if (container) {
      const scrollAmount = 350;
      const newPosition = direction === 'left' 
        ? Math.max(0, dormScrollPosition - scrollAmount)
        : Math.min(container.scrollWidth - container.clientWidth, dormScrollPosition + scrollAmount);
      
      container.scrollTo({ left: newPosition, behavior: 'smooth' });
      setDormScrollPosition(newPosition);
    }
  };

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
          
          <div className="slider-container">
            <button 
              className="slider-button slider-button-left" 
              onClick={() => scrollUniversities('left')}
              disabled={universityScrollPosition === 0}
            >
              ‹
            </button>
            <div className="slider-wrapper" id="university-slider">
              {topUniversities.map(uni => (
              <Link key={uni.slug} to={`/universities/${uni.slug}`} className="featured-card slider-card">
                <div className="featured-image-container">
                  <img src={uni.imageUrl || '/src/assets/Default_Campus.png'} alt={uni.name} className="featured-image" />
                </div>
                <div className="featured-info">
                  <h3 className="featured-university-name">
                    <span className="icon"></span> {uni.name}
                  </h3>
                  <p className="featured-location">
                    <span className="icon"></span> {uni.location?.replace(', Canada', '') || 'Location N/A'}
                  </p>
                  <p className="featured-location">
                    <span className="icon"></span> {universityReviewCounts[uni.slug] ?? 0} {universityReviewCounts[uni.slug] === 1 ? 'review' : 'reviews'}
                  </p>
                </div>
              </Link>
            ))}
            </div>
            <button 
              className="slider-button slider-button-right" 
              onClick={() => scrollUniversities('right')}
            >
              ›
            </button>
          </div>
        </div>

        {/* Most Rated Dorms Section */}
        <div className="featured-container" style={{ marginTop: '40px' }}>
          <h2 className="featured-title">Most Rated Dorms</h2>
          <p className="featured-subtitle">Discover the most reviewed residences across campuses.</p>
          
          <div className="slider-container">
            <button 
              className="slider-button slider-button-left" 
              onClick={() => scrollMostRatedDorms('left')}
              disabled={mostRatedDormsScrollPosition === 0}
            >
              ‹
            </button>
            <div className="slider-wrapper" id="most-rated-dorms-slider">
              {mostRatedDorms.map(dorm => (
              <Link key={`${dorm.universitySlug}-${dorm.slug}`} to={`/universities/${dorm.universitySlug}/dorms/${dorm.slug}`} className="featured-card slider-card">
                <div className="featured-image-container">
                  <img src={dorm.imageUrl || '/src/assets/Default_Dorm.png'} alt={dorm.name} className="featured-image" />
                </div>
                <div className="featured-info">
                  <h3 className="featured-university-name">
                    <span className="icon"></span> {dorm.name}
                  </h3>
                  <p className="featured-location">
                    <span className="icon"></span> {dorm.university}
                  </p>
                  <p className="featured-location">
                    <span className="icon"></span> {dorm.reviewCount ?? 0} {dorm.reviewCount === 1 ? 'review' : 'reviews'}
                  </p>
                </div>
              </Link>
            ))}
            </div>
            <button 
              className="slider-button slider-button-right" 
              onClick={() => scrollMostRatedDorms('right')}
            >
              ›
            </button>
          </div>
        </div>
            

        {/* Top Rated Dorms Section */}
        <div className="featured-container" style={{ marginTop: '40px' }}>
          <h2 className="featured-title">Top Rated Dorms</h2>
          <p className="featured-subtitle">Check out highly-rated residences across campuses.</p>
          
          <div className="slider-container">
            <button 
              className="slider-button slider-button-left" 
              onClick={() => scrollDorms('left')}
              disabled={dormScrollPosition === 0}
            >
              ‹
            </button>
            <div className="slider-wrapper" id="dorm-slider">
              {topDorms.map(dorm => (
              <Link key={`${dorm.universitySlug}-${dorm.slug}`} to={`/universities/${dorm.universitySlug}/dorms/${dorm.slug}`} className="featured-card slider-card">
                <div className="featured-image-container">
                  <img src={dorm.imageUrl || '/src/assets/Default_Dorm.png'} alt={dorm.name} className="featured-image" />
                </div>
                <div className="featured-info">
                  <h3 className="featured-university-name">
                    <span className="icon"></span> {dorm.name}
                  </h3>
                  <p className="featured-location">
                    <span className="icon"></span> {dorm.university}
                  </p>
                  <p className="featured-location">
                    <span className="icon"></span> {(dormRatings[dorm.name] ?? 0).toFixed(1)} ({dormReviewCounts[dorm.name] ?? 0} {dormReviewCounts[dorm.name] === 1 ? 'review' : 'reviews'})
                  </p>
                </div>
              </Link>
            ))}
            </div>
            <button 
              className="slider-button slider-button-right" 
              onClick={() => scrollDorms('right')}
            >
              ›
            </button>
          </div>
        </div>

      </div>

      <Footer />
    </div>
  );
}

export default Home;