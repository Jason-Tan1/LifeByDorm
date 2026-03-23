import { useTranslation } from 'react-i18next';
import './legal.css';
import NavBar from '../nav/navbar';
import Footer from '../home/footer';
import { useSEO } from '../../hooks/useSEO';

function CookiePolicy() {
  const { t } = useTranslation();

  useSEO({
    title: 'Cookie Policy',
    description: 'Learn how LifeByDorm uses cookies and similar technologies.',
    canonicalPath: '/cookie-policy'
  });

  return (
    <div className="legal-page-wrapper">
      <NavBar />

      <div className="legal-container">
        <h1 className="legal-page-title">{t('legal.cookieTitle')}</h1>
        <span className="legal-date">{t('legal.lastUpdatedCookie')}</span>

        <div className="legal-section">
          <p>{t('legal.cookieIntro')}</p>
        </div>

        <div className="legal-section">
          <h2>{t('legal.cookie1Title')}</h2>
          <p>{t('legal.cookie1Text')}</p>
        </div>

        <div className="legal-section">
          <h2>{t('legal.cookie2Title')}</h2>
          <p>{t('legal.cookie2Text')}</p>
        </div>

        <div className="legal-section">
          <h2>{t('legal.cookie3Title')}</h2>
          <p>{t('legal.cookie3Text')}</p>
        </div>

        <div className="legal-section">
          <h2>{t('legal.cookie4Title')}</h2>
          <p>{t('legal.cookie4Text')}</p>
        </div>

        <div className="legal-section">
          <h2>{t('legal.cookie5Title')}</h2>
          <p>{t('legal.cookie5Text')}</p>
        </div>

        <div className="legal-contact">
          <h2>{t('legal.contactUs')}</h2>
          <p>
            {t('legal.contactCookie')}
            <br />
            <strong>support@lifebydorm.ca</strong>
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default CookiePolicy;
