import { useEffect, useState, useRef, useCallback } from 'react';
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
  reviews: { total: number; approved: number; pending: number; today: number; thisWeek: number; selectedPeriod?: number };
  dorms: { total: number };
  universities: { total: number };
  periodDays?: number;
  topDorms: { dorm: string; university: string; reviewCount: number }[];
  topUniversities: { university: string; reviewCount: number }[];
  googleAnalytics?: {
    configured: boolean;
    available: boolean;
    propertyId?: string;
    activeUsers: number;
    totalUsers: number;
    newUsers: number;
    sessions: number;
    pageViews: number;
    bounceRate: number | null;
    averageSessionDuration: number | null;
    topPages: { path: string; title: string; views: number; activeUsers: number }[];
    dailyTraffic: { date: string; activeUsers: number; sessions: number; pageViews: number }[];
    error?: string;
  };
}

function TrafficChart({ data }: { data: { date: string; activeUsers: number; sessions: number; pageViews: number }[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; day: typeof data[0] } | null>(null);
  const [containerWidth, setContainerWidth] = useState(600);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) setContainerWidth(entry.contentRect.width);
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (data.length < 2) return;
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const padL = 0, padR = 0;
    const chartW = containerWidth - padL - padR;
    const idx = Math.round(((mouseX - padL) / chartW) * (data.length - 1));
    const clamped = Math.max(0, Math.min(data.length - 1, idx));
    const ptX = padL + (clamped / (data.length - 1)) * chartW;
    const maxPV = Math.max(...data.map(d => d.pageViews), 1);
    const ptY = 180 - (data[clamped].pageViews / maxPV) * 150 - 10;
    setTooltip({ x: ptX, y: ptY, day: data[clamped] });
  }, [data, containerWidth]);

  if (data.length === 0) return <p className="admin-empty-state">No traffic data available.</p>;

  const maxPV = Math.max(...data.map(d => d.pageViews), 1);
  const height = 180;
  const padTop = 10, padBot = 20;
  const chartH = height - padTop - padBot;
  const w = containerWidth;

  const points = data.map((d, i) => {
    const x = data.length === 1 ? w / 2 : (i / (data.length - 1)) * w;
    const y = padTop + chartH - (d.pageViews / maxPV) * chartH;
    return { x, y };
  });

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const areaPath = `${linePath} L${points[points.length - 1].x.toFixed(1)},${height - padBot} L${points[0].x.toFixed(1)},${height - padBot} Z`;

  // Show ~5-7 evenly-spaced date labels
  const labelCount = Math.min(data.length, Math.max(3, Math.min(7, Math.floor(w / 90))));
  const labelIndices: number[] = [];
  for (let i = 0; i < labelCount; i++) {
    labelIndices.push(Math.round((i / (labelCount - 1)) * (data.length - 1)));
  }

  return (
    <div className="admin-traffic-chart" ref={containerRef}>
      <svg
        width="100%"
        height={height}
        viewBox={`0 0 ${w} ${height}`}
        preserveAspectRatio="none"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setTooltip(null)}
      >
        <defs>
          <linearGradient id="trafficGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3a8dde" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#3a8dde" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {/* Grid lines */}
        {[0.25, 0.5, 0.75].map(frac => {
          const gy = padTop + chartH - frac * chartH;
          return <line key={frac} x1="0" y1={gy} x2={w} y2={gy} stroke="#edf1f6" strokeWidth="1" />;
        })}
        {/* Area fill */}
        <path d={areaPath} fill="url(#trafficGrad)" />
        {/* Line */}
        <path d={linePath} fill="none" stroke="#3a8dde" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        {/* Tooltip dot */}
        {tooltip && (
          <circle cx={tooltip.x} cy={tooltip.y} r="5" fill="#3a8dde" stroke="#fff" strokeWidth="2" />
        )}
      </svg>
      {/* X-axis labels */}
      <div className="admin-traffic-labels">
        {labelIndices.map(idx => (
          <span key={idx} style={{ left: `${(idx / (data.length - 1)) * 100}%` }}>
            {data[idx].date.slice(5)}
          </span>
        ))}
      </div>
      {/* Tooltip */}
      {tooltip && (
        <div
          className="admin-traffic-tooltip"
          style={{ left: tooltip.x, top: tooltip.y - 10 }}
        >
          <strong>{tooltip.day.pageViews.toLocaleString()} views</strong>
          <span>{tooltip.day.sessions.toLocaleString()} sessions</span>
          <span>{tooltip.day.date}</span>
        </div>
      )}
    </div>
  );
}

function AdminDashboard() {
  const navigate = useNavigate();
  const [pendingReviews, setPendingReviews] = useState<Review[]>([]);
  const [pendingDorms, setPendingDorms] = useState<PendingDorm[]>([]);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [analyticsDays, setAnalyticsDays] = useState<number>(14);
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

  const fetchStats = async (days = analyticsDays) => {
    try {
      setStatsLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/admin/stats?days=${days}`, {
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

  const formatNumber = (value: number) => value.toLocaleString();

  const formatPercent = (value: number | null | undefined) => {
    if (value === null || value === undefined) return 'N/A';
    return `${(value * 100).toFixed(1)}%`;
  };

  const formatDuration = (seconds: number | null | undefined) => {
    if (seconds === null || seconds === undefined) return 'N/A';
    const total = Math.max(0, Math.floor(seconds));
    const mins = Math.floor(total / 60);
    const secs = total % 60;
    return `${mins}m ${secs}s`;
  };

  const activePeriodDays = stats?.periodDays || analyticsDays;

  return (
    <div className="admin-dashboard-container">
      <NavBar />
      <main className="admin-main">
        <div className="admin-header">
          <div>
            <h1 className="admin-title">Admin Dashboard</h1>
            <p className="admin-subtitle">Operations + website analytics in one place.</p>
          </div>
          <button className="admin-refresh-btn" onClick={() => fetchStats()}>
            Refresh Stats
          </button>
        </div>

        {/* Tabs */}
        <div className="admin-tabs">
          <button
            onClick={() => setActiveTab('stats')}
            className={`admin-tab-btn ${activeTab === 'stats' ? 'active' : ''}`}
          >
            Analytics Overview
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`admin-tab-btn ${activeTab === 'reviews' ? 'active' : ''}`}
          >
            Pending Reviews ({pendingReviews.length})
          </button>
          <button
            onClick={() => setActiveTab('dorms')}
            className={`admin-tab-btn ${activeTab === 'dorms' ? 'active' : ''}`}
          >
            Pending Dorms ({pendingDorms.length})
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
                <div className="admin-dashboard-shell">
                  <section className="admin-controls-row">
                    <div className="admin-filter-group">
                      <label htmlFor="analytics-days">Time Range</label>
                      <select
                        id="analytics-days"
                        value={analyticsDays}
                        onChange={(e) => {
                          const days = Number(e.target.value);
                          setAnalyticsDays(days);
                          fetchStats(days);
                        }}
                      >
                        <option value={7}>Last 7 days</option>
                        <option value={14}>Last 14 days</option>
                        <option value={30}>Last 30 days</option>
                        <option value={60}>Last 60 days</option>
                        <option value={90}>Last 90 days</option>
                        <option value={365}>Last 365 days</option>
                      </select>
                    </div>
                  </section>

                  <section className="admin-kpi-row">
                    {[
                      { label: 'Logged Users', value: formatNumber(stats.users?.total ?? 0), meta: `+${formatNumber(stats.users?.newThisWeek ?? 0)} this week` },
                      { label: 'Reviews', value: formatNumber(stats.reviews?.total ?? 0), meta: `${formatNumber(stats.reviews?.selectedPeriod ?? 0)} in ${activePeriodDays}d` },
                      { label: 'Pending Reviews', value: formatNumber(stats.reviews?.pending ?? 0), meta: 'Needs moderation' },
                      { label: 'Dorms', value: formatNumber(stats.dorms?.total ?? 0), meta: `${formatNumber(stats.universities?.total ?? 0)} universities` },
                      {
                        label: `GA Active Users (${activePeriodDays}d)`,
                        value: formatNumber(stats.googleAnalytics?.activeUsers ?? 0),
                        meta: stats.googleAnalytics?.available ? 'Google Analytics' : 'GA unavailable'
                      },
                      {
                        label: `GA Page Views (${activePeriodDays}d)`,
                        value: formatNumber(stats.googleAnalytics?.pageViews ?? 0),
                        meta: stats.googleAnalytics?.available ? `Bounce ${formatPercent(stats.googleAnalytics?.bounceRate)}` : 'Configure GA env vars'
                      }
                    ].map((stat) => (
                      <article key={stat.label} className="admin-kpi-tile">
                        <p className="admin-kpi-label">{stat.label}</p>
                        <p className="admin-kpi-value">{stat.value}</p>
                        <p className="admin-kpi-meta">{stat.meta}</p>
                      </article>
                    ))}
                  </section>

                  <section className="admin-analytics-grid">
                    <article className="admin-panel">
                      <div className="admin-panel-head">
                        <h3>Website Traffic (Last {activePeriodDays} Days)</h3>
                        <span>{stats.googleAnalytics?.propertyId ? `GA4 Property ${stats.googleAnalytics.propertyId}` : 'GA4 Not Configured'}</span>
                      </div>

                      {!stats.googleAnalytics?.configured ? (
                        <p className="admin-empty-state">Google Analytics is not configured yet. Add GA4 environment variables on the server.</p>
                      ) : !stats.googleAnalytics?.available ? (
                        <p className="admin-empty-state">{stats.googleAnalytics?.error || 'Google Analytics data is unavailable.'}</p>
                      ) : (
                        <>
                          <div className="admin-mini-metrics">
                            <div>
                              <span>Sessions ({activePeriodDays}d)</span>
                              <strong>{formatNumber(stats.googleAnalytics.sessions)}</strong>
                            </div>
                            <div>
                              <span>Total Users ({activePeriodDays}d)</span>
                              <strong>{formatNumber(stats.googleAnalytics.totalUsers)}</strong>
                            </div>
                            <div>
                              <span>Avg Session</span>
                              <strong>{formatDuration(stats.googleAnalytics.averageSessionDuration)}</strong>
                            </div>
                          </div>

                          <TrafficChart data={stats.googleAnalytics.dailyTraffic || []} />
                        </>
                      )}
                    </article>

                    <article className="admin-panel">
                      <div className="admin-panel-head">
                        <h3>Top Website Pages ({activePeriodDays} Days)</h3>
                        <span>From Google Analytics</span>
                      </div>

                      {!stats.googleAnalytics?.available ? (
                        <p className="admin-empty-state">No GA page data available.</p>
                      ) : (
                        <div className="admin-page-table">
                          <div className="admin-page-table-head">
                            <span>Page</span>
                            <span>Views</span>
                            <span>Active Users</span>
                          </div>
                          {(stats.googleAnalytics?.topPages || []).map((page, idx) => (
                            <div key={`${page.path}-${idx}`} className="admin-page-table-row">
                              <span>{page.title || page.path}</span>
                              <span>{formatNumber(page.views)}</span>
                              <span>{formatNumber(page.activeUsers)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </article>
                  </section>
                </div>

                {/* Top Lists */}
                <div className="admin-lists-container">
                  {/* Top Dorms */}
                  <div className="admin-list-card">
                    <div className="admin-panel-head">
                      <h3>Top 10 Most Reviewed Dorms</h3>
                      <span>Internal review data ({activePeriodDays}d)</span>
                    </div>
                    {(!stats.topDorms || stats.topDorms.length === 0) ? (
                      <p className="admin-empty-state">No data yet.</p>
                    ) : (
                      <ul className="admin-list admin-ranked-list">
                        {stats.topDorms.map((d, i) => (
                          <li key={i} className="admin-list-item">
                            <div className="admin-rank-pill">{i + 1}</div>
                            <div className="admin-list-primary">
                              <strong>{d.dorm}</strong>
                              <span>{d.university}</span>
                            </div>
                            <span className="admin-review-count">{d.reviewCount} reviews</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Top Universities */}
                  <div className="admin-list-card">
                    <div className="admin-panel-head">
                      <h3>Top 10 Most Active Universities</h3>
                      <span>Internal review data ({activePeriodDays}d)</span>
                    </div>
                    {(!stats.topUniversities || stats.topUniversities.length === 0) ? (
                      <p className="admin-empty-state">No data yet.</p>
                    ) : (
                      <ul className="admin-list admin-ranked-list">
                        {stats.topUniversities.map((u, i) => (
                          <li key={i} className="admin-list-item">
                            <div className="admin-rank-pill">{i + 1}</div>
                            <div className="admin-list-primary">
                              <strong>{u.university}</strong>
                              <span>University</span>
                            </div>
                            <span className="admin-review-count">{u.reviewCount} reviews</span>
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
