import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch } from 'react-icons/fi';
import { useUniversityData } from '../../context/UniversityDataContext';
import { useDebouncedValue } from '../../hooks/useDebounce';
import './NavbarSearchBar.css';

// Use relative path '' on localhost to leverage the Vite proxy
const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const API_BASE = isLocal ? '' : ((import.meta as any).env?.VITE_API_BASE || '');

type University = {
  name: string;
  slug: string;
};

type Dorm = {
  name: string;
  slug: string;
  universitySlug: string;
};

function NavbarSearchBar() {
  const [query, setQuery] = useState('');
  const [filteredUniversities, setFilteredUniversities] = useState<University[]>([]);
  const [filteredDorms, setFilteredDorms] = useState<Dorm[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchMode] = useState<'universities' | 'dorms'>('universities');
  const [allDorms, setAllDorms] = useState<Dorm[]>([]);
  const [isLoadingDorms, setIsLoadingDorms] = useState(false);
  const navigate = useNavigate();
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Debounce the query to reduce unnecessary filtering/fetching
  const debouncedQuery = useDebouncedValue(query, 200);
  const { universities } = useUniversityData();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch dorms if switching to dorm mode (unused by default currently, but available)
  useEffect(() => {
    if (searchMode === 'dorms' && debouncedQuery.trim().length >= 2 && allDorms.length === 0 && !isLoadingDorms) {
      setIsLoadingDorms(true);
      fetch(`${API_BASE}/api/dorms/search`)
        .then(res => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        })
        .then(data => setAllDorms(data))
        .catch(err => console.error('Failed to fetch dorms', err))
        .finally(() => setIsLoadingDorms(false));
    }
  }, [searchMode, debouncedQuery, allDorms.length, isLoadingDorms]);

  // Filter based on query
  useEffect(() => {
    if (debouncedQuery.trim() === '') {
      setFilteredUniversities([]);
      setFilteredDorms([]);
      setShowDropdown(false);
      return;
    }

    if (searchMode === 'universities') {
      const filtered = universities.filter(uni =>
        uni.name.toLowerCase().includes(debouncedQuery.toLowerCase())
      );
      setFilteredUniversities(filtered);
      setShowDropdown(filtered.length > 0);
    } else {
      const filtered = allDorms.filter(dorm =>
        dorm.name.toLowerCase().includes(debouncedQuery.toLowerCase())
      );
      setFilteredDorms(filtered);
      setShowDropdown(filtered.length > 0);
    }
  }, [debouncedQuery, universities, allDorms, searchMode]);

  const handleSearch = () => {
    if (query.trim() === '') return;

    if (searchMode === 'universities') {
      if (filteredUniversities.length > 0) {
        navigate(`/universities/${filteredUniversities[0].slug}`);
      }
    } else {
      if (filteredDorms.length > 0) {
        const dorm = filteredDorms[0];
        navigate(`/universities/${dorm.universitySlug}/dorms/${dorm.slug}`);
      }
    }
    setQuery('');
    setShowDropdown(false);
  };

  const handleSelectUniversity = (slug: string) => {
    navigate(`/universities/${slug}`);
    setQuery('');
    setShowDropdown(false);
  };

  const handleSelectDorm = (dorm: Dorm) => {
    navigate(`/universities/${dorm.universitySlug}/dorms/${dorm.slug}`);
    setQuery('');
    setShowDropdown(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') handleSearch();
  };

  const handleFocus = () => {
    if (query.trim() !== '') {
      if (searchMode === 'universities' && filteredUniversities.length > 0) setShowDropdown(true);
      else if (searchMode === 'dorms' && filteredDorms.length > 0) setShowDropdown(true);
    }
  };

  return (
    <div className="navbar-search-wrapper" ref={wrapperRef}>
      <div className="navbar-search-bar-container">
        <FiSearch className="navbar-search-icon" />
        <input
          type="text"
          className="navbar-search-input"
          placeholder="Search for a university..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
        />
      </div>

      {showDropdown && (
        <div className="navbar-search-dropdown">
          {searchMode === 'universities' ? (
            filteredUniversities.map(uni => (
              <div
                key={uni.slug}
                className="navbar-search-dropdown-item"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelectUniversity(uni.slug)}
              >
                {uni.name}
              </div>
            ))
          ) : (
            filteredDorms.map(dorm => (
              <div
                key={`${dorm.universitySlug}-${dorm.slug}`}
                className="navbar-search-dropdown-item"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelectDorm(dorm)}
              >
                <div className="dorm-name">{dorm.name}</div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default NavbarSearchBar;
