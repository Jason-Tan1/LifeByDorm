import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import NavBar from '../nav/navbar';
import DefaultDorm from '../../assets/Default_Dorm.webp';
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
  pendingEdit?: {
    room: number;
    bathroom: number;
    building: number;
    amenities: number;
    location: number;
    description: string;
    year: number[];
    roomType: string[];
    wouldDormAgain?: boolean;
    images?: string[];
    submittedAt?: string;
  };
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
  universities: { total: number };
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
      } catch (_err) {
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
    <div className="admin-dashboard-container">
      <NavBar />
      <main className="admin-main">
        <div className="admin-header">
          <h1 className="admin-title">Admin Dashboard</h1>
          <p className="admin-subtitle">Review pending submissions and monitor application performance.</p>
        </div>

        {/* Tabs */}
        <div className="admin-tabs">
          <button
            onClick={() => setActiveTab('stats')}
            className={`admin-tab-btn ${activeTab === 'stats' ? 'active' : ''}`}
          >
            📊 Analytics Overview
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`admin-tab-btn ${activeTab === 'reviews' ? 'active' : ''}`}
          >
            📝 Pending Reviews ({pendingReviews.length})
          </button>
          <button
            onClick={() => setActiveTab('dorms')}
            className={`admin-tab-btn ${activeTab === 'dorms' ? 'active' : ''}`}
          >
            🏠 Pending Dorms ({pendingDorms.length})
          </button>
        </div>

        {/* Stats Tab Content */}
        {activeTab === 'stats' && (
          <div>
            {statsLoading ? (
              <p className="admin-empty-state">Loading stats...</p>
            ) : !stats ? (
              <p className="admin-empty-state">Unable to load stats.</p>
            ) : (
              <>
                {/* Stat Cards Grid */}
                <div className="admin-stats-grid">
                  {[
                    { label: 'Total Users', value: stats.users?.total ?? 0, icon: '👥', color: '#1976d2' },
                    { label: 'New This Week', value: stats.users?.newThisWeek ?? 0, icon: '🆕', color: '#00897b' },
                    { label: 'Total Reviews', value: stats.reviews?.total ?? 0, icon: '📝', color: '#7b1fa2' },
                    { label: 'Reviews Today', value: stats.reviews?.today ?? 0, icon: '📅', color: '#e65100' },
                    { label: 'Reviews This Week', value: stats.reviews?.thisWeek ?? 0, icon: '📆', color: '#2e7d32' },
                    { label: 'Total Universities', value: stats.universities?.total ?? 0, icon: '🎓', color: '#d81b60' },
                    { label: 'Pending Approval', value: stats.reviews?.pending ?? 0, icon: '⏳', color: '#f57c00' },
                    { label: 'Total Dorms', value: stats.dorms?.total ?? 0, icon: '🏠', color: '#5c6bc0' },
                  ].map((stat) => (
                    <div key={stat.label} className="admin-stat-card" style={{ borderTop: `4px solid ${stat.color}` }}>
                      <div className="admin-stat-icon">{stat.icon}</div>
                      <div className="admin-stat-value" style={{ color: stat.color }}>{stat.value}</div>
                      <div className="admin-stat-label">{stat.label}</div>
                    </div>
                  ))}
                </div>

                {/* Top Lists */}
                <div className="admin-lists-container">
                  {/* Top Dorms */}
                  <div className="admin-list-card">
                    <h3>🏆 Top 10 Most Reviewed Dorms</h3>
                    {(!stats.topDorms || stats.topDorms.length === 0) ? (
                      <p className="admin-empty-state">No data yet.</p>
                    ) : (
                      <ul className="admin-list">
                        {stats.topDorms.map((d, i) => (
                          <li key={i} className="admin-list-item">
                            <div>
                              <strong>{i + 1}. {d.dorm}</strong>
                              <span> — {d.university}</span>
                            </div>
                            <span className="admin-review-count" style={{ fontWeight: '700', color: '#1976d2' }}>{d.reviewCount} reviews</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Top Universities */}
                  <div className="admin-list-card">
                    <h3>🎓 Top 10 Most Active Universities</h3>
                    {(!stats.topUniversities || stats.topUniversities.length === 0) ? (
                      <p className="admin-empty-state">No data yet.</p>
                    ) : (
                      <ul className="admin-list">
                        {stats.topUniversities.map((u, i) => (
                          <li key={i} className="admin-list-item">
                            <strong>{i + 1}. {u.university}</strong>
                            <span className="admin-review-count" style={{ fontWeight: '700', color: '#7b1fa2' }}>{u.reviewCount} reviews</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Reviews Tab Content */}
        {activeTab === 'reviews' && (
          <div>
            {loading && <p className="admin-empty-state">Loading...</p>}
            {error && <p className="admin-empty-state" style={{ color: 'red' }}>{error}</p>}

            {!loading && !error && pendingReviews.length === 0 && (
              <p className="admin-empty-state">No pending reviews at this time. Great job! 🎉</p>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', marginTop: '10px' }}>
              {pendingReviews.map(review => {
                const pe = review.pendingEdit;
                const dRoom = pe ? pe.room : review.room;
                const dBathroom = pe ? pe.bathroom : review.bathroom;
                const dBuilding = pe ? pe.building : review.building;
                const dAmenities = pe ? pe.amenities : review.amenities;
                const dLocation = pe ? pe.location : review.location;
                const dDescription = pe ? pe.description : review.description;
                const dYear = pe ? pe.year : review.year;
                const dRoomType = pe ? pe.roomType : review.roomType;
                const dWouldDormAgain = pe ? pe.wouldDormAgain : review.wouldDormAgain;
                const dImages = pe ? pe.images : review.images;
                const dOverall = ((dRoom + dBathroom + dBuilding + dAmenities + dLocation) / 5).toFixed(1);

                return (
                  <div key={review._id} className="admin-card">
                    <div className="admin-card-inner">
                      <div className="admin-card-content">
                        <h3>
                          {review.dorm} - {review.university}
                          {review.pendingEdit ? (
                            <span className="admin-badge admin-badge-edit">✏️ EDITED</span>
                          ) : (
                            <span className="admin-badge admin-badge-new">🆕 NEW</span>
                          )}
                        </h3>
                        <p>
                          <strong>Overall Rating:</strong> {dOverall} / 5.0
                        </p>
                        <p>
                          <strong>Room Type:</strong> {formatRoomTypes(dRoomType)} &nbsp;|&nbsp;
                          <strong> Year:</strong> {formatYears(dYear)} &nbsp;|&nbsp;
                          <strong> Would Dorm Again:</strong> {dWouldDormAgain ? 'Yes 👍' : 'No 👎'}
                        </p>
                        <p>
                          <strong>Submitted by:</strong> {review.user || 'Unknown'}
                        </p>
                        <div style={{ marginTop: '16px' }}>
                          <strong>Individual Ratings:</strong>
                          <div className="admin-ratings-grid">
                            <span>🛏️ Room: {dRoom}/5</span>
                            <span>🚿 Bathroom: {dBathroom}/5</span>
                            <span>🏢 Building: {dBuilding}/5</span>
                            <span>✨ Amenities: {dAmenities}/5</span>
                            <span>📍 Location: {dLocation}/5</span>
                          </div>
                        </div>
                        <div style={{ marginTop: '16px' }}>
                          <strong>User Comment:</strong>
                          <p className="admin-review-text">{dDescription}</p>
                        </div>
                        {(() => {
                          const hasImagesArray = dImages && dImages.length > 0;
                          const hasFileImage = !!review.fileImage;

                          if (!hasImagesArray && !hasFileImage) return null;

                          const imagesToShow = hasImagesArray ? dImages! : [review.fileImage!];

                          return (
                            <div style={{ marginTop: '12px' }}>
                              <strong>Images ({imagesToShow.length}):</strong>
                              <div className="admin-review-images">
                                {imagesToShow.map((img, idx) => (
                                  <img
                                    key={idx}
                                    src={img}
                                    alt={`Review ${idx + 1}`}
                                  />
                                ))}
                              </div>
                            </div>
                          );
                        })()}
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
                );
              })}
            </div>
          </div>
        )}

        {/* Dorms Tab Content */}
        {activeTab === 'dorms' && (
          <div>
            {pendingDorms.length === 0 ? (
              <p className="admin-empty-state">No pending dorm submissions at this time.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', marginTop: '10px' }}>
                {pendingDorms.map(dorm => (
                  <div key={dorm._id} className="admin-card">
                    <div className="admin-card-inner">
                      <div className="admin-card-content">
                        <h3>{dorm.name}</h3>
                        <p>
                          <strong>University:</strong> {dorm.universitySlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </p>
                        {dorm.description && (
                          <div style={{ marginTop: '16px' }}>
                            <strong>Description:</strong>
                            <p className="admin-review-text">{dorm.description}</p>
                          </div>
                        )}
                        {dorm.amenities && dorm.amenities.length > 0 && (
                          <p style={{ marginTop: '12px' }}>
                            <strong>Amenities:</strong> {dorm.amenities.join(', ')}
                          </p>
                        )}
                        {dorm.roomTypes && dorm.roomTypes.length > 0 && (
                          <p style={{ marginTop: '8px' }}>
                            <strong>Room Types:</strong> {dorm.roomTypes.join(', ')}
                          </p>
                        )}
                        <div style={{ marginTop: '16px' }}>
                          <strong>Image:</strong>
                          <div className="admin-review-images">
                            <img
                              src={dorm.imageUrl || DefaultDorm}
                              alt={dorm.name}
                            />
                          </div>
                        </div>
                        <p style={{ fontSize: '12px', color: '#999', marginTop: '16px' }}>
                          Submitted by: {dorm.submittedBy || 'Unknown'} &nbsp;|&nbsp; {dorm.createdAt ? new Date(dorm.createdAt).toLocaleString() : 'Unknown date'}
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
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default AdminDashboard;
