import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom';
import LoginModal from './login';
import './navbar.css'

function navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check token and determine login/admin status from JWT role claim
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payloadJson = token.split('.')[1];
        const decoded = JSON.parse(atob(payloadJson));
        setIsLoggedIn(true);
        setIsAdmin(decoded?.role === 'admin');
      } catch (err) {
        setIsLoggedIn(false);
        setIsAdmin(false);
      }
    } else {
      setIsLoggedIn(false);
      setIsAdmin(false);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    setIsAdmin(false);
    navigate('/');
  };
  return (
    <div className="navbar">
        {/* Navigation Bar Logo */}
      <div className="navbar_logo">
        <Link to="/">LifeByDorm</Link>
      </div>
        {/* Navigation Bar Buttons */}
      <div className="navbar_actions">
        {isAdmin && (
          <div className="navbar_dashboard">
            <Link to="/admin/dashboard">
              <button>Dashboard</button>
            </Link>
          </div>
        )}
        <div className="navbar_login">
          {isLoggedIn ? (
            <button onClick={handleLogout}>Log Out</button>
          ) : (
            <button onClick={() => setIsLoginModalOpen(true)}>Log In</button>
          )}
        </div>
      </div>
      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
    </div>
  )
}

export default navbar