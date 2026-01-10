import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import NavBar from './navbar.tsx';
import Footer from '../homepage/footer.tsx';
import Star from '@mui/icons-material/Star';
import './account.css';

const API_BASE = (import.meta as any).env?.VITE_API_BASE || 'http://localhost:3000';

interface Review {
  _id: string;
  university: string;
  dorm: string;
  room: number;
  bathroom: number;
  building: number;
  amenities: number;
  location: number;
  description: string;
  roomType: string | string[];
  year: number | number[];
  wouldDormAgain: boolean;
  createdAt: string;
  images?: string[];
}

function Account() {
  const navigate = useNavigate();
  const [userEmail, setUserEmail] = useState<string>('');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/');
      return;
    }

    try {
      const payloadJson = token.split('.')[1];
      const decoded = JSON.parse(atob(payloadJson));
      setUserEmail(decoded?.name || decoded?.email || '');
    } catch (err) {
      navigate('/');
    }
  }, [navigate]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    async function fetchUserReviews() {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`${API_BASE}/api/reviews/user`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('Fetched user reviews:', data);
          setReviews(data);
        } else {
          const errorData = await response.json().catch(() => ({}));
          console.error('Failed to fetch reviews:', response.status, errorData);
          setError(errorData.message || 'Failed to load reviews');
        }
      } catch (err) {
        console.error('Error fetching reviews:', err);
        setError('Unable to connect to server. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    fetchUserReviews();
  }, []);

  const calculateOverallRating = (review: Review) => {
    const ratings = [review.room, review.bathroom, review.building, review.amenities, review.location];
    return ratings.reduce((acc, rating) => acc + rating, 0) / ratings.length;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getRatingClass = (rating: number): string => {
    if (rating >= 4.0) return 'rating-high';
    if (rating >= 3.0) return 'rating-medium';
    return 'rating-low';
  };

  return (
    <div className="account-page">
      <NavBar />
      
      <div className="account-content">
        <div className="account-sidebar">
          <div className="user-info">
            <div className="user-avatar">
              {userEmail.charAt(0).toUpperCase()}
            </div>
            <h2>My Account</h2>
            <p className="user-email">{userEmail}</p>
          </div>
          
          <nav className="account-nav">
            <button className="nav-item active">My Reviews</button>
          </nav>
        </div>

        <div className="account-main">
          <h1>My Dorm Reviews</h1>
          
          {loading ? (
            <p className="loading-text">Loading your reviews...</p>
          ) : error ? (
            <div className="error-state">
              <p className="error-message">{error}</p>
              <button 
                className="retry-button"
                onClick={() => window.location.reload()}
              >
                Try Again
              </button>
            </div>
          ) : reviews.length === 0 ? (
            <div className="no-reviews">
              <p>You haven't submitted any reviews yet.</p>
              <Link to="/universities" className="browse-link">
                Browse Universities to Leave a Review
              </Link>
            </div>
          ) : (
            <div className="reviews-list">
              {reviews.map(review => (
                <div key={review._id} className="review-item">
                  <div className="review-item-header">
                    <div className="review-dorm-info">
                      <Link 
                        to={`/universities/${review.university}`}
                        className="review-university"
                      >
                        {review.university.split('-').map(word => 
                          word.charAt(0).toUpperCase() + word.slice(1)
                        ).join(' ')}
                      </Link>
                      <h3 className="review-dorm-name">{review.dorm}</h3>
                    </div>
                    <div className={`review-rating ${getRatingClass(calculateOverallRating(review))}`}>
                      <Star style={{ fontSize: '1rem' }} />
                      <span>{calculateOverallRating(review).toFixed(1)}</span>
                    </div>
                  </div>
                  
                  <div className="review-item-details">
                    <span>Room: {review.room}/5</span>
                    <span>Bathroom: {review.bathroom}/5</span>
                    <span>Building: {review.building}/5</span>
                    <span>Amenities: {review.amenities}/5</span>
                    <span>Location: {review.location}/5</span>
                  </div>
                  
                  <p className="review-item-description">{review.description}</p>
                  
                  {review.images && review.images.length > 0 && (
                    <div className="review-item-images">
                      {review.images.slice(0, 3).map((img, idx) => (
                        <img key={idx} src={img} alt={`Review ${idx + 1}`} />
                      ))}
                      {review.images.length > 3 && (
                        <span className="more-images">+{review.images.length - 3} more</span>
                      )}
                    </div>
                  )}
                  
                  <div className="review-item-footer">
                    <span className="review-date">Submitted on {formatDate(review.createdAt)}</span>
                    <span className="review-would-dorm">
                      Would dorm again: {review.wouldDormAgain ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <Footer />
    </div>
  );
}

export default Account;
