import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './searchbar.css';
import { FaSearch, FaExchangeAlt } from 'react-icons/fa';
import { useUniversityData } from '../context/UniversityDataContext';
import { useDebouncedValue } from '../hooks/useDebounce';

const API_BASE = (import.meta as any).env?.VITE_API_BASE || 'http://localhost:3000';

type University = {
  name: string;
  slug: string;
};

type Dorm = {
  name: string;
  slug: string;
  universitySlug: string;
};

function SearchBar() {
  const [query, setQuery] = useState('');
  const [filteredUniversities, setFilteredUniversities] = useState<University[]>([]);
  const [filteredDorms, setFilteredDorms] = useState<Dorm[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchMode, setSearchMode] = useState<'universities' | 'dorms'>('universities');
  const [allDorms, setAllDorms] = useState<Dorm[]>([]);
  const [isLoadingDorms, setIsLoadingDorms] = useState(false);
  const navigate = useNavigate();

  // Debounce the query to reduce unnecessary filtering/fetching
  const debouncedQuery = useDebouncedValue(query, 200);

  // Use shared context for universities - no duplicate fetch!
  const { universities } = useUniversityData();

  // Fetch dorms only when needed: dorm mode + user typing at least 2 chars + not already loaded
  useEffect(() => {
    if (searchMode === 'dorms' && debouncedQuery.trim().length >= 2 && allDorms.length === 0 && !isLoadingDorms) {
      setIsLoadingDorms(true);
      fetch(`${API_BASE}/api/dorms`)
        .then(res => res.json())
        .then(data => setAllDorms(data))
        .catch(err => console.error('Failed to fetch dorms', err))
        .finally(() => setIsLoadingDorms(false));
    }
  }, [searchMode, debouncedQuery, allDorms.length, isLoadingDorms]);

  // Filter based on debounced query and mode
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

  const toggleSearchMode = () => {
    setSearchMode(prev => prev === 'universities' ? 'dorms' : 'universities');
    setQuery(''); // Clear query when switching to avoid confusion
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="search-bar-wrapper">
      {/* Group Search Bar and Dropdown together for correct positioning */}
      <div className="search-input-group">
        <div className="search-bar-container">
          <input
            type="text"
            className="search-input"
            placeholder={searchMode === 'universities' ? "Search for universities..." : "Search for dormitories..."}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <button className="search-button" onClick={handleSearch}>
            <FaSearch />
          </button>
        </div>

        {showDropdown && (
          <div className="search-dropdown">
            {searchMode === 'universities' ? (
              filteredUniversities.map(uni => (
                <div
                  key={uni.slug}
                  className="search-dropdown-item"
                  onClick={() => handleSelectUniversity(uni.slug)}
                >
                  {uni.name}
                </div>
              ))
            ) : (
              filteredDorms.map(dorm => (
                <div
                  key={`${dorm.universitySlug}-${dorm.slug}`}
                  className="search-dropdown-item"
                  onClick={() => handleSelectDorm(dorm)}
                >
                  <div className="dorm-name">{dorm.name}</div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <div className="search-mode-toggle" onClick={toggleSearchMode}>
        <FaExchangeAlt className="toggle-icon" />
        <span>
          {searchMode === 'universities' ? "Search dormitories" : "Search universities"}
        </span>
      </div>
    </div>
  );
}

export default SearchBar;