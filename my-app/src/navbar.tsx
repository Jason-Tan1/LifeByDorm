import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom';
import './navbar.css'

function navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    navigate('/');
  };
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
          {isLoggedIn ? (
            <button onClick={handleLogout}>Log Out</button>
          ) : (
            <Link to="/login">
              <button>Log In</button>
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

export default navbar