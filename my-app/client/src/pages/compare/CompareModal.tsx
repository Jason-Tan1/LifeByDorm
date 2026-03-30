import { useEffect, useState, useCallback, useRef } from 'react';
import { useUniversityData } from '../../context/UniversityDataContext';
import DefaultDorm from '../../assets/Default_Dorm.webp';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './compare.css';

const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const API_BASE = isLocal ? '' : ((import.meta as any).env?.VITE_API_BASE || '');

type DormOption = {
  name: string;
  slug: string;
  universitySlug: string;
  imageUrl?: string;
  reviewCount?: number;
};

type ComparisonStats = {
  name: string;
  slug: string;
  universitySlug: string;
  imageUrl?: string;
  amenities: string[];
  roomTypes: string[];
  reviewCount: number;
  avgRoom: number;
  avgBathroom: number;
  avgBuilding: number;
  avgAmenities: number;
  avgLocation: number;
  avgOverall: number;
  wouldDormAgainPct: number;
};

type ComparisonResult = {
  dorm1: ComparisonStats;
  dorm2: ComparisonStats;
  comparison: string | null;
};

function SkeletonBlock({ width, height }: { width?: string; height?: string }) {
  return <div className="skeleton-pulse" style={{ width: width || '100%', height: height || '16px', borderRadius: '6px' }} />;
}

interface CompareModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialUni1?: string;
  initialDorm1?: string;
}

function CompareModal({ isOpen, onClose, initialUni1, initialDorm1 }: CompareModalProps) {
  const { universities } = useUniversityData();
  const resultsRef = useRef<HTMLDivElement>(null);

  const [uni1, setUni1] = useState(initialUni1 || '');
  const [dorm1, setDorm1] = useState(initialDorm1 || '');
  const [uni2, setUni2] = useState('');
  const [dorm2, setDorm2] = useState('');

  const [dorms1, setDorms1] = useState<DormOption[]>([]);
  const [dorms2, setDorms2] = useState<DormOption[]>([]);

  const [result, setResult] = useState<ComparisonResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [barsAnimated, setBarsAnimated] = useState(false);

  // Reset state when opened with new initial props
  useEffect(() => {
    if (isOpen) {
      setUni1(initialUni1 || '');
      setDorm1(initialDorm1 || '');
      setUni2(initialUni1 || '');
      setDorm2('');
      setResult(null);
      setCollapsed(false);
      setBarsAnimated(false);
      setError(null);
    }
  }, [isOpen, initialUni1, initialDorm1]);

  const fetchDorms = useCallback(async (uniSlug: string, setter: (d: DormOption[]) => void) => {
    if (!uniSlug) { setter([]); return; }
    try {
      const res = await fetch(`${API_BASE}/api/universities/${uniSlug}/dorms-stats`);
      if (res.ok) {
        const data = await res.json();
        setter(Array.isArray(data) ? data : data.dorms || []);
      } else {
        const res2 = await fetch(`${API_BASE}/api/universities/${uniSlug}/dorms`);
        if (res2.ok) setter(await res2.json());
      }
    } catch { setter([]); }
  }, []);

  useEffect(() => { fetchDorms(uni1, setDorms1); }, [uni1, fetchDorms]);
  useEffect(() => { fetchDorms(uni2, setDorms2); }, [uni2, fetchDorms]);

  const selectedDorm1 = dorms1.find(d => d.slug === dorm1);
  const selectedDorm2 = dorms2.find(d => d.slug === dorm2);

  const handleCompare = async () => {
    if (!dorm1 || !uni1 || !dorm2 || !uni2) return;
    setCollapsed(true);
    setLoading(true);
    setError(null);
    setResult(null);
    setBarsAnimated(false);

    try {
      const res = await fetch(
        `${API_BASE}/api/compare?dorm1=${dorm1}&uni1=${uni1}&dorm2=${dorm2}&uni2=${uni2}`
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Failed to compare dorms');
        setCollapsed(false);
        return;
      }
      setResult(data);
      // Scroll to results and animate bars after they render
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setBarsAnimated(true);
      }, 150);
    } catch {
      setError('Failed to compare dorms. Please try again.');
      setCollapsed(false);
    } finally {
      setLoading(false);
    }
  };

  const handleNewComparison = () => {
    setCollapsed(false);
    setResult(null);
    setError(null);
    setBarsAnimated(false);
  };

  const canCompare = dorm1 && uni1 && dorm2 && uni2 && !(uni1 === uni2 && dorm1 === dorm2);

  const uniName = (slug: string) =>
    universities.find(u => u.slug === slug)?.name || slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  const renderRatingBar = (label: string, val1: number, val2: number) => {
    const better1 = val1 > val2;
    const better2 = val2 > val1;
    const w1 = barsAnimated ? `${(val1 / 5) * 100}%` : '0%';
    const w2 = barsAnimated ? `${(val2 / 5) * 100}%` : '0%';
    return (
      <div className="compare-rating-row">
        <span className={`compare-rating-value ${better1 ? 'better' : ''}`}>{val1.toFixed(1)}</span>
        <div className="compare-rating-bar-wrapper">
          <div className="compare-rating-bar left">
            <div className="compare-rating-fill left" style={{ width: w1 }} />
          </div>
          <span className="compare-rating-label">{label}</span>
          <div className="compare-rating-bar right">
            <div className="compare-rating-fill right" style={{ width: w2 }} />
          </div>
        </div>
        <span className={`compare-rating-value ${better2 ? 'better' : ''}`}>{val2.toFixed(1)}</span>
      </div>
    );
  };

  const renderSkeleton = () => (
    <div className="compare-results" ref={resultsRef}>
      <div className="compare-headers">
        <div className="compare-dorm-header dorm-left">
          <SkeletonBlock height="140px" />
          <div style={{ marginTop: 12 }}><SkeletonBlock width="70%" height="20px" /></div>
          <div style={{ marginTop: 8 }}><SkeletonBlock width="50%" height="14px" /></div>
          <div style={{ marginTop: 12, display: 'flex', gap: 6, justifyContent: 'center' }}>
            <SkeletonBlock width="50px" height="24px" />
            <SkeletonBlock width="70px" height="24px" />
            <SkeletonBlock width="90px" height="24px" />
          </div>
        </div>
        <div className="compare-dorm-header dorm-right">
          <SkeletonBlock height="140px" />
          <div style={{ marginTop: 12 }}><SkeletonBlock width="70%" height="20px" /></div>
          <div style={{ marginTop: 8 }}><SkeletonBlock width="50%" height="14px" /></div>
          <div style={{ marginTop: 12, display: 'flex', gap: 6, justifyContent: 'center' }}>
            <SkeletonBlock width="50px" height="24px" />
            <SkeletonBlock width="70px" height="24px" />
            <SkeletonBlock width="90px" height="24px" />
          </div>
        </div>
      </div>

      <div className="compare-ratings-section">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} style={{ marginBottom: 14 }}><SkeletonBlock height="14px" /></div>
        ))}
      </div>

      <div className="compare-ai-card">
        <SkeletonBlock width="40%" height="20px" />
        <div style={{ marginTop: 16 }}>
          <SkeletonBlock height="14px" />
          <div style={{ marginTop: 8 }}><SkeletonBlock height="14px" /></div>
          <div style={{ marginTop: 8 }}><SkeletonBlock width="80%" height="14px" /></div>
          <div style={{ marginTop: 8 }}><SkeletonBlock height="14px" /></div>
          <div style={{ marginTop: 8 }}><SkeletonBlock width="60%" height="14px" /></div>
        </div>
      </div>
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="compare-modal-overlay" onClick={onClose}>
      <div className="compare-modal-container" onClick={(e) => e.stopPropagation()}>
        <button className="compare-modal-close" onClick={onClose} aria-label="Close">
          &times;
        </button>

        {/* Collapsed top bar showing selections */}
        {collapsed && (
          <div className="compare-collapsed-bar">
            <div className="compare-collapsed-info">
              <span className="collapsed-dorm-name">{selectedDorm1?.name || dorm1}</span>
              <span className="collapsed-vs">vs</span>
              <span className="collapsed-dorm-name">{selectedDorm2?.name || dorm2}</span>
            </div>
            <button className="compare-change-btn" onClick={handleNewComparison}>
              Change
            </button>
          </div>
        )}

        {/* Full selection area — hidden when collapsed */}
        {!collapsed && (
          <>
            <div className="compare-hero">
              <h1 className="compare-title">Compare Dorms</h1>
              <p className="compare-subtitle">Select another dorm at {uniName(initialUni1 || '')} to see a side-by-side breakdown</p>
            </div>

            <div className="compare-selection-area">
              <div className={`compare-select-card ${selectedDorm1 ? 'has-selection' : ''}`}>
                <div className="compare-select-card-inner">
                  {selectedDorm1 && (
                    <img src={selectedDorm1.imageUrl || DefaultDorm} alt={selectedDorm1.name} className="compare-preview-image" />
                  )}
                  <div className="compare-select-fields">
                    <select value={dorm1} onChange={e => setDorm1(e.target.value)}>
                      <option value="">Select dorm...</option>
                      {dorms1.map(d => (
                        <option key={d.slug} value={d.slug}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="compare-vs-badge">VS</div>

              <div className={`compare-select-card ${selectedDorm2 ? 'has-selection' : ''}`}>
                <div className="compare-select-card-inner">
                  {selectedDorm2 && (
                    <img src={selectedDorm2.imageUrl || DefaultDorm} alt={selectedDorm2.name} className="compare-preview-image" />
                  )}
                  <div className="compare-select-fields">
                    <select value={dorm2} onChange={e => setDorm2(e.target.value)}>
                      <option value="">Select dorm...</option>
                      {dorms2.map(d => (
                        <option key={d.slug} value={d.slug}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <button
              className="compare-button"
              onClick={handleCompare}
              disabled={!canCompare || loading}
            >
              Compare Dorms
            </button>
          </>
        )}

        {error && <p className="compare-error">{error}</p>}

        {/* Skeleton while loading */}
        {loading && renderSkeleton()}

        {/* Actual results */}
        {result && !loading && (
          <div className="compare-results compare-results-animated" ref={resultsRef}>
            <div className="compare-headers">
              <div className="compare-dorm-header dorm-left">
                <img src={result.dorm1.imageUrl || DefaultDorm} alt={result.dorm1.name} className="compare-dorm-image" />
                <h2>{result.dorm1.name}</h2>
                <p className="compare-uni-name">{uniName(result.dorm1.universitySlug)}</p>
                <div className="compare-stat-pills">
                  <span className="compare-pill">{result.dorm1.avgOverall.toFixed(1)}/5</span>
                  <span className="compare-pill">{result.dorm1.reviewCount} reviews</span>
                  <span className="compare-pill">{result.dorm1.wouldDormAgainPct}% would return</span>
                </div>
              </div>

              <div className="compare-dorm-header dorm-right">
                <img src={result.dorm2.imageUrl || DefaultDorm} alt={result.dorm2.name} className="compare-dorm-image" />
                <h2>{result.dorm2.name}</h2>
                <p className="compare-uni-name">{uniName(result.dorm2.universitySlug)}</p>
                <div className="compare-stat-pills">
                  <span className="compare-pill">{result.dorm2.avgOverall.toFixed(1)}/5</span>
                  <span className="compare-pill">{result.dorm2.reviewCount} reviews</span>
                  <span className="compare-pill">{result.dorm2.wouldDormAgainPct}% would return</span>
                </div>
              </div>
            </div>

            <div className="compare-ratings-section">
              <div className="compare-ratings-legend">
                <span className="legend-dot left" /><span>{result.dorm1.name}</span>
                <span className="legend-dot right" /><span>{result.dorm2.name}</span>
              </div>
              {renderRatingBar('Room', result.dorm1.avgRoom, result.dorm2.avgRoom)}
              {renderRatingBar('Bathroom', result.dorm1.avgBathroom, result.dorm2.avgBathroom)}
              {renderRatingBar('Building', result.dorm1.avgBuilding, result.dorm2.avgBuilding)}
              {renderRatingBar('Amenities', result.dorm1.avgAmenities, result.dorm2.avgAmenities)}
              {renderRatingBar('Location', result.dorm1.avgLocation, result.dorm2.avgLocation)}
            </div>

            {result.comparison && (
              <div className="compare-ai-card compare-ai-animated">
                <h2 className="compare-ai-header">AI Comparison</h2>
                <div className="compare-ai-text"><ReactMarkdown remarkPlugins={[remarkGfm]}>{result.comparison}</ReactMarkdown></div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default CompareModal;
