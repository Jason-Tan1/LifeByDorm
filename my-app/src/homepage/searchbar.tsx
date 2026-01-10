import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './searchbar.css';
import { FaSearch } from 'react-icons/fa';
import { useUniversityData } from '../context/UniversityDataContext';

type University = {
  name: string;
  slug: string;
};

function SearchBar() {
  const [query, setQuery] = useState('');
  const [filteredResults, setFilteredResults] = useState<University[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();

  // Use shared context for universities - no duplicate fetch!
  const { universities } = useUniversityData();

  // Filter universities based on query
  useEffect(() => {
    if (query.trim() === '') {
      setFilteredResults([]);
      setShowDropdown(false);
    } else {
      const filtered = universities.filter(uni =>
        uni.name.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredResults(filtered);
      setShowDropdown(filtered.length > 0);
    }
  }, [query, universities]);

  const handleSearch = () => {
    if (query.trim() !== '' && filteredResults.length > 0) {
      // Navigate to the first result
      navigate(`/universities/${filteredResults[0].slug}`);
      setQuery('');
      setShowDropdown(false);
    }
  };

  const handleSelectUniversity = (slug: string) => {
    navigate(`/universities/${slug}`);
    setQuery('');
    setShowDropdown(false);
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="search-bar-wrapper">
      <div className="search-bar-container">
        <input
          type="text"
          className="search-input"
          placeholder="Search for universities..."
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
          {filteredResults.map(uni => (
            <div
              key={uni.slug}
              className="search-dropdown-item"
              onClick={() => handleSelectUniversity(uni.slug)}
            >
              {uni.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default SearchBar;