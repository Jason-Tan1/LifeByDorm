import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import NavBar from '../nav/navbar';
import DefaultDorm from '../../assets/Default_Dorm.png';
import './dashboard.css';

// Use relative path '' on localhost to leverage the Vite proxy
const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const API_BASE = isLocal ? '' : ((import.meta as any).env?.VITE_API_BASE || '');

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
  user?: string;
}

interface PendingDorm {
  _id: string;
  name: string;
  slug: string;
  universitySlug: string;
  description?: string;
  imageUrl?: string;
  amenities?: string[];
  roomTypes?: string[];
  submittedBy?: string;
  createdAt?: string;
  status?: string;
}

interface StatsData {
  users: { total: number; newThisWeek: number };
  reviews: { total: number; approved: number; pending: number; today: number; thisWeek: number };
  dorms: { total: number };
  topDorms: { dorm: string; university: string; reviewCount: number }[];
  topUniversities: { university: string; reviewCount: number }[];
}

function AdminDashboard() {
  const navigate = useNavigate();
  const [pendingReviews, setPendingReviews] = useState<Review[]>([]);
  const [pendingDorms, setPendingDorms] = useState<PendingDorm[]>([]);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'stats' | 'reviews' | 'dorms'>('stats');

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
      navigate('/?login=true');
      return;
    }

    fetchPendingReviews();
    fetchPendingDorms();
    fetchStats();
  }, [navigate]);

  const fetchPendingReviews = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/admin/reviews/pending`, {
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

  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/admin/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch stats');
      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error('Error loading stats:', err);
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchPendingDorms = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/admin/dorms/pending`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch pending dorms');
      }

      const data = await response.json();
      setPendingDorms(data);
    } catch (err) {
      console.error('Error loading pending dorms:', err);
    }
  };

  const handleApprove = async (reviewId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/admin/reviews/${reviewId}/approve`, {
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
      const response = await fetch(`${API_BASE}/api/admin/reviews/${reviewId}/decline`, {
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

  const handleApproveDorm = async (dormId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/admin/dorms/${dormId}/approve`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to approve dorm');
      }

      // Remove from pending list
      setPendingDorms(prev => prev.filter(d => d._id !== dormId));
    } catch (err) {
      alert('Error approving dorm');
      console.error(err);
    }
  };

  const handleDeclineDorm = async (dormId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/admin/dorms/${dormId}/decline`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to decline dorm');
      }

      // Remove from pending list
      setPendingDorms(prev => prev.filter(d => d._id !== dormId));
    } catch (err) {
      alert('Error declining dorm');
      console.error(err);
    }
  };

  const calculateOverallRating = (review: Review) => {
    return ((review.room + review.bathroom + review.building + review.amenities + review.location) / 5).toFixed(1);
  };

  const formatYears = (year: number[] | number) => {
    const labels = ['', '1st', '2nd', '3rd', '4th', 'Other'];
    if (Array.isArray(year)) {
      return year.map(y => y > 10 ? y.toString() : (labels[y] || 'N/A')).join(', ');
    }
    return (year as number) > 10 ? year.toString() : (labels[year as number] || 'N/A');
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

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '24px', marginBottom: '24px' }}>
          <button
            onClick={() => setActiveTab('stats')}
            style={{
              padding: '12px 24px',
              backgroundColor: activeTab === 'stats' ? '#1976d2' : '#e0e0e0',
              color: activeTab === 'stats' ? 'white' : '#333',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '14px',
              transition: 'all 0.2s'
            }}
          >
            📊 Stats
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            style={{
              padding: '12px 24px',
              backgroundColor: activeTab === 'reviews' ? '#1976d2' : '#e0e0e0',
              color: activeTab === 'reviews' ? 'white' : '#333',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '14px',
              transition: 'all 0.2s'
            }}
          >
            Pending Reviews ({pendingReviews.length})
          </button>
          <button
            onClick={() => setActiveTab('dorms')}
            style={{
              padding: '12px 24px',
              backgroundColor: activeTab === 'dorms' ? '#1976d2' : '#e0e0e0',
              color: activeTab === 'dorms' ? 'white' : '#333',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '14px',
              transition: 'all 0.2s'
            }}
          >
            Pending Dorms ({pendingDorms.length})
          </button>
        </div>

        {/* Stats Tab Content */}
        {activeTab === 'stats' && (
          <div style={{ marginTop: '32px' }}>
            <h2>📊 Analytics Overview</h2>
            {statsLoading ? (
              <p>Loading stats...</p>
            ) : !stats ? (
              <p>Unable to load stats.</p>
            ) : (
              <>
                {/* Stat Cards Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginTop: '20px' }}>
                  {[
                    { label: 'Total Users', value: stats.users.total, icon: '👥', color: '#1976d2' },
                    { label: 'New This Week', value: stats.users.newThisWeek, icon: '🆕', color: '#00897b' },
                    { label: 'Total Reviews', value: stats.reviews.total, icon: '📝', color: '#7b1fa2' },
                    { label: 'Reviews Today', value: stats.reviews.today, icon: '📅', color: '#e65100' },
                    { label: 'Reviews This Week', value: stats.reviews.thisWeek, icon: '📆', color: '#2e7d32' },
                    { label: 'Pending Approval', value: stats.reviews.pending, icon: '⏳', color: '#f57c00' },
                    { label: 'Total Dorms', value: stats.dorms.total, icon: '🏠', color: '#5c6bc0' },
                  ].map((stat) => (
                    <div key={stat.label} style={{
                      backgroundColor: '#fff',
                      border: '1px solid #e0e0e0',
                      borderRadius: '12px',
                      padding: '20px',
                      textAlign: 'center',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                      borderTop: `4px solid ${stat.color}`
                    }}>
                      <div style={{ fontSize: '28px', marginBottom: '8px' }}>{stat.icon}</div>
                      <div style={{ fontSize: '32px', fontWeight: '700', color: stat.color }}>{stat.value}</div>
                      <div style={{ fontSize: '13px', color: '#666', marginTop: '4px', fontWeight: '500' }}>{stat.label}</div>
                    </div>
                  ))}
                </div>

                {/* Top Lists */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginTop: '32px' }}>
                  {/* Top Dorms */}
                  <div style={{ backgroundColor: '#fff', border: '1px solid #e0e0e0', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                    <h3 style={{ margin: '0 0 16px 0', fontSize: '16px' }}>🏆 Top 5 Most Reviewed Dorms</h3>
                    {stats.topDorms.length === 0 ? (
                      <p style={{ color: '#999' }}>No data yet.</p>
                    ) : (
                      <ol style={{ margin: 0, paddingLeft: '20px' }}>
                        {stats.topDorms.map((d, i) => (
                          <li key={i} style={{ padding: '8px 0', borderBottom: i < stats.topDorms.length - 1 ? '1px solid #f0f0f0' : 'none' }}>
                            <strong>{d.dorm}</strong>
                            <span style={{ color: '#666', fontSize: '13px' }}> — {d.university}</span>
                            <span style={{ float: 'right', fontWeight: '700', color: '#1976d2' }}>{d.reviewCount} reviews</span>
                          </li>
                        ))}
                      </ol>
                    )}
                  </div>

                  {/* Top Universities */}
                  <div style={{ backgroundColor: '#fff', border: '1px solid #e0e0e0', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                    <h3 style={{ margin: '0 0 16px 0', fontSize: '16px' }}>🎓 Top 5 Most Active Universities</h3>
                    {stats.topUniversities.length === 0 ? (
                      <p style={{ color: '#999' }}>No data yet.</p>
                    ) : (
                      <ol style={{ margin: 0, paddingLeft: '20px' }}>
                        {stats.topUniversities.map((u, i) => (
                          <li key={i} style={{ padding: '8px 0', borderBottom: i < stats.topUniversities.length - 1 ? '1px solid #f0f0f0' : 'none' }}>
                            <strong>{u.university}</strong>
                            <span style={{ float: 'right', fontWeight: '700', color: '#7b1fa2' }}>{u.reviewCount} reviews</span>
                          </li>
                        ))}
                      </ol>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Reviews Tab Content */}
        {activeTab === 'reviews' && (
          <div style={{ marginTop: '32px' }}>
            <h2>Pending Reviews ({pendingReviews.length})</h2>

            {loading && <p>Loading...</p>}
            {error && <p style={{ color: 'red' }}>{error}</p>}

            {!loading && !error && pendingReviews.length === 0 && (
              <p>No pending reviews at this time.</p>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '20px' }}>
              {pendingReviews.map(review => (
                <div key={review._id} className="admin-card">
                  <div className="admin-card-inner">
                    <div className="admin-card-content">
                      <h3 style={{ margin: '0 0 8px 0' }}>
                        {review.dorm} - {review.university}
                      </h3>
                      <p style={{ margin: '4px 0', color: '#666' }}>
                        <strong>Overall Rating:</strong> {calculateOverallRating(review)} / 5.0
                      </p>
                      <p style={{ margin: '4px 0', color: '#666' }}>
                        <strong>Room Type:</strong> {formatRoomTypes(review.roomType)} |
                        <strong> Year:</strong> {formatYears(review.year)} |
                        <strong> Year:</strong> {formatYears(review.year)} |
                        <strong> Would Dorm Again:</strong> {review.wouldDormAgain ? 'Yes' : 'No'}
                      </p>
                      <p style={{ margin: '4px 0', color: '#666' }}>
                        <strong>Submitted by:</strong> {review.user || 'Unknown'}
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
                        <p className="admin-review-text">{review.description}</p>
                      </div>
                      {review.images && review.images.length > 0 && (
                        <div style={{ marginTop: '12px' }}>
                          <strong>Images ({review.images.length}):</strong>
                          <div className="admin-review-images">
                            {review.images.map((img, idx) => (
                              <img
                                key={idx}
                                src={img}
                                alt={`Review ${idx + 1}`}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                      <p style={{ fontSize: '12px', color: '#999', marginTop: '12px' }}>
                        Submitted: {review.createdAt ? new Date(review.createdAt).toLocaleString() : 'Unknown'}
                      </p>
                    </div>

                    <div className="admin-card-actions">
                      <button
                        onClick={() => handleApprove(review._id)}
                        className="admin-action-btn admin-btn-approve"
                      >
                        ✓ Approve
                      </button>
                      <button
                        onClick={() => handleDecline(review._id)}
                        className="admin-action-btn admin-btn-decline"
                      >
                        ✗ Decline
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Dorms Tab Content */}
        {activeTab === 'dorms' && (
          <div style={{ marginTop: '32px' }}>
            <h2>Pending Dorms ({pendingDorms.length})</h2>

            {pendingDorms.length === 0 && (
              <p>No pending dorm submissions at this time.</p>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '20px' }}>
              {pendingDorms.map(dorm => (
                <div key={dorm._id} className="admin-card">
                  <div className="admin-card-inner">
                    <div className="admin-card-content">
                      <h3 style={{ margin: '0 0 8px 0' }}>
                        {dorm.name}
                      </h3>
                      <p style={{ margin: '4px 0', color: '#666' }}>
                        <strong>University:</strong> {dorm.universitySlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </p>
                      {dorm.description && (
                        <div style={{ marginTop: '12px' }}>
                          <strong>Description:</strong>
                          <p className="admin-review-text">{dorm.description}</p>
                        </div>
                      )}
                      {dorm.amenities && dorm.amenities.length > 0 && (
                        <p style={{ margin: '8px 0', color: '#666' }}>
                          <strong>Amenities:</strong> {dorm.amenities.join(', ')}
                        </p>
                      )}
                      {dorm.roomTypes && dorm.roomTypes.length > 0 && (
                        <p style={{ margin: '8px 0', color: '#666' }}>
                          <strong>Room Types:</strong> {dorm.roomTypes.join(', ')}
                        </p>
                      )}
                      <div style={{ marginTop: '12px' }}>
                        <strong>Image:</strong>
                        <div className="admin-review-images">
                          <img
                            src={dorm.imageUrl || DefaultDorm}
                            alt={dorm.name}
                          />
                        </div>
                      </div>
                      <p style={{ fontSize: '12px', color: '#999', marginTop: '12px' }}>
                        Submitted by: {dorm.submittedBy || 'Unknown'} | {dorm.createdAt ? new Date(dorm.createdAt).toLocaleString() : 'Unknown date'}
                      </p>
                    </div>

                    <div className="admin-card-actions">
                      <button
                        onClick={() => handleApproveDorm(dorm._id)}
                        className="admin-action-btn admin-btn-approve"
                      >
                        ✓ Approve
                      </button>
                      <button
                        onClick={() => handleDeclineDorm(dorm._id)}
                        className="admin-action-btn admin-btn-decline"
                      >
                        ✗ Decline
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default AdminDashboard;
