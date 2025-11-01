import React from 'react'
import { Link } from 'react-router-dom';
import './navbar.css'

function navbar() {
  return (
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
  )
}

export default navbar