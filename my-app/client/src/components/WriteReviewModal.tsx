import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUniversityData } from '../context/UniversityDataContext';
import './WriteReviewModal.css';

interface WriteReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Ensure window is defined for Vite proxy setup
const isLocal = typeof window !== 'undefined' && 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const API_BASE = isLocal ? '' : ((import.meta as any).env?.VITE_API_BASE || '');

interface DormOption {
  _id: string;
  name: string;
  slug: string;
}

const WriteReviewModal: React.FC<WriteReviewModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { universities, isLoading: isUniLoading } = useUniversityData();

  const [selectedUniSlug, setSelectedUniSlug] = useState('');
  const [uniSearchQuery, setUniSearchQuery] = useState('');
  const [showUniDropdown, setShowUniDropdown] = useState(false);
  const uniWrapperRef = useRef<HTMLDivElement>(null);

  const [selectedDormSlug, setSelectedDormSlug] = useState('');
  
  const [dorms, setDorms] = useState<DormOption[]>([]);
  const [isDormLoading, setIsDormLoading] = useState(false);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (uniWrapperRef.current && !uniWrapperRef.current.contains(event.target as Node)) {
        setShowUniDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedUniSlug('');
      setUniSearchQuery('');
      setShowUniDropdown(false);
      setSelectedDormSlug('');
      setDorms([]);
    }
  }, [isOpen]);

  // Filter universities based on search query
  const filteredUniversities = universities.filter(uni => 
    uni.name.toLowerCase().includes(uniSearchQuery.toLowerCase())
  );

  // Fetch dorms when university changes
  useEffect(() => {
    if (!selectedUniSlug) {
      setDorms([]);
      setSelectedDormSlug('');
      return;
    }

    const fetchDorms = async () => {
      setIsDormLoading(true);
      setSelectedDormSlug(''); // Reset dorm selection
      try {
        const response = await fetch(`${API_BASE}/api/universities/${selectedUniSlug}/dorms`);
        if (response.ok) {
          const data = await response.json();
          // Assuming data is an array of objects representing dorms. 
          // CompareModal or UniversityDash uses this exact endpoint.
          if (Array.isArray(data)) {
            setDorms(data);
          } else {
            setDorms([]);
          }
        } else {
          setDorms([]);
        }
      } catch (error) {
        console.error('Failed to fetch dorms:', error);
        setDorms([]);
      } finally {
        setIsDormLoading(false);
      }
    };

    fetchDorms();
  }, [selectedUniSlug]);

  if (!isOpen) return null;

  const handleContinue = () => {
    if (selectedUniSlug && selectedDormSlug) {
      // Find the proper names for building the query params
      const uni = universities.find(u => u.slug === selectedUniSlug);
      const dorm = dorms.find(d => d.slug === selectedDormSlug);

      if (uni && dorm) {
        onClose();
        // review.tsx reads URLSearchParams for `university` and `dorm`
        // We MUST pass the slug here because the review page uses it to construct the Breadcrumb link back to the dorm.
        // If we pass the name, the breadcrumb will 404 because the API and frontend routes expect the slug.
        navigate(`/review?university=${encodeURIComponent(uni.slug)}&dorm=${encodeURIComponent(dorm.slug)}`);
      }
    }
  };

  return (
    <div className="review-modal-overlay" onClick={onClose}>
      <div className="review-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="review-modal-header">
          <h2 className="review-modal-title">Write a Review</h2>
          <button className="review-modal-close" onClick={onClose}>&times;</button>
        </div>

        <div className="review-modal-body">
          <div className="modal-input-group" ref={uniWrapperRef}>
            <label>Search your University</label>
            <div className="modal-search-wrapper">
              <input
                type="text"
                className="modal-select modal-search-input"
                placeholder={isUniLoading ? 'Loading universities...' : 'Type to search...'}
                value={uniSearchQuery}
                onChange={(e) => {
                  setUniSearchQuery(e.target.value);
                  setShowUniDropdown(true);
                  if (selectedUniSlug) setSelectedUniSlug(''); // clear selection if they type
                }}
                onFocus={() => setShowUniDropdown(true)}
                disabled={isUniLoading}
              />
              {showUniDropdown && filteredUniversities.length > 0 && (
                <div className="modal-search-dropdown">
                  {filteredUniversities.map((uni) => (
                    <div
                      key={uni.slug}
                      className="modal-search-dropdown-item"
                      onMouseDown={(e) => e.preventDefault()} // prevent blur before click
                      onClick={() => {
                        setSelectedUniSlug(uni.slug);
                        setUniSearchQuery(uni.name);
                        setShowUniDropdown(false);
                      }}
                    >
                      {uni.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="modal-input-group">
            <label htmlFor="dorm-select">Select your Dorm</label>
            <select
              id="dorm-select"
              className="modal-select"
              value={selectedDormSlug}
              onChange={(e) => setSelectedDormSlug(e.target.value)}
              disabled={!selectedUniSlug || isDormLoading}
            >
              <option value="" disabled>
                {!selectedUniSlug 
                  ? 'Select a university first' 
                  : isDormLoading 
                    ? 'Loading dorms...' 
                    : 'Choose a dorm...'}
              </option>
              {dorms.map((dorm) => (
                <option key={dorm._id || dorm.slug} value={dorm.slug}>
                  {dorm.name}
                </option>
              ))}
            </select>
          </div>

          <div className="modal-button-group">
            <button
              className="review-modal-submit-btn"
              onClick={handleContinue}
              disabled={!selectedUniSlug || !selectedDormSlug}
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WriteReviewModal;
