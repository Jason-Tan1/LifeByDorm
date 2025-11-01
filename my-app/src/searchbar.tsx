import React, { useState } from 'react';
import './searchbar.css'; // We will create this file next
import { FaSearch } from 'react-icons/fa'; // A popular library for icons

function SearchBar() {
  const [query, setQuery] = useState('');

  const handleSearch = () => {
    // This is where you would handle the search logic,
    // for example, redirecting to a search results page.
    if (query.trim() !== '') {
      alert(`Searching for: ${query}`);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    // Allow searching by pressing the "Enter" key
    if (event.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="search-bar-container">
      <input
        type="text"
        className="search-input"
        placeholder="Search for universities or dorms..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyPress={handleKeyPress}
      />
      <button className="search-button" onClick={handleSearch}>
        <FaSearch /> {/* Search Icon */}
      </button>
    </div>
  );
}

export default SearchBar;