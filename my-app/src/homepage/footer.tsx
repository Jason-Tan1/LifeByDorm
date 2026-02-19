// import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './footer.css';
import LBDLogo from '../assets/LBDLogo-removebg-preview.png';

function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="footer">
      <div className="footer-content">
        <img src={LBDLogo} alt="LifeByDorm Logo" className="footer-logo" />
        <div className="footer-links">
          <Link to="/aboutme" className="footer-link">{t('footer.about')}</Link>
          <span className="footer-separator">•</span>
          <Link to="/contactme" className="footer-link">{t('footer.contactMe')}</Link>
          <span className="footer-separator">•</span>
          <Link to="/universities" className="footer-link">{t('footer.universityList')}</Link>
          <span className="footer-separator">•</span>
          <Link to="/terms" className="footer-link">{t('footer.terms')}</Link>
          <span className="footer-separator">•</span>
          <Link to="/privacy" className="footer-link">{t('footer.privacy')}</Link>
        </div>
        <p>&copy; {new Date().getFullYear()} {t('footer.rightsReserved')}</p>
      </div>
    </footer>
  );
}

export default Footer;
