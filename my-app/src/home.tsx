import React from 'react';
import './Home.css'; 
import { Link } from 'react-router-dom';
import NavBar from './navbar.tsx'; 
import SearchBar from './searchbar.tsx'; 

function Home() {
  return (
    <div className = "home"> 
      <NavBar />
      <div className="home-container">
        <div className="home-content">
          <div className="home-section">
            <h1>
              Honest Reviews
              <br />
              of Canadian University
              <br />
              Dorms Straight from
              <br />
              Real Students
            </h1>
            <SearchBar />
          </div>

          <div className="quicklinks-section">
            <h2>Quick Links:</h2>
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
        </div>
      </div>
    </div>
  );
}

export default Home;