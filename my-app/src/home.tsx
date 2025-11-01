import React from 'react';
import './Home.css'; // Make sure to import the CSS file
import './navbar.css';
import { Link } from 'react-router-dom';

function Home() {
  return (
    <div className="home">
      <div className="homeContainer">
         {/* Navigation Bar */}
        <div className="navbar">
            {/* Navigation Bar Logo */}
          <div className="navbar_logo">
            <Link to ="/">  
              <a>LifeByDorm</a>
            </Link>
          </div>
            {/* Navigation Bar Buttons */}
          <div className="navbar_actions">
            <div className="navbar_aboutme">
              <Link to="/aboutme">
                <button>About Me</button>
              </Link>
            </div>
            <div className="navbar_contactme">
              <Link to="/contactme"> 
                <button>Contact Me</button>
              </Link>
            </div>
            <div className="navbar_login">
              <Link to="/login">
                <button>Log In</button>
              </Link>
            </div>
          </div>
        </div>
        {/* Search Bar (Seperate File) */}
          <h2> (Search Bar Goes Here)</h2>
        {/* Quick Links to Universities */}
        <div className = "quicklinks"> 
          <h2> Quick Links: </h2>
          <Link to ="/university">  
            <button>
              University of Toronto
            </button>
            <button>
              Western University
            </button>
            <button>
              York University
            </button>
          </Link>
        </div>
        {/* Leaderboard */}
        <div className="leaderboard">
          <h2> Leaderboard: </h2>
        </div>
      </div>
    </div>
  );
}

export default Home;