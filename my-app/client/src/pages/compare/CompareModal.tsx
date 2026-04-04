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



interface CompareModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialUni1?: string;
  initialDorm1?: string;
}

function CompareModal({ isOpen, onClose, initialUni1, initialDorm1 }: CompareModalProps) {
  const { universities } = useUniversityData();
  const resultsRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const [uni1, setUni1] = useState(initialUni1 || '');
  const [dorm1, setDorm1] = useState(initialDorm1 || '');
  const [uni2, setUni2] = useState('');
  const [dorm2, setDorm2] = useState('');

  const [dorms1, setDorms1] = useState<DormOption[]>([]);
  const [dorms2, setDorms2] = useState<DormOption[]>([]);

  const [isDorm1Open, setIsDorm1Open] = useState(false);
  const [isDorm2Open, setIsDorm2Open] = useState(false);
  const dorm1Ref = useRef<HTMLDivElement>(null);
  const dorm2Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dorm1Ref.current && !dorm1Ref.current.contains(event.target as Node)) {
        setIsDorm1Open(false);
      }
      if (dorm2Ref.current && !dorm2Ref.current.contains(event.target as Node)) {
        setIsDorm2Open(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Close modal on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  // Prevent background scrolling while modal is open
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [isOpen]);

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
      if (modalRef.current) {
        modalRef.current.scrollTop = 0;
      }
    }
  }, [isOpen, initialUni1, initialDorm1]);

  const fetchDorms = useCallback(async (uniSlug: string, setter: (d: DormOption[]) => void, signal?: AbortSignal) => {
    if (!uniSlug) { setter([]); return; }
    try {
      const res = await fetch(`${API_BASE}/api/universities/${uniSlug}/dorms-stats`, { signal });
      if (res.ok) {
        const data = await res.json();
        setter(Array.isArray(data) ? data : data.dorms || []);
      } else {
        const res2 = await fetch(`${API_BASE}/api/universities/${uniSlug}/dorms`, { signal });
        if (res2.ok) setter(await res2.json());
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setter([]);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchDorms(uni1, setDorms1, controller.signal);
    return () => controller.abort();
  }, [uni1, fetchDorms]);

  useEffect(() => {
    const controller = new AbortController();
    fetchDorms(uni2, setDorms2, controller.signal);
    return () => controller.abort();
  }, [uni2, fetchDorms]);

  const selectedDorm1 = dorms1.find(d => d.slug === dorm1);
  const selectedDorm2 = dorms2.find(d => d.slug === dorm2);

  const handleCompare = async () => {
    if (!dorm1 || !uni1 || !dorm2 || !uni2) return;
    setCollapsed(true);
    setLoading(true);
    setError(null);
    setResult(null);
    setBarsAnimated(false);
    
    if (modalRef.current) {
      modalRef.current.scrollTop = 0;
    }

    try {
      const params = new URLSearchParams({ dorm1, uni1, dorm2, uni2 });
      const res = await fetch(`${API_BASE}/api/compare?${params}`);
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
    if (modalRef.current) {
      modalRef.current.scrollTop = 0;
    }
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
    <div className="compare-results" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 0' }} ref={resultsRef}>
      <div className="compare-circle-spinner" />
      <p style={{ marginTop: 24, fontSize: '1.05rem', color: '#666', fontWeight: 600 }}>Analyzing and Comparing Dorms...</p>
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="compare-modal-overlay" onClick={onClose}>
      <div className="compare-modal-container" ref={modalRef} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="compare-modal-title">
        <button className="compare-modal-close" onClick={onClose} aria-label="Close">
          &times;
        </button>

        {/* Full selection area — hidden when collapsed */}
        {!collapsed && (
          <>
            <div className="compare-hero">
              <h1 className="compare-title" id="compare-modal-title">Compare Dorms</h1>
              <p className="compare-subtitle">Select another dorm at {uniName(initialUni1 || '')} to see a side-by-side breakdown</p>
              <p className="compare-disclaimer" style={{ fontSize: '0.85rem', color: '#888', marginTop: '8px', fontWeight: 500 }}>
                * Note: Only dorms with 3 or more reviews can be compared
              </p>
            </div>

            <div className="compare-selection-area">
              <div className={`compare-select-card ${selectedDorm1 ? 'has-selection' : ''}`}>
                <div className="compare-select-card-inner">
                  {selectedDorm1 && (
                    <img src={selectedDorm1.imageUrl || DefaultDorm} alt={selectedDorm1.name} className="compare-preview-image" />
                  )}
                  <div className="compare-custom-dropdown" ref={dorm1Ref}>
                    <button
                      className="compare-dropdown-button"
                      onClick={() => setIsDorm1Open(!isDorm1Open)}
                    >
                      {selectedDorm1 ? selectedDorm1.name : 'Select dorm...'}
                    </button>
                    {isDorm1Open && (
                      <div className="compare-dropdown-menu">
                        <button onClick={() => { setDorm1(''); setIsDorm1Open(false); }}>Select dorm...</button>
                        {dorms1.map(d => {
                          const eligible = (d.reviewCount ?? 0) >= 3;
                          return (
                            <button
                              key={d.slug}
                              onClick={() => { if (eligible) { setDorm1(d.slug); setIsDorm1Open(false); } }}
                              disabled={!eligible}
                              className={!eligible ? 'compare-dropdown-disabled' : ''}
                            >
                              {d.name}
                              <span className="compare-dropdown-review-count">
                                {d.reviewCount ?? 0} review{(d.reviewCount ?? 0) !== 1 ? 's' : ''}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="compare-vs-badge">VS</div>

              <div className={`compare-select-card ${selectedDorm2 ? 'has-selection' : ''}`}>
                <div className="compare-select-card-inner">
                  {selectedDorm2 && (
                    <img src={selectedDorm2.imageUrl || DefaultDorm} alt={selectedDorm2.name} className="compare-preview-image" />
                  )}
                  <div className="compare-custom-dropdown" ref={dorm2Ref}>
                    <button
                      className="compare-dropdown-button"
                      onClick={() => setIsDorm2Open(!isDorm2Open)}
                    >
                      {selectedDorm2 ? selectedDorm2.name : 'Select dorm...'}
                    </button>
                    {isDorm2Open && (
                      <div className="compare-dropdown-menu">
                        <button onClick={() => { setDorm2(''); setIsDorm2Open(false); }}>Select dorm...</button>
                        {dorms2.map(d => {
                          const eligible = (d.reviewCount ?? 0) >= 3;
                          return (
                            <button
                              key={d.slug}
                              onClick={() => { if (eligible) { setDorm2(d.slug); setIsDorm2Open(false); } }}
                              disabled={!eligible}
                              className={!eligible ? 'compare-dropdown-disabled' : ''}
                            >
                              {d.name}
                              <span className="compare-dropdown-review-count">
                                {d.reviewCount ?? 0} review{(d.reviewCount ?? 0) !== 1 ? 's' : ''}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
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
            <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '24px' }}>
              <button className="compare-change-btn" onClick={handleNewComparison}>
                &larr; Change
              </button>
            </div>
            <div className="compare-headers">
              <div className="compare-dorm-header dorm-left">
                <div className="compare-dorm-image-container">
                  <img src={result.dorm1.imageUrl || DefaultDorm} alt={result.dorm1.name} className="compare-dorm-image" />
                  <div className="compare-dorm-image-overlay" />
                  <div className="compare-dorm-title-wrap">
                    <h2>{result.dorm1.name}</h2>
                    <p className="compare-uni-name">{uniName(result.dorm1.universitySlug)}</p>
                  </div>
                </div>
                <div className="compare-stat-pills">
                  <div className="compare-pill-item">
                    <span className="compare-pill-value">{result.dorm1.avgOverall.toFixed(1)}</span>
                    <span className="compare-pill-label">Rating</span>
                  </div>
                  <div className="compare-pill-divider" />
                  <div className="compare-pill-item">
                    <span className="compare-pill-value">{result.dorm1.reviewCount}</span>
                    <span className="compare-pill-label">Reviews</span>
                  </div>
                  <div className="compare-pill-divider" />
                  <div className="compare-pill-item">
                    <span className="compare-pill-value">{result.dorm1.wouldDormAgainPct}%</span>
                    <span className="compare-pill-label">Would Return</span>
                  </div>
                </div>
              </div>

              <div className="compare-dorm-header dorm-right">
                <div className="compare-dorm-image-container">
                  <img src={result.dorm2.imageUrl || DefaultDorm} alt={result.dorm2.name} className="compare-dorm-image" />
                  <div className="compare-dorm-image-overlay" />
                  <div className="compare-dorm-title-wrap">
                    <h2>{result.dorm2.name}</h2>
                    <p className="compare-uni-name">{uniName(result.dorm2.universitySlug)}</p>
                  </div>
                </div>
                <div className="compare-stat-pills">
                  <div className="compare-pill-item">
                    <span className="compare-pill-value">{result.dorm2.avgOverall.toFixed(1)}</span>
                    <span className="compare-pill-label">Rating</span>
                  </div>
                  <div className="compare-pill-divider" />
                  <div className="compare-pill-item">
                    <span className="compare-pill-value">{result.dorm2.reviewCount}</span>
                    <span className="compare-pill-label">Reviews</span>
                  </div>
                  <div className="compare-pill-divider" />
                  <div className="compare-pill-item">
                    <span className="compare-pill-value">{result.dorm2.wouldDormAgainPct}%</span>
                    <span className="compare-pill-label">Would Return</span>
                  </div>
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
                <div className="compare-ai-text"><ReactMarkdown remarkPlugins={[remarkGfm]} allowedElements={['p', 'strong', 'em', 'h1', 'h2', 'h3', 'h4', 'ul', 'ol', 'li', 'br', 'hr', 'blockquote', 'table', 'thead', 'tbody', 'tr', 'th', 'td']} unwrapDisallowed>{result.comparison}</ReactMarkdown></div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default CompareModal;
