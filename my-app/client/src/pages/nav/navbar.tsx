import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { FaTiktok, FaInstagram, FaLinkedinIn } from 'react-icons/fa';
import MenuIcon from '@mui/icons-material/Menu';
import LanguageIcon from '@mui/icons-material/Language';
import LoginModal from './login';
import { useTranslation } from 'react-i18next';
import NavbarSearchBar from './NavbarSearchBar';
import './navbar.css'

import LBDLogo from '../../assets/LBDLogo.webp';

function Navbar() {
  const { t, i18n } = useTranslation();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showNavSearch, setShowNavSearch] = useState(false);

  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      if (location.pathname === '/') {
        // Show after scrolling past the home hero section search bar (~350px)
        setShowNavSearch(window.scrollY > 350);
      } else {
        // Always show on other pages
        setShowNavSearch(true);
      }
    };

    handleScroll(); // Check initially
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [location.pathname]);

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    setIsLangDropdownOpen(false);
  };

  // Auto-open login modal when redirected with ?login=true (e.g. from admin dashboard)
  useEffect(() => {
    if (searchParams.get('login') === 'true') {
      setIsLoginModalOpen(true);
      searchParams.delete('login');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

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
      } catch (_err) {
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

  const closeAllMenus = () => {
    setIsDropdownOpen(false);
    setIsLangDropdownOpen(false);
    setIsMobileMenuOpen(false);
  };

  const renderLanguageSwitcher = () => (
    <div className="navbar_account_dropdown language-dropdown">
      <button
        className="account_btn"
        onClick={() => {
          setIsLangDropdownOpen(!isLangDropdownOpen);
          setIsDropdownOpen(false);
        }}
        style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700 }}
      >
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
  );

  const renderAuthActions = () => (
    <div className="navbar_login">
      {isLoggedIn ? (
        <div className="navbar_account_dropdown">
          <button
            className="account_btn icon_btn"
            onClick={() => {
              setIsDropdownOpen(!isDropdownOpen);
              setIsLangDropdownOpen(false);
            }}
          >
            <MenuIcon />
          </button>
          {isDropdownOpen && (
            <div className="account_dropdown_content" style={{ display: 'block' }}>
              {isAdmin && (
                <button
                  onClick={() => {
                    navigate('/admin/dashboard');
                    closeAllMenus();
                  }}
                >
                  {t('navbar.dashboard')}
                </button>
              )}
              <button
                onClick={() => {
                  navigate('/account');
                  closeAllMenus();
                }}
              >
                {t('navbar.myAccount')}
              </button>
              <button onClick={() => { handleLogout(); closeAllMenus(); }}>{t('navbar.logOut')}</button>
            </div>
          )}
        </div>
      ) : (
        <button
          onClick={() => {
            setIsLoginModalOpen(true);
            setIsMobileMenuOpen(false);
          }}
        >
          {t('navbar.signIn')}
        </button>
      )}
    </div>
  );

  const renderMobileMenuContent = () => (
    <>
      <div className="mobile_menu_section">
        <p className="mobile_menu_label">Language</p>
        <button
          className={`mobile_menu_item ${i18n.language === 'en' ? 'active' : ''}`}
          onClick={() => changeLanguage('en')}
        >
          English
        </button>
        <button
          className={`mobile_menu_item ${i18n.language === 'fr' ? 'active' : ''}`}
          onClick={() => changeLanguage('fr')}
        >
          French
        </button>
      </div>

      <div className="mobile_menu_section">
        <p className="mobile_menu_label">Account</p>
        {isLoggedIn ? (
          <>
            {isAdmin && (
              <button
                className="mobile_menu_item"
                onClick={() => {
                  navigate('/admin/dashboard');
                  closeAllMenus();
                }}
              >
                {t('navbar.dashboard')}
              </button>
            )}
            <button
              className="mobile_menu_item"
              onClick={() => {
                navigate('/account');
                closeAllMenus();
              }}
            >
              {t('navbar.myAccount')}
            </button>
            <button
              className="mobile_menu_item"
              onClick={() => {
                handleLogout();
                closeAllMenus();
              }}
            >
              {t('navbar.logOut')}
            </button>
          </>
        ) : (
          <button
            className="mobile_menu_item mobile_sign_in"
            onClick={() => {
              setIsLoginModalOpen(true);
              closeAllMenus();
            }}
          >
            {t('navbar.signIn')}
          </button>
        )}
      </div>
    </>
  );

  return (
    <>
    <div className="navbar">
      <div className="navbar-content">
      <div className="navbar_left">
        {/* Navigation Bar Logo */}
        <div className="navbar_logo">
          <Link to="/">
            <img src={LBDLogo} alt="LifeByDorm Logo" />
          </Link>
        </div>

        {/* Conditionally Displayed Search Bar */}
        {showNavSearch && (
          <div className="navbar_search_container">
            <NavbarSearchBar />
          </div>
        )}
      </div>

      <button
        className="mobile_menu_toggle"
        aria-label="Open menu"
        onClick={() => {
          setIsMobileMenuOpen(!isMobileMenuOpen);
          setIsDropdownOpen(false);
          setIsLangDropdownOpen(false);
        }}
      >
        <MenuIcon />
      </button>

      {/* Desktop Navigation Buttons */}
      <div className="navbar_actions navbar_actions_desktop">
        <div className="navbar_socials">
          <a href="https://www.tiktok.com/@lifebydorm" target="_blank" rel="noopener noreferrer" aria-label="TikTok">
            <FaTiktok />
          </a>
          <a href="https://www.instagram.com/lifebydorm" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
            <FaInstagram />
          </a>
          <a href="https://www.linkedin.com/company/lifebydorm" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
            <FaLinkedinIn />
          </a>
        </div>
        {renderLanguageSwitcher()}
        {renderAuthActions()}
      </div>

      {/* Mobile Navigation Buttons */}
      <div className={`navbar_actions_mobile ${isMobileMenuOpen ? 'open' : ''}`}>
        {renderMobileMenuContent()}
      </div>
      </div>
      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
    </div>
    <div className="navbar-spacer" />
    </>
  )
}

export default Navbar