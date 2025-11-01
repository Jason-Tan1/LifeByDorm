import React from 'react';
import './Home.css'; // Make sure to import the CSS file
import { Link } from 'react-router-dom';
import NavBar from './navbar.tsx';
import SearchBar from './searchbar.tsx';

function Home() {
  return (
    <div className="home">
      <NavBar />
      <div className="homeContent">
        {/* Search Bar Placeholder */}
       <SearchBar />
        {/* Quick Links to Universities */}
        <div className="quicklinks">
          <h2 className="section-title">Quick Links:</h2>
          <div className="quicklinks-buttons">
            <Link to="/university">
              <button>University of Toronto</button>
            </Link>
            <Link to="/university">
              <button>Western University</button>
            </Link>
            <Link to="/university">
              <button>York University</button>
            </Link>
          </div>
        </div>

        {/* Preview of Dorms Placeholder */}
        <div className="preview">
          <h2 className="section-title">Preview of Dorms:</h2>
        </div>
      </div>
    </div>
  );
}

export default Home;