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
        <div className = "home_searchbar"> 
           <h2> Real Canadian University Dorm Reviews from Previous Students!</h2>
           <SearchBar />
        </div>
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

        {/* Featured Dorms */}
        <div className="preview">
          <h2 className="section-title">Preview of Dorms:</h2>
        </div>

        {/* Footer */}

      </div>
    </div>
  );
}

export default Home;