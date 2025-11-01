import React from 'react';
import './Home.css'; // Make sure to import the CSS file

function Home() {
  return (
    <div className="home">
      <div className="homeContainer">
         {/* Navigation Bar */}
        <div className="home_navbar">
            {/* Navigation Bar Logo */}
          <div className="navbar_logo">
            <a>LifeByDorm</a>
          </div>
            {/* Navigation Bar Buttons */}
          <div className="navbar_actions">
            <div className="navbar_aboutme">
              <button>About Me</button>
            </div>
            <div className="navbar_contactme">
              <button>Contact Me</button>
            </div>
            <div className="navbar_login">
              <button>Log In</button>
            </div>
          </div>
        </div>
        {/* Search Bar */}
        
        {/* Quick Links to Universities */}
        <button>
          University of Toronto
        </button>
        <button>
          Western University
        </button>
        <button>
          York University
        </button>
        <button>
          McMaster University
        </button>
        <button>
          McGill University
        </button>
        {/* Leaderboard */}

      </div>
    </div>
  );
}

export default Home;