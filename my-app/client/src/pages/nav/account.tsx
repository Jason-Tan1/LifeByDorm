import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import NavBar from './navbar.tsx';
import Footer from '../home/footer.tsx';
import Star from '@mui/icons-material/Star';
import EditReviewModal from './EditReviewModal.tsx';
import './account.css';

// Use relative path '' on localhost to leverage the Vite proxy
const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const API_BASE = isLocal ? '' : ((import.meta as any).env?.VITE_API_BASE || '');

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
  status?: string;
  pendingEdit?: any;
}

function Account() {
  const navigate = useNavigate();
  const [userEmail, setUserEmail] = useState<string>('');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Lightbox State
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [currentImages, setCurrentImages] = useState<string[]>([]);

  // Edit Modal State
  const [editingReview, setEditingReview] = useState<Review | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/');
      return;
    }

    try {
      const payloadJson = token.split('.')[1];
      const decoded = JSON.parse(atob(payloadJson));

      // Check if token is expired
      if (decoded.exp * 1000 < Date.now()) {
        localStorage.removeItem('token');
        navigate('/navbar'); // Redirect to login
        return;
      }

      setUserEmail(decoded?.name || decoded?.email || '');
    } catch (err) {
      localStorage.removeItem('token');
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
          // Reviews fetched successfully
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

  const formatYears = (year: number[] | number | string | string[]) => {
    const labels = ['', '1st', '2nd', '3rd', '4th', 'Other'];
    if (Array.isArray(year)) {
      return year.map(y => labels[Number(y)] || y).join(', ');
    }
    return labels[Number(year)] || year;
  };

  const getStatusLabel = (status: string = 'pending') => {
    switch (status.toLowerCase()) {
      case 'approved': return 'Accepted';
      case 'declined': return 'Rejected';
      default: return 'Pending';
    }
  };

  // Lightbox Handlers
  const openLightbox = (images: string[], index: number) => {
    setCurrentImages(images);
    setCurrentImageIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % currentImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + currentImages.length) % currentImages.length);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') nextImage();
    if (e.key === 'ArrowLeft') prevImage();
    if (e.key === 'Escape') closeLightbox();
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

          <div className="account-actions">
            <button
              className="action-btn logout-btn"
              onClick={() => {
                localStorage.removeItem('token');
                window.location.href = '/';
              }}
            >
              Log Out
            </button>
            <button
              className="action-btn delete-btn"
              onClick={() => {
                if (window.confirm('Are you sure you want to delete your account? This cannot be undone.')) {
                  alert('Account deletion request has been submitted. (Demo)');
                }
              }}
            >
              Delete Account
            </button>
          </div>
        </div>

        <div className="account-main">
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
              {reviews.map(review => {
                // If there's a pending edit, show the edited data on the account page
                const pe = review.pendingEdit;
                const displayRoom = pe ? pe.room : review.room;
                const displayBathroom = pe ? pe.bathroom : review.bathroom;
                const displayBuilding = pe ? pe.building : review.building;
                const displayAmenities = pe ? pe.amenities : review.amenities;
                const displayLocation = pe ? pe.location : review.location;
                const displayDescription = pe ? pe.description : review.description;
                const displayYear = pe ? pe.year : review.year;
                const displayWouldDormAgain = pe ? pe.wouldDormAgain : review.wouldDormAgain;
                const displayImages = pe ? pe.images : review.images;
                const displayOverall = ((displayRoom + displayBathroom + displayBuilding + displayAmenities + displayLocation) / 5);

                return (
                  <div key={review._id} className="review-item review-card-style">
                    <div className="review-header" style={{ padding: '0', display: 'flex', gap: '20px', alignItems: 'flex-start', marginBottom: '16px' }}>
                      <div className="review-overall-rating" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', flexShrink: 0, minWidth: '110px' }}>
                        <span className={`overall-rating-badge ${getRatingClass(displayOverall)}`}>
                          <Star className="rating-star-icon" />
                          {displayOverall.toFixed(1)}
                        </span>
                        {review.pendingEdit ? (
                          <span className="edit-pending-badge">Edit Pending</span>
                        ) : (
                          <button className="edit-review-btn" onClick={() => setEditingReview(review)}>
                            Edit
                          </button>
                        )}
                      </div>

                      <div className="review-metadata" style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                        <div className="review-metadata-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div className="review-dorm-info">
                            <Link
                              to={`/universities/${review.university}`}
                              className="review-university"
                              style={{ margin: '0 0 4px 0', fontSize: '0.85rem' }}
                            >
                              {review.university.split('-').map(word =>
                                word.charAt(0).toUpperCase() + word.slice(1)
                              ).join(' ')}
                            </Link>
                            <h3 className="review-dorm-name" style={{ margin: 0, fontSize: '1.25rem' }}>{review.dorm}</h3>
                          </div>
                          <span className={`status-badge status-${(review.status || 'pending').toLowerCase()}`}>
                            {getStatusLabel(review.status)}
                          </span>
                        </div>

                        <div className="review-metadata-row" style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', fontSize: '0.9rem', color: '#666' }}>
                          <span className="review-time" style={{ fontStyle: 'italic' }}>Submitted on {formatDate(review.createdAt)}</span>
                          <span>Year: {formatYears(displayYear as any)}</span>
                          <span>Would dorm again: {displayWouldDormAgain ? 'Yes' : 'No'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="review-content" style={{ padding: '0' }}>
                      <div className="review-item-details" style={{ borderBottom: 'none', paddingBottom: '0', marginBottom: '12px', display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                        <span style={{ fontSize: '0.85rem', color: '#666', backgroundColor: '#f5f5f5', padding: '4px 10px', borderRadius: '4px' }}>Room: {displayRoom}/5</span>
                        <span style={{ fontSize: '0.85rem', color: '#666', backgroundColor: '#f5f5f5', padding: '4px 10px', borderRadius: '4px' }}>Bathroom: {displayBathroom}/5</span>
                        <span style={{ fontSize: '0.85rem', color: '#666', backgroundColor: '#f5f5f5', padding: '4px 10px', borderRadius: '4px' }}>Building: {displayBuilding}/5</span>
                        <span style={{ fontSize: '0.85rem', color: '#666', backgroundColor: '#f5f5f5', padding: '4px 10px', borderRadius: '4px' }}>Amenities: {displayAmenities}/5</span>
                        <span style={{ fontSize: '0.85rem', color: '#666', backgroundColor: '#f5f5f5', padding: '4px 10px', borderRadius: '4px' }}>Location: {displayLocation}/5</span>
                      </div>

                      <p className="review-description" style={{ color: '#444', lineHeight: 1.5, margin: '0 0 16px 0', fontSize: '0.95rem' }}>
                        {displayDescription}
                      </p>

                      {displayImages && displayImages.length > 0 && (
                        <div className="review-images-gallery" style={{ display: 'flex', gap: '12px' }}>
                          {displayImages!.slice(0, 3).map((img: string, idx: number) => (
                            <div
                              key={idx}
                              className="review-gallery-image-wrapper"
                              style={{ position: 'relative', width: '150px', height: '150px', flex: '0 0 auto', cursor: 'pointer' }}
                              onClick={() => openLightbox(displayImages as string[], idx)}
                            >
                              <img src={img} alt={`Review ${idx + 1}`} className="review-gallery-image" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} />
                              {idx === 2 && displayImages!.length > 3 && (
                                <div className="review-image-overlay" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '1.2rem', fontWeight: 'bold' }}>
                                  +{displayImages!.length - 3} more
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Lightbox Modal */}
      {lightboxOpen && (
        <div
          className="lightbox-overlay"
          onClick={closeLightbox}
          onKeyDown={handleKeyDown}
          tabIndex={0}
        >
          <button className="lightbox-close" onClick={closeLightbox}>×</button>
          <button className="lightbox-arrow lightbox-arrow-left" onClick={(e) => { e.stopPropagation(); prevImage(); }}>‹</button>
          <img
            src={currentImages[currentImageIndex]}
            alt="Full size"
            className="lightbox-image"
            onClick={(e) => e.stopPropagation()}
          />
          <button className="lightbox-arrow lightbox-arrow-right" onClick={(e) => { e.stopPropagation(); nextImage(); }}>›</button>
          <div className="lightbox-counter">{currentImageIndex + 1} / {currentImages.length}</div>
        </div>
      )}

      {/* Edit Review Modal */}
      {editingReview && (
        <EditReviewModal
          review={editingReview}
          onClose={() => setEditingReview(null)}
          onSaved={async () => {
            // Re-fetch reviews after edit
            try {
              const token = localStorage.getItem('token');
              const res = await fetch(`${API_BASE}/api/reviews/user`, {
                headers: { 'Authorization': `Bearer ${token}` }
              });
              if (res.ok) {
                const data = await res.json();
                setReviews(data);
              }
            } catch (err) {
              console.error('Error refreshing reviews:', err);
            }
          }}
        />
      )}

      <Footer />
    </div>
  );
}

export default Account;
