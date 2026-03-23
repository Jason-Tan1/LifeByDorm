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
        </div>

        {/* Right Side: Links */}
        <div className="footer-right">

          {/* Column 1: Navigation */}
          <div className="footer-link-column">
            <Link to="/aboutme" className="footer-link">{t('footer.about')}</Link>
            <Link to="/contactme" className="footer-link">{t('footer.contactMe')}</Link>
            <Link to="/universities" className="footer-link">{t('footer.universityList')}</Link>
            <Link to="/terms" className="footer-link">{t('footer.terms')}</Link>
            <Link to="/privacy" className="footer-link">{t('footer.privacy')}</Link>
          </div>

          {/* Column 2: Socials & Support */}
          <div className="footer-link-column">
            <a href="https://linkedin.com/company/lifebydorm" target="_blank" rel="noopener noreferrer" className="footer-link with-icon">
              <FaLinkedin className="footer-icon" /> {t('footer.companyLinkedin')}
            </a>
            <a href="https://www.linkedin.com/in/jasontan5/" target="_blank" rel="noopener noreferrer" className="footer-link with-icon">
              <FaLinkedin className="footer-icon" /> {t('footer.creatorLinkedin')}
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
            <Trans
              i18nKey="footer.hiringMessage"
              components={{
                link: <a href="https://www.linkedin.com/in/jasontan5/" target="_blank" rel="noopener noreferrer" />
              }}
            />
          </div>
          <p>&copy; {new Date().getFullYear()} LifeByDorm. {t('footer.rightsReserved')}</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
