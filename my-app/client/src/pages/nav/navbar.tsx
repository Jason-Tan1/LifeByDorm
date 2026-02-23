import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom';
import MenuIcon from '@mui/icons-material/Menu';
import LanguageIcon from '@mui/icons-material/Language';
import LoginModal from './login';
import { useTranslation } from 'react-i18next';
import './navbar.css'

import LBDLogo from '../../assets/LBDLogo-removebg-preview.png';

function navbar() {
  const { t, i18n } = useTranslation();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const navigate = useNavigate();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    setIsLangDropdownOpen(false);
  };

  useEffect(() => {
    // Check token and determine login/admin status from JWT role claim
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payloadJson = token.split('.')[1];
        const decoded = JSON.parse(atob(payloadJson));

        // Check if token has already expired
        if (decoded.exp && decoded.exp * 1000 < Date.now()) {
          localStorage.removeItem('token');
          setIsLoggedIn(false);
          setIsAdmin(false);
          return;
        }

        setIsLoggedIn(true);
        setIsAdmin(decoded?.role === 'admin');

        // Set a timer to auto-logout when the token expires
        if (decoded.exp) {
          const msUntilExpiry = decoded.exp * 1000 - Date.now();
          const logoutTimer = setTimeout(() => {
            localStorage.removeItem('token');
            setIsLoggedIn(false);
            setIsAdmin(false);
            window.location.href = '/';
          }, msUntilExpiry);
          return () => clearTimeout(logoutTimer);
        }
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
        <Link to="/">
          <img src={LBDLogo} alt="LifeByDorm Logo" />
        </Link>
      </div>
      {/* Navigation Bar Buttons */}
      <div className="navbar_actions">
        {/* Language Switcher */}
        <div className="navbar_account_dropdown" style={{ marginRight: '10px' }}>
          <button className="account_btn" onClick={() => { setIsLangDropdownOpen(!isLangDropdownOpen); setIsDropdownOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700 }}>
            <LanguageIcon style={{ fontSize: '1.2rem', color: '#333' }} />
            <span style={{ color: '#ccc', margin: '0 2px' }}>|</span>
            {i18n.language === 'en' ? 'ENG' : 'FR'}
          </button>
          {isLangDropdownOpen && (
            <div className="account_dropdown_content" style={{ display: 'block' }}>
              <button onClick={() => changeLanguage('en')}>English</button>
              <button onClick={() => changeLanguage('fr')}>French</button>
            </div>
          )}
        </div>
        <div className="navbar_login">
          {isLoggedIn ? (
            <div className="navbar_account_dropdown">
              <button className="account_btn icon_btn" onClick={() => { setIsDropdownOpen(!isDropdownOpen); setIsLangDropdownOpen(false); }}>
                <MenuIcon />
              </button>
              {isDropdownOpen && (
                <div className="account_dropdown_content" style={{ display: 'block' }}>
                  {isAdmin && (
                    <button onClick={() => { navigate('/admin/dashboard'); setIsDropdownOpen(false); }}>{t('navbar.dashboard')}</button>
                  )}
                  <button onClick={() => { navigate('/account'); setIsDropdownOpen(false); }}>{t('navbar.myAccount')}</button>
                  <button onClick={handleLogout}>{t('navbar.logOut')}</button>
                </div>
              )}
            </div>
          ) : (
            <button onClick={() => setIsLoginModalOpen(true)}>{t('navbar.signIn')}</button>
          )}
        </div>
      </div>
      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
    </div>
  )
}

export default navbar