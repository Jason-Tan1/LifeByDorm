// import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation, Trans } from 'react-i18next';
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
            {t('footer.description1')}
          </p>
          <p className="footer-description">
            {t('footer.description2')}
          </p>

          <div className="footer-socials">
            <a href="https://linkedin.com/company/lifebydorm" target="_blank" rel="noopener noreferrer" className="footer-social-icon" aria-label="LinkedIn">
              <FaLinkedin />
            </a>
            <a href="https://x.com/lifebydorm" target="_blank" rel="noopener noreferrer" className="footer-social-icon" aria-label="X (Twitter)">
              <FaXTwitter />
            </a>
            <a href="https://www.instagram.com/lifebydorm/" target="_blank" rel="noopener noreferrer" className="footer-social-icon" aria-label="Instagram">
              <FaInstagram />
            </a>
            <a href="https://www.tiktok.com/@lifebydorm?lang=en" target="_blank" rel="noopener noreferrer" className="footer-social-icon" aria-label="TikTok">
              <FaTiktok />
            </a>
          </div>
        </div>

        {/* Right Side: Links */}
        <div className="footer-right">

          {/* Column 1: Resources */}
          <div className="footer-link-column">
            <h4 className="footer-column-title">Resources</h4>
            <Link to="/universities" className="footer-link">{t('footer.universityList', 'Find a University')}</Link>
            <span className="footer-link placeholder-link">
              Blogs <span className="coming-soon-badge">Soon</span>
            </span>
            <span className="footer-link placeholder-link">
              Dorm Essentials <span className="coming-soon-badge">Soon</span>
            </span>
            <span className="footer-link placeholder-link">
              Freshman Guide <span className="coming-soon-badge">Soon</span>
            </span>
            <Link to="/help-center" className="footer-link">Help Center</Link>
          </div>

          {/* Column 2: Company */}
          <div className="footer-link-column">
            <h4 className="footer-column-title">Company</h4>
            <Link to="/about" className="footer-link">{t('footer.about', 'About Us')}</Link>
            <Link to="/contactme" className="footer-link">{t('footer.contactMe', 'Contact Us')}</Link>
            <a href="https://www.linkedin.com/in/jasontan5/" target="_blank" rel="noopener noreferrer" className="footer-link">
              Founder LinkedIn
            </a>
            <span className="footer-link placeholder-link">
              Ambassadors <span className="coming-soon-badge">Soon</span>
            </span>
          </div>

          {/* Column 3: Legal & Community */}
          <div className="footer-link-column">
            <h4 className="footer-column-title">Legal</h4>
            <Link to="/terms" className="footer-link">{t('footer.terms', 'Terms of Service')}</Link>
            <Link to="/privacy" className="footer-link">{t('footer.privacy', 'Privacy Policy')}</Link>
            <Link to="/review-guidelines" className="footer-link">
              Review Guidelines
            </Link>
            <Link to="/cookie-policy" className="footer-link">
              Cookie Policy
            </Link>
          </div>

        </div>
      </div>

      {/* Bottom Legal / Copyright Area */}
      <div className="footer-bottom">
        <div className="footer-bottom-content">
          <div className="hiring-box">
            <Trans
              i18nKey="footer.hiringMessage"
              components={{
                link: <a href="https://www.linkedin.com/in/jasontan5/" target="_blank" rel="noopener noreferrer" />
              }}
            />
          </div>
          <p>&copy; {new Date().getFullYear()} LifeByDorm. {t('footer.rightsReserved', 'All rights reserved.')}</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
