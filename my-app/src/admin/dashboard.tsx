import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import NavBar from '../NavBarPages/navbar';

interface Review {
  _id: string;
  university?: string;
  dorm?: string;
  room: number;
  bathroom: number;
  building: number;
  amenities: number;
  location: number;
  description: string;
  year: number[] | number;
  roomType: string[] | string;
  wouldDormAgain?: boolean;
  fileImage?: string;
  images?: string[];
  createdAt?: string;
  status?: string;
}

function AdminDashboard() {
  const navigate = useNavigate();
  const [pendingReviews, setPendingReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    let isAdmin = false;
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        isAdmin = payload?.role === 'admin';
      } catch (err) {
        isAdmin = false;
      }
    }
    if (!isAdmin) {
      navigate('/login');
      return;
    }

    fetchPendingReviews();
  }, [navigate]);

  const fetchPendingReviews = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3000/api/admin/reviews/pending', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch pending reviews');
      }
      
      const data = await response.json();
      setPendingReviews(data);
      setLoading(false);
    } catch (err) {
      setError('Error loading reviews');
      setLoading(false);
      console.error(err);
    }
  };

  const handleApprove = async (reviewId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3000/api/admin/reviews/${reviewId}/approve`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to approve review');
      }
      
      // Remove from pending list
      setPendingReviews(prev => prev.filter(r => r._id !== reviewId));
    } catch (err) {
      alert('Error approving review');
      console.error(err);
    }
  };

  const handleDecline = async (reviewId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3000/api/admin/reviews/${reviewId}/decline`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to decline review');
      }
      
      // Remove from pending list
      setPendingReviews(prev => prev.filter(r => r._id !== reviewId));
    } catch (err) {
      alert('Error declining review');
      console.error(err);
    }
  };

  const calculateOverallRating = (review: Review) => {
    return ((review.room + review.bathroom + review.building + review.amenities + review.location) / 5).toFixed(1);
  };

  const formatYears = (year: number[] | number) => {
    if (Array.isArray(year)) {
      return year.map(y => ['', 'Freshman', 'Sophomore', 'Junior', 'Senior', 'Graduate Student'][y]).join(', ');
    }
    return ['', 'Freshman', 'Sophomore', 'Junior', 'Senior', 'Graduate Student'][year] || 'N/A';
  };

  const formatRoomTypes = (roomType: string[] | string) => {
    if (Array.isArray(roomType)) {
      return roomType.map(r => r.charAt(0).toUpperCase() + r.slice(1)).join(', ');
    }
    return roomType ? roomType.charAt(0).toUpperCase() + roomType.slice(1) : 'N/A';
  };

  return (
    <div>
      <NavBar />
      <main style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        <h1>Admin Dashboard</h1>
        <p>Review pending submissions from users.</p>

        <div style={{ marginTop: '32px' }}>
          <h2>Pending Reviews ({pendingReviews.length})</h2>
          
          {loading && <p>Loading...</p>}
          {error && <p style={{ color: 'red' }}>{error}</p>}
          
          {!loading && !error && pendingReviews.length === 0 && (
            <p>No pending reviews at this time.</p>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '20px' }}>
            {pendingReviews.map(review => (
              <div 
                key={review._id} 
                style={{ 
                  border: '1px solid #ddd', 
                  borderRadius: '8px', 
                  padding: '20px',
                  backgroundColor: '#f9f9f9'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: '0 0 8px 0' }}>
                      {review.dorm} - {review.university}
                    </h3>
                    <p style={{ margin: '4px 0', color: '#666' }}>
                      <strong>Overall Rating:</strong> {calculateOverallRating(review)} / 5.0
                    </p>
                    <p style={{ margin: '4px 0', color: '#666' }}>
                      <strong>Room Type:</strong> {formatRoomTypes(review.roomType)} | 
                      <strong> Year:</strong> {formatYears(review.year)} | 
                      <strong> Would Dorm Again:</strong> {review.wouldDormAgain ? 'Yes' : 'No'}
                    </p>
                    <div style={{ marginTop: '12px' }}>
                      <strong>Ratings:</strong>
                      <div style={{ display: 'flex', gap: '16px', marginTop: '8px', fontSize: '14px' }}>
                        <span>Room: {review.room}/5</span>
                        <span>Bathroom: {review.bathroom}/5</span>
                        <span>Building: {review.building}/5</span>
                        <span>Amenities: {review.amenities}/5</span>
                        <span>Location: {review.location}/5</span>
                      </div>
                    </div>
                    <div style={{ marginTop: '12px' }}>
                      <strong>Comments:</strong>
                      <p style={{ marginTop: '4px', lineHeight: '1.5' }}>{review.description}</p>
                    </div>
                    {review.images && review.images.length > 0 && (
                      <div style={{ marginTop: '12px' }}>
                        <strong>Images ({review.images.length}):</strong>
                        <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
                          {review.images.map((img, idx) => (
                            <img 
                              key={idx} 
                              src={img} 
                              alt={`Review ${idx + 1}`}
                              style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '4px' }}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                    <p style={{ fontSize: '12px', color: '#999', marginTop: '12px' }}>
                      Submitted: {review.createdAt ? new Date(review.createdAt).toLocaleString() : 'Unknown'}
                    </p>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginLeft: '20px' }}>
                    <button
                      onClick={() => handleApprove(review._id)}
                      style={{
                        padding: '10px 20px',
                        backgroundColor: '#4caf50',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: '600',
                        fontSize: '14px'
                      }}
                    >
                      ✓ Approve
                    </button>
                    <button
                      onClick={() => handleDecline(review._id)}
                      style={{
                        padding: '10px 20px',
                        backgroundColor: '#f44336',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: '600',
                        fontSize: '14px'
                      }}
                    >
                      ✗ Decline
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

export default AdminDashboard;
