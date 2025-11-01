import React from 'react'
import { Link } from 'react-router-dom';
import './dorms.css'
import './navbar.css'

function dorms() {
  return (
    <div className = "dorm">
      {/* University Navbar */}
      <div className = "navbar">
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
      {/* Dorm Header */}
      <div className = "dorms_header">
        <div className = "dorms_title">
          <h1> Founders Residence </h1>
        </div>
         <div className = "dorms_address"> 
          <h4> 123 Example Road </h4>
         </div>
         <div className = "dorms_rating">
          <h4> 3 Stars </h4>
         </div>
      </div>
      {/* List of Dorms */}
      <div className = "dorms_lists">
        <h2> List of Dorms: </h2>
      </div>
    </div>
  )
}

export default dorms