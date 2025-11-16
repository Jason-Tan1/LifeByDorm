import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import NavBar from '../navbarpages/navbar';
import './universityDash.css';

// Define types for University and Dorm data from API
type APIUniversity = {
  name: string;
  slug: string;
  founded?: number | null;
  location?: string | null;
  totalStudents?: number | null;
  acceptanceRate?: number | null;
  imageUrl?: string | null;
  website?: string | null;
  highlights?: string[];
};

type APIDorm = {
  name: string;
  slug: string;
  universitySlug: string;
  imageUrl?: string;
  rating?: number;
  totalReviews?: number;
};

const API_BASE = (import.meta as any).env?.VITE_API_BASE || 'http://localhost:3000';

// Main component for University Dashboard
function UniversityDash() {
  const { universityName } = useParams();

  const [university, setUniversity] = useState<APIUniversity | null>(null);
  const [dorms, setDorms] = useState<APIDorm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch university and dorm data when component mounts or universityName changes
  useEffect(() => {
    if (!universityName) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    // Fetch data from APIs
    async function fetchData() {
      try {
        const [uniRes, dormsRes] = await Promise.all([
          fetch(`${API_BASE}/api/universities/${encodeURIComponent(universityName!)}`),
          fetch(`${API_BASE}/api/universities/${encodeURIComponent(universityName!)}/dorms`),
        ]);

        if (!uniRes.ok) {
          throw new Error(`Failed to load university: ${uniRes.status}`);
        }
        if (!dormsRes.ok) {
          throw new Error(`Failed to load dorms: ${dormsRes.status}`);
        }

        const uniData: APIUniversity = await uniRes.json();
        const dormsData: APIDorm[] = await dormsRes.json();
        if (!cancelled) {
          setUniversity(uniData);
          setDorms(dormsData);
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Failed to load data');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [universityName]);

  // Function to render star ratings
  const renderStars = (rating: number) => {
    return "★".repeat(Math.floor(rating)) + "☆".repeat(5 - Math.floor(rating));
  };

  // Main component render
  if (loading) {
    return (
      <div className="university-dash">
        <NavBar />
        <div className="university-content">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // Handle error state
  if (error || !university) {
    return (
      <div className="university-dash">
        <NavBar />
        <div className="university-content">
          <p>{error || 'University not found'}</p>
        </div>
      </div>
    );
  }

  // Render university dashboard
  return (
    <div className="university-dash">
      <NavBar />
      <div className="university-content">
        {/* Left side - University Information */}
        <div className="university-info">
          <img
            src={university.imageUrl || ''}
            alt={university.name}
            className="university-main-image"
          />
          <h1>{university.name}</h1>
          
          
          <div className="university-stats">
            <div className="stat-item">
              <span className="stat-label">Founded</span>
              <span className="stat-value">{university.founded ?? '—'}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Total Students</span>
              <span className="stat-value">{university.totalStudents ? university.totalStudents.toLocaleString() : '—'}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Acceptance Rate</span>
              <span className="stat-value">{typeof university.acceptanceRate === 'number' ? `${university.acceptanceRate}%` : '—'}</span>
            </div>
          </div>

          <div className="university-highlights">
            <h2>University Highlights</h2>
            <ul>
              {(university.highlights || []).map((highlight, index) => (
                <li key={index}>{highlight}</li>
              ))}
            </ul>
          </div>

          <a 
            href={university.website || '#'}
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
              <div key={`${dorm.universitySlug}-${dorm.slug}`} className="dorm-card">
                <img src={dorm.imageUrl || ''} alt={dorm.name} className="dorm-image" />
                <div className="dorm-info">
                  <h3>{dorm.name}</h3>
                  <div className="dorm-rating">
                    <div className="stars" title={(dorm.rating ?? 0).toString()}>
                      {renderStars(dorm.rating ?? 0)}
                    </div>
                    <span className="rating-number">
                      {(dorm.rating ?? 0).toFixed(1)} ({dorm.totalReviews ?? 0} reviews)
                    </span>
                  </div>
                  <div className="dorm-buttons">
                    <Link to={`/universities/${universityName}/dorms/${dorm.slug}`} className="view-dorm-button">
                      View Details
                    </Link>
                    <Link to={`/review?university=${encodeURIComponent(universityName || '')}&dorm=${encodeURIComponent(dorm.name)}`} className="review-button">
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