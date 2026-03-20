// import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaLinkedin, FaInstagram, FaTiktok } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';
import './footer.css';
import LBDLogo from '../../assets/LBDLogo.webp';

function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="footer">
      <div className="footer-content">

        {/* Left Side: Logo and Descriptions */}
        <div className="footer-left">
          <Link to="/" aria-label="LifeByDorm Home">
            <img src={LBDLogo} alt="LifeByDorm Logo" className="footer-logo" />
          </Link>
          <p className="footer-description">
            LifeByDorm is an independent platform built by students, for students. We provide genuine reviews and insights on university accommodations across Canada to help you make informed decisions about where you live.
          </p>
          <p className="footer-description">
            Writing a review is easy! Simply create an account, search for your university and specific dorm, and rate the various aspects of your stay. Your insights directly help future students find their ideal home away from home.
          </p>
        </div>

        {/* Right Side: Links */}
        <div className="footer-right">

          {/* Column 1: Navigation */}
          <div className="footer-link-column">
            <Link to="/aboutme" className="footer-link">{t('footer.about') || 'About us'}</Link>
            <Link to="/contactme" className="footer-link">{t('footer.contactMe') || 'Contact Me'}</Link>
            <Link to="/universities" className="footer-link">{t('footer.universityList') || 'Universities'}</Link>
            <Link to="/terms" className="footer-link">{t('footer.terms') || 'Terms of Use'}</Link>
            <Link to="/privacy" className="footer-link">{t('footer.privacy') || 'Privacy Policy'}</Link>
          </div>

          {/* Column 2: Socials & Support */}
          <div className="footer-link-column">
            {/* You can update these HREFs with your actual links */}
            <a href="https://linkedin.com/company/lifebydorm" target="_blank" rel="noopener noreferrer" className="footer-link with-icon">
              <FaLinkedin className="footer-icon" /> Company LinkedIn
            </a>
            <a href="https://www.linkedin.com/in/jasontan5/" target="_blank" rel="noopener noreferrer" className="footer-link with-icon">
              <FaLinkedin className="footer-icon" /> Creator LinkedIn
            </a>
            <a href="https://x.com/lifebydorm" target="_blank" rel="noopener noreferrer" className="footer-link with-icon">
              <FaXTwitter className="footer-icon" /> X
            </a>
            <a href="https://www.instagram.com/lifebydorm/" target="_blank" rel="noopener noreferrer" className="footer-link with-icon">
              <FaInstagram className="footer-icon" /> Instagram
            </a>
            <a href="https://www.tiktok.com/@lifebydorm?lang=en" target="_blank" rel="noopener noreferrer" className="footer-link with-icon">
              <FaTiktok className="footer-icon" /> TikTok
            </a>
          </div>

        </div>
      </div>

      {/* Bottom Legal / Copyright Area */}
      <div className="footer-bottom">
        <div className="footer-bottom-content">
          <div className="hiring-box">
            Looking for a Lead Marketing/Growth person to work with me, message on my <a href="https://www.linkedin.com/in/jasontan5/" target="_blank" rel="noopener noreferrer">linkedin</a> to see details
          </div>
          <p>&copy; {new Date().getFullYear()} LifeByDorm. {t('footer.rightsReserved') || 'All Rights Reserved.'}</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
