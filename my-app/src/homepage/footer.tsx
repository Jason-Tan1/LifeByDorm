import React from 'react';
import { Link } from 'react-router-dom';
import './footer.css';
import LBDLogo from '../assets/LBDLogo-removebg-preview.png';

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-content">
        <img src={LBDLogo} alt="LifeByDorm Logo" className="footer-logo" />
        <div className="footer-links">
          <Link to="/aboutme" className="footer-link">About</Link>
          <span className="footer-separator">•</span>
          <Link to="/contactme" className="footer-link">Contact Me</Link>
          <span className="footer-separator">•</span>
          <Link to="/universities" className="footer-link">University List</Link>
          <span className="footer-separator">•</span>
          <Link to="/terms" className="footer-link">Terms & Conditions</Link>
          <span className="footer-separator">•</span>
          <Link to="/privacy" className="footer-link">Privacy Policy</Link>
        </div>
        <p>&copy; 2025 LifeByDorm. All rights reserved.</p>
      </div>
    </footer>
  );
}

export default Footer;
