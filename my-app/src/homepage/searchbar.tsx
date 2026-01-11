import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './searchbar.css';
import { FaSearch, FaExchangeAlt } from 'react-icons/fa';
import { useUniversityData } from '../context/UniversityDataContext';

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
  const navigate = useNavigate();

  // Use shared context for universities - no duplicate fetch!
  const { universities } = useUniversityData();

  // Fetch dorms when switching to dorm search mode
  useEffect(() => {
    if (searchMode === 'dorms' && allDorms.length === 0) {
      fetch(`${API_BASE}/api/dorms`)
        .then(res => res.json())
        .then(data => setAllDorms(data))
        .catch(err => console.error('Failed to fetch dorms', err));
    }
  }, [searchMode, allDorms.length]);

  // Filter based on query and mode
  useEffect(() => {
    if (query.trim() === '') {
      setFilteredUniversities([]);
      setFilteredDorms([]);
      setShowDropdown(false);
      return;
    }

    if (searchMode === 'universities') {
      const filtered = universities.filter(uni =>
        uni.name.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredUniversities(filtered);
      setShowDropdown(filtered.length > 0);
    } else {
      const filtered = allDorms.filter(dorm =>
        dorm.name.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredDorms(filtered);
      setShowDropdown(filtered.length > 0);
    }
  }, [query, universities, allDorms, searchMode]);

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